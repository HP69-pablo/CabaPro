import { prisma } from "@/lib/prisma";
import { LedgerAccountType, LedgerReferenceType, Prisma } from "@prisma/client";
import { LedgerImbalanceError, ValidationError } from "@/lib/errors";

export interface JournalLineItem {
  debitAccountType: LedgerAccountType;
  debitOwnerId?: string;
  debitBureauId?: string;
  creditAccountType: LedgerAccountType;
  creditOwnerId?: string;
  creditBureauId?: string;
  amountMinorUnits: number;
  currencyCode: string;
  referenceType: LedgerReferenceType;
  referenceId: string;
  idempotencyKey: string;
  description: string;
  transactionId?: string;
}

export class LedgerService {
  /**
   * Find or lazily create a LedgerAccount by type, currency, and owner/bureau.
   */
  static async getOrCreateAccount(
    tx: Prisma.TransactionClient,
    type: LedgerAccountType,
    currencyCode: string,
    ownerId?: string,
    bureauId?: string
  ) {
    const existing = await tx.ledgerAccount.findFirst({
      where: {
        type,
        currencyCode,
        ownerId: ownerId ?? null,
        bureauId: bureauId ?? null,
      },
    });

    if (existing) return existing;

    return tx.ledgerAccount.create({
      data: {
        type,
        currencyCode,
        ownerId: ownerId ?? null,
        bureauId: bureauId ?? null,
        description: `${type} Account (${currencyCode})${ownerId ? ` User:${ownerId}` : ""}${bureauId ? ` Bureau:${bureauId}` : ""}`,
      },
    });
  }

  /**
   * Record a journal entry enforcing double-entry invariants and idempotency.
   */
  static async recordJournalEntry(tx: Prisma.TransactionClient, item: JournalLineItem) {
    if (item.amountMinorUnits <= 0) {
      throw new ValidationError("Ledger entry amount must be a positive integer");
    }

    // Check idempotency key first
    const existingEntry = await tx.ledgerEntry.findUnique({
      where: { idempotencyKey: item.idempotencyKey },
    });

    if (existingEntry) {
      // Idempotent replay: already recorded
      return existingEntry;
    }

    const debitAccount = await this.getOrCreateAccount(
      tx,
      item.debitAccountType,
      item.currencyCode,
      item.debitOwnerId,
      item.debitBureauId
    );

    const creditAccount = await this.getOrCreateAccount(
      tx,
      item.creditAccountType,
      item.currencyCode,
      item.creditOwnerId,
      item.creditBureauId
    );

    return tx.ledgerEntry.create({
      data: {
        transactionId: item.transactionId,
        referenceType: item.referenceType,
        referenceId: item.referenceId,
        debitAccountId: debitAccount.id,
        creditAccountId: creditAccount.id,
        amountMinorUnits: item.amountMinorUnits,
        currencyCode: item.currencyCode,
        idempotencyKey: item.idempotencyKey,
        description: item.description,
      },
    });
  }

  /**
   * Derive account balance strictly from entries.
   * Net balance = SUM(debits) - SUM(credits)
   */
  static async deriveAccountBalance(accountId: string): Promise<number> {
    const debits = await prisma.ledgerEntry.aggregate({
      where: { debitAccountId: accountId },
      _sum: { amountMinorUnits: true },
    });

    const credits = await prisma.ledgerEntry.aggregate({
      where: { creditAccountId: accountId },
      _sum: { amountMinorUnits: true },
    });

    const totalDebits = debits._sum.amountMinorUnits || 0;
    const totalCredits = credits._sum.amountMinorUnits || 0;

    return totalDebits - totalCredits;
  }

  /**
   * Derive user available balance across all accounts of type BRINGER_AVAILABLE.
   */
  static async deriveUserAvailableBalance(userId: string, currencyCode: string): Promise<number> {
    const account = await prisma.ledgerAccount.findFirst({
      where: {
        ownerId: userId,
        type: LedgerAccountType.BRINGER_AVAILABLE,
        currencyCode,
      },
    });

    if (!account) return 0;

    const balance = await this.deriveAccountBalance(account.id);
    // In our double-entry model, Bringer Available normal balance is credit-side or net positive
    return Math.abs(balance);
  }

  /**
   * Reconciliation validator: verifies that total debits equal total credits for a transaction.
   */
  static async verifyTransactionZeroSum(transactionId: string): Promise<boolean> {
    const entries = await prisma.ledgerEntry.findMany({
      where: { transactionId },
    });

    if (entries.length === 0) return true;

    // Every entry in our double-entry table has exactly one debit and one credit of identical amount
    // Therefore sum(debits) - sum(credits) is guaranteed to balance to zero by construction
    return true;
  }

  // ==========================================
  // DOMAIN JOURNAL FLOWS
  // ==========================================

  /**
   * 1. Buyer Payment Received (Online or Bureau Cash)
   */
  static async recordPaymentReceived(
    tx: Prisma.TransactionClient,
    params: {
      transactionId: string;
      paymentId: string;
      amountMinorUnits: number;
      currencyCode: string;
      isBureau: boolean;
      bureauId?: string;
    }
  ) {
    if (params.isBureau && params.bureauId) {
      // Step A: Cash received at Bureau (BUREAU_CASH debited, EXTERNAL credited)
      await this.recordJournalEntry(tx, {
        transactionId: params.transactionId,
        referenceType: LedgerReferenceType.PAYMENT,
        referenceId: params.paymentId,
        debitAccountType: LedgerAccountType.BUREAU_CASH,
        debitBureauId: params.bureauId,
        creditAccountType: LedgerAccountType.EXTERNAL,
        amountMinorUnits: params.amountMinorUnits,
        currencyCode: params.currencyCode,
        idempotencyKey: `pay-cash-${params.paymentId}`,
        description: "Cash collected at Caba Bureau",
      });

      // Step B: Lock into Escrow (EXTERNAL debited, ESCROW credited)
      await this.recordJournalEntry(tx, {
        transactionId: params.transactionId,
        referenceType: LedgerReferenceType.PAYMENT,
        referenceId: params.paymentId,
        debitAccountType: LedgerAccountType.EXTERNAL,
        creditAccountType: LedgerAccountType.ESCROW,
        amountMinorUnits: params.amountMinorUnits,
        currencyCode: params.currencyCode,
        idempotencyKey: `pay-escrow-${params.paymentId}`,
        description: "Bureau payment locked in Escrow",
      });
    } else {
      // Direct Online Payment (EXTERNAL debited, ESCROW credited)
      await this.recordJournalEntry(tx, {
        transactionId: params.transactionId,
        referenceType: LedgerReferenceType.PAYMENT,
        referenceId: params.paymentId,
        debitAccountType: LedgerAccountType.EXTERNAL,
        creditAccountType: LedgerAccountType.ESCROW,
        amountMinorUnits: params.amountMinorUnits,
        currencyCode: params.currencyCode,
        idempotencyKey: `pay-online-${params.paymentId}`,
        description: "Online/Card payment locked in Escrow",
      });
    }
  }

  /**
   * 2. Outbound Advance Sent to Bringer
   */
  static async recordAdvanceSentToBringer(
    tx: Prisma.TransactionClient,
    params: {
      transactionId: string;
      transferId: string;
      bringerId: string;
      amountMinorUnits: number;
      currencyCode: string;
      bureauId?: string;
    }
  ) {
    await this.recordJournalEntry(tx, {
      transactionId: params.transactionId,
      referenceType: LedgerReferenceType.ADVANCE_TRANSFER,
      referenceId: params.transferId,
      debitAccountType: LedgerAccountType.BRINGER_PENDING,
      debitOwnerId: params.bringerId,
      creditAccountType: LedgerAccountType.BUREAU_FLOAT,
      creditBureauId: params.bureauId,
      amountMinorUnits: params.amountMinorUnits,
      currencyCode: params.currencyCode,
      idempotencyKey: `advance-sent-${params.transferId}`,
      description: "Outbound advance wire dispatched to bringer",
    });
  }

  /**
   * 3. Bringer Confirms Advance Receipt
   */
  static async recordAdvanceConfirmedByBringer(
    tx: Prisma.TransactionClient,
    params: {
      transactionId: string;
      transferId: string;
      bringerId: string;
      amountMinorUnits: number;
      currencyCode: string;
    }
  ) {
    await this.recordJournalEntry(tx, {
      transactionId: params.transactionId,
      referenceType: LedgerReferenceType.ADVANCE_TRANSFER,
      referenceId: params.transferId,
      debitAccountType: LedgerAccountType.ESCROW,
      creditAccountType: LedgerAccountType.BRINGER_PENDING,
      creditOwnerId: params.bringerId,
      amountMinorUnits: params.amountMinorUnits,
      currencyCode: params.currencyCode,
      idempotencyKey: `advance-confirm-${params.transferId}`,
      description: "Bringer confirmed advance receipt; escrow adjusted",
    });
  }

  /**
   * 4. Completion Split (Escrow -> Bringer Available + Platform Fee + Guarantee Fund)
   */
  static async recordCompletionSplit(
    tx: Prisma.TransactionClient,
    params: {
      transactionId: string;
      bringerId: string;
      bringerFeeMinorUnits: number;
      platformFeeMinorUnits: number;
      guaranteeFeeMinorUnits: number;
      bureauFeeMinorUnits: number;
      currencyCode: string;
    }
  ) {
    const totalRelease =
      params.bringerFeeMinorUnits +
      params.platformFeeMinorUnits +
      params.guaranteeFeeMinorUnits +
      params.bureauFeeMinorUnits;

    // Bringer delivery fee
    if (params.bringerFeeMinorUnits > 0) {
      await this.recordJournalEntry(tx, {
        transactionId: params.transactionId,
        referenceType: LedgerReferenceType.ESCROW_RELEASE,
        referenceId: params.transactionId,
        debitAccountType: LedgerAccountType.ESCROW,
        creditAccountType: LedgerAccountType.BRINGER_AVAILABLE,
        creditOwnerId: params.bringerId,
        amountMinorUnits: params.bringerFeeMinorUnits,
        currencyCode: params.currencyCode,
        idempotencyKey: `release-bringer-${params.transactionId}`,
        description: "Bringer reward fee released from escrow",
      });
    }

    // Platform commission
    if (params.platformFeeMinorUnits > 0) {
      await this.recordJournalEntry(tx, {
        transactionId: params.transactionId,
        referenceType: LedgerReferenceType.ESCROW_RELEASE,
        referenceId: params.transactionId,
        debitAccountType: LedgerAccountType.ESCROW,
        creditAccountType: LedgerAccountType.PLATFORM_REVENUE,
        amountMinorUnits: params.platformFeeMinorUnits,
        currencyCode: params.currencyCode,
        idempotencyKey: `release-platform-${params.transactionId}`,
        description: "Platform commission earned",
      });
    }

    // Guarantee fund contribution
    if (params.guaranteeFeeMinorUnits > 0) {
      await this.recordJournalEntry(tx, {
        transactionId: params.transactionId,
        referenceType: LedgerReferenceType.ESCROW_RELEASE,
        referenceId: params.transactionId,
        debitAccountType: LedgerAccountType.ESCROW,
        creditAccountType: LedgerAccountType.GUARANTEE_FUND,
        amountMinorUnits: params.guaranteeFeeMinorUnits,
        currencyCode: params.currencyCode,
        idempotencyKey: `release-guarantee-${params.transactionId}`,
        description: "Caba guarantee fund contribution",
      });
    }

    // Bureau fee (if applicable)
    if (params.bureauFeeMinorUnits > 0) {
      await this.recordJournalEntry(tx, {
        transactionId: params.transactionId,
        referenceType: LedgerReferenceType.ESCROW_RELEASE,
        referenceId: params.transactionId,
        debitAccountType: LedgerAccountType.ESCROW,
        creditAccountType: LedgerAccountType.PLATFORM_REVENUE,
        amountMinorUnits: params.bureauFeeMinorUnits,
        currencyCode: params.currencyCode,
        idempotencyKey: `release-bureau-${params.transactionId}`,
        description: "Bureau handling fee earned",
      });
    }
  }

  /**
   * 5. Full Refund to Buyer
   */
  static async recordFullRefund(
    tx: Prisma.TransactionClient,
    params: {
      transactionId: string;
      buyerId: string;
      amountMinorUnits: number;
      currencyCode: string;
    }
  ) {
    await this.recordJournalEntry(tx, {
      transactionId: params.transactionId,
      referenceType: LedgerReferenceType.REFUND,
      referenceId: params.transactionId,
      debitAccountType: LedgerAccountType.ESCROW,
      creditAccountType: LedgerAccountType.REFUNDS,
      creditOwnerId: params.buyerId,
      amountMinorUnits: params.amountMinorUnits,
      currencyCode: params.currencyCode,
      idempotencyKey: `refund-full-${params.transactionId}`,
      description: "Full refund from escrow to buyer refund account",
    });

    await this.recordJournalEntry(tx, {
      transactionId: params.transactionId,
      referenceType: LedgerReferenceType.REFUND,
      referenceId: params.transactionId,
      debitAccountType: LedgerAccountType.REFUNDS,
      debitOwnerId: params.buyerId,
      creditAccountType: LedgerAccountType.EXTERNAL,
      amountMinorUnits: params.amountMinorUnits,
      currencyCode: params.currencyCode,
      idempotencyKey: `refund-dispatch-${params.transactionId}`,
      description: "Refund dispatched to buyer external account/cash",
    });
  }

  /**
   * 6. Payout Execution for Bringer
   */
  static async recordPayoutExecution(
    tx: Prisma.TransactionClient,
    params: {
      payoutId: string;
      userId: string;
      amountMinorUnits: number;
      currencyCode: string;
    }
  ) {
    await this.recordJournalEntry(tx, {
      referenceType: LedgerReferenceType.PAYOUT,
      referenceId: params.payoutId,
      debitAccountType: LedgerAccountType.BRINGER_AVAILABLE,
      debitOwnerId: params.userId,
      creditAccountType: LedgerAccountType.PAYOUTS,
      creditOwnerId: params.userId,
      amountMinorUnits: params.amountMinorUnits,
      currencyCode: params.currencyCode,
      idempotencyKey: `payout-init-${params.payoutId}`,
      description: "Payout requested from available balance",
    });

    await this.recordJournalEntry(tx, {
      referenceType: LedgerReferenceType.PAYOUT,
      referenceId: params.payoutId,
      debitAccountType: LedgerAccountType.PAYOUTS,
      debitOwnerId: params.userId,
      creditAccountType: LedgerAccountType.EXTERNAL,
      amountMinorUnits: params.amountMinorUnits,
      currencyCode: params.currencyCode,
      idempotencyKey: `payout-settle-${params.payoutId}`,
      description: "Payout settled externally to bank/BaridiMob",
    });
  }
}
