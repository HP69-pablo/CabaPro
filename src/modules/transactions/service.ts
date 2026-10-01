import { prisma } from "@/lib/prisma";
import {
  TransactionStatus,
  UserRole,
  Prisma,
  PaymentProviderType,
} from "@prisma/client";
import {
  StateTransitionError,
  ForbiddenError,
  NotFoundError,
  ConcurrencyError,
  ValidationError,
} from "@/lib/errors";
import { LedgerService } from "../ledger/service";
import {
  generateDeliveryCode,
  generateSalt,
  hashDeliveryCode,
  verifyDeliveryCode,
} from "@/lib/crypto";

export interface TransactionActor {
  id: string;
  role: UserRole;
}

export interface TransitionPayload {
  cancellationReason?: string;
  deliveryCodeAttempt?: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Permitted transition map
const ALLOWED_TRANSITIONS: Record<TransactionStatus, TransactionStatus[]> = {
  AGREED: [TransactionStatus.AWAITING_PAYMENT, TransactionStatus.AWAITING_BUREAU_PAYMENT, TransactionStatus.CANCELLED],
  AWAITING_PAYMENT: [TransactionStatus.PAYMENT_UNDER_REVIEW, TransactionStatus.PAID, TransactionStatus.EXPIRED, TransactionStatus.CANCELLED],
  PAYMENT_UNDER_REVIEW: [TransactionStatus.PAID, TransactionStatus.AWAITING_PAYMENT, TransactionStatus.CANCELLED],
  AWAITING_BUREAU_PAYMENT: [TransactionStatus.BUREAU_PAYMENT_RECEIVED, TransactionStatus.EXPIRED, TransactionStatus.CANCELLED],
  BUREAU_PAYMENT_RECEIVED: [TransactionStatus.PAID],
  PAID: [TransactionStatus.FUNDS_TRANSFER_PENDING, TransactionStatus.PURCHASING, TransactionStatus.HANDED_OVER, TransactionStatus.DISPUTED, TransactionStatus.CANCELLED],
  FUNDS_TRANSFER_PENDING: [TransactionStatus.FUNDS_SENT_TO_BRINGER, TransactionStatus.DISPUTED],
  FUNDS_SENT_TO_BRINGER: [TransactionStatus.FUNDS_CONFIRMED_BY_BRINGER, TransactionStatus.DISPUTED],
  FUNDS_CONFIRMED_BY_BRINGER: [TransactionStatus.PURCHASING, TransactionStatus.DISPUTED],
  PURCHASING: [TransactionStatus.PURCHASED, TransactionStatus.DISPUTED],
  PURCHASED: [TransactionStatus.PRODUCT_PROOF_REVIEW, TransactionStatus.HANDED_OVER, TransactionStatus.DISPUTED],
  PRODUCT_PROOF_REVIEW: [TransactionStatus.HANDED_OVER, TransactionStatus.DISPUTED],
  HANDED_OVER: [TransactionStatus.IN_TRANSIT, TransactionStatus.DISPUTED],
  IN_TRANSIT: [TransactionStatus.ARRIVED, TransactionStatus.DISPUTED],
  ARRIVED: [TransactionStatus.DELIVERED, TransactionStatus.DISPUTED],
  DELIVERED: [TransactionStatus.CONFIRMED, TransactionStatus.DISPUTED],
  CONFIRMED: [TransactionStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
  DISPUTED: [TransactionStatus.REFUNDED, TransactionStatus.PARTIALLY_REFUNDED, TransactionStatus.COMPLETED],
  REFUNDED: [],
  PARTIALLY_REFUNDED: [],
};

export class TransactionService {
  /**
   * Create a transaction from an agreed offer with concurrency-safe capacity locking.
   */
  static async createFromAgreedOffer(offerId: string, actor: TransactionActor) {
    return prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findUnique({
        where: { id: offerId },
        include: {
          buyerRequest: true,
          trip: true,
        },
      });

      if (!offer) throw new NotFoundError("Offer", offerId);
      if (offer.status !== "PENDING" && offer.status !== "COUNTERED") {
        throw new ValidationError("Offer is not in an agreeable state");
      }

      // Concurrency-safe capacity reservation check
      const remainingCapacity = offer.trip.totalCapacityGrams - offer.trip.reservedCapacityGrams;
      if (remainingCapacity < offer.buyerRequest.weightGrams) {
        throw new ConcurrencyError(
          `Insufficient remaining capacity on trip. Required: ${offer.buyerRequest.weightGrams}g, Available: ${remainingCapacity}g`
        );
      }

      // Reserve capacity atomically
      await tx.trip.update({
        where: { id: offer.tripId },
        data: {
          reservedCapacityGrams: { increment: offer.buyerRequest.weightGrams },
        },
      });

      // Update offer status
      await tx.offer.update({
        where: { id: offerId },
        data: { status: "ACCEPTED" },
      });

      // Generate reference number: CP-TX-YYYY-XXXXX
      const year = new Date().getFullYear();
      const rand = Math.floor(10000 + Math.random() * 90000);
      const referenceNumber = `CP-TX-${year}-${rand}`;

      // Frozen exchange rate snapshot
      const exchangeSnapshot = {
        currency: offer.currencyCode,
        lockedAt: new Date().toISOString(),
        rate: 1.0,
      };

      // Determine advance amount
      const advancePortionPercent = 100;
      const advanceAmountMinorUnits = Math.round(
        (offer.productPriceMinorUnits * advancePortionPercent) / 100
      );

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          referenceNumber,
          buyerId: offer.buyerRequest.buyerId,
          bringerId: offer.trip.bringerId,
          buyerRequestId: offer.buyerRequestId,
          tripId: offer.tripId,
          agreedOfferId: offer.id,
          status: TransactionStatus.AGREED,
          paymentMethod: PaymentProviderType.DEMO,
          currencyCode: offer.currencyCode,
          productPriceMinorUnits: offer.productPriceMinorUnits,
          bringerFeeMinorUnits: offer.bringerFeeMinorUnits,
          platformFeeMinorUnits: offer.platformFeeMinorUnits,
          guaranteeFeeMinorUnits: offer.guaranteeFeeMinorUnits,
          bureauFeeMinorUnits: offer.bureauFeeMinorUnits,
          totalBuyerPayMinorUnits: offer.totalAmountMinorUnits,
          exchangeRateSnapshotJson: exchangeSnapshot,
          advancePortionPercent,
          advanceAmountMinorUnits,
        },
      });

      // Initialize Delivery entity with hashed 6-digit code
      const plainCode = generateDeliveryCode();
      const codeSalt = generateSalt();
      const codeHash = hashDeliveryCode(plainCode, codeSalt);
      const expiresAt = new Date(offer.trip.arrivalDatetime.getTime() + 72 * 60 * 60 * 1000);

      await tx.delivery.create({
        data: {
          transactionId: transaction.id,
          codeHash,
          codeSalt,
          expiresAt,
        },
      });

      // Initialize empty HandoverChecklist
      await tx.handoverChecklist.create({
        data: {
          transactionId: transaction.id,
        },
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "TRANSACTION_CREATED",
          entityType: "Transaction",
          entityId: transaction.id,
          afterJson: { referenceNumber, status: TransactionStatus.AGREED },
        },
      });

      return { transaction, plainDeliveryCode: plainCode };
    });
  }

  /**
   * The ONE CENTRAL STATE MACHINE TRANSITION METHOD.
   * Executes all 6 mandatory steps in an ACID transaction:
   * 1. Validate transition against table
   * 2. Check actor permission
   * 3. Evaluate guards
   * 4. Mutate state
   * 5. Write AuditLog
   * 6. Dispatch chat event & notification
   */
  static async transition(
    transactionId: string,
    targetStatus: TransactionStatus,
    actor: TransactionActor,
    payload: TransitionPayload = {}
  ) {
    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          buyer: true,
          bringer: true,
          buyerRequest: true,
          trip: true,
          delivery: true,
          handoverChecklist: true,
          conversation: true,
        },
      });

      if (!transaction) throw new NotFoundError("Transaction", transactionId);

      const currentStatus = transaction.status;

      // 1. Validate Transition
      const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
      // Allow dispute from almost any in-flight state
      const isDisputeAllowed =
        targetStatus === TransactionStatus.DISPUTED &&
        currentStatus !== TransactionStatus.COMPLETED &&
        currentStatus !== TransactionStatus.CANCELLED &&
        currentStatus !== TransactionStatus.REFUNDED;

      if (!allowedNext.includes(targetStatus) && !isDisputeAllowed) {
        throw new StateTransitionError(currentStatus, targetStatus);
      }

      // 2. Permission Check
      this.validateActorPermission(transaction, targetStatus, actor);

      // 3. Domain Guards Evaluation
      await this.evaluateGuards(tx, transaction, targetStatus, payload);

      // 4. Update State & Side Effects
      const updatedTx = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: targetStatus,
          cancellationReason: payload.cancellationReason || transaction.cancellationReason,
        },
      });

      // Capacity release side effects on cancellation / refund
      if (
        targetStatus === TransactionStatus.CANCELLED ||
        targetStatus === TransactionStatus.EXPIRED ||
        targetStatus === TransactionStatus.REFUNDED
      ) {
        await tx.trip.update({
          where: { id: transaction.tripId },
          data: {
            reservedCapacityGrams: {
              decrement: transaction.buyerRequest.weightGrams,
            },
          },
        });
      }

      // Ledger Completion Split side effect on COMPLETED
      if (targetStatus === TransactionStatus.COMPLETED) {
        await LedgerService.recordCompletionSplit(tx, {
          transactionId: transaction.id,
          bringerId: transaction.bringerId,
          bringerFeeMinorUnits: transaction.bringerFeeMinorUnits,
          platformFeeMinorUnits: transaction.platformFeeMinorUnits,
          guaranteeFeeMinorUnits: transaction.guaranteeFeeMinorUnits,
          bureauFeeMinorUnits: transaction.bureauFeeMinorUnits,
          currencyCode: transaction.currencyCode,
        });
      }

      // 5. Write AuditLog
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: actor.role,
          action: "TRANSACTION_STATE_CHANGE",
          entityType: "Transaction",
          entityId: transaction.id,
          beforeJson: { status: currentStatus },
          afterJson: { status: targetStatus, reason: payload.cancellationReason },
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
        },
      });

      // 6. System Chat Message & Notifications
      if (transaction.conversation?.id) {
        await tx.message.create({
          data: {
            conversationId: transaction.conversation.id,
            type: "SYSTEM",
            content: `Transaction status changed to: ${targetStatus}`,
          },
        });
      }

      // Notifications for Buyer and Bringer
      await tx.notification.createMany({
        data: [
          {
            userId: transaction.buyerId,
            type: "SYSTEM",
            title: `Order Update: ${targetStatus}`,
            body: `Your transaction ${transaction.referenceNumber} is now ${targetStatus}.`,
            linkUrl: `/transactions/${transaction.id}`,
          },
          {
            userId: transaction.bringerId,
            type: "SYSTEM",
            title: `Trip Order Update: ${targetStatus}`,
            body: `Transaction ${transaction.referenceNumber} is now ${targetStatus}.`,
            linkUrl: `/transactions/${transaction.id}`,
          },
        ],
      });

      return updatedTx;
    });
  }

  /**
   * Helper: Validate actor role permissions for a transition.
   */
  private static validateActorPermission(
    transaction: any,
    targetStatus: TransactionStatus,
    actor: TransactionActor
  ) {
    const isBuyer = actor.id === transaction.buyerId;
    const isBringer = actor.id === transaction.bringerId;
    const isStaff = actor.role === UserRole.BUREAU_STAFF;
    const isModeratorOrAdmin =
      actor.role === UserRole.MODERATOR ||
      actor.role === UserRole.ADMIN ||
      actor.role === UserRole.FINANCE;

    switch (targetStatus) {
      case TransactionStatus.AWAITING_PAYMENT:
      case TransactionStatus.AWAITING_BUREAU_PAYMENT:
      case TransactionStatus.PAYMENT_UNDER_REVIEW:
        if (!isBuyer && !isModeratorOrAdmin) throw new ForbiddenError();
        break;

      case TransactionStatus.BUREAU_PAYMENT_RECEIVED:
      case TransactionStatus.FUNDS_TRANSFER_PENDING:
      case TransactionStatus.FUNDS_SENT_TO_BRINGER:
        if (!isStaff && !isModeratorOrAdmin) throw new ForbiddenError();
        break;

      case TransactionStatus.FUNDS_CONFIRMED_BY_BRINGER:
      case TransactionStatus.PURCHASING:
      case TransactionStatus.PURCHASED:
      case TransactionStatus.IN_TRANSIT:
      case TransactionStatus.ARRIVED:
        if (!isBringer && !isModeratorOrAdmin) throw new ForbiddenError();
        break;

      case TransactionStatus.PRODUCT_PROOF_REVIEW:
      case TransactionStatus.CONFIRMED:
        if (!isBuyer && !isModeratorOrAdmin) throw new ForbiddenError();
        break;

      case TransactionStatus.HANDED_OVER:
        if (!isBuyer && !isBringer && !isModeratorOrAdmin) throw new ForbiddenError();
        break;

      case TransactionStatus.DELIVERED:
        if (!isBringer && !isModeratorOrAdmin) throw new ForbiddenError();
        break;

      case TransactionStatus.DISPUTED:
        if (!isBuyer && !isBringer && !isModeratorOrAdmin) throw new ForbiddenError();
        break;

      case TransactionStatus.REFUNDED:
      case TransactionStatus.PARTIALLY_REFUNDED:
        if (!isModeratorOrAdmin) throw new ForbiddenError("Only Moderators/Finance can execute refunds");
        break;
    }
  }

  /**
   * Helper: Domain Guard evaluations for critical states.
   */
  private static async evaluateGuards(
    tx: Prisma.TransactionClient,
    transaction: any,
    targetStatus: TransactionStatus,
    payload: TransitionPayload
  ) {
    // Guard for DELIVERED: Must verify hashed 6-digit delivery code
    if (targetStatus === TransactionStatus.DELIVERED) {
      if (!transaction.delivery) {
        throw new ValidationError("No delivery record found for transaction");
      }
      if (!payload.deliveryCodeAttempt) {
        throw new ValidationError("Delivery code is required to complete delivery");
      }
      if (transaction.delivery.isUsed) {
        throw new ValidationError("Delivery code has already been used");
      }
      if (transaction.delivery.attemptsCount >= transaction.delivery.maxAttempts) {
        throw new ValidationError("Delivery code max attempts exceeded; verification locked");
      }

      const isValid = verifyDeliveryCode(
        payload.deliveryCodeAttempt,
        transaction.delivery.codeSalt,
        transaction.delivery.codeHash
      );

      // Increment attempt count
      await tx.delivery.update({
        where: { id: transaction.delivery.id },
        data: {
          attemptsCount: { increment: 1 },
          lastAttemptAt: new Date(),
          isUsed: isValid ? true : false,
          usedAt: isValid ? new Date() : undefined,
        },
      });

      if (!isValid) {
        throw new ValidationError("Invalid delivery code");
      }
    }

    // Guard for HANDED_OVER: Safe Handover checklist must be completed
    if (targetStatus === TransactionStatus.HANDED_OVER) {
      if (transaction.handoverChecklist) {
        const cl = transaction.handoverChecklist;
        if (!cl.noProhibitedItems || !cl.inspectedByBringer) {
          throw new ValidationError(
            "Safe Handover checklist must be verified: Bringer must inspect package and confirm no prohibited items."
          );
        }
      }
    }
  }
}
