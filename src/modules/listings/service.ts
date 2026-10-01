import { prisma } from "@/lib/prisma";
import {
  CreateBuyerRequestInput,
  CreateTripInput,
  RequestFilterParams,
  TripFilterParams,
} from "./types";
import { CatalogService } from "../catalog/service";
import { MatchingEngine } from "../matching/engine";
import { ListingStatus, TripStatus, CategoryRule, Prisma } from "@prisma/client";
import { ValidationError, NotFoundError, ForbiddenError } from "@/lib/errors";

export class ListingsService {
  /**
   * Create a Buyer Request with category rule validation, prohibited keyword scan,
   * and automated match discovery.
   */
  static async createBuyerRequest(input: CreateBuyerRequestInput) {
    // 1. Validate Category
    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });
    if (!category) throw new NotFoundError("Category", input.categoryId);
    if (category.rule === CategoryRule.BLOCKED) {
      throw new ValidationError(
        "Products in this category are prohibited from being transported."
      );
    }

    // 2. Scan content for prohibited keywords
    const contentToScan = `${input.title} ${input.description}`;
    const scanResult = await CatalogService.scanContentForProhibitedKeywords(contentToScan);

    if (scanResult.isBlocked) {
      throw new ValidationError(
        `Listing rejected due to prohibited terms: ${scanResult.matchedKeywords.join(", ")}`
      );
    }

    // If category is RESTRICTED or content flagged -> put in moderation queue
    const initialStatus =
      category.rule === CategoryRule.RESTRICTED || scanResult.isFlaggedForReview
        ? ListingStatus.UNDER_REVIEW
        : ListingStatus.ACTIVE;

    // 3. Create the Request
    const request = await prisma.buyerRequest.create({
      data: {
        buyerId: input.buyerId,
        title: input.title.trim(),
        description: input.description.trim(),
        url: input.url,
        storeName: input.storeName,
        categoryId: input.categoryId,
        sourceCountryId: input.sourceCountryId,
        sourceCityId: input.sourceCityId,
        destCountryId: input.destCountryId,
        destCityId: input.destCityId,
        quantity: input.quantity,
        weightGrams: input.weightGrams,
        dimensionsCm: input.dimensionsCm,
        estimatedPriceMinorUnits: input.estimatedPriceMinorUnits,
        currencyCode: input.currencyCode,
        maxBudgetMinorUnits: input.maxBudgetMinorUnits,
        preferredFeeMinorUnits: input.preferredFeeMinorUnits,
        isFeeNegotiable: input.isFeeNegotiable ?? true,
        deadlineDate: input.deadlineDate,
        condition: input.condition || "NEW_SEALED",
        purchaseMethod: input.purchaseMethod || "BRINGER_BUYS",
        deliveryPreference: input.deliveryPreference || "MEETUP",
        status: initialStatus,
        imagesJson: input.images || [],
      },
    });

    // 4. Trigger Auto-Matching if active
    if (request.status === ListingStatus.ACTIVE) {
      await this.findAndSaveMatchesForRequest(request.id);
    }

    return request;
  }

  /**
   * Create a Bringer Trip with schedule and capacity validation,
   * followed by automated match discovery.
   */
  static async createTrip(input: CreateTripInput) {
    if (new Date(input.departureDatetime) >= new Date(input.arrivalDatetime)) {
      throw new ValidationError("Arrival date/time must be after departure date/time");
    }

    if (input.totalCapacityGrams <= 0) {
      throw new ValidationError("Total capacity must be greater than 0 grams");
    }

    const trip = await prisma.trip.create({
      data: {
        bringerId: input.bringerId,
        originCountryId: input.originCountryId,
        originCityId: input.originCityId,
        destCountryId: input.destCountryId,
        destCityId: input.destCityId,
        departureDatetime: input.departureDatetime,
        arrivalDatetime: input.arrivalDatetime,
        transportMethod: input.transportMethod || "FLIGHT",
        totalCapacityGrams: input.totalCapacityGrams,
        reservedCapacityGrams: 0,
        maxItems: input.maxItems || 5,
        acceptedCategoryIdsJson: input.acceptedCategoryIds || [],
        deliveryAreasJson: input.deliveryAreas || [],
        doorDelivery: input.doorDelivery ?? false,
        canBuyInStore: input.canBuyInStore ?? true,
        notes: input.notes,
        status: TripStatus.ACTIVE,
      },
    });

    // Trigger Auto-Matching
    await this.findAndSaveMatchesForTrip(trip.id);

    return trip;
  }

  /**
   * List Buyer Requests with multi-criteria filtering and pagination.
   */
  static async listRequests(params: RequestFilterParams = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, params.limit || 20);
    const skip = (page - 1) * limit;

    const where: Prisma.BuyerRequestWhereInput = {
      status: params.status || ListingStatus.ACTIVE,
      ...(params.sourceCountryId && { sourceCountryId: params.sourceCountryId }),
      ...(params.destCountryId && { destCountryId: params.destCountryId }),
      ...(params.sourceCityId && { sourceCityId: params.sourceCityId }),
      ...(params.destCityId && { destCityId: params.destCityId }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.maxWeightGrams && { weightGrams: { lte: params.maxWeightGrams } }),
      ...(params.deadlineBefore && { deadlineDate: { lte: params.deadlineBefore } }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: "insensitive" } },
          { description: { contains: params.search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.buyerRequest.findMany({
        where,
        include: {
          category: true,
          sourceCountry: true,
          sourceCity: true,
          destCountry: true,
          destCity: true,
          buyer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              trustLevel: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.buyerRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List Bringer Trips with capacity calculation and filters.
   */
  static async listTrips(params: TripFilterParams = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, params.limit || 20);
    const skip = (page - 1) * limit;

    const where: Prisma.TripWhereInput = {
      status: params.status || TripStatus.ACTIVE,
      ...(params.originCountryId && { originCountryId: params.originCountryId }),
      ...(params.destCountryId && { destCountryId: params.destCountryId }),
      ...(params.originCityId && { originCityId: params.originCityId }),
      ...(params.destCityId && { destCityId: params.destCityId }),
      ...(params.arrivalBefore && { arrivalDatetime: { lte: params.arrivalBefore } }),
      ...(params.canBuyInStore !== undefined && { canBuyInStore: params.canBuyInStore }),
      ...(params.verifiedOnly && {
        bringer: {
          trustLevel: { in: ["ID_VERIFIED", "TRUSTED"] },
        },
      }),
    };

    const [rawTrips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: {
          originCountry: true,
          originCity: true,
          destCountry: true,
          destCity: true,
          bringer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              trustLevel: true,
            },
          },
        },
        orderBy: { arrivalDatetime: "asc" },
        skip,
        take: limit,
      }),
      prisma.trip.count({ where }),
    ]);

    // Calculate dynamic remaining capacity and filter if requested
    const trips = rawTrips
      .map((t) => {
        const remainingCapacityGrams = t.totalCapacityGrams - t.reservedCapacityGrams;
        return {
          ...t,
          remainingCapacityGrams: Math.max(0, remainingCapacityGrams),
        };
      })
      .filter((t) => {
        if (params.minRemainingCapacityGrams) {
          return t.remainingCapacityGrams >= params.minRemainingCapacityGrams;
        }
        return true;
      });

    return {
      items: trips,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get Request detail by ID.
   */
  static async getRequestById(id: string) {
    const request = await prisma.buyerRequest.findUnique({
      where: { id },
      include: {
        category: true,
        sourceCountry: true,
        sourceCity: true,
        destCountry: true,
        destCity: true,
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            trustLevel: true,
            bio: true,
          },
        },
        matches: {
          include: {
            trip: {
              include: {
                bringer: true,
                originCity: true,
                destCity: true,
              },
            },
          },
          orderBy: { score: "desc" },
          take: 5,
        },
      },
    });

    if (!request) throw new NotFoundError("BuyerRequest", id);
    return request;
  }

  /**
   * Get Trip detail by ID with remaining capacity.
   */
  static async getTripById(id: string) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        originCountry: true,
        originCity: true,
        destCountry: true,
        destCity: true,
        bringer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            trustLevel: true,
            bio: true,
          },
        },
        matches: {
          include: {
            buyerRequest: {
              include: {
                category: true,
                buyer: true,
              },
            },
          },
          orderBy: { score: "desc" },
          take: 5,
        },
      },
    });

    if (!trip) throw new NotFoundError("Trip", id);

    const remainingCapacityGrams = Math.max(
      0,
      trip.totalCapacityGrams - trip.reservedCapacityGrams
    );

    return {
      ...trip,
      remainingCapacityGrams,
    };
  }

  // ==========================================
  // AUTO-MATCHING DISCOVERY
  // ==========================================

  private static async findAndSaveMatchesForRequest(requestId: string) {
    const request = await prisma.buyerRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return;

    // Find candidate trips heading to the same destination country
    const candidateTrips = await prisma.trip.findMany({
      where: {
        destCountryId: request.destCountryId,
        status: TripStatus.ACTIVE,
        bringerId: { not: request.buyerId },
      },
      include: {
        bringer: { select: { trustLevel: true } },
      },
    });

    for (const trip of candidateTrips) {
      const matchCandidateRequest = {
        id: request.id,
        buyerId: request.buyerId,
        sourceCountryId: request.sourceCountryId,
        sourceCityId: request.sourceCityId,
        destCountryId: request.destCountryId,
        destCityId: request.destCityId,
        categoryId: request.categoryId,
        weightGrams: request.weightGrams,
        deadlineDate: request.deadlineDate,
        purchaseMethod: request.purchaseMethod,
      };

      const matchCandidateTrip = {
        id: trip.id,
        bringerId: trip.bringerId,
        originCountryId: trip.originCountryId,
        originCityId: trip.originCityId,
        destCountryId: trip.destCountryId,
        destCityId: trip.destCityId,
        arrivalDatetime: trip.arrivalDatetime,
        totalCapacityGrams: trip.totalCapacityGrams,
        reservedCapacityGrams: trip.reservedCapacityGrams,
        acceptedCategoryIds: trip.acceptedCategoryIdsJson as string[],
        deliveryAreas: trip.deliveryAreasJson as string[],
        canBuyInStore: trip.canBuyInStore,
        bringerTrustLevel: trip.bringer.trustLevel,
      };

      const evalResult = MatchingEngine.evaluate(matchCandidateRequest, matchCandidateTrip);

      if (evalResult.isMatch) {
        await prisma.match.upsert({
          where: {
            buyerRequestId_tripId: {
              buyerRequestId: request.id,
              tripId: trip.id,
            },
          },
          create: {
            buyerRequestId: request.id,
            tripId: trip.id,
            score: evalResult.score,
            reasonsJson: evalResult.reasons,
          },
          update: {
            score: evalResult.score,
            reasonsJson: evalResult.reasons,
          },
        });
      }
    }
  }

  private static async findAndSaveMatchesForTrip(tripId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        bringer: { select: { trustLevel: true } },
      },
    });
    if (!trip) return;

    // Find candidate requests heading to the same destination country
    const candidateRequests = await prisma.buyerRequest.findMany({
      where: {
        destCountryId: trip.destCountryId,
        status: ListingStatus.ACTIVE,
        buyerId: { not: trip.bringerId },
      },
    });

    for (const request of candidateRequests) {
      const matchCandidateRequest = {
        id: request.id,
        buyerId: request.buyerId,
        sourceCountryId: request.sourceCountryId,
        sourceCityId: request.sourceCityId,
        destCountryId: request.destCountryId,
        destCityId: request.destCityId,
        categoryId: request.categoryId,
        weightGrams: request.weightGrams,
        deadlineDate: request.deadlineDate,
        purchaseMethod: request.purchaseMethod,
      };

      const matchCandidateTrip = {
        id: trip.id,
        bringerId: trip.bringerId,
        originCountryId: trip.originCountryId,
        originCityId: trip.originCityId,
        destCountryId: trip.destCountryId,
        destCityId: trip.destCityId,
        arrivalDatetime: trip.arrivalDatetime,
        totalCapacityGrams: trip.totalCapacityGrams,
        reservedCapacityGrams: trip.reservedCapacityGrams,
        acceptedCategoryIds: trip.acceptedCategoryIdsJson as string[],
        deliveryAreas: trip.deliveryAreasJson as string[],
        canBuyInStore: trip.canBuyInStore,
        bringerTrustLevel: trip.bringer.trustLevel,
      };

      const evalResult = MatchingEngine.evaluate(matchCandidateRequest, matchCandidateTrip);

      if (evalResult.isMatch) {
        await prisma.match.upsert({
          where: {
            buyerRequestId_tripId: {
              buyerRequestId: request.id,
              tripId: trip.id,
            },
          },
          create: {
            buyerRequestId: request.id,
            tripId: trip.id,
            score: evalResult.score,
            reasonsJson: evalResult.reasons,
          },
          update: {
            score: evalResult.score,
            reasonsJson: evalResult.reasons,
          },
        });
      }
    }
  }
}
