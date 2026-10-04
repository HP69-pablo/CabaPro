import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Package,
  Plane,
  Search,
  MessageCircle,
  CheckCircle,
  Shield,
  Zap,
  Users,
  DollarSign,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <div className="flex flex-col bg-brand-bg min-h-screen">
      {/* Hero Section matching Mockup Screen 1 */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-24">
        {/* Subtle world map graphic watermark background */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none flex items-center justify-center">
          <svg
            className="w-full h-full max-w-5xl"
            viewBox="0 0 1000 500"
            fill="currentColor"
          >
            <path d="M150,120 Q180,100 230,130 T320,160 T380,130 T450,180 T400,240 T300,270 T200,240 Z M600,100 Q650,80 720,110 T820,140 T900,120 T950,180 T900,260 T800,280 T700,240 T620,180 Z M300,320 Q350,300 420,340 T460,420 T380,480 T300,440 T260,370 Z M650,320 Q720,310 780,350 T820,440 T750,490 T670,450 Z" />
          </svg>
        </div>

        {/* Floating background suitcase illustration cues */}
        <div className="absolute right-10 top-20 hidden lg:block opacity-20 pointer-events-none transform rotate-12">
          <div className="w-36 h-48 rounded-3xl border-4 border-brand-teal/40 bg-brand-teal/10 relative">
            <div className="w-12 h-6 border-4 border-brand-teal/40 rounded-t-lg mx-auto -mt-6"></div>
          </div>
        </div>

        <div className="container relative mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            {/* Mockup Logo: Stylized Teal "C" inside circular badge */}
            <div className="inline-flex items-center justify-center mb-6">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-teal text-white shadow-lg shadow-brand-teal/25 ring-4 ring-brand-teal/10">
                  <span className="text-3xl font-extrabold tracking-tight">C</span>
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Caba <span className="text-brand-teal">Pro</span>
                </span>
              </div>
            </div>

            {/* Signature Headline from Mockup Screen 1 */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Your Items,<br />
              <span className="text-brand-teal">Delivered.</span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
              {t("heroSubtitle")}
            </p>

            {/* CTAs matching Mockup Screen 1: Dual persona buttons */}
            <div className="mt-8 flex flex-col gap-3 max-w-sm mx-auto">
              {/* Buyer CTA: Deep Teal Button with "Buyers" caption */}
              <Link
                href="/requests/new"
                className="group relative flex flex-col items-center justify-center rounded-2xl bg-brand-teal py-3.5 px-6 text-white shadow-md shadow-brand-teal/25 hover:bg-brand-teal-800 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 text-base font-bold">
                  <Package className="h-5 w-5" />
                  <span>{t("ctaBuyer") || "I Need Something"}</span>
                </div>
                <span className="text-[11px] font-medium text-teal-100/90 mt-0.5 tracking-wide">
                  Buyers
                </span>
              </Link>

              {/* Bringer CTA: Warm Coral Orange Button with "Bringers" caption */}
              <Link
                href="/trips/new"
                className="group relative flex flex-col items-center justify-center rounded-2xl bg-brand-coral py-3.5 px-6 text-white shadow-md shadow-brand-coral/25 hover:bg-brand-coral-600 transition active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 text-base font-bold">
                  <Plane className="h-5 w-5" />
                  <span>{t("ctaBringer") || "I'm Traveling"}</span>
                </div>
                <span className="text-[11px] font-medium text-coral-100/90 mt-0.5 tracking-wide">
                  Bringers
                </span>
              </Link>
            </div>

            {/* Footer auth links matching Mockup Screen 1 */}
            <div className="mt-6 flex items-center justify-center gap-3 text-xs font-semibold text-brand-teal">
              <Link href="/login" className="hover:underline">
                Login
              </Link>
              <span className="text-slate-300">|</span>
              <Link href="/register" className="hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white border-y border-brand-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-md mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal-50 text-brand-teal text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" /> Simple & Fast
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              {t("howTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Search, title: t("step1Title"), desc: t("step1Desc"), num: "01" },
              { icon: Users, title: t("step2Title"), desc: t("step2Desc"), num: "02" },
              { icon: MessageCircle, title: t("step3Title"), desc: t("step3Desc"), num: "03" },
              { icon: CheckCircle, title: t("step4Title"), desc: t("step4Desc"), num: "04" },
            ].map((step, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-2xl bg-brand-bg/50 border border-brand-border hover:border-brand-teal/40 transition"
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal-100 text-brand-teal mb-4 font-bold shadow-sm">
                  <step.icon className="h-6 w-6 stroke-[2]" />
                </div>
                <div className="text-[11px] font-bold text-brand-teal/80 uppercase tracking-widest mb-1">
                  Step {step.num}
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5 text-base">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Caba Pro */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
            {t("whyTitle")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            <div className="flex gap-4 p-5 rounded-2xl bg-white border border-brand-border hover:border-brand-teal/30 hover:shadow-sm transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal-50 text-brand-teal">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{t("whySafe")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t("whySafeDesc")}</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-white border border-brand-border hover:border-brand-coral/30 hover:shadow-sm transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-coral-50 text-brand-coral">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{t("whyCheap")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t("whyCheapDesc")}</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-white border border-brand-border hover:border-amber-200 hover:shadow-sm transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{t("whyFast")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t("whyFastDesc")}</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-white border border-brand-border hover:border-brand-teal/30 hover:shadow-sm transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal-50 text-brand-teal">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1 text-sm">{t("whyCommunity")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{t("whyCommunityDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <section className="py-12 bg-brand-teal text-white">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-xl">
          <h2 className="text-2xl font-bold mb-3">
            Start saving or earning on every trip
          </h2>
          <p className="text-xs text-teal-100 mb-6">
            Join thousands of travelers and shoppers across Algeria, France, and beyond.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/requests"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-xs font-bold text-brand-teal hover:bg-teal-50 transition"
            >
              <Package className="h-4 w-4" />
              Browse Requests
            </Link>
            <Link
              href="/trips"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-6 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
            >
              <Plane className="h-4 w-4" />
              Browse Trips
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
