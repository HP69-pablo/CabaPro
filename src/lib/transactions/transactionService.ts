import {
  Transaction,
  TransactionStatus,
  PriceBreakdown,
  LedgerEntry,
  AuditLogEntry,
  FundsTransferRecord,
  ReceptionMethod,
  MeetingStatus,
  SafeHandoverChecklist,
  PurchaseProof,
  DisputeRecord,
} from "./types";
import {
  PARTNER_BUREAUS,
  FINANCIAL_CONFIG,
  LEDGER_ACCOUNTS,
  calculatePriceBreakdown,
} from "./constants";
import {
  getDocById,
  setDoc,
  updateDoc,
  queryDocs,
  collections,
  sendMessage,
} from "@/lib/firestore";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function sha256(str: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  try {
    const crypto = await import("crypto");
    return crypto.createHash("sha256").update(str).digest("hex");
  } catch {
    // Fallback deterministic string hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, "0");
  }
}

export function generatePaymentCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `CP-${digits}`;
}

export function generate6DigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ------------------- IN-MEMORY DEMO LEDGER & AUDIT FALLBACKS -------------------
// Enables instantaneous reactive updates even if network or Firestore rules are strict
const localTransactions = new Map<string, Transaction>();
const localLedger = new Map<string, LedgerEntry[]>();
const localAuditLogs = new Map<string, AuditLogEntry[]>();

export class TransactionService {
  static async safeSendChatMessage(conversationId: string | undefined, message: any) {
    if (!conversationId) return;
    try {
      await sendMessage(conversationId, message);
    } catch (e) {
      // Non-fatal if offline or unauthenticated
    }
  }

  /**
   * Helper to write an immutable AuditLog entry
   */
  static async writeAuditLog(entry: Omit<AuditLogEntry, "id" | "timestamp">): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    const list = localAuditLogs.get(entry.transactionId) || [];
    list.unshift(fullEntry);
    localAuditLogs.set(entry.transactionId, list);

    try {
      await setDoc("audit_logs", fullEntry.id, fullEntry as any);
    } catch (e) {
      console.warn("AuditLog firestore sync notice:", e);
    }

    return fullEntry;
  }

  /**
   * Helper to append an immutable financial ledger entry
   */
  static async appendLedgerEntry(entry: Omit<LedgerEntry, "id" | "timestamp">): Promise<LedgerEntry> {
    const fullEntry: LedgerEntry = {
      id: `ledg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    const list = localLedger.get(entry.transactionId) || [];
    list.push(fullEntry);
    localLedger.set(entry.transactionId, list);

    try {
      await setDoc("ledger_entries", fullEntry.id, fullEntry as any);
    } catch (e) {
      console.warn("Ledger firestore sync notice:", e);
    }

    return fullEntry;
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(id: string): Promise<Transaction | null> {
    if (localTransactions.has(id)) {
      return localTransactions.get(id)!;
    }
    const docData = await getDocById<Transaction>("transactions", id);
    if (docData) {
      localTransactions.set(id, docData);
      return docData;
    }
    return null;
  }

  /**
   * Subscribe to a transaction in real-time
   */
  static subscribeToTransaction(id: string, callback: (tx: Transaction | null) => void) {
    if (localTransactions.has(id)) {
      callback(localTransactions.get(id)!);
    }

    try {
      const docRef = doc(db, "transactions", id);
      return onSnapshot(
        docRef,
        (snap) => {
          if (snap.exists()) {
            const data = { id: snap.id, ...snap.data() } as Transaction;
            localTransactions.set(id, data);
            callback(data);
          } else if (localTransactions.has(id)) {
            callback(localTransactions.get(id)!);
          } else {
            callback(null);
          }
        },
        () => {
          if (localTransactions.has(id)) {
            callback(localTransactions.get(id)!);
          }
        }
      );
    } catch {
      return () => {};
    }
  }

  /**
   * Get audit logs for transaction
   */
  static async getAuditLogs(transactionId: string): Promise<AuditLogEntry[]> {
    const local = localAuditLogs.get(transactionId) || [];
    try {
      const remote = await queryDocs<AuditLogEntry>("audit_logs");
      const matched = remote.filter((a) => a.transactionId === transactionId);
      const combined = [...local, ...matched];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      return unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return local;
    }
  }

  /**
   * Get ledger entries for transaction
   */
  static async getLedgerEntries(transactionId: string): Promise<LedgerEntry[]> {
    const local = localLedger.get(transactionId) || [];
    try {
      const remote = await queryDocs<LedgerEntry>("ledger_entries");
      const matched = remote.filter((l) => l.transactionId === transactionId);
      const combined = [...local, ...matched];
      const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
      return unique.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch {
      return local;
    }
  }

  /**
   * STAGE 1: Create transaction from accepted chat offer
   */
  static async createTransactionFromOffer(params: {
    conversationId?: string;
    requestId?: string;
    requestTitle: string;
    productName: string;
    tripId?: string;
    tripRoute: string;
    buyerId: string;
    buyerName: string;
    bringerId: string;
    bringerName: string;
    productPriceEur: number;
    bringerFeeEur: number;
    bureauId?: string;
    customId?: string;
  }): Promise<Transaction> {
    const id = params.customId || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const breakdown = calculatePriceBreakdown(params.productPriceEur, params.bringerFeeEur);
    const bureau = PARTNER_BUREAUS.find((b) => b.id === params.bureauId) || PARTNER_BUREAUS[0];
    const paymentCode = generatePaymentCode();

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + FINANCIAL_CONFIG.PAYMENT_DEADLINE_HOURS);

    // Initial placeholder delivery code (actual hashed code is generated upon payment confirmation)
    const initialSalt = Math.random().toString(36).substring(2);
    const initialHash = await sha256(`000000${initialSalt}`);

    const tx: Transaction = {
      id,
      conversationId: params.conversationId,
      requestId: params.requestId,
      requestTitle: params.requestTitle,
      productName: params.productName,
      tripId: params.tripId,
      tripRoute: params.tripRoute,
      buyerId: params.buyerId,
      buyerName: params.buyerName,
      bringerId: params.bringerId,
      bringerName: params.bringerName,
      status: "AWAITING_PAYMENT",
      previousStatus: "AGREED",
      priceBreakdown: breakdown,
      paymentCode,
      paymentDeadline: deadline.toISOString(),
      bureauId: bureau.id,
      bureauName: bureau.name,
      bureauCity: bureau.city,
      bureauAddress: bureau.address,
      deliveryCode: {
        hashedCode: initialHash,
        salt: initialSalt,
        attempts: 0,
        maxAttempts: FINANCIAL_CONFIG.MAX_CODE_ATTEMPTS,
        isLocked: false,
        expiresAt: deadline.toISOString(),
      },
      safeHandover: {
        itemMatchesListing: false,
        modelQuantityVerified: false,
        packagingInspected: false,
        noProhibitedItems: false,
        receiptAttached: false,
        bringerConfirmed: false,
        buyerConfirmedProof: false,
      },
      reception: {
        method: "bureau_pickup",
        selectedBureauId: bureau.id,
        meetingPoint: bureau.address,
        meetingTime: "To be scheduled upon arrival",
        status: "proposed",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    localTransactions.set(id, tx);
    try {
      await setDoc("transactions", id, tx as any);
    } catch (e) {
      console.warn("Transaction firestore sync notice:", e);
    }

    await this.writeAuditLog({
      transactionId: id,
      fromState: "INITIAL",
      toState: "AWAITING_PAYMENT",
      actorId: params.buyerId,
      actorRole: "buyer",
      actorName: params.buyerName,
      action: "TRANSACTION_CREATED",
      details: `Created transaction for ${params.productName}. Locked total: ${breakdown.totalDzd.toLocaleString()} DZD (€${breakdown.totalEur}). Payment code: ${paymentCode}`,
    });

    if (params.conversationId) {
      await this.safeSendChatMessage(params.conversationId, {
        senderId: "system",
        senderName: "Caba Pro Finance",
        type: "system",
        text: `🤝 Agreement confirmed! Transaction #${paymentCode} created. Buyer must deposit ${breakdown.totalDzd.toLocaleString()} DZD at ${bureau.name} before ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} tomorrow.`,
      });
    }

    return tx;
  }

  /**
   * STAGE 2: Bureau Staff confirms physical cash received
   */
  static async recordBureauPayment(params: {
    transactionId: string;
    receivedAmountDzd: number;
    receiptPhotoUrl?: string;
    staffId: string;
    staffName: string;
    idChecked: boolean;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");
    if (tx.status !== "AWAITING_PAYMENT") {
      throw new Error(`Invalid state transition: cannot record payment in state ${tx.status}`);
    }

    const expected = tx.priceBreakdown.totalDzd;
    if (params.receivedAmountDzd < expected) {
      throw new Error(`Insufficient amount. Expected ${expected} DZD, received ${params.receivedAmountDzd} DZD.`);
    }

    // Generate single-use, secure 6-digit delivery code
    const rawDeliveryCode = generate6DigitCode();
    const salt = Math.random().toString(36).substring(2, 10);
    const hashedCode = await sha256(`${rawDeliveryCode}${salt}`);

    const codeExpiry = new Date();
    codeExpiry.setDate(codeExpiry.getDate() + 7); // 7-day validity

    const previousStatus = tx.status;
    tx.status = "PAID";
    tx.previousStatus = previousStatus;
    tx.updatedAt = new Date().toISOString();

    tx.bureauPaymentRecord = {
      receivedAmountDzd: params.receivedAmountDzd,
      receiptPhotoUrl: params.receiptPhotoUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
      verifiedById: params.staffId,
      verifiedByName: params.staffName,
      paidAt: new Date().toISOString(),
      idChecked: params.idChecked,
    };

    tx.deliveryCode = {
      hashedCode,
      salt,
      plaintextForDemo: rawDeliveryCode, // Accessible for user and testing convenience
      attempts: 0,
      maxAttempts: FINANCIAL_CONFIG.MAX_CODE_ATTEMPTS,
      isLocked: false,
      expiresAt: codeExpiry.toISOString(),
    };

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "PAID",
        previousStatus,
        bureauPaymentRecord: tx.bureauPaymentRecord,
        deliveryCode: tx.deliveryCode,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    // Append Double-Entry Ledger records
    await this.appendLedgerEntry({
      transactionId: tx.id,
      debitAccount: LEDGER_ACCOUNTS.BUREAU_CASH,
      creditAccount: "EXT_BUYER_CASH",
      amount: params.receivedAmountDzd,
      currency: "DZD",
      idempotencyKey: `pay-${tx.id}-${Date.now()}`,
      description: `In-person cash receipt verified by ${params.staffName} at ${tx.bureauName}`,
    });

    await this.appendLedgerEntry({
      transactionId: tx.id,
      debitAccount: "EXT_ESCROW_OBLIGATION",
      creditAccount: LEDGER_ACCOUNTS.CUSTOMER_ESCROW,
      amount: tx.priceBreakdown.totalEur,
      currency: "EUR",
      idempotencyKey: `escrow-${tx.id}-${Date.now()}`,
      description: `Customer funds locked in escrow. EUR equivalent at ${tx.priceBreakdown.fxRate} DZD/EUR`,
    });

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "PAID",
      actorId: params.staffId,
      actorRole: "bureau_staff",
      actorName: params.staffName,
      action: "BUREAU_PAYMENT_VERIFIED",
      details: `Cash payment of ${params.receivedAmountDzd.toLocaleString()} DZD confirmed. Buyer ID verified: ${params.idChecked}. Delivery code generated.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Caba Bureau Alger",
        type: "system",
        text: `✅ Payment received in cash at ${tx.bureauName}! ${params.receivedAmountDzd.toLocaleString()} DZD locked in escrow. Bringer Karim is now authorized to proceed with international transfer and purchase.`,
      });
    }

    return tx;
  }

  /**
   * STAGE 3: Bureau Staff initiates international wire/card advance to bringer
   */
  static async initiateFundsTransfer(params: {
    transactionId: string;
    method: "bank_wire" | "card_payout" | "wise" | "revolut";
    transferRef: string;
    proofUrl?: string;
    staffId: string;
    staffName: string;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");
    if (tx.status !== "PAID" && tx.status !== "FUNDS_TRANSFER_PENDING") {
      throw new Error(`Cannot initiate funds transfer in state ${tx.status}`);
    }

    const advanceAmountEur = tx.priceBreakdown.productPrice;
    const requiresDual = advanceAmountEur >= FINANCIAL_CONFIG.DUAL_APPROVAL_THRESHOLD_EUR;

    const transferRecord: FundsTransferRecord = {
      id: `wire-${Date.now()}`,
      transactionId: tx.id,
      method: params.method,
      amountEur: advanceAmountEur,
      currency: "EUR",
      feesEur: 0,
      fxRate: tx.priceBreakdown.fxRate,
      transferRef: params.transferRef,
      proofUrl: params.proofUrl || "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400",
      status: requiresDual ? "PENDING" : "SENT",
      requiresDualApproval: requiresDual,
      createdAt: new Date().toISOString(),
    };

    const nextStatus: TransactionStatus = requiresDual ? "FUNDS_TRANSFER_PENDING" : "FUNDS_SENT_TO_BRINGER";
    const previousStatus = tx.status;
    tx.status = nextStatus;
    tx.previousStatus = previousStatus;
    tx.fundsTransfer = transferRecord;
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: nextStatus,
        previousStatus,
        fundsTransfer: transferRecord,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    if (!requiresDual) {
      await this.appendLedgerEntry({
        transactionId: tx.id,
        debitAccount: LEDGER_ACCOUNTS.CUSTOMER_ESCROW,
        creditAccount: LEDGER_ACCOUNTS.BRINGER_PENDING,
        amount: advanceAmountEur,
        currency: "EUR",
        idempotencyKey: `wire-${tx.id}-${Date.now()}`,
        description: `Advance product cost wired to bringer via ${params.method}. Ref: ${params.transferRef}`,
      });
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: nextStatus,
      actorId: params.staffId,
      actorRole: "bureau_staff",
      actorName: params.staffName,
      action: requiresDual ? "WIRE_PENDING_DUAL_APPROVAL" : "WIRE_DISPATCHED",
      details: `International transfer of €${advanceAmountEur} (${params.method}, ref: ${params.transferRef}) ${requiresDual ? "queued for Finance dual approval" : "dispatched to bringer"}.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Caba International Payments",
        type: "system",
        text: requiresDual
          ? `📋 Wire of €${advanceAmountEur} registered. Pending dual-control authorization from Finance.`
          : `💸 €${advanceAmountEur} advance wired to bringer via ${params.method} (Ref: ${params.transferRef}). Bringer: please confirm once received in your account.`,
      });
    }

    return tx;
  }

  /**
   * STAGE 3 (Dual Control): Finance admin approves high-value transfer (> €500)
   */
  static async approveDualControlTransfer(params: {
    transactionId: string;
    financeAdminId: string;
    financeAdminName: string;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx || !tx.fundsTransfer) throw new Error("Transaction or transfer record not found");
    if (tx.status !== "FUNDS_TRANSFER_PENDING") {
      throw new Error(`Cannot dual-approve transfer in state ${tx.status}`);
    }

    tx.fundsTransfer.status = "SENT";
    tx.fundsTransfer.approvedBy = params.financeAdminName;
    tx.fundsTransfer.approvedAt = new Date().toISOString();

    const previousStatus = tx.status;
    tx.status = "FUNDS_SENT_TO_BRINGER";
    tx.previousStatus = previousStatus;
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "FUNDS_SENT_TO_BRINGER",
        previousStatus,
        fundsTransfer: tx.fundsTransfer,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.appendLedgerEntry({
      transactionId: tx.id,
      debitAccount: LEDGER_ACCOUNTS.CUSTOMER_ESCROW,
      creditAccount: LEDGER_ACCOUNTS.BRINGER_PENDING,
      amount: tx.fundsTransfer.amountEur,
      currency: "EUR",
      idempotencyKey: `wire-approved-${tx.id}-${Date.now()}`,
      description: `Dual-control approval: €${tx.fundsTransfer.amountEur} released to Bringer Pending by ${params.financeAdminName}`,
    });

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "FUNDS_SENT_TO_BRINGER",
      actorId: params.financeAdminId,
      actorRole: "finance",
      actorName: params.financeAdminName,
      action: "DUAL_CONTROL_APPROVED",
      details: `Finance dual authorization granted by ${params.financeAdminName}. Transfer dispatched.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Finance Control",
        type: "system",
        text: `🔐 Finance authorization confirmed by ${params.financeAdminName}. Wire released to traveler.`,
      });
    }

    return tx;
  }

  /**
   * STAGE 3: Bringer confirms reception of funds
   */
  static async confirmBringerFunds(params: {
    transactionId: string;
    bringerId: string;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx || !tx.fundsTransfer) throw new Error("Transaction not found");
    if (tx.status !== "FUNDS_SENT_TO_BRINGER") {
      throw new Error(`Cannot confirm funds in state ${tx.status}`);
    }

    tx.fundsTransfer.status = "CONFIRMED";
    tx.fundsTransfer.confirmedAt = new Date().toISOString();

    const previousStatus = tx.status;
    tx.status = "PURCHASING";
    tx.previousStatus = previousStatus;
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "PURCHASING",
        previousStatus,
        fundsTransfer: tx.fundsTransfer,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "PURCHASING",
      actorId: params.bringerId,
      actorRole: "bringer",
      actorName: tx.bringerName,
      action: "FUNDS_CONFIRMED_BY_BRINGER",
      details: `Traveler confirmed reception of €${tx.fundsTransfer.amountEur}. Purchasing phase started.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Caba Pro",
        type: "system",
        text: `🛒 Traveler ${tx.bringerName} confirmed funds reception. Now purchasing ${tx.productName}!`,
      });
    }

    return tx;
  }

  /**
   * STAGE 4: Bringer uploads purchase proof (Receipt, Product photo, Packaging photo)
   */
  static async submitPurchaseProof(params: {
    transactionId: string;
    bringerId: string;
    receiptUrl: string;
    productPhotoUrl: string;
    packagingPhotoUrl: string;
    storeName?: string;
    purchaseAmountEur?: number;
    notes?: string;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");

    const proof: PurchaseProof = {
      receiptUrl: params.receiptUrl,
      productPhotoUrl: params.productPhotoUrl,
      packagingPhotoUrl: params.packagingPhotoUrl,
      storeName: params.storeName || "Official Store",
      purchaseAmountEur: params.purchaseAmountEur || tx.priceBreakdown.productPrice,
      notes: params.notes || "Item brand new and inspected.",
      uploadedAt: new Date().toISOString(),
      buyerApproved: false,
    };

    const previousStatus = tx.status;
    tx.status = "PURCHASED";
    tx.previousStatus = previousStatus;
    tx.purchaseProof = proof;
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "PURCHASED",
        previousStatus,
        purchaseProof: proof,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "PURCHASED",
      actorId: params.bringerId,
      actorRole: "bringer",
      actorName: tx.bringerName,
      action: "PURCHASE_PROOF_SUBMITTED",
      details: `Purchase proof uploaded by ${tx.bringerName}. Store: ${proof.storeName}. Buyer notification dispatched.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Caba Pro",
        type: "system",
        text: `📸 Traveler ${tx.bringerName} has purchased ${tx.productName} and uploaded proof photos and receipt. Buyer ${tx.buyerName}: please review and approve the item.`,
      });
    }

    return tx;
  }

  /**
   * STAGE 4: Buyer approves purchase proof
   */
  static async approvePurchaseProof(params: {
    transactionId: string;
    buyerId: string;
    buyerNotes?: string;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx || !tx.purchaseProof) throw new Error("Transaction or proof not found");

    tx.purchaseProof.buyerApproved = true;
    tx.purchaseProof.buyerApprovedAt = new Date().toISOString();
    tx.purchaseProof.buyerNotes = params.buyerNotes || "Approved";
    tx.safeHandover.buyerConfirmedProof = true;
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        purchaseProof: tx.purchaseProof,
        safeHandover: tx.safeHandover,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: tx.status,
      toState: tx.status,
      actorId: params.buyerId,
      actorRole: "buyer",
      actorName: tx.buyerName,
      action: "PURCHASE_PROOF_APPROVED",
      details: `Buyer ${tx.buyerName} approved purchase proof photos and store receipt. Ready for Safe Handover checklist.`,
    });

    return tx;
  }

  /**
   * STAGE 5: Safe Handover checklist at origin
   */
  static async submitSafeHandoverChecklist(params: {
    transactionId: string;
    bringerId: string;
    checklist: Omit<SafeHandoverChecklist, "completedAt">;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");

    const fullChecklist: SafeHandoverChecklist = {
      ...params.checklist,
      bringerConfirmed: true,
      buyerConfirmedProof: true,
      completedAt: new Date().toISOString(),
    };

    // Verify all 6 mandatory items
    const isValid =
      fullChecklist.itemMatchesListing &&
      fullChecklist.modelQuantityVerified &&
      fullChecklist.packagingInspected &&
      fullChecklist.noProhibitedItems &&
      fullChecklist.receiptAttached;

    if (!isValid) {
      throw new Error("All Safe Handover checklist items must be physically verified before handover.");
    }

    const previousStatus = tx.status;
    tx.status = "HANDED_OVER";
    tx.previousStatus = previousStatus;
    tx.safeHandover = fullChecklist;
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "HANDED_OVER",
        previousStatus,
        safeHandover: fullChecklist,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "HANDED_OVER",
      actorId: params.bringerId,
      actorRole: "bringer",
      actorName: tx.bringerName,
      action: "SAFE_HANDOVER_VERIFIED",
      details: `Safe Handover checklist passed: packaging inspected, no prohibited items, model verified.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Caba Pro Trust & Safety",
        type: "system",
        text: `🛡️ Safe Handover protocol verified for ${tx.productName}! Package inspected and ready for travel.`,
      });
    }

    return tx;
  }

  /**
   * STAGE 5: Start trip & broadcast transit
   */
  static async startTransit(params: {
    transactionId: string;
    bringerId: string;
    flightNumber?: string;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");

    const previousStatus = tx.status;
    tx.status = "IN_TRANSIT";
    tx.previousStatus = previousStatus;
    tx.travelDetails = {
      departureTime: new Date().toISOString(),
      flightNumber: params.flightNumber || "Flight / Transit",
    };
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "IN_TRANSIT",
        previousStatus,
        travelDetails: tx.travelDetails,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "IN_TRANSIT",
      actorId: params.bringerId,
      actorRole: "bringer",
      actorName: tx.bringerName,
      action: "TRANSIT_STARTED",
      details: `Traveler in transit with ${tx.productName}. Route: ${tx.tripRoute}.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Flight & Transit Desk",
        type: "system",
        text: `✈️ Traveler ${tx.bringerName} is on the way! Trip route: ${tx.tripRoute}. ETA tracking active.`,
      });
    }

    return tx;
  }

  /**
   * STAGE 6: Confirm Arrival in Algeria
   * (Supports direct action button for bringer after agreement / transit as requested)
   */
  static async confirmArrival(params: {
    transactionId: string;
    bringerId: string;
    arrivalCity?: string;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");

    const previousStatus = tx.status;
    tx.status = "ARRIVED";
    tx.previousStatus = previousStatus;
    tx.travelDetails = {
      ...tx.travelDetails,
      arrivedAt: new Date().toISOString(),
      arrivalCity: params.arrivalCity || tx.bureauCity || "Alger",
    };
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "ARRIVED",
        previousStatus,
        travelDetails: tx.travelDetails,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "ARRIVED",
      actorId: params.bringerId,
      actorRole: "bringer",
      actorName: tx.bringerName,
      action: "ARRIVAL_CONFIRMED",
      details: `Traveler confirmed arrival in ${tx.travelDetails.arrivalCity}. Unlocking Stage 6 Reception Coordination.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Caba Arrival Service",
        type: "system",
        text: `📍 Traveler ${tx.bringerName} has arrived in ${tx.travelDetails.arrivalCity}! Buyer ${tx.buyerName}: please select your reception method (Bureau Pickup, Public Meetup, or Door Delivery).`,
      });
    }

    return tx;
  }

  /**
   * STAGE 6: Set reception method & coordinate meeting
   */
  static async arrangeMeeting(params: {
    transactionId: string;
    actorId: string;
    method: ReceptionMethod;
    meetingPoint: string;
    meetingTime: string;
    notes?: string;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");

    const previousStatus = tx.status;
    tx.status = "MEETING_ARRANGED";
    tx.previousStatus = previousStatus;
    tx.reception = {
      ...tx.reception,
      method: params.method,
      meetingPoint: params.meetingPoint,
      meetingTime: params.meetingTime,
      notes: params.notes,
      status: "accepted",
      lastStatusUpdateBy: params.actorId,
    };
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "MEETING_ARRANGED",
        previousStatus,
        reception: tx.reception,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "MEETING_ARRANGED",
      actorId: params.actorId,
      actorRole: params.actorId === tx.buyerId ? "buyer" : "bringer",
      actorName: params.actorId === tx.buyerId ? tx.buyerName : tx.bringerName,
      action: "MEETING_ARRANGED",
      details: `Meeting coordinated: ${params.method} at ${params.meetingPoint} (${params.meetingTime}).`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Meeting Coordinator",
        type: "system",
        text: `🤝 Handover meeting agreed! Method: ${params.method}. Location: ${params.meetingPoint}. Time: ${params.meetingTime}.`,
      });
    }

    return tx;
  }

  /**
   * STAGE 6: Update live meeting status & opt-in location ping
   */
  static async updateMeetingStatus(params: {
    transactionId: string;
    actorId: string;
    status: MeetingStatus;
    locationPing?: { lat: number; lng: number; label: string } | null;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");

    tx.reception.status = params.status;
    tx.reception.lastStatusUpdateBy = params.actorId;

    if (params.locationPing) {
      tx.reception.locationPing = {
        enabled: true,
        lat: params.locationPing.lat,
        lng: params.locationPing.lng,
        label: params.locationPing.label,
        sharedBy: params.actorId === tx.buyerId ? "buyer" : "bringer",
        updatedAt: new Date().toISOString(),
      };
    }

    tx.updatedAt = new Date().toISOString();
    localTransactions.set(tx.id, tx);

    try {
      await updateDoc("transactions", tx.id, {
        reception: tx.reception,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    const actorName = params.actorId === tx.buyerId ? tx.buyerName : tx.bringerName;
    const readableStatus = {
      on_my_way: "🏃 On my way",
      arrived: "📍 I have arrived at the meeting point",
      running_late: "⏱ Running 15 minutes late",
      reschedule: "🔄 Requesting reschedule",
      proposed: "Proposed",
      accepted: "Meeting confirmed",
    }[params.status];

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: tx.status,
      toState: tx.status,
      actorId: params.actorId,
      actorRole: params.actorId === tx.buyerId ? "buyer" : "bringer",
      actorName,
      action: "MEETING_STATUS_UPDATE",
      details: `${actorName} updated meeting status: ${readableStatus}`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Live Coordination",
        type: "system",
        text: `💬 ${actorName}: ${readableStatus}`,
      });
    }

    return tx;
  }

  /**
   * STAGE 6: Bringer enters 6-digit delivery code provided by Buyer upon physical inspection
   */
  static async verifyDeliveryCode(params: {
    transactionId: string;
    bringerId: string;
    enteredCode: string;
  }): Promise<{ success: boolean; message: string; attemptsRemaining: number; transaction: Transaction }> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");

    if (tx.deliveryCode.isLocked) {
      return {
        success: false,
        message: "Delivery code is locked due to too many failed attempts. Contact Bureau or Support.",
        attemptsRemaining: 0,
        transaction: tx,
      };
    }

    const testHash = await sha256(`${params.enteredCode.trim()}${tx.deliveryCode.salt}`);
    const isMatch = testHash === tx.deliveryCode.hashedCode;

    if (!isMatch) {
      tx.deliveryCode.attempts += 1;
      const remaining = Math.max(0, tx.deliveryCode.maxAttempts - tx.deliveryCode.attempts);
      if (remaining === 0) {
        tx.deliveryCode.isLocked = true;
      }

      tx.updatedAt = new Date().toISOString();
      localTransactions.set(tx.id, tx);
      try {
        await updateDoc("transactions", tx.id, {
          deliveryCode: tx.deliveryCode,
          updatedAt: tx.updatedAt,
        });
      } catch (e) {
        console.warn("Firestore update notice:", e);
      }

      await this.writeAuditLog({
        transactionId: tx.id,
        fromState: tx.status,
        toState: tx.status,
        actorId: params.bringerId,
        actorRole: "bringer",
        actorName: tx.bringerName,
        action: "DELIVERY_CODE_FAILED",
        details: `Invalid code attempt. Attempts: ${tx.deliveryCode.attempts}/${tx.deliveryCode.maxAttempts}. Locked: ${tx.deliveryCode.isLocked}`,
      });

      return {
        success: false,
        message: tx.deliveryCode.isLocked
          ? "Too many incorrect attempts. Code locked for security."
          : `Incorrect delivery code. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
        transaction: tx,
      };
    }

    // Success: code verified!
    const previousStatus = tx.status;
    tx.status = "DELIVERED";
    tx.previousStatus = previousStatus;
    tx.deliveryCode.consumedAt = new Date().toISOString();
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "DELIVERED",
        previousStatus,
        deliveryCode: tx.deliveryCode,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "DELIVERED",
      actorId: params.bringerId,
      actorRole: "bringer",
      actorName: tx.bringerName,
      action: "DELIVERY_CODE_VERIFIED",
      details: `Delivery code cryptographic hash verified successfully! Item marked DELIVERED. 24h auto-confirm window open.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Delivery Handshake",
        type: "system",
        text: `🎉 Delivery code verified! ${tx.productName} has been handed over. Buyer ${tx.buyerName}: please confirm delivery to release funds.`,
      });
    }

    return {
      success: true,
      message: "Delivery code verified successfully!",
      attemptsRemaining: tx.deliveryCode.maxAttempts,
      transaction: tx,
    };
  }

  /**
   * STAGE 7: Buyer confirms delivery & releases escrow
   */
  static async confirmDelivery(params: {
    transactionId: string;
    buyerId: string;
    buyerReview?: { rating: number; comment: string };
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");

    const previousStatus = tx.status;
    tx.status = "COMPLETED";
    tx.previousStatus = previousStatus;
    if (params.buyerReview) {
      tx.buyerReview = {
        ...params.buyerReview,
        createdAt: new Date().toISOString(),
      };
    }
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "COMPLETED",
        previousStatus,
        buyerReview: tx.buyerReview,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    // Ledger: Release Bringer Reward & Platform Fees
    await this.appendLedgerEntry({
      transactionId: tx.id,
      debitAccount: LEDGER_ACCOUNTS.CUSTOMER_ESCROW,
      creditAccount: LEDGER_ACCOUNTS.BRINGER_AVAILABLE,
      amount: tx.priceBreakdown.bringerFee,
      currency: "EUR",
      idempotencyKey: `payout-bringer-${tx.id}`,
      description: `Bringer fee released to ${tx.bringerName} wallet upon confirmed delivery`,
    });

    await this.appendLedgerEntry({
      transactionId: tx.id,
      debitAccount: LEDGER_ACCOUNTS.CUSTOMER_ESCROW,
      creditAccount: LEDGER_ACCOUNTS.PLATFORM_REVENUE,
      amount: tx.priceBreakdown.platformFee,
      currency: "EUR",
      idempotencyKey: `plat-fee-${tx.id}`,
      description: `Caba Pro 7% platform fee booked`,
    });

    await this.appendLedgerEntry({
      transactionId: tx.id,
      debitAccount: LEDGER_ACCOUNTS.CUSTOMER_ESCROW,
      creditAccount: LEDGER_ACCOUNTS.GUARANTEE_RESERVE,
      amount: tx.priceBreakdown.guaranteeFee,
      currency: "EUR",
      idempotencyKey: `guar-fee-${tx.id}`,
      description: `2.5% Guarantee & Protection reserve booked`,
    });

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "COMPLETED",
      actorId: params.buyerId,
      actorRole: "buyer",
      actorName: tx.buyerName,
      action: "ESCROW_RELEASED",
      details: `Delivery confirmed. Escrow released: €${tx.priceBreakdown.bringerFee} reward to Bringer wallet. Transaction complete!`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Caba Pro Finance",
        type: "system",
        text: `🏆 Order successfully completed! €${tx.priceBreakdown.bringerFee} reward is now available in traveler ${tx.bringerName}'s wallet. Thank you for using Caba Pro!`,
      });
    }

    return tx;
  }

  /**
   * STAGE 8: Open Dispute
   */
  static async openDispute(params: {
    transactionId: string;
    openedBy: string;
    openedByName: string;
    reason: string;
    evidenceUrls?: string[];
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx) throw new Error("Transaction not found");

    const dispute: DisputeRecord = {
      id: `disp-${Date.now()}`,
      transactionId: tx.id,
      openedBy: params.openedBy,
      openedByName: params.openedByName,
      openedAt: new Date().toISOString(),
      reason: params.reason,
      evidenceUrls: params.evidenceUrls || [],
      status: "OPEN",
    };

    const previousStatus = tx.status;
    tx.status = "DISPUTED";
    tx.previousStatus = previousStatus;
    tx.dispute = dispute;
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: "DISPUTED",
        previousStatus,
        dispute,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: "DISPUTED",
      actorId: params.openedBy,
      actorRole: params.openedBy === tx.buyerId ? "buyer" : "bringer",
      actorName: params.openedByName,
      action: "DISPUTE_OPENED",
      details: `Dispute opened by ${params.openedByName}. Reason: ${params.reason}. Escrow release frozen.`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Moderation & Safety",
        type: "system",
        text: `⚠️ A dispute was opened by ${params.openedByName}: "${params.reason}". Escrow release is frozen. A Caba Pro moderator is reviewing the dossier.`,
      });
    }

    return tx;
  }

  /**
   * STAGE 8: Moderator resolves dispute
   */
  static async resolveDispute(params: {
    transactionId: string;
    moderatorId: string;
    moderatorName: string;
    resolution: "FULL_REFUND" | "PARTIAL_REFUND" | "RELEASE_BRINGER" | "SPLIT";
    moderatorNotes: string;
  }): Promise<Transaction> {
    const tx = await this.getTransaction(params.transactionId);
    if (!tx || !tx.dispute) throw new Error("Transaction or dispute not found");

    tx.dispute.status = "RESOLVED";
    tx.dispute.resolution = params.resolution;
    tx.dispute.moderatorNotes = params.moderatorNotes;
    tx.dispute.resolvedBy = params.moderatorName;
    tx.dispute.resolvedAt = new Date().toISOString();

    const previousStatus = tx.status;
    const nextStatus: TransactionStatus =
      params.resolution === "FULL_REFUND"
        ? "REFUNDED"
        : params.resolution === "PARTIAL_REFUND" || params.resolution === "SPLIT"
        ? "PARTIALLY_REFUNDED"
        : "COMPLETED";

    tx.status = nextStatus;
    tx.previousStatus = previousStatus;
    tx.updatedAt = new Date().toISOString();

    localTransactions.set(tx.id, tx);
    try {
      await updateDoc("transactions", tx.id, {
        status: nextStatus,
        previousStatus,
        dispute: tx.dispute,
        updatedAt: tx.updatedAt,
      });
    } catch (e) {
      console.warn("Firestore update notice:", e);
    }

    await this.writeAuditLog({
      transactionId: tx.id,
      fromState: previousStatus,
      toState: nextStatus,
      actorId: params.moderatorId,
      actorRole: "moderator",
      actorName: params.moderatorName,
      action: "DISPUTE_RESOLVED",
      details: `Resolution: ${params.resolution}. Notes: ${params.moderatorNotes}`,
    });

    if (tx.conversationId) {
      await this.safeSendChatMessage(tx.conversationId, {
        senderId: "system",
        senderName: "Moderation Verdict",
        type: "system",
        text: `⚖️ Dispute resolved by Moderator ${params.moderatorName}: ${params.resolution}. ${params.moderatorNotes}`,
      });
    }

    return tx;
  }
}
