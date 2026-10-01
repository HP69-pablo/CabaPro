import { prisma } from "@/lib/prisma";

export interface MatchingWeightsConfig {
  originCity: number;
  arrivalDate: number;
  capacityHeadroom: number;
  deliveryArea: number;
  category: number;
  bringerTrust: number;
  canBuyInStore: number;
}

export interface FeeStructureConfig {
  platformFeePercent: number; // e.g. 5%
  guaranteeFeePercent: number; // e.g. 2%
  bureauCashFeePercent: number; // e.g. 2%
  fxBufferMarginPercent: number; // e.g. 2.5%
}

export interface TimerConfig {
  checkoutWindowHours: number; // 24h
  inspectionWindowHours: number; // 48h
  deliveryCodeGracePeriodHours: number; // 72h
  purchaseDeadlineHours: number; // 48h
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeightsConfig = {
  originCity: 20,
  arrivalDate: 20,
  capacityHeadroom: 15,
  deliveryArea: 15,
  category: 10,
  bringerTrust: 15,
  canBuyInStore: 5,
};

export const DEFAULT_FEE_STRUCTURE: FeeStructureConfig = {
  platformFeePercent: 5,
  guaranteeFeePercent: 2,
  bureauCashFeePercent: 2,
  fxBufferMarginPercent: 2.5,
};

export const DEFAULT_TIMERS: TimerConfig = {
  checkoutWindowHours: 24,
  inspectionWindowHours: 48,
  deliveryCodeGracePeriodHours: 72,
  purchaseDeadlineHours: 48,
};

export class SettingsService {
  /**
   * Get typed setting by key, falling back to default value.
   */
  static async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const record = await prisma.setting.findUnique({
        where: { key },
      });

      if (!record || record.valueJson === null) {
        return defaultValue;
      }

      return record.valueJson as T;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Set or update a setting in database.
   */
  static async setSetting<T>(key: string, value: T, description?: string, updatedBy?: string) {
    return prisma.setting.upsert({
      where: { key },
      create: {
        key,
        valueJson: value as any,
        description,
        updatedBy,
      },
      update: {
        valueJson: value as any,
        description,
        updatedBy,
      },
    });
  }

  /**
   * Get matching algorithm weights.
   */
  static async getMatchingWeights(): Promise<MatchingWeightsConfig> {
    return this.getSetting("matching_weights", DEFAULT_MATCHING_WEIGHTS);
  }

  /**
   * Get platform fee percentages.
   */
  static async getFeeStructure(): Promise<FeeStructureConfig> {
    return this.getSetting("fee_structure", DEFAULT_FEE_STRUCTURE);
  }

  /**
   * Get timer configurations.
   */
  static async getTimers(): Promise<TimerConfig> {
    return this.getSetting("system_timers", DEFAULT_TIMERS);
  }

  /**
   * Check if a feature flag is enabled.
   */
  static async isFeatureEnabled(flagKey: string, defaultValue = false): Promise<boolean> {
    try {
      const flag = await prisma.featureFlag.findUnique({
        where: { key: flagKey },
      });
      return flag ? flag.isEnabled : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}
