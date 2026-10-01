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
} from "lucide-react";

export default function LandingPage() {
  const t = useTranslations("landing");

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative py-16 sm:py-24 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
              {t("heroSubtitle")}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/requests/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition"
              >
                <Package className="h-4 w-4" />
                {t("ctaBuyer")}
              </Link>
              <Link
                href="/trips/new"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Plane className="h-4 w-4" />
                {t("ctaBringer")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
            {t("howTitle")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Search, title: t("step1Title"), desc: t("step1Desc"), color: "blue" },
              { icon: Users, title: t("step2Title"), desc: t("step2Desc"), color: "purple" },
              { icon: MessageCircle, title: t("step3Title"), desc: t("step3Desc"), color: "amber" },
              { icon: CheckCircle, title: t("step4Title"), desc: t("step4Desc"), color: "emerald" },
            ].map((step, i) => (
              <div key={i} className="text-center p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full bg-${step.color}-100 text-${step.color}-600 mb-4`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold text-slate-400 mb-1">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="flex gap-4 p-5 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{t("whySafe")}</h3>
                <p className="text-sm text-slate-500">{t("whySafeDesc")}</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{t("whyCheap")}</h3>
                <p className="text-sm text-slate-500">{t("whyCheapDesc")}</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl border border-slate-100 hover:border-amber-100 hover:bg-amber-50/30 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{t("whyFast")}</h3>
                <p className="text-sm text-slate-500">{t("whyFastDesc")}</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-xl border border-slate-100 hover:border-purple-100 hover:bg-purple-50/30 transition">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{t("whyCommunity")}</h3>
                <p className="text-sm text-slate-500">{t("whyCommunityDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t("heroTitle")}
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/requests"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition"
            >
              <Package className="h-4 w-4" />
              {t("ctaBuyer")}
            </Link>
            <Link
              href="/trips"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              <Plane className="h-4 w-4" />
              {t("ctaBringer")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
