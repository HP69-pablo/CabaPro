import { MatchingWeightsConfig, DEFAULT_MATCHING_WEIGHTS } from "../settings/service";
import { TrustLevel } from "@prisma/client";

export interface MatchCandidateRequest {
  id: string;
  buyerId: string;
  sourceCountryId: string;
  sourceCityId: string;
  destCountryId: string;
  destCityId: string;
  categoryId: string;
  weightGrams: number;
  deadlineDate: Date;
  purchaseMethod: string;
}

export interface MatchCandidateTrip {
  id: string;
  bringerId: string;
  originCountryId: string;
  originCityId: string;
  destCountryId: string;
  destCityId: string;
  arrivalDatetime: Date;
  totalCapacityGrams: number;
  reservedCapacityGrams: number;
  acceptedCategoryIds: string[];
  deliveryAreas: string[];
  canBuyInStore: boolean;
  bringerTrustLevel: TrustLevel;
}

export interface MatchEvaluationResult {
  isMatch: boolean;
  rejectionReason?: string;
  score: number; // 0 - 100
  reasons: string[]; // Human readable explanation checklist
}

export class MatchingEngine {
  /**
   * Evaluate a Request against a Trip.
   * Performs Hard Filters first, followed by Weighted Scoring.
   */
  static evaluate(
    request: MatchCandidateRequest,
    trip: MatchCandidateTrip,
    weights: MatchingWeightsConfig = DEFAULT_MATCHING_WEIGHTS
  ): MatchEvaluationResult {
    // HARD REQUIREMENT 1: Buyer and Bringer cannot be the same person
    if (request.buyerId === trip.bringerId) {
      return { isMatch: false, rejectionReason: "SELF_TRANSACTION_NOT_ALLOWED", score: 0, reasons: [] };
    }

    // HARD REQUIREMENT 2: Destination country must match
    if (request.destCountryId !== trip.destCountryId) {
      return { isMatch: false, rejectionReason: "DESTINATION_COUNTRY_MISMATCH", score: 0, reasons: [] };
    }

    // HARD REQUIREMENT 3: Origin country must match
    if (request.sourceCountryId !== trip.originCountryId) {
      return { isMatch: false, rejectionReason: "ORIGIN_COUNTRY_MISMATCH", score: 0, reasons: [] };
    }

    // HARD REQUIREMENT 4: Trip arrival must be before or on request deadline
    if (new Date(trip.arrivalDatetime).getTime() > new Date(request.deadlineDate).getTime()) {
      return { isMatch: false, rejectionReason: "ARRIVES_AFTER_DEADLINE", score: 0, reasons: [] };
    }

    // HARD REQUIREMENT 5: Trip must have sufficient remaining capacity
    const remainingCapacityGrams = trip.totalCapacityGrams - trip.reservedCapacityGrams;
    if (remainingCapacityGrams < request.weightGrams) {
      return { isMatch: false, rejectionReason: "INSUFFICIENT_CAPACITY", score: 0, reasons: [] };
    }

    // HARD REQUIREMENT 6: Category must not be rejected by trip (if trip specifies category filters)
    if (
      trip.acceptedCategoryIds &&
      trip.acceptedCategoryIds.length > 0 &&
      !trip.acceptedCategoryIds.includes(request.categoryId)
    ) {
      return { isMatch: false, rejectionReason: "CATEGORY_NOT_ACCEPTED", score: 0, reasons: [] };
    }

    // HARD REQUIREMENT 7: If request requires bringer to buy in store, trip must support it
    if (request.purchaseMethod === "BRINGER_BUYS" && !trip.canBuyInStore) {
      return { isMatch: false, rejectionReason: "CANNOT_BUY_IN_STORE", score: 0, reasons: [] };
    }

    // All hard requirements met! Now calculate weighted score and explanation
    let score = 0;
    const reasons: string[] = [];

    // Factor 1: Origin city exact match (Default weight: 20)
    if (request.sourceCityId === trip.originCityId) {
      score += weights.originCity;
      reasons.push("Origin city matches exactly");
    } else {
      // Partial credit for same origin country
      score += Math.round(weights.originCity * 0.5);
      reasons.push("Origin country matches");
    }

    // Factor 2: Arrival date headway before deadline (Default weight: 20)
    const timeDiffMs = new Date(request.deadlineDate).getTime() - new Date(trip.arrivalDatetime).getTime();
    const daysAhead = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24));
    if (daysAhead >= 5) {
      score += weights.arrivalDate;
      reasons.push(`Arrives ${daysAhead} days comfortably before deadline`);
    } else if (daysAhead >= 1) {
      score += Math.round(weights.arrivalDate * 0.7);
      reasons.push(`Arrives ${daysAhead} day(s) before deadline`);
    } else {
      score += Math.round(weights.arrivalDate * 0.3);
      reasons.push("Arrives on the deadline date");
    }

    // Factor 3: Capacity headroom (Default weight: 15)
    const capacityRatio = request.weightGrams / remainingCapacityGrams;
    if (capacityRatio <= 0.5) {
      score += weights.capacityHeadroom;
      reasons.push(`High capacity headroom (${Math.round(remainingCapacityGrams / 1000)} kg available)`);
    } else {
      score += Math.round(weights.capacityHeadroom * 0.7);
      reasons.push(`Capacity available (${Math.round(remainingCapacityGrams / 1000)} kg remaining)`);
    }

    // Factor 4: Destination city / delivery area (Default weight: 15)
    if (request.destCityId === trip.destCityId) {
      score += weights.deliveryArea;
      reasons.push("Destination city matches traveler destination");
    } else if (trip.deliveryAreas && trip.deliveryAreas.includes(request.destCityId)) {
      score += weights.deliveryArea;
      reasons.push("Covered by traveler delivery areas");
    } else {
      score += Math.round(weights.deliveryArea * 0.4);
    }

    // Factor 5: Category preference (Default weight: 10)
    if (trip.acceptedCategoryIds && trip.acceptedCategoryIds.includes(request.categoryId)) {
      score += weights.category;
      reasons.push("Preferred product category for traveler");
    } else {
      score += Math.round(weights.category * 0.5);
    }

    // Factor 6: Bringer Trust level (Default weight: 15)
    if (trip.bringerTrustLevel === TrustLevel.TRUSTED) {
      score += weights.bringerTrust;
      reasons.push("Trusted bringer with top delivery history");
    } else if (trip.bringerTrustLevel === TrustLevel.ID_VERIFIED) {
      score += Math.round(weights.bringerTrust * 0.8);
      reasons.push("ID-verified traveler");
    } else if (trip.bringerTrustLevel === TrustLevel.CONTACT_VERIFIED) {
      score += Math.round(weights.bringerTrust * 0.5);
      reasons.push("Contact-verified traveler");
    }

    // Factor 7: In-store purchase capability (Default weight: 5)
    if (trip.canBuyInStore) {
      score += weights.canBuyInStore;
      reasons.push("Traveler is able to purchase directly in store");
    }

    // Normalize final score to [0, 100]
    const finalScore = Math.min(100, Math.max(0, score));

    return {
      isMatch: true,
      score: finalScore,
      reasons,
    };
  }
}
