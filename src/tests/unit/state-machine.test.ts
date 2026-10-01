import { describe, it, expect } from "vitest";
import { TransactionStatus } from "@prisma/client";

// Test the state machine transition table rules
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

describe("Phase 7 - State Machine Transition Matrix Tests", () => {
  it("validates direct happy path transitions from AGREED to COMPLETED", () => {
    const happyPath = [
      TransactionStatus.AGREED,
      TransactionStatus.AWAITING_PAYMENT,
      TransactionStatus.PAID,
      TransactionStatus.PURCHASING,
      TransactionStatus.PURCHASED,
      TransactionStatus.PRODUCT_PROOF_REVIEW,
      TransactionStatus.HANDED_OVER,
      TransactionStatus.IN_TRANSIT,
      TransactionStatus.ARRIVED,
      TransactionStatus.DELIVERED,
      TransactionStatus.CONFIRMED,
      TransactionStatus.COMPLETED,
    ];

    for (let i = 0; i < happyPath.length - 1; i++) {
      const from = happyPath[i];
      const to = happyPath[i + 1];
      const allowed = ALLOWED_TRANSITIONS[from];
      expect(allowed).toContain(to);
    }
  });

  it("validates the Bureau payment flow transitions", () => {
    const bureauPath = [
      TransactionStatus.AGREED,
      TransactionStatus.AWAITING_BUREAU_PAYMENT,
      TransactionStatus.BUREAU_PAYMENT_RECEIVED,
      TransactionStatus.PAID,
      TransactionStatus.FUNDS_TRANSFER_PENDING,
      TransactionStatus.FUNDS_SENT_TO_BRINGER,
      TransactionStatus.FUNDS_CONFIRMED_BY_BRINGER,
      TransactionStatus.PURCHASING,
    ];

    for (let i = 0; i < bureauPath.length - 1; i++) {
      const from = bureauPath[i];
      const to = bureauPath[i + 1];
      const allowed = ALLOWED_TRANSITIONS[from];
      expect(allowed).toContain(to);
    }
  });

  it("strictly forbids illegal backwards or skipping transitions", () => {
    // Cannot jump from AGREED straight to DELIVERED
    expect(ALLOWED_TRANSITIONS[TransactionStatus.AGREED]).not.toContain(TransactionStatus.DELIVERED);

    // Cannot jump from PAID straight to COMPLETED without delivery
    expect(ALLOWED_TRANSITIONS[TransactionStatus.PAID]).not.toContain(TransactionStatus.COMPLETED);

    // Cannot transition out of terminal state COMPLETED
    expect(ALLOWED_TRANSITIONS[TransactionStatus.COMPLETED].length).toBe(0);

    // Cannot transition out of terminal state CANCELLED
    expect(ALLOWED_TRANSITIONS[TransactionStatus.CANCELLED].length).toBe(0);
  });
});
