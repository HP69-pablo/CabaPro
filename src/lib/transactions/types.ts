export type TransactionStatus =
  | "AGREED"
  | "AWAITING_PAYMENT"
  | "BUREAU_PAYMENT_RECEIVED"
  | "PAID"
  | "FUNDS_TRANSFER_PENDING"
  | "FUNDS_SENT_TO_BRINGER"
  | "FUNDS_CONFIRMED_BY_BRINGER"
  | "PURCHASING"
  | "PURCHASED"
  | "HANDED_OVER"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "MEETING_ARRANGED"
  | "DELIVERED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "DISPUTED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type ReceptionMethod = "bureau_pickup" | "public_meetup" | "door_delivery";

export type MeetingStatus =
  | "proposed"
  | "accepted"
  | "on_my_way"
  | "arrived"
  | "running_late"
  | "reschedule";

export type FundsTransferStatus =
  | "PENDING"
  | "SENT"
  | "CONFIRMED"
  | "FAILED"
  | "RETURNED";

export interface PriceBreakdown {
  productPrice: number; // in EUR
  bringerFee: number; // in EUR
  platformFee: number; // 7% in EUR
  guaranteeFee: number; // 2.5% in EUR
  bureauFeeEur: number; // fixed ~2 EUR (500 DZD)
  bureauFeeDzd: number; // 500 DZD
  fxRate: number; // e.g. 245 DZD per EUR
  totalEur: number; // total in EUR
  totalDzd: number; // total locked in DZD
  lockedAt: string;
}

export interface PartnerBureau {
  id: string;
  name: string;
  wilaya: string;
  city: string;
  address: string;
  phone: string;
  workingHours: string;
  active: boolean;
}

export interface DeliveryCodeData {
  hashedCode: string; // sha256(code + salt)
  salt: string;
  plaintextForDemo?: string; // stored for demo simulator convenience only
  attempts: number;
  maxAttempts: number;
  isLocked: boolean;
  expiresAt: string;
  consumedAt?: string | null;
}

export interface FundsTransferRecord {
  id: string;
  transactionId: string;
  method: "bank_wire" | "card_payout" | "wise" | "revolut";
  amountEur: number;
  currency: string;
  feesEur: number;
  fxRate: number;
  transferRef: string;
  proofUrl?: string;
  status: FundsTransferStatus;
  requiresDualApproval: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
}

export interface PurchaseProof {
  receiptUrl?: string;
  productPhotoUrl?: string;
  packagingPhotoUrl?: string;
  storeName?: string;
  purchaseAmountEur?: number;
  notes?: string;
  uploadedAt: string;
  buyerApproved: boolean;
  buyerApprovedAt?: string | null;
  buyerNotes?: string | null;
}

export interface SafeHandoverChecklist {
  itemMatchesListing: boolean;
  modelQuantityVerified: boolean;
  packagingInspected: boolean;
  noProhibitedItems: boolean;
  receiptAttached: boolean;
  bringerConfirmed: boolean;
  buyerConfirmedProof: boolean;
  completedAt?: string | null;
}

export interface LocationPing {
  enabled: boolean;
  lat: number;
  lng: number;
  label: string;
  sharedBy: "buyer" | "bringer";
  updatedAt: string;
}

export interface ReceptionCoordination {
  method: ReceptionMethod;
  selectedBureauId?: string;
  meetingPoint?: string;
  meetingTime?: string;
  status: MeetingStatus;
  lastStatusUpdateBy?: string;
  notes?: string;
  locationPing?: LocationPing | null;
}

export interface DisputeRecord {
  id: string;
  transactionId: string;
  openedBy: string; // user uid
  openedByName: string;
  openedAt: string;
  reason: string;
  evidenceUrls: string[];
  status: "OPEN" | "INVESTIGATING" | "RESOLVED";
  resolution?: "FULL_REFUND" | "PARTIAL_REFUND" | "RELEASE_BRINGER" | "SPLIT" | null;
  moderatorNotes?: string;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: string;
  idempotencyKey: string;
  description: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  transactionId: string;
  fromState: TransactionStatus | "INITIAL";
  toState: TransactionStatus;
  actorId: string;
  actorRole: "buyer" | "bringer" | "bureau_staff" | "finance" | "moderator" | "admin" | "system";
  actorName: string;
  action: string;
  details?: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  conversationId?: string;
  requestId?: string;
  requestTitle: string;
  productName: string;
  productImageUrl?: string;
  tripId?: string;
  tripRoute: string;
  
  // Parties
  buyerId: string;
  buyerName: string;
  buyerPhone?: string;
  bringerId: string;
  bringerName: string;
  bringerPhone?: string;
  
  // State
  status: TransactionStatus;
  previousStatus?: TransactionStatus;
  
  // Financials
  priceBreakdown: PriceBreakdown;
  paymentCode: string; // 8-char lookup code for bureau
  paymentSlipUrl?: string;
  paymentDeadline: string; // ISO date
  
  // Selected Bureau
  bureauId: string;
  bureauName: string;
  bureauCity: string;
  bureauAddress: string;
  
  // Payment confirmation at bureau
  bureauPaymentRecord?: {
    receivedAmountDzd: number;
    receiptPhotoUrl?: string;
    verifiedById: string;
    verifiedByName: string;
    paidAt: string;
    idChecked: boolean;
  };
  
  // Delivery Code
  deliveryCode: DeliveryCodeData;
  
  // International Funds Transfer
  fundsTransfer?: FundsTransferRecord;
  
  // Purchasing & Proof
  purchaseProof?: PurchaseProof;
  
  // Safe Handover
  safeHandover: SafeHandoverChecklist;
  
  // Transit & Arrival
  travelDetails?: {
    departureTime?: string;
    arrivalTime?: string;
    flightNumber?: string;
    arrivedAt?: string;
    arrivalCity?: string;
  };
  
  // Reception & Meeting
  reception: ReceptionCoordination;
  
  // Exceptions
  dispute?: DisputeRecord;
  
  // Reviews & Timestamps
  buyerReview?: { rating: number; comment: string; createdAt: string };
  bringerReview?: { rating: number; comment: string; createdAt: string };
  createdAt: string;
  updatedAt: string;
}
