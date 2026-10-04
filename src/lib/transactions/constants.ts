import { PartnerBureau, PriceBreakdown } from "./types";

export const PARTNER_BUREAUS: PartnerBureau[] = [
  {
    id: "bureau-alger-centre",
    name: "Bureau Central Alger",
    wilaya: "16 - Alger",
    city: "Alger Centre",
    address: "24 Rue Didouche Mourad, Alger Centre",
    phone: "+213 21 73 45 80",
    workingHours: "Samedi - Jeudi: 08:30 - 18:00",
    active: true,
  },
  {
    id: "bureau-oran-centre",
    name: "Bureau Régional Oran",
    wilaya: "31 - Oran",
    city: "Oran",
    address: "12 Boulevard Front de Mer, Oran",
    phone: "+213 41 33 12 90",
    workingHours: "Samedi - Jeudi: 09:00 - 17:30",
    active: true,
  },
  {
    id: "bureau-constantine",
    name: "Bureau Constantine Cirta",
    wilaya: "25 - Constantine",
    city: "Constantine",
    address: "Cité Sidi Mabrouk Supérieur, Constantine",
    phone: "+213 31 92 64 21",
    workingHours: "Samedi - Jeudi: 09:00 - 17:00",
    active: true,
  },
  {
    id: "bureau-setif",
    name: "Bureau Sétif Ain Fouara",
    wilaya: "19 - Sétif",
    city: "Sétif",
    address: "Boulevard du 8 Mai 1945, Sétif",
    phone: "+213 36 84 10 55",
    workingHours: "Samedi - Jeudi: 08:30 - 17:30",
    active: true,
  },
  {
    id: "bureau-annaba",
    name: "Bureau Annaba Seybouse",
    wilaya: "23 - Annaba",
    city: "Annaba",
    address: "06 Cours de la Révolution, Annaba",
    phone: "+213 38 45 22 19",
    workingHours: "Samedi - Jeudi: 09:00 - 17:00",
    active: true,
  },
];

export const FINANCIAL_CONFIG = {
  PLATFORM_FEE_PERCENT: 0.07, // 7%
  GUARANTEE_FEE_PERCENT: 0.025, // 2.5%
  BUREAU_FEE_DZD: 500, // 500 DZD
  BUREAU_FEE_EUR: 2.04, // ~500 DZD at 245
  EXCHANGE_RATE_EUR_DZD: 245, // Locked cash rate at bureau
  DUAL_APPROVAL_THRESHOLD_EUR: 500, // > €500 requires Finance Admin dual control
  PAYMENT_DEADLINE_HOURS: 24,
  PROOF_AUTO_APPROVE_HOURS: 12,
  DELIVERY_AUTO_CONFIRM_HOURS: 24,
  MAX_CODE_ATTEMPTS: 3,
};

export const LEDGER_ACCOUNTS = {
  BUREAU_CASH: "1010_BUREAU_CASH",
  BANK_CLEARING: "1020_BANK_CLEARING",
  CUSTOMER_ESCROW: "2010_CUSTOMER_ESCROW",
  BRINGER_PENDING: "2020_BRINGER_PENDING",
  BRINGER_AVAILABLE: "2030_BRINGER_AVAILABLE",
  PLATFORM_REVENUE: "4010_PLATFORM_REVENUE",
  GUARANTEE_RESERVE: "4020_GUARANTEE_RESERVE",
  FX_MARGIN: "5010_FX_EXPENSE_MARGIN",
};

export function calculatePriceBreakdown(
  productPriceEur: number,
  bringerFeeEur: number,
  fxRate = FINANCIAL_CONFIG.EXCHANGE_RATE_EUR_DZD
): PriceBreakdown {
  const baseSubtotal = productPriceEur + bringerFeeEur;
  const platformFee = Math.round(baseSubtotal * FINANCIAL_CONFIG.PLATFORM_FEE_PERCENT * 100) / 100;
  const guaranteeFee = Math.round(baseSubtotal * FINANCIAL_CONFIG.GUARANTEE_FEE_PERCENT * 100) / 100;
  const bureauFeeEur = FINANCIAL_CONFIG.BUREAU_FEE_EUR;
  const bureauFeeDzd = FINANCIAL_CONFIG.BUREAU_FEE_DZD;

  const totalEur = Math.round((baseSubtotal + platformFee + guaranteeFee + bureauFeeEur) * 100) / 100;
  const totalDzd = Math.round((baseSubtotal + platformFee + guaranteeFee) * fxRate + bureauFeeDzd);

  return {
    productPrice: productPriceEur,
    bringerFee: bringerFeeEur,
    platformFee,
    guaranteeFee,
    bureauFeeEur,
    bureauFeeDzd,
    fxRate,
    totalEur,
    totalDzd,
    lockedAt: new Date().toISOString(),
  };
}

export const STAFF_CREDENTIALS = {
  ADMIN: {
    email: "admin@cabapro.dz",
    role: "admin",
    name: "Direction Générale (Admin)",
    pin: "9900",
  },
  FINANCE: {
    email: "finance@cabapro.dz",
    role: "finance",
    name: "Direction Financière",
    pin: "8800",
  },
  BUREAU_ALGER: {
    email: "bureau.alger@cabapro.dz",
    role: "bureau_staff",
    name: "Mustapha K. (Alger Centre)",
    bureauId: "bureau-alger-centre",
    pin: "1600",
  },
  MODERATOR: {
    email: "moderation@cabapro.dz",
    role: "moderator",
    name: "Équipe Modération & Litiges",
    pin: "7700",
  },
};
