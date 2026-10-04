"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { addDoc, formatFirestoreError } from "@/lib/firestore";
import { serverTimestamp } from "firebase/firestore";
import { Plane, CheckCircle, Loader2, ArrowLeft, Car, Ship } from "lucide-react";

export default function NewTripPage() {
  const t = useTranslations("trip");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [transportMethod, setTransportMethod] = useState<"PLANE" | "CAR" | "SHIP">("PLANE");
  const [canBuyInStore, setCanBuyInStore] = useState(true);
  const [doorDelivery, setDoorDelivery] = useState(true);
  const [deliveryAreas, setDeliveryAreas] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const capNum = Number(capacity);
      const parsedDeliveryAreas = deliveryAreas
        ? deliveryAreas.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Airport", "City Centre"];

      await addDoc("trips", {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        userPhoto: user.photoURL || null,
        from,
        to,
        originCountry: from,
        originCity: from,
        destCountry: "Algeria",
        destCity: to,
        departureDate,
        arrivalDate: arrivalDate || departureDate,
        transportMethod,
        capacity: capNum,
        totalCapacity: capNum,
        reservedCapacity: 0,
        remainingCapacity: capNum,
        maxItems: 6,
        acceptedCategories: ["Electronics", "Fashion", "Cosmetics", "Books"],
        deliveryAreas: parsedDeliveryAreas,
        doorDelivery,
        canBuyInStore,
        notes: notes || null,
        status: "active",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setError(formatFirestoreError(err));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-sm">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">{t("published")}</h2>
          <p className="text-xs text-slate-500 mt-1">Redirecting to your dashboard matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-lg">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> {tCommon("back")}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-coral-50 text-brand-coral">
          <Plane className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("newTitle")}</h1>
          <p className="text-xs text-slate-500">{t("newSubtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transport mode selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Transportation Method</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTransportMethod("PLANE")}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition ${
                transportMethod === "PLANE"
                  ? "bg-brand-coral text-white border-brand-coral shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Plane className="h-4 w-4" /> Plane
            </button>
            <button
              type="button"
              onClick={() => setTransportMethod("CAR")}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition ${
                transportMethod === "CAR"
                  ? "bg-brand-coral text-white border-brand-coral shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Car className="h-4 w-4" /> Car / Ferry
            </button>
            <button
              type="button"
              onClick={() => setTransportMethod("SHIP")}
              className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition ${
                transportMethod === "SHIP"
                  ? "bg-brand-coral text-white border-brand-coral shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Ship className="h-4 w-4" /> Ship
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("from")} *</label>
            <input
              type="text"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="e.g. Paris, France"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-brand-coral focus:ring-1 focus:ring-brand-coral outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("to")} *</label>
            <input
              type="text"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="e.g. Algiers"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-brand-coral focus:ring-1 focus:ring-brand-coral outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("departureDate")} *</label>
            <input
              type="date"
              required
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-brand-coral focus:ring-1 focus:ring-brand-coral outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("arrivalDate")}</label>
            <input
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-brand-coral focus:ring-1 focus:ring-brand-coral outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{t("capacity")} (kg) *</label>
          <input
            type="number"
            required
            min="0.5"
            step="0.5"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="15"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-brand-coral focus:ring-1 focus:ring-brand-coral outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">{t("capacityHint")}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery / Meetup Areas (comma separated)</label>
          <input
            type="text"
            value={deliveryAreas}
            onChange={(e) => setDeliveryAreas(e.target.value)}
            placeholder="e.g. Algiers Centre, Bab Ezzouar, Kouba"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-brand-coral focus:ring-1 focus:ring-brand-coral outline-none"
          />
        </div>

        {/* Checkbox Options from PDF Page 3 */}
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={canBuyInStore}
              onChange={(e) => setCanBuyInStore(e.target.checked)}
              className="rounded text-brand-coral focus:ring-brand-coral h-4 w-4"
            />
            <span>I can purchase products directly in-store at origin</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={doorDelivery}
              onChange={(e) => setDoorDelivery(e.target.checked)}
              className="rounded text-brand-coral focus:ring-brand-coral h-4 w-4"
            />
            <span>I can deliver to the buyer's address / door</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{t("notes")}</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("notesPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-brand-coral focus:ring-1 focus:ring-brand-coral outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-brand-coral px-4 py-3 text-xs font-bold text-white hover:bg-brand-coral-600 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-md shadow-brand-coral/20"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("publish")}
          </button>
        </div>
      </form>
    </div>
  );
}
