import { prisma } from "@/lib/prisma";
import { MessageType, OfferStatus, UserRole } from "@prisma/client";
import { ContactMasker } from "./contact-masker";
import { TransactionService } from "../transactions/service";
import { SettingsService } from "../settings/service";
import { ValidationError, NotFoundError, ForbiddenError } from "@/lib/errors";

export interface SendMessageInput {
  conversationId: string;
  senderId?: string; // null if system message
  content: string;
  attachments?: string[];
  type?: MessageType;
}

export interface CreateOfferInput {
  conversationId: string;
  senderId: string;
  recipientId: string;
  buyerRequestId: string;
  tripId: string;
  productPriceMinorUnits: number;
  bringerFeeMinorUnits: number;
  currencyCode: string;
  deliveryMethod: string;
  deliveryAddress?: string;
  pickupDetails?: string;
  expiresInHours?: number;
}

export class ChatService {
  /**
   * Find existing or create new Conversation between two participants.
   */
  static async getOrCreateConversation(params: {
    participant1Id: string;
    participant2Id: string;
    buyerRequestId?: string;
    tripId?: string;
    transactionId?: string;
  }) {
    const existing = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: params.participant1Id, participant2Id: params.participant2Id },
          { participant1Id: params.participant2Id, participant2Id: params.participant1Id },
        ],
        buyerRequestId: params.buyerRequestId ?? undefined,
        tripId: params.tripId ?? undefined,
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        offers: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (existing) return existing;

    return prisma.conversation.create({
      data: {
        participant1Id: params.participant1Id,
        participant2Id: params.participant2Id,
        buyerRequestId: params.buyerRequestId,
        tripId: params.tripId,
        transactionId: params.transactionId,
      },
      include: {
        messages: true,
        offers: true,
      },
    });
  }

  /**
   * Send a message with anti-disintermediation contact masking before transaction payment.
   */
  static async sendMessage(input: SendMessageInput) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: input.conversationId },
      include: { transaction: true },
    });

    if (!conversation) throw new NotFoundError("Conversation", input.conversationId);
    if (conversation.isBlocked) throw new ForbiddenError("This conversation has been blocked");

    // Check if contacts can be shared: only if transaction exists and is PAID
    const isPaid =
      conversation.transaction &&
      conversation.transaction.status !== "AGREED" &&
      conversation.transaction.status !== "AWAITING_PAYMENT" &&
      conversation.transaction.status !== "AWAITING_BUREAU_PAYMENT";

    let finalContent = input.content;
    let isMasked = false;
    let originalMasked: string | null = null;

    if (!isPaid && input.type !== "SYSTEM") {
      const maskResult = ContactMasker.mask(input.content);
      if (maskResult.hasContactInfo) {
        isMasked = true;
        originalMasked = input.content;
        finalContent = maskResult.maskedContent;
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.senderId,
        type: input.type || MessageType.TEXT,
        content: finalContent,
        attachmentsJson: input.attachments || [],
        isContactMasked: isMasked,
        originalMaskedContent: originalMasked,
      },
    });

    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  /**
   * Create a structured Offer with transparent fee breakdown.
   */
  static async createStructuredOffer(input: CreateOfferInput) {
    const feeStructure = await SettingsService.getFeeStructure();

    // Calculate platform fee (e.g. 5%) and guarantee fee (e.g. 2%)
    const platformFeeMinorUnits = Math.round(
      (input.bringerFeeMinorUnits * feeStructure.platformFeePercent) / 100
    );
    const guaranteeFeeMinorUnits = Math.round(
      (input.productPriceMinorUnits * feeStructure.guaranteeFeePercent) / 100
    );
    const bureauFeeMinorUnits = 0; // Set if bureau method chosen later

    const totalAmountMinorUnits =
      input.productPriceMinorUnits +
      input.bringerFeeMinorUnits +
      platformFeeMinorUnits +
      guaranteeFeeMinorUnits +
      bureauFeeMinorUnits;

    const expiresAt = new Date(Date.now() + (input.expiresInHours || 48) * 60 * 60 * 1000);

    const offer = await prisma.offer.create({
      data: {
        conversationId: input.conversationId,
        senderId: input.senderId,
        recipientId: input.recipientId,
        buyerRequestId: input.buyerRequestId,
        tripId: input.tripId,
        productPriceMinorUnits: input.productPriceMinorUnits,
        bringerFeeMinorUnits: input.bringerFeeMinorUnits,
        platformFeeMinorUnits,
        guaranteeFeeMinorUnits,
        bureauFeeMinorUnits,
        totalAmountMinorUnits,
        currencyCode: input.currencyCode,
        deliveryMethod: input.deliveryMethod,
        deliveryAddress: input.deliveryAddress,
        pickupDetails: input.pickupDetails,
        expiresAt,
        status: OfferStatus.PENDING,
      },
    });

    // Create system message in conversation
    await this.sendMessage({
      conversationId: input.conversationId,
      senderId: input.senderId,
      type: MessageType.OFFER,
      content: `Structured Offer Sent: Product ${input.productPriceMinorUnits / 100} ${input.currencyCode}, Bringer Fee ${input.bringerFeeMinorUnits / 100} ${input.currencyCode}. Total: ${totalAmountMinorUnits / 100} ${input.currencyCode}`,
    });

    return offer;
  }

  /**
   * Respond to an offer (ACCEPT, REJECT, COUNTER).
   * Accepting automatically initializes the Transaction via TransactionService.
   */
  static async respondToOffer(
    offerId: string,
    actor: { id: string; role: UserRole },
    action: "ACCEPT" | "REJECT" | "COUNTER",
    counterInput?: {
      productPriceMinorUnits: number;
      bringerFeeMinorUnits: number;
    }
  ) {
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
    });

    if (!offer) throw new NotFoundError("Offer", offerId);
    if (offer.recipientId !== actor.id && action !== "COUNTER") {
      throw new ForbiddenError("Only the offer recipient can accept or reject an offer");
    }

    if (action === "ACCEPT") {
      // Create Transaction via the central state machine service
      const result = await TransactionService.createFromAgreedOffer(offer.id, actor);

      // Link conversation to transaction
      await prisma.conversation.update({
        where: { id: offer.conversationId },
        data: { transactionId: result.transaction.id },
      });

      await this.sendMessage({
        conversationId: offer.conversationId,
        type: MessageType.SYSTEM,
        content: `Offer accepted! Transaction ${result.transaction.referenceNumber} created in AGREED state. Proceed to escrow payment.`,
      });

      return {
        status: "ACCEPTED",
        transaction: result.transaction,
        plainDeliveryCode: result.plainDeliveryCode,
      };
    }

    if (action === "REJECT") {
      const updated = await prisma.offer.update({
        where: { id: offerId },
        data: { status: OfferStatus.REJECTED },
      });

      await this.sendMessage({
        conversationId: offer.conversationId,
        type: MessageType.SYSTEM,
        content: "Offer was declined.",
      });

      return { status: "REJECTED", offer: updated };
    }

    if (action === "COUNTER" && counterInput) {
      // Mark current offer as COUNTERED
      await prisma.offer.update({
        where: { id: offerId },
        data: { status: OfferStatus.COUNTERED },
      });

      // Create new counter-offer with inverted sender/recipient
      const counterOffer = await this.createStructuredOffer({
        conversationId: offer.conversationId,
        senderId: actor.id,
        recipientId: offer.senderId,
        buyerRequestId: offer.buyerRequestId,
        tripId: offer.tripId,
        productPriceMinorUnits: counterInput.productPriceMinorUnits,
        bringerFeeMinorUnits: counterInput.bringerFeeMinorUnits,
        currencyCode: offer.currencyCode,
        deliveryMethod: offer.deliveryMethod,
      });

      return { status: "COUNTERED", counterOffer };
    }

    throw new ValidationError("Invalid action");
  }
}
