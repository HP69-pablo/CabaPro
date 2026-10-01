"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Plane, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function NewTripPage() {
  const router = useRouter();

  const [originCity, setOriginCity] = useState("Paris, France");
  const [destCity, setDestCity] = useState("Algiers, Algeria");
  const [departureDate, setDepartureDate] = useState("2026-11-10T08:00");
  const [arrivalDate, setArrivalDate] = useState("2026-11-10T11:30");
  const [transportMethod, setTransportMethod] = useState("FLIGHT");
  const [totalCapacityKg, setTotalCapacityKg] = useState(15);
  const [maxItems, setMaxItems] = useState(5);
  const [canBuyInStore, setCanBuyInStore] = useState(true);
  const [doorDelivery, setDoorDelivery] = useState(false);
  const [deliveryAreas, setDeliveryAreas] = useState("Algiers Centre, Hydra, Kouba");
  const [notes, setNotes] = useState("Direct Air France flight. Can meet at Algiers Centre or Kouba.");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      setTimeout(() => {
        setSuccess(true);
        setTimeout(() => {
          router.push("/trips");
        }, 1500);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Failed to publish trip");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <Plane className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Post an Upcoming Trip
            </h1>
            <p className="text-xs text-slate-500">
              Monetize your spare baggage allowance by bringing requested items to Algeria.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-medium text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-2" />
            <h3 className="text-base font-bold text-emerald-900">Trip Published Successfully!</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Matching product requests are being connected to your trip. Redirecting to feed...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Schedule & Transport */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                1. Schedule & Transport
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origin City *
                  </label>
                  <input
                    type="text"
                    required
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination in Algeria *
                  </label>
                  <input
                    type="text"
                    required
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departure Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Arrival Date & Time in Algeria *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transport Method
                  </label>
                  <select
                    value={transportMethod}
                    onChange={(e) => setTransportMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none bg-white"
                  >
                    <option value="FLIGHT">Flight</option>
                    <option value="FERRY">Ferry / Boat</option>
                    <option value="CAR">Car</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Baggage Capacity */}
            <div className="border-t border-slate-100 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                2. Baggage Capacity
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Spare Weight Capacity (in kg) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={totalCapacityKg}
                    onChange={(e) => setTotalCapacityKg(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maximum Number of Packages / Items
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={maxItems}
                    onChange={(e) => setMaxItems(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canBuyInStore}
                    onChange={(e) => setCanBuyInStore(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>I can purchase items in physical stores abroad with advanced funds</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doorDelivery}
                    onChange={(e) => setDoorDelivery(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>I offer direct door delivery (additional fee negotiable)</span>
                </label>
              </div>
            </div>

            {/* 3. Delivery Areas & Instructions */}
            <div className="border-t border-slate-100 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                3. Meeting & Handover Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meeting Neighborhoods in Destination City
                  </label>
                  <input
                    type="text"
                    value={deliveryAreas}
                    onChange={(e) => setDeliveryAreas(e.target.value)}
                    placeholder="e.g. Algiers Centre, Kouba, Airport Terminal"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flight / Traveler Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Direct Air France flight. Can meet at Algiers Centre or Kouba."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 disabled:opacity-50 transition"
              >
                Publish Trip <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
