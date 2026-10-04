"use client";

import React, { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Package,
  Plane,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Tag,
  Clock,
  ShieldCheck,
  ChevronRight,
  Plus,
  Compass,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { queryDocs } from "@/lib/firestore";
import { BuyerRequestItem, BringerTripItem } from "@/lib/firestore";
import { DemoSimulator } from "@/lib/transactions/demoSimulator";
import { Transaction } from "@/lib/transactions/types";

const ALGERIA_WILAYAS = [
  "Toutes les wilayas",
  "16 - Alger",
  "31 - Oran",
  "25 - Constantine",
  "19 - Sétif",
  "23 - Annaba",
  "09 - Blida",
  "06 - Béjaïa",
  "15 - Tizi Ouzou",
  "13 - Tlemcen",
  "35 - Boumerdès",
];

const CATEGORIES = [
  { id: "all", label: "Tout le FYP", icon: "🔥" },
  { id: "tech", label: "Smartphones & Tech", icon: "📱" },
  { id: "fashion", label: "Mode & Sneakers", icon: "👟" },
  { id: "perfume", label: "Parfums & Cosmétiques", icon: "💄" },
  { id: "supplements", label: "Compléments & Soins", icon: "💊" },
  { id: "trips", label: "Espace Kilos (Voyageurs)", icon: "🧳" },
  { id: "urgent", label: "Demandes Urgentes", icon: "⚡" },
];

export default function MarketplaceFypHub() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWilaya, setSelectedWilaya] = useState("Toutes les wilayas");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [feedTab, setFeedTab] = useState<"for_you" | "requests" | "trips">("for_you");

  const [requests, setRequests] = useState<BuyerRequestItem[]>([]);
  const [trips, setTrips] = useState<BringerTripItem[]>([]);
  const [activeTx, setActiveTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [reqs, trps, demoTx] = await Promise.all([
          queryDocs<BuyerRequestItem>("requests"),
          queryDocs<BringerTripItem>("trips"),
          DemoSimulator.getOrCreateDemoTransaction(),
        ]);
        setRequests(reqs);
        setTrips(trps);
        setActiveTx(demoTx);
      } catch (err) {
        console.error("Failed to load marketplace FYP feed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destCity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sourceCountry?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWilaya =
      selectedWilaya === "Toutes les wilayas" ||
      r.destCity?.toLowerCase().includes(selectedWilaya.split("-")[1]?.trim().toLowerCase() || "");

    return matchesSearch && matchesWilaya;
  });

  // Filter trips
  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.to?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesWilaya =
      selectedWilaya === "Toutes les wilayas" ||
      t.to?.toLowerCase().includes(selectedWilaya.split("-")[1]?.trim().toLowerCase() || "");

    return matchesSearch && matchesWilaya;
  });

  return (
    <div className="min-h-screen bg-brand-bg pb-20">
      {/* ---------------- TOP SEARCH BAR & OUEDKNISS/FB STYLE FILTERS ---------------- */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border-b border-brand-border py-3 px-4 sm:px-6 shadow-xs">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher iPhone, Nike, Zara, Paris, Dubaï..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 border border-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition"
              />
            </div>

            {/* Wilaya Filter Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-brand-accent" />
                <select
                  value={selectedWilaya}
                  onChange={(e) => setSelectedWilaya(e.target.value)}
                  className="w-full sm:w-48 pl-9 pr-7 py-2.5 rounded-2xl bg-slate-100 border border-transparent text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:bg-white focus:border-brand-accent"
                >
                  {ALGERIA_WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fast Action Buttons */}
              <Link
                href="/requests/new"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-brand-teal text-white text-xs font-bold hover:bg-brand-teal-800 transition shadow-xs whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Demander
              </Link>
            </div>
          </div>

          {/* Category Chips Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap shrink-0 ${
                    active
                      ? "bg-brand-teal text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 pt-5">
        {/* ---------------- ACTIVE TRANSACTION TRACKER PILL ---------------- */}
        {activeTx && (
          <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-brand-teal to-[#11494b] text-white shadow-md shadow-brand-teal/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    Commande en cours • #{activeTx.paymentCode}
                  </span>
                  <span className="text-xs font-extrabold text-amber-300">
                    Statut: {activeTx.status}
                  </span>
                </div>
                <h3 className="text-sm font-black mt-0.5">{activeTx.productName}</h3>
                <p className="text-[11px] text-white/80">
                  {activeTx.tripRoute} • Garanti Caba Pro ({activeTx.priceBreakdown.totalDzd.toLocaleString()} DZD)
                </p>
              </div>
            </div>

            <Link
              href={`/transactions/${activeTx.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-black hover:bg-slate-100 transition shrink-0 shadow-sm"
            >
              <span>Suivre la Livraison & Remise</span>
              <ArrowRight className="h-3.5 w-3.5 text-brand-accent" />
            </Link>
          </div>
        )}

        {/* ---------------- FEED TABS ---------------- */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-brand-border shadow-xs">
            <button
              onClick={() => setFeedTab("for_you")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                feedTab === "for_you"
                  ? "bg-brand-teal text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Pour Vous (FYP)
            </button>
            <button
              onClick={() => setFeedTab("requests")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                feedTab === "requests"
                  ? "bg-brand-teal text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Demandes d'Objets ({filteredRequests.length})
            </button>
            <button
              onClick={() => setFeedTab("trips")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                feedTab === "trips"
                  ? "bg-brand-teal text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Plane className="h-3.5 w-3.5" />
              Trajets Voyageurs ({filteredTrips.length})
            </button>
          </div>

          <span className="hidden sm:block text-xs font-bold text-slate-400">
            {filteredRequests.length + filteredTrips.length} annonces actives en Algérie
          </span>
        </div>

        {/* ---------------- HIGH-DENSITY MARKETPLACE FEED GRID (OUEDKNISS / FB STYLE) ---------------- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Combine both requests & trips for FYP tab */}
          {(feedTab === "for_you" || feedTab === "requests") &&
            filteredRequests.map((req) => {
              const dzdPrice = req.budget ? Math.round(req.budget * 245) : 35000;
              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-brand-border hover:border-brand-accent/40 hover:shadow-md transition flex flex-col overflow-hidden group"
                >
                  {/* Image banner */}
                  <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img
                      src={
                        req.productImages?.[0] ||
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
                      }
                      alt={req.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Reward badge */}
                    <div className="absolute top-2 left-2 bg-brand-teal/95 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                      +{req.reward || 30} € Prime
                    </div>

                    {/* Route pill */}
                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-lg truncate">
                      {req.sourceCountry || req.fromCountry || "Étranger"} → {req.destCity || req.toCity || "Alger"}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-baseline justify-between gap-1 mb-1">
                        <span className="text-sm font-black text-slate-900 line-clamp-1">
                          {dzdPrice.toLocaleString()} DZD
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          (€{req.budget || 150})
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-brand-accent transition">
                        {req.productName}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate max-w-[80px]">
                        Par {req.userName?.split(" ")[0]}
                      </span>
                      <Link
                        href={`/requests`}
                        className="font-bold text-brand-accent hover:underline flex items-center gap-0.5"
                      >
                        Ramener
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Traveler Trips in the feed */}
          {(feedTab === "for_you" || feedTab === "trips") &&
            filteredTrips.map((trip) => {
              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-2xl border border-brand-border hover:border-brand-coral/40 hover:shadow-md transition flex flex-col overflow-hidden group"
                >
                  <div className="relative aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400"
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Capacity badge */}
                    <div className="absolute top-2 left-2 bg-brand-coral/95 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                      ✈️ {trip.remainingCapacity !== undefined ? trip.remainingCapacity : trip.capacity} kg Libres
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-1 rounded-lg truncate">
                      {trip.originCity || trip.from} → {trip.destCity || trip.to}
                    </div>
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-baseline justify-between gap-1 mb-1">
                        <span className="text-xs font-black text-brand-coral uppercase">
                          Trajet Voyageur
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {trip.departureDate ? new Date(trip.departureDate).toLocaleDateString() : "Bientôt"}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                        Espace bagages disponible ({trip.originCity || trip.from} vers {trip.destCity || trip.to})
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate max-w-[80px]">
                        {trip.userName?.split(" ")[0]}
                      </span>
                      <Link
                        href={`/trips`}
                        className="font-bold text-brand-coral hover:underline flex items-center gap-0.5"
                      >
                        Réserver
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
