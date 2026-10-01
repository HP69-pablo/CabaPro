import { prisma } from "@/lib/prisma";
import { CategoryRule, KeywordAction } from "@prisma/client";
import { NotFoundError, ValidationError } from "@/lib/errors";

export interface CreateCountryInput {
  code: string;
  nameEn: string;
  nameFr: string;
  nameAr: string;
}

export interface CreateCityInput {
  countryId: string;
  nameEn: string;
  nameFr: string;
  nameAr: string;
}

export interface CreateCategoryInput {
  slug: string;
  nameEn: string;
  nameFr: string;
  nameAr: string;
  rule: CategoryRule;
  requiresReceipt?: boolean;
  maxDeclaredValue?: number;
  icon?: string;
  parentId?: string;
}

export interface KeywordCheckResult {
  isBlocked: boolean;
  isFlaggedForReview: boolean;
  matchedKeywords: string[];
  reasons: string[];
}

export class CatalogService {
  // Countries
  static async listCountries(activeOnly = true) {
    return prisma.country.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: { cities: { where: activeOnly ? { isActive: true } : undefined } },
      orderBy: { nameEn: "asc" },
    });
  }

  static async getCountryById(id: string) {
    const country = await prisma.country.findUnique({
      where: { id },
      include: { cities: true },
    });
    if (!country) throw new NotFoundError("Country", id);
    return country;
  }

  static async createCountry(input: CreateCountryInput) {
    return prisma.country.create({
      data: {
        code: input.code.toUpperCase().trim(),
        nameEn: input.nameEn.trim(),
        nameFr: input.nameFr.trim(),
        nameAr: input.nameAr.trim(),
      },
    });
  }

  // Cities
  static async createCity(input: CreateCityInput) {
    return prisma.city.create({
      data: {
        countryId: input.countryId,
        nameEn: input.nameEn.trim(),
        nameFr: input.nameFr.trim(),
        nameAr: input.nameAr.trim(),
      },
    });
  }

  // Currencies & Exchange Rates
  static async listCurrencies(activeOnly = true) {
    return prisma.currency.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { code: "asc" },
    });
  }

  static async getExchangeRate(baseCode: string, targetCode: string) {
    if (baseCode === targetCode) {
      return { rate: 1.0, baseCode, targetCode, source: "IDENTITY" };
    }

    const record = await prisma.exchangeRate.findFirst({
      where: {
        baseCurrencyCode: baseCode,
        targetCurrencyCode: targetCode,
      },
      orderBy: { fetchedAt: "desc" },
    });

    if (!record) {
      // Invert if reverse rate exists
      const reverse = await prisma.exchangeRate.findFirst({
        where: {
          baseCurrencyCode: targetCode,
          targetCurrencyCode: baseCode,
        },
        orderBy: { fetchedAt: "desc" },
      });

      if (reverse) {
        const invertedRate = 1.0 / Number(reverse.rate);
        return {
          rate: invertedRate,
          baseCode,
          targetCode,
          source: `INVERTED_${reverse.source}`,
        };
      }

      throw new NotFoundError(
        `Exchange rate not found for ${baseCode} -> ${targetCode}`
      );
    }

    return {
      rate: Number(record.rate),
      baseCode,
      targetCode,
      source: record.source,
    };
  }

  // Categories
  static async listCategories(activeOnly = true) {
    return prisma.category.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: { children: true },
      orderBy: { nameEn: "asc" },
    });
  }

  static async createCategory(input: CreateCategoryInput) {
    return prisma.category.create({
      data: {
        slug: input.slug.toLowerCase().trim(),
        nameEn: input.nameEn.trim(),
        nameFr: input.nameFr.trim(),
        nameAr: input.nameAr.trim(),
        rule: input.rule,
        requiresReceipt: input.requiresReceipt ?? true,
        maxDeclaredValue: input.maxDeclaredValue,
        icon: input.icon,
        parentId: input.parentId,
      },
    });
  }

  // Prohibited Keywords Inspection
  static async scanContentForProhibitedKeywords(text: string): Promise<KeywordCheckResult> {
    if (!text || !text.trim()) {
      return { isBlocked: false, isFlaggedForReview: false, matchedKeywords: [], reasons: [] };
    }

    const keywords = await prisma.prohibitedKeyword.findMany({
      where: { isActive: true },
    });

    const normalizedText = text.toLowerCase();
    const matchedKeywords: string[] = [];
    const reasons: string[] = [];
    let isBlocked = false;
    let isFlaggedForReview = false;

    for (const kw of keywords) {
      // Word boundary regex
      const regex = new RegExp(`\\b${kw.keyword.toLowerCase()}\\b`, "i");
      if (regex.test(normalizedText)) {
        matchedKeywords.push(kw.keyword);
        reasons.push(kw.reasonEn);
        if (kw.action === KeywordAction.REJECT_IMMEDIATELY) {
          isBlocked = true;
        } else if (kw.action === KeywordAction.FLAG_FOR_REVIEW) {
          isFlaggedForReview = true;
        }
      }
    }

    return {
      isBlocked,
      isFlaggedForReview,
      matchedKeywords,
      reasons,
    };
  }
}
