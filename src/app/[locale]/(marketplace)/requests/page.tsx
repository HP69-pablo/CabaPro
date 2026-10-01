import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Package, Plus, Filter, Search, ArrowRight, ShieldCheck, Scale, Calendar, MapPin } from "lucide-react";

export default function RequestsPage() {
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");

  // Realistic sample feed matching our seed data
  const requests = [
    {
      id: "req-1",
      title: "Sony WH-1000XM5 Wireless Noise-Cancelling Headphones",
      category: "Electronics",
      origin: "Paris, France",
      destination: "Algiers, Algeria",
      weightKg: 0.85,
      estimatedPrice: "280.00 €",
      bringerFee: "40.00 €",
      deadline: "Nov 20, 2026",
      buyerName: "Amine B.",
      trustLevel: "CONTACT_VERIFIED",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
      matchCount: 2,
    },
    {
      id: "req-2",
      title: "Dior Sauvage Elixir 100ml Eau de Parfum",
      category: "Cosmetics & Perfumes",
      origin: "Marseille, France",
      destination: "Oran, Algeria",
      weightKg: 0.45,
      estimatedPrice: "140.00 €",
      bringerFee: "25.00 €",
      deadline: "Nov 25, 2026",
      buyerName: "Sofiane M.",
      trustLevel: "ID_VERIFIED",
      imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500&auto=format&fit=crop",
      matchCount: 1,
    },
    {
      id: "req-3",
      title: "MacBook Air 15-inch M3 Chip (16GB RAM, 512GB SSD)",
      category: "Electronics",
      origin: "Lyon, France",
      destination: "Algiers, Algeria",
      weightKg: 1.51,
      estimatedPrice: "1,299.00 €",
      bringerFee: "120.00 €",
      deadline: "Dec 05, 2026",
      buyerName: "Lydia K.",
      trustLevel: "TRUSTED",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop",
      matchCount: 3,
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="h-7 w-7 text-blue-600" />
            Buyer Requests Feed
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse items requested by buyers in Algeria. Earn a reward fee by bringing them along.
          </p>
        </div>

        <Link
          href="/requests/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          {t("postRequest")}
        </Link>
      </div>

      {/* Main Grid: Filters + Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs h-fit space-y-5">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            <Filter className="h-4 w-4 text-blue-600" />
            Filter Listings
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Search by Keyword
            </label>
            <div className="relative">
              <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Sony, iPhone, Zara..."
                className="w-full rounded-xl border border-slate-200 ps-9 pe-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Source Country (Purchase Origin)
            </label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white">
              <option value="">All Countries</option>
              <option value="FR">France</option>
              <option value="ES">Spain</option>
              <option value="TR">Turkey</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Destination City (Algeria)
            </label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white">
              <option value="">All Cities</option>
              <option value="ALG">Algiers</option>
              <option value="ORN">Oran</option>
              <option value="CST">Constantine</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white">
              <option value="">All Categories</option>
              <option value="electronics">Electronics & Tech</option>
              <option value="fashion">Fashion & Clothes</option>
              <option value="cosmetics">Cosmetics & Perfumes</option>
            </select>
          </div>
        </aside>

        {/* Requests Feed Cards */}
        <main className="lg:col-span-3 space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition"
            >
              {/* Thumbnail */}
              <div className="h-44 sm:h-36 sm:w-36 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={req.imageUrl}
                  alt={req.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      {req.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Due {req.deadline}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug hover:text-blue-600 transition">
                    {req.title}
                  </h3>

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1 text-slate-800 font-medium">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      {req.origin} → {req.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5 text-slate-400" />
                      {req.weightKg} kg
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      {req.buyerName}
                    </span>
                  </div>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block">
                      Traveler Reward Fee
                    </span>
                    <span className="text-lg font-black text-emerald-600">
                      +{req.bringerFee}
                    </span>
                  </div>

                  <Link
                    href={`/messages/new?requestId=${req.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition"
                  >
                    Make an Offer <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
