import { TransactionService, generate6DigitCode } from "./transactionService";
import { Transaction } from "./types";
import { PARTNER_BUREAUS } from "./constants";

export interface DemoPersona {
  role: "buyer" | "bringer" | "bureau_staff" | "finance" | "moderator";
  name: string;
  email: string;
  avatar: string;
  title: string;
}

export const DEMO_PERSONAS: Record<string, DemoPersona> = {
  buyer: {
    role: "buyer",
    name: "Sarah J.",
    email: "sarah.buyer@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    title: "Buyer (Alger)",
  },
  bringer: {
    role: "bringer",
    name: "Karim B.",
    email: "karim.traveler@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    title: "Bringer / Traveler (Paris → Alger)",
  },
  bureau_staff: {
    role: "bureau_staff",
    name: "Mustapha K.",
    email: "mustapha.bureau@cabapro.dz",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    title: "Bureau Staff (Alger Centre)",
  },
  finance: {
    role: "finance",
    name: "Amine T.",
    email: "amine.finance@cabapro.dz",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    title: "Finance Director (Dual Control)",
  },
  moderator: {
    role: "moderator",
    name: "Samira R.",
    email: "samira.mod@cabapro.dz",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    title: "Trust & Safety Moderator",
  },
};

export const DEMO_TRANSACTION_ID = "tx-demo-caba-pro-001";

export class DemoSimulator {
  /**
   * Initializes or returns the standard clean demo transaction
   */
  static async getOrCreateDemoTransaction(): Promise<Transaction> {
    const existing = await TransactionService.getTransaction(DEMO_TRANSACTION_ID);
    if (existing) return existing;

    return this.resetDemoTransaction();
  }

  /**
   * Resets the demo transaction to fresh initial state
   */
  static async resetDemoTransaction(): Promise<Transaction> {
    const tx = await TransactionService.createTransactionFromOffer({
      conversationId: "conv-demo-001",
      requestId: "req-sony-001",
      requestTitle: "Sony WH-1000XM5 Wireless Headphones",
      productName: "Sony WH-1000XM5",
      tripId: "trip-paris-alger-001",
      tripRoute: "Paris (CDG) → Alger (ALG)",
      buyerId: "user-sarah-001",
      buyerName: DEMO_PERSONAS.buyer.name,
      bringerId: "user-karim-001",
      bringerName: DEMO_PERSONAS.bringer.name,
      productPriceEur: 320,
      bringerFeeEur: 35,
      bureauId: PARTNER_BUREAUS[0].id,
      customId: DEMO_TRANSACTION_ID,
    });

    tx.productImageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400";
    return tx;
  }

  /**
   * Fast actions to simulate each step without leaving the page
   */
  static async stepPayAtBureau(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.recordBureauPayment({
      transactionId: tx.id,
      receivedAmountDzd: tx.priceBreakdown.totalDzd,
      staffId: "staff-mustapha-001",
      staffName: DEMO_PERSONAS.bureau_staff.name,
      idChecked: true,
      receiptPhotoUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
    });
  }

  static async stepSendWire(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.initiateFundsTransfer({
      transactionId: tx.id,
      method: "bank_wire",
      transferRef: `SEPA-${Math.floor(100000 + Math.random() * 900000)}`,
      staffId: "staff-mustapha-001",
      staffName: DEMO_PERSONAS.bureau_staff.name,
    });
  }

  static async stepApproveDualControl(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.approveDualControlTransfer({
      transactionId: tx.id,
      financeAdminId: "admin-amine-001",
      financeAdminName: DEMO_PERSONAS.finance.name,
    });
  }

  static async stepConfirmBringerFunds(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.confirmBringerFunds({
      transactionId: tx.id,
      bringerId: tx.bringerId,
    });
  }

  static async stepSubmitPurchaseProof(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.submitPurchaseProof({
      transactionId: tx.id,
      bringerId: tx.bringerId,
      receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
      productPhotoUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      packagingPhotoUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400",
      storeName: "Fnac Paris Saint-Lazare",
      purchaseAmountEur: tx.priceBreakdown.productPrice,
    });
  }

  static async stepApproveProof(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.approvePurchaseProof({
      transactionId: tx.id,
      buyerId: tx.buyerId,
      buyerNotes: "Receipt and photos confirmed. All good!",
    });
  }

  static async stepSafeHandover(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.submitSafeHandoverChecklist({
      transactionId: tx.id,
      bringerId: tx.bringerId,
      checklist: {
        itemMatchesListing: true,
        modelQuantityVerified: true,
        packagingInspected: true,
        noProhibitedItems: true,
        receiptAttached: true,
        bringerConfirmed: true,
        buyerConfirmedProof: true,
      },
    });
  }

  static async stepStartTransit(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.startTransit({
      transactionId: tx.id,
      bringerId: tx.bringerId,
      flightNumber: "Air Algérie AH1001 (CDG → ALG)",
    });
  }

  static async stepConfirmArrival(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.confirmArrival({
      transactionId: tx.id,
      bringerId: tx.bringerId,
      arrivalCity: "Alger",
    });
  }

  static async stepArrangeMeeting(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.arrangeMeeting({
      transactionId: tx.id,
      actorId: tx.buyerId,
      method: "bureau_pickup",
      meetingPoint: PARTNER_BUREAUS[0].address,
      meetingTime: "Demain à 14:30",
      notes: "Rencontre au guichet Caba Pro Didouche Mourad",
    });
  }

  static async stepVerifyCorrectCode(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx || !tx.deliveryCode.plaintextForDemo) return;
    return TransactionService.verifyDeliveryCode({
      transactionId: tx.id,
      bringerId: tx.bringerId,
      enteredCode: tx.deliveryCode.plaintextForDemo,
    });
  }

  static async stepVerifyWrongCode(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.verifyDeliveryCode({
      transactionId: tx.id,
      bringerId: tx.bringerId,
      enteredCode: "000000",
    });
  }

  static async stepCompleteDelivery(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.confirmDelivery({
      transactionId: tx.id,
      buyerId: tx.buyerId,
      buyerReview: {
        rating: 5,
        comment: "Excellent service! Rapide et produit neuf conforme.",
      },
    });
  }

  static async stepOpenDispute(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.openDispute({
      transactionId: tx.id,
      openedBy: tx.buyerId,
      openedByName: tx.buyerName,
      reason: "Le modèle reçu ne correspond pas à la couleur demandée dans l'offre.",
      evidenceUrls: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"],
    });
  }

  static async stepResolveDispute(txId: string = DEMO_TRANSACTION_ID) {
    const tx = await TransactionService.getTransaction(txId);
    if (!tx) return;
    return TransactionService.resolveDispute({
      transactionId: tx.id,
      moderatorId: "mod-samira-001",
      moderatorName: DEMO_PERSONAS.moderator.name,
      resolution: "PARTIAL_REFUND",
      moderatorNotes: "Compensation de 30€ accordée à l'acheteur pour dédommagement couleur.",
    });
  }
}
