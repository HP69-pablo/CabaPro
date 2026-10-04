import { describe, it, expect, beforeEach } from "vitest";
import { TransactionService, sha256 } from "../../lib/transactions/transactionService";
import { DemoSimulator, DEMO_TRANSACTION_ID } from "../../lib/transactions/demoSimulator";

describe("TransactionService State Machine & Cryptographic Delivery Code", () => {
  beforeEach(async () => {
    await DemoSimulator.resetDemoTransaction();
  });

  it("should calculate sha256 hashes correctly", async () => {
    const hash1 = await sha256("123456salt");
    const hash2 = await sha256("123456salt");
    const hash3 = await sha256("999999salt");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64);
  });

  it("should create a transaction with locked price breakdown in DZD and EUR", async () => {
    const tx = await TransactionService.getTransaction(DEMO_TRANSACTION_ID);
    expect(tx).not.toBeNull();
    expect(tx?.status).toBe("AWAITING_PAYMENT");
    expect(tx?.priceBreakdown.productPrice).toBe(320);
    expect(tx?.priceBreakdown.bringerFee).toBe(35);
    expect(tx?.priceBreakdown.totalDzd).toBeGreaterThan(0);
    expect(tx?.paymentCode).toMatch(/^CP-\d{6}$/);
  });

  it("should transition AWAITING_PAYMENT -> PAID when bureau cash is recorded", async () => {
    const tx = await TransactionService.getTransaction(DEMO_TRANSACTION_ID);
    expect(tx?.status).toBe("AWAITING_PAYMENT");

    const paidTx = await DemoSimulator.stepPayAtBureau(DEMO_TRANSACTION_ID);
    expect(paidTx?.status).toBe("PAID");
    expect(paidTx?.bureauPaymentRecord?.receivedAmountDzd).toBe(tx?.priceBreakdown.totalDzd);
    expect(paidTx?.deliveryCode.hashedCode.length).toBe(64);

    // Verify ledger entries
    const ledger = await TransactionService.getLedgerEntries(DEMO_TRANSACTION_ID);
    expect(ledger.length).toBeGreaterThanOrEqual(2);
    expect(ledger.some((l) => l.debitAccount === "1010_BUREAU_CASH")).toBe(true);
  });

  it("should allow bringer to confirm arrival directly", async () => {
    await DemoSimulator.stepPayAtBureau(DEMO_TRANSACTION_ID);
    const arrivedTx = await DemoSimulator.stepConfirmArrival(DEMO_TRANSACTION_ID);

    expect(arrivedTx?.status).toBe("ARRIVED");
    expect(arrivedTx?.travelDetails?.arrivalCity).toBe("Alger");
  });

  it("should reject wrong delivery code and verify correct delivery code", async () => {
    await DemoSimulator.stepPayAtBureau(DEMO_TRANSACTION_ID);
    await DemoSimulator.stepConfirmArrival(DEMO_TRANSACTION_ID);

    // 1. Enter wrong code
    const wrongRes = await DemoSimulator.stepVerifyWrongCode(DEMO_TRANSACTION_ID);
    expect(wrongRes?.success).toBe(false);
    expect(wrongRes?.attemptsRemaining).toBe(2);

    // 2. Enter correct code
    const correctRes = await DemoSimulator.stepVerifyCorrectCode(DEMO_TRANSACTION_ID);
    expect(correctRes?.success).toBe(true);
    expect(correctRes?.transaction.status).toBe("DELIVERED");

    // 3. Confirm delivery and release escrow
    const completedTx = await DemoSimulator.stepCompleteDelivery(DEMO_TRANSACTION_ID);
    expect(completedTx?.status).toBe("COMPLETED");

    // Check completion ledger entries
    const ledger = await TransactionService.getLedgerEntries(DEMO_TRANSACTION_ID);
    expect(ledger.some((l) => l.creditAccount === "2030_BRINGER_AVAILABLE")).toBe(true);
  }, 20000);
});
