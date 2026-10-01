import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  ShieldCheck,
  Building2,
  Lock,
  UserCheck,
  CheckCircle2,
  Package,
  Plane,
  ArrowRight,
  Sparkles,
  Luggage,
  BadgeDollarSign,
  Scale,
} from "lucide-react";

export default function LandingPage() {
  const t = useTranslations("landing");
  const tNav = useTranslations("nav");
  const tMarket = useTranslations("marketplace");

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-slate-50 py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-xs mb-6">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>Two-sided marketplace connecting Algeria with the world</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
              {t("heroTitle")}
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {t("heroSubtitle")}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/requests/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition"
              >
                <Package className="h-5 w-5" />
                {t("ctaBuyer")}
              </Link>
              <Link
                href="/trips/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition"
              >
                <Plane className="h-5 w-5 text-blue-600" />
                {t("ctaBringer")}
              </Link>
            </div>

            {/* Live Trust Metrics Strip */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-200 pt-8 text-center">
              <div>
                <p className="text-2xl font-extrabold text-blue-600">100%</p>
                <p className="text-xs text-slate-500 font-medium">Escrow Protected</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">4,500+</p>
                <p className="text-xs text-slate-500 font-medium">Kilograms Delivered</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">4.9 / 5</p>
                <p className="text-xs text-slate-500 font-medium">Traveler Rating</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-emerald-600">12 Bureaus</p>
                <p className="text-xs text-slate-500 font-medium">In-person Cash Intake</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How It Works Section */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t("howItWorksTitle")}
            </h2>
            <p className="mt-3 text-slate-600">
              A transparent, safe 5-step process designed for complete trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{t("step1Title")}</h3>
              <p className="text-xs text-slate-600 leading-normal">{t("step1Desc")}</p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{t("step2Title")}</h3>
              <p className="text-xs text-slate-600 leading-normal">{t("step2Desc")}</p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{t("step3Title")}</h3>
              <p className="text-xs text-slate-600 leading-normal">{t("step3Desc")}</p>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{t("step4Title")}</h3>
              <p className="text-xs text-slate-600 leading-normal">{t("step4Desc")}</p>
            </div>

            {/* Step 5 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 transition">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold mb-4">
                5
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{t("step5Title")}</h3>
              <p className="text-xs text-slate-600 leading-normal">{t("step5Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. The Caba Partner Bureau Feature Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 mb-6">
                <Building2 className="h-3.5 w-3.5" />
                <span>Physical Offices Across Algeria</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {t("bureauSectionTitle")}
              </h2>
              <p className="mt-5 text-slate-300 text-base sm:text-lg leading-relaxed">
                {t("bureauSectionSubtitle")}
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">Pay in DZD Cash:</strong> No need for Visa or Mastercard. Obtain a verified stamped physical payment slip.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">Direct Traveler Wire:</strong> The bureau handles international banking to wire purchase advances to travelers in Europe, Turkey, etc.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">Dual Verification:</strong> Staff checks national IDs and prevents fraud on both sides.
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/bureau"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Find a Bureau Near You <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/60 p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Sample Bureau Receipt
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                  VERIFIED RECEIPT
                </span>
              </div>
              <div className="mt-6 space-y-3 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Bureau:</span>
                  <span className="text-white">Algiers Central Branch #01</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Reference:</span>
                  <span className="text-white">BPR-2026-ALG-089</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Deposit Amount:</span>
                  <span className="text-emerald-400 font-bold text-sm">26,000 DZD</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Advance to Bringer:</span>
                  <span className="text-white">100.00 EUR (Paysera Wire)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Escrow Lock Status:</span>
                  <span className="text-blue-400">ACTIVE & INSURED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Trust, Safe Handover & Caba Guarantee Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 mb-6">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{t("guaranteeTitle")}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{t("guaranteeDesc")}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 mb-6">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Verified Travelers</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bringers submit government passports, national IDs, and contact verification. Multi-tiered transaction limits protect both parties.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Safe Handover Checklist</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Travelers never carry sealed mystery parcels. Mandatory receipt and packaging inspection ensures zero prohibited items.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
