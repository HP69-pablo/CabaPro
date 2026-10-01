import {
  ItemCondition,
  PurchaseMethod,
  DeliveryPreference,
  ListingStatus,
  TransportMethod,
  TripStatus,
} from "@prisma/client";

export interface CreateBuyerRequestInput {
  buyerId: string;
  title: string;
  description: string;
  url?: string;
  storeName?: string;
  categoryId: string;
  sourceCountryId: string;
  sourceCityId: string;
  destCountryId: string;
  destCityId: string;
  quantity: number;
  weightGrams: number;
  dimensionsCm?: string;
  estimatedPriceMinorUnits: number;
  currencyCode: string;
  maxBudgetMinorUnits: number;
  preferredFeeMinorUnits: number;
  isFeeNegotiable?: boolean;
  deadlineDate: Date;
  condition?: ItemCondition;
  purchaseMethod?: PurchaseMethod;
  deliveryPreference?: DeliveryPreference;
  images?: string[];
}

export interface CreateTripInput {
  bringerId: string;
  originCountryId: string;
  originCityId: string;
  destCountryId: string;
  destCityId: string;
  departureDatetime: Date;
  arrivalDatetime: Date;
  transportMethod?: TransportMethod;
  totalCapacityGrams: number;
  maxItems?: number;
  acceptedCategoryIds?: string[];
  deliveryAreas?: string[];
  doorDelivery?: boolean;
  canBuyInStore?: boolean;
  notes?: string;
}

export interface RequestFilterParams {
  sourceCountryId?: string;
  destCountryId?: string;
  sourceCityId?: string;
  destCityId?: string;
  categoryId?: string;
  maxWeightGrams?: number;
  deadlineBefore?: Date;
  status?: ListingStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TripFilterParams {
  originCountryId?: string;
  destCountryId?: string;
  originCityId?: string;
  destCityId?: string;
  minRemainingCapacityGrams?: number;
  arrivalBefore?: Date;
  verifiedOnly?: boolean;
  canBuyInStore?: boolean;
  status?: TripStatus;
  search?: string;
  page?: number;
  limit?: number;
}
