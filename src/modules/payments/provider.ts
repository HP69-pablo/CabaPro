import { prisma } from "@/lib/prisma";
import { PaymentProviderType, PaymentStatus, TransactionStatus, UserRole } from "@prisma/client";
import { TransactionService } from "../transactions/service";
import { LedgerService } from "../ledger/service";
import { ValidationError, NotFoundError } from "@/lib/errors";

export interface InitiatePaymentParams {
  transactionId: string;
  amountMinorUnits: number;
  currencyCode: string;
  senderName?: string;
  referenceNumber: string;
  paymentProofKey?: string;
  idempotencyKey: string;
}

export interface PaymentProviderResult {
  paymentId: string;
  status: PaymentStatus;
  message: string;
}

export interface PaymentProvider {
  type: PaymentProviderType;
  initiatePayment(params: InitiatePaymentParams): Promise<PaymentProviderResult>;
}

export class DemoPaymentProvider implements PaymentProvider {
  type = PaymentProviderType.DEMO;

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentProviderResult> {
    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          transactionId: params.transactionId,
          provider: this.type,
          status: PaymentStatus.VERIFIED,
          amountMinorUnits: params.amountMinorUnits,
          currencyCode: params.currencyCode,
          referenceNumber: params.referenceNumber,
          idempotencyKey: params.idempotencyKey,
          verifiedAt: new Date(),
        },
      });

      // Record double-entry ledger entry: External -> Escrow
      await LedgerService.recordPaymentReceived(tx, {
        transactionId: params.transactionId,
        paymentId: p.id,
        amountMinorUnits: params.amountMinorUnits,
        currencyCode: params.currencyCode,
        isBureau: false,
      });

      return p;
    });

    // Advance transaction status to PAID via TransactionService
    await TransactionService.transition(
      params.transactionId,
      TransactionStatus.PAID,
      { id: "SYSTEM", role: UserRole.ADMIN },
      { notes: "Simulated instant payment verified via DemoProvider" }
    );

    return {
      paymentId: payment.id,
      status: PaymentStatus.VERIFIED,
      message: "Demo instant payment verified and locked in escrow.",
    };
  }
}

export class BaridiMobPaymentProvider implements PaymentProvider {
  type = PaymentProviderType.BARIDIMOB;

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentProviderResult> {
    if (!params.paymentProofKey) {
      throw new ValidationError("Screenshot of BaridiMob transfer is required");
    }

    const payment = await prisma.payment.create({
      data: {
        transactionId: params.transactionId,
        provider: this.type,
        status: PaymentStatus.UNDER_REVIEW,
        amountMinorUnits: params.amountMinorUnits,
        currencyCode: params.currencyCode,
        referenceNumber: params.referenceNumber,
        paymentProofKey: params.paymentProofKey,
        senderName: params.senderName,
        idempotencyKey: params.idempotencyKey,
      },
    });

    // Transition transaction to PAYMENT_UNDER_REVIEW
    await TransactionService.transition(
      params.transactionId,
      TransactionStatus.PAYMENT_UNDER_REVIEW,
      { id: "BUYER", role: UserRole.USER },
      { notes: `BaridiMob payment reference: ${params.referenceNumber}` }
    );

    return {
      paymentId: payment.id,
      status: PaymentStatus.UNDER_REVIEW,
      message: "Transfer proof submitted. Finance team is reviewing the receipt.",
    };
  }
}

export class BureauPaymentProvider implements PaymentProvider {
  type = PaymentProviderType.BUREAU;

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentProviderResult> {
    const payment = await prisma.payment.create({
      data: {
        transactionId: params.transactionId,
        provider: this.type,
        status: PaymentStatus.PENDING,
        amountMinorUnits: params.amountMinorUnits,
        currencyCode: params.currencyCode,
        referenceNumber: params.referenceNumber,
        idempotencyKey: params.idempotencyKey,
      },
    });

    // Transition transaction to AWAITING_BUREAU_PAYMENT
    await TransactionService.transition(
      params.transactionId,
      TransactionStatus.AWAITING_BUREAU_PAYMENT,
      { id: "BUYER", role: UserRole.USER },
      { notes: "Bureau Payment Slip generated" }
    );

    return {
      paymentId: payment.id,
      status: PaymentStatus.PENDING,
      message: "Bureau payment code generated. Please visit the bureau to complete cash deposit.",
    };
  }
}

export function getPaymentProvider(type: PaymentProviderType): PaymentProvider {
  switch (type) {
    case PaymentProviderType.DEMO:
      return new DemoPaymentProvider();
    case PaymentProviderType.BARIDIMOB:
      return new BaridiMobPaymentProvider();
    case PaymentProviderType.BUREAU:
      return new BureauPaymentProvider();
    default:
      return new DemoPaymentProvider();
  }
}
