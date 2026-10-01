import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Plane, Plus, Filter, Search, ArrowRight, ShieldCheck, Scale, Calendar, MapPin, ShoppingBag } from "lucide-react";

export default function TripsPage() {
  const t = useTranslations("marketplace");

  const trips = [
    {
      id: "trip-1",
      bringerName: "Yacine Benali",
      trustLevel: "TRUSTED",
      transportMethod: "Flight (Air France)",
      origin: "Paris, France",
      destination: "Algiers, Algeria",
      departureDate: "Nov 08, 2026",
      arrivalDate: "Nov 08, 2026",
      totalCapacityKg: 15,
      remainingCapacityKg: 12,
      canBuyInStore: true,
      doorDelivery: false,
      deliveryAreas: "Algiers Centre, Hydra, Kouba",
    },
    {
      id: "trip-2",
      bringerName: "Rachid K.",
      trustLevel: "ID_VERIFIED",
      transportMethod: "Ferry (Corsica Linea)",
      origin: "Marseille, France",
      destination: "Oran, Algeria",
      departureDate: "Nov 12, 2026",
      arrivalDate: "Nov 13, 2026",
      totalCapacityKg: 30,
      remainingCapacityKg: 22,
      canBuyInStore: true,
      doorDelivery: true,
      deliveryAreas: "Oran Ville, Ain Turk",
    },
    {
      id: "trip-3",
      bringerName: "Anis D.",
      trustLevel: "CONTACT_VERIFIED",
      transportMethod: "Flight (Turkish Airlines)",
      origin: "Istanbul, Turkey",
      destination: "Algiers, Algeria",
      departureDate: "Nov 18, 2026",
      arrivalDate: "Nov 18, 2026",
      totalCapacityKg: 20,
      remainingCapacityKg: 8,
      canBuyInStore: false,
      doorDelivery: false,
      deliveryAreas: "Algiers Airport, Bab Ezzouar",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Plane className="h-7 w-7 text-blue-600" />
            Traveler Trips Feed
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Find travelers heading to Algeria with spare luggage capacity. Request them to bring your items.
          </p>
        </div>

        <Link
          href="/trips/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          {t("postTrip")}
        </Link>
      </div>

      {/* Main Grid: Filters + Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filter Sidebar */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs h-fit space-y-5">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
            <Filter className="h-4 w-4 text-blue-600" />
            Filter Trips
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Origin City
            </label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white">
              <option value="">All Origins</option>
              <option value="PAR">Paris, France</option>
              <option value="MRS">Marseille, France</option>
              <option value="IST">Istanbul, Turkey</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Destination City
            </label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white">
              <option value="">All Destinations</option>
              <option value="ALG">Algiers</option>
              <option value="ORN">Oran</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Min Remaining Capacity
            </label>
            <select className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white">
              <option value="">Any Capacity</option>
              <option value="2">At least 2 kg</option>
              <option value="5">At least 5 kg</option>
              <option value="10">At least 10 kg</option>
            </select>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
              <span>Verified Travelers Only</span>
            </label>
          </div>
        </aside>

        {/* Trips Feed Cards */}
        <main className="lg:col-span-3 space-y-4">
          {trips.map((trip) => {
            const capacityPercent = Math.round((trip.remainingCapacityKg / trip.totalCapacityKg) * 100);

            return (
              <div
                key={trip.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-blue-300 hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                      {trip.bringerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{trip.bringerName}</span>
                        {trip.trustLevel === "TRUSTED" && (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            ★ TRUSTED BRINGER
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{trip.transportMethod}</span>
                    </div>
                  </div>

                  <div className="text-end">
                    <span className="text-xs font-semibold text-slate-500 block">Arrival Date</span>
                    <span className="text-sm font-bold text-slate-900">{trip.arrivalDate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Route</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" />
                      {trip.origin} → {trip.destination}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">In-Store Purchase</span>
                    <span className={`font-semibold flex items-center gap-1 ${trip.canBuyInStore ? "text-emerald-700" : "text-slate-500"}`}>
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {trip.canBuyInStore ? "Can buy directly in store" : "Buyer-prepared package"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Delivery Areas</span>
                    <span className="font-semibold text-slate-800">{trip.deliveryAreas}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-slate-600 flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5 text-slate-400" />
                      Luggage Capacity
                    </span>
                    <span className="font-bold text-slate-900">
                      <span className="text-blue-600 font-extrabold">{trip.remainingCapacityKg} kg</span> remaining of {trip.totalCapacityKg} kg
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${capacityPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Link
                    href={`/messages/new?tripId=${trip.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                  >
                    Request this Bringer <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
}
