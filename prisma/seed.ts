import { PrismaClient, UserRole, TrustLevel, CategoryRule, KeywordAction, TransportMethod, ItemCondition, PurchaseMethod, DeliveryPreference, ListingStatus, TripStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/crypto";
import { DEFAULT_MATCHING_WEIGHTS, DEFAULT_FEE_STRUCTURE, DEFAULT_TIMERS } from "../src/modules/settings/service";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Caba Pro Database Seed...");

  // 1. Currencies
  const dzd = await prisma.currency.upsert({
    where: { code: "DZD" },
    create: { code: "DZD", name: "Algerian Dinar", symbol: "DA", decimals: 2, isActive: true, isDefault: true },
    update: {},
  });

  const eur = await prisma.currency.upsert({
    where: { code: "EUR" },
    create: { code: "EUR", name: "Euro", symbol: "€", decimals: 2, isActive: true, isDefault: false },
    update: {},
  });

  const usd = await prisma.currency.upsert({
    where: { code: "USD" },
    create: { code: "USD", name: "US Dollar", symbol: "$", decimals: 2, isActive: true, isDefault: false },
    update: {},
  });

  // 2. Exchange Rates (EUR -> DZD = 240.00, USD -> DZD = 220.00)
  await prisma.exchangeRate.createMany({
    data: [
      {
        baseCurrencyCode: "EUR",
        targetCurrencyCode: "DZD",
        rate: 240.0,
        source: "CABA_BUREAU_BENCHMARK",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        baseCurrencyCode: "USD",
        targetCurrencyCode: "DZD",
        rate: 220.0,
        source: "CABA_BUREAU_BENCHMARK",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        baseCurrencyCode: "DZD",
        targetCurrencyCode: "EUR",
        rate: 0.004167,
        source: "CABA_BUREAU_BENCHMARK",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });

  // 3. Countries
  const dz = await prisma.country.upsert({
    where: { code: "DZ" },
    create: { code: "DZ", nameEn: "Algeria", nameFr: "Algérie", nameAr: "الجزائر", isActive: true },
    update: {},
  });

  const fr = await prisma.country.upsert({
    where: { code: "FR" },
    create: { code: "FR", nameEn: "France", nameFr: "France", nameAr: "فرنسا", isActive: true },
    update: {},
  });

  const tr = await prisma.country.upsert({
    where: { code: "TR" },
    create: { code: "TR", nameEn: "Turkey", nameFr: "Turquie", nameAr: "تركيا", isActive: true },
    update: {},
  });

  const es = await prisma.country.upsert({
    where: { code: "ES" },
    create: { code: "ES", nameEn: "Spain", nameFr: "Espagne", nameAr: "إسبانيا", isActive: true },
    update: {},
  });

  // 4. Cities
  const algiers = await prisma.city.create({
    data: { countryId: dz.id, nameEn: "Algiers", nameFr: "Alger", nameAr: "الجزائر العاصمة" },
  });
  const oran = await prisma.city.create({
    data: { countryId: dz.id, nameEn: "Oran", nameFr: "Oran", nameAr: "وهران" },
  });
  const constantine = await prisma.city.create({
    data: { countryId: dz.id, nameEn: "Constantine", nameFr: "Constantine", nameAr: "قسنطينة" },
  });

  const paris = await prisma.city.create({
    data: { countryId: fr.id, nameEn: "Paris", nameFr: "Paris", nameAr: "باريس" },
  });
  const marseille = await prisma.city.create({
    data: { countryId: fr.id, nameEn: "Marseille", nameFr: "Marseille", nameAr: "مارسيليا" },
  });
  const lyon = await prisma.city.create({
    data: { countryId: fr.id, nameEn: "Lyon", nameFr: "Lyon", nameAr: "ليون" },
  });

  const istanbul = await prisma.city.create({
    data: { countryId: tr.id, nameEn: "Istanbul", nameFr: "Istanbul", nameAr: "إسطنبول" },
  });

  // 5. Categories
  const catElectronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    create: {
      slug: "electronics",
      nameEn: "Electronics & Tech",
      nameFr: "High-Tech & Électronique",
      nameAr: "إلكترونيات وتكنولوجيا",
      rule: CategoryRule.ALLOWED,
      requiresReceipt: true,
      maxDeclaredValue: 200000,
      icon: "Smartphone",
    },
    update: {},
  });

  const catFashion = await prisma.category.upsert({
    where: { slug: "fashion" },
    create: {
      slug: "fashion",
      nameEn: "Fashion & Clothes",
      nameFr: "Mode & Vêtements",
      nameAr: "أزياء وملابس",
      rule: CategoryRule.ALLOWED,
      requiresReceipt: true,
      icon: "Shirt",
    },
    update: {},
  });

  const catCosmetics = await prisma.category.upsert({
    where: { slug: "cosmetics" },
    create: {
      slug: "cosmetics",
      nameEn: "Cosmetics & Perfumes",
      nameFr: "Cosmétiques & Parfums",
      nameAr: "عطور ومستحضرات تجميل",
      rule: CategoryRule.ALLOWED,
      requiresReceipt: true,
      icon: "Sparkles",
    },
    update: {},
  });

  const catSupplements = await prisma.category.upsert({
    where: { slug: "supplements" },
    create: {
      slug: "supplements",
      nameEn: "Vitamins & Supplements",
      nameFr: "Vitamines & Compléments",
      nameAr: "فيتامينات ومكملات غذائية",
      rule: CategoryRule.RESTRICTED,
      requiresReceipt: true,
      icon: "Pill",
    },
    update: {},
  });

  const catProhibited = await prisma.category.upsert({
    where: { slug: "prohibited" },
    create: {
      slug: "prohibited",
      nameEn: "Weapons, Drugs & Prohibited",
      nameFr: "Armes & Produits Interdits",
      nameAr: "مواد محظورة وأسلحة",
      rule: CategoryRule.BLOCKED,
      icon: "ShieldAlert",
    },
    update: {},
  });

  // 6. Prohibited Keywords
  await prisma.prohibitedKeyword.createMany({
    data: [
      { keyword: "weapon", action: KeywordAction.REJECT_IMMEDIATELY, reasonEn: "Weapons and firearms are strictly illegal", reasonFr: "Armes strictement interdites", reasonAr: "الأسلحة محظورة تماماً" },
      { keyword: "gun", action: KeywordAction.REJECT_IMMEDIATELY, reasonEn: "Firearms strictly forbidden", reasonFr: "Armes à feu interdites", reasonAr: "الأسلحة النارية محظورة" },
      { keyword: "drugs", action: KeywordAction.REJECT_IMMEDIATELY, reasonEn: "Narcotics and illicit drugs strictly prohibited", reasonFr: "Stupéfiants interdits", reasonAr: "المخدرات محظورة" },
      { keyword: "cocaine", action: KeywordAction.REJECT_IMMEDIATELY, reasonEn: "Narcotics prohibited", reasonFr: "Stupéfiants interdits", reasonAr: "المخدرات محظورة" },
      { keyword: "alcohol", action: KeywordAction.FLAG_FOR_REVIEW, reasonEn: "Alcoholic beverages require customs declaration", reasonFr: "Alcool soumis à déclaration", reasonAr: "المشروبات الكحولية تتطلب مراجعة" },
      { keyword: "counterfeit", action: KeywordAction.REJECT_IMMEDIATELY, reasonEn: "Counterfeit goods violate customs law", reasonFr: "Contrefaçon interdite", reasonAr: "البضائع المقلدة محظورة" },
    ],
    skipDuplicates: true,
  });

  // 7. Dynamic Settings
  await prisma.setting.createMany({
    data: [
      { key: "matching_weights", valueJson: DEFAULT_MATCHING_WEIGHTS as any, description: "Matching algorithm weights" },
      { key: "fee_structure", valueJson: DEFAULT_FEE_STRUCTURE as any, description: "Platform and bureau fees" },
      { key: "system_timers", valueJson: DEFAULT_TIMERS as any, description: "Checkout and inspection timers" },
    ],
    skipDuplicates: true,
  });

  // 8. Feature Flags
  await prisma.featureFlag.createMany({
    data: [
      { key: "demo_mode", isEnabled: true, rolloutPercentage: 100, description: "Demo mode with simulated payments" },
      { key: "contact_sharing_post_payment", isEnabled: true, rolloutPercentage: 100, description: "Reveal phone numbers after payment" },
    ],
    skipDuplicates: true,
  });

  // 9. Caba Partner Bureau
  const algerBureau = await prisma.bureau.create({
    data: {
      name: "Caba Bureau Alger Centre #01",
      countryId: dz.id,
      cityId: algiers.id,
      address: "14 Rue Didouche Mourad, Alger Centre",
      phone: "+213 21 73 40 00",
      openingHoursJson: {
        saturday: "09:00-17:00",
        sunday: "09:00-17:00",
        monday: "09:00-17:00",
        tuesday: "09:00-17:00",
        wednesday: "09:00-17:00",
        thursday: "09:00-17:00",
        friday: "Closed",
      },
      status: "ACTIVE",
      dailyDepositLimitMinorUnits: 20000000, // 200,000 DZD
      dailyTransferLimitMinorUnits: 50000000, // 500,000 DZD
      currencyCode: "DZD",
    },
  });

  // 10. Demo Users
  const defaultPasswordHash = await hashPassword("DemoPassword123!");

  const buyer = await prisma.user.upsert({
    where: { email: "buyer.amine@cabapro.com" },
    create: {
      email: "buyer.amine@cabapro.com",
      passwordHash: defaultPasswordHash,
      firstName: "Amine",
      lastName: "Boumediene",
      phone: "+213550123456",
      phoneVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
      role: UserRole.USER,
      status: "ACTIVE",
      trustLevel: TrustLevel.CONTACT_VERIFIED,
      preferredLanguage: "fr",
      preferredCurrencyCode: "DZD",
      bio: "Tech enthusiast based in Algiers looking for original electronics from Europe.",
    },
    update: {},
  });

  const bringer = await prisma.user.upsert({
    where: { email: "bringer.yacine@cabapro.com" },
    create: {
      email: "bringer.yacine@cabapro.com",
      passwordHash: defaultPasswordHash,
      firstName: "Yacine",
      lastName: "Benali",
      phone: "+33612345678",
      phoneVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
      role: UserRole.USER,
      status: "ACTIVE",
      trustLevel: TrustLevel.TRUSTED,
      preferredLanguage: "en",
      preferredCurrencyCode: "EUR",
      bio: "Frequent traveler Paris <-> Algiers. 8 successful deliveries, 5-star rating.",
    },
    update: {},
  });

  const bureauStaffUser = await prisma.user.upsert({
    where: { email: "bureau.staff@cabapro.com" },
    create: {
      email: "bureau.staff@cabapro.com",
      passwordHash: defaultPasswordHash,
      firstName: "Karim",
      lastName: "Hadj",
      phone: "+213770987654",
      phoneVerifiedAt: new Date(),
      emailVerifiedAt: new Date(),
      role: UserRole.BUREAU_STAFF,
      status: "ACTIVE",
      trustLevel: TrustLevel.ID_VERIFIED,
      preferredLanguage: "fr",
      preferredCurrencyCode: "DZD",
    },
    update: {},
  });

  await prisma.bureauStaff.create({
    data: {
      bureauId: algerBureau.id,
      userId: bureauStaffUser.id,
      role: "STAFF",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@cabapro.com" },
    create: {
      email: "admin@cabapro.com",
      passwordHash: defaultPasswordHash,
      firstName: "Sarah",
      lastName: "Mansouri",
      role: UserRole.ADMIN,
      status: "ACTIVE",
      trustLevel: TrustLevel.TRUSTED,
      preferredLanguage: "en",
      preferredCurrencyCode: "EUR",
    },
    update: {},
  });

  // 11. Realistic Listings (Paris -> Algiers, Marseille -> Oran, etc.)
  const request1 = await prisma.buyerRequest.create({
    data: {
      buyerId: buyer.id,
      title: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
      description: "Brand new in sealed box from Fnac or Amazon France. Silver or Black color.",
      url: "https://www.fnac.com/Casque-Bluetooth-Sony-WH-1000XM5-Noir/a16943806",
      storeName: "Fnac Paris Saint-Lazare",
      categoryId: catElectronics.id,
      sourceCountryId: fr.id,
      sourceCityId: paris.id,
      destCountryId: dz.id,
      destCityId: algiers.id,
      quantity: 1,
      weightGrams: 850,
      dimensionsCm: "25x20x8",
      estimatedPriceMinorUnits: 28000, // 280.00 EUR
      currencyCode: "EUR",
      maxBudgetMinorUnits: 34000,
      preferredFeeMinorUnits: 4000, // 40.00 EUR bringer fee
      isFeeNegotiable: true,
      deadlineDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      condition: ItemCondition.NEW_SEALED,
      purchaseMethod: PurchaseMethod.BRINGER_BUYS,
      deliveryPreference: DeliveryPreference.MEETUP,
      status: ListingStatus.ACTIVE,
      imagesJson: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop"],
    },
  });

  const trip1 = await prisma.trip.create({
    data: {
      bringerId: bringer.id,
      originCountryId: fr.id,
      originCityId: paris.id,
      destCountryId: dz.id,
      destCityId: algiers.id,
      departureDatetime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      arrivalDatetime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // in 6 days
      transportMethod: TransportMethod.FLIGHT,
      totalCapacityGrams: 15000, // 15 kg
      reservedCapacityGrams: 0,
      maxItems: 5,
      acceptedCategoryIdsJson: [catElectronics.id, catFashion.id, catCosmetics.id],
      deliveryAreasJson: ["Algiers Centre", "Hydra", "Kouba"],
      doorDelivery: false,
      canBuyInStore: true,
      notes: "Direct Air France flight CDG -> ALG. Meeting point: Algiers Centre or Kouba.",
      status: TripStatus.ACTIVE,
    },
  });

  // Pre-seed an automated match between Request1 and Trip1
  await prisma.match.create({
    data: {
      buyerRequestId: request1.id,
      tripId: trip1.id,
      score: 95,
      reasonsJson: [
        "Origin city matches exactly (Paris)",
        "Destination city matches exactly (Algiers)",
        "Arrives 8 days before deadline",
        "15 kg capacity available (item is 0.85 kg)",
        "Traveler is able to purchase in store",
        "Trusted bringer with 5-star rating",
      ],
      status: "PROPOSED",
    },
  });

  console.log("✅ Caba Pro Seed Completed Successfully!");
  console.log(`- Created currencies: DZD, EUR, USD`);
  console.log(`- Created countries: Algeria, France, Spain, Turkey`);
  console.log(`- Created demo accounts:`);
  console.log(`  * Buyer:   buyer.amine@cabapro.com  (Password: DemoPassword123!)`);
  console.log(`  * Bringer: bringer.yacine@cabapro.com (Password: DemoPassword123!)`);
  console.log(`  * Bureau:  bureau.staff@cabapro.com   (Password: DemoPassword123!)`);
  console.log(`  * Admin:   admin@cabapro.com         (Password: DemoPassword123!)`);
  console.log(`- Created active listing: Sony WH-1000XM5 (Paris -> Algiers)`);
  console.log(`- Created active trip: Paris -> Algiers (15 kg, Air France)`);
  console.log(`- Created match: 95% score with explanation reasons`);
}

main()
  .catch((e) => {
    console.error("❌ Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
