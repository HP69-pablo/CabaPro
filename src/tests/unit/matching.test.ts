import { describe, it, expect } from "vitest";
import { MatchingEngine, MatchCandidateRequest, MatchCandidateTrip } from "../../modules/matching/engine";
import { TrustLevel } from "@prisma/client";

describe("Phase 5 - Rule-Based Matching Engine Unit Tests", () => {
  const baseRequest: MatchCandidateRequest = {
    id: "req-1",
    buyerId: "buyer-1",
    sourceCountryId: "FR",
    sourceCityId: "PARIS",
    destCountryId: "DZ",
    destCityId: "ALGIERS",
    categoryId: "electronics",
    weightGrams: 2000, // 2 kg
    deadlineDate: new Date("2026-11-20T00:00:00Z"),
    purchaseMethod: "BRINGER_BUYS",
  };

  const baseTrip: MatchCandidateTrip = {
    id: "trip-1",
    bringerId: "bringer-2",
    originCountryId: "FR",
    originCityId: "PARIS",
    destCountryId: "DZ",
    destCityId: "ALGIERS",
    arrivalDatetime: new Date("2026-11-10T12:00:00Z"), // 10 days before deadline
    totalCapacityGrams: 15000, // 15 kg
    reservedCapacityGrams: 3000, // 12 kg remaining
    acceptedCategoryIds: ["electronics", "clothing"],
    deliveryAreas: ["ALGIERS", "BLIDA"],
    canBuyInStore: true,
    bringerTrustLevel: TrustLevel.TRUSTED,
  };

  it("produces a high match score (>=90%) for an ideal trip with clear reasons", () => {
    const result = MatchingEngine.evaluate(baseRequest, baseTrip);

    expect(result.isMatch).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.reasons).toContain("Origin city matches exactly");
    expect(result.reasons).toContain("Destination city matches traveler destination");
    expect(result.reasons).toContain("Preferred product category for traveler");
    expect(result.reasons).toContain("Trusted bringer with top delivery history");
  });

  describe("Hard Requirements Enforcements", () => {
    it("rejects when buyer and bringer are the same user", () => {
      const selfTrip = { ...baseTrip, bringerId: baseRequest.buyerId };
      const result = MatchingEngine.evaluate(baseRequest, selfTrip);

      expect(result.isMatch).toBe(false);
      expect(result.rejectionReason).toBe("SELF_TRANSACTION_NOT_ALLOWED");
    });

    it("rejects when origin countries differ", () => {
      const diffCountryTrip = { ...baseTrip, originCountryId: "TR" }; // Turkey
      const result = MatchingEngine.evaluate(baseRequest, diffCountryTrip);

      expect(result.isMatch).toBe(false);
      expect(result.rejectionReason).toBe("ORIGIN_COUNTRY_MISMATCH");
    });

    it("rejects when traveler arrives after the deadline", () => {
      const lateTrip = {
        ...baseTrip,
        arrivalDatetime: new Date("2026-11-25T00:00:00Z"), // 5 days after deadline
      };
      const result = MatchingEngine.evaluate(baseRequest, lateTrip);

      expect(result.isMatch).toBe(false);
      expect(result.rejectionReason).toBe("ARRIVES_AFTER_DEADLINE");
    });

    it("rejects when remaining capacity is less than requested weight", () => {
      const fullTrip = {
        ...baseTrip,
        totalCapacityGrams: 10000,
        reservedCapacityGrams: 9000, // only 1 kg remaining, request is 2 kg
      };
      const result = MatchingEngine.evaluate(baseRequest, fullTrip);

      expect(result.isMatch).toBe(false);
      expect(result.rejectionReason).toBe("INSUFFICIENT_CAPACITY");
    });

    it("rejects when bringer cannot buy in store but request requires it", () => {
      const cannotBuyTrip = {
        ...baseTrip,
        canBuyInStore: false,
      };
      const result = MatchingEngine.evaluate(baseRequest, cannotBuyTrip);

      expect(result.isMatch).toBe(false);
      expect(result.rejectionReason).toBe("CANNOT_BUY_IN_STORE");
    });
  });
});
