"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { queryDocs, getOrCreateConversation } from "@/lib/firestore";
import { orderBy, limit } from "firebase/firestore";
import { Plane, MapPin, Calendar, Weight, Plus, Loader2, Search, MessageSquare } from "lucide-react";

interface TripItem {
  id: string;
  userId: string;
  from: string;
  to: string;
  departureDate: string;
  arrivalDate?: string;
  capacity: number;
  notes?: string;
  userName: string;
  userPhoto?: string;
  createdAt: any;
}

export default function TripsPage() {
  const t = useTranslations("trip");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();

  const [trips, setTrips] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const data = await queryDocs<TripItem>(
          "trips",
          orderBy("createdAt", "desc"),
          limit(50)
        );
        setTrips(data);
      } catch (err) {
        console.error("Failed to load trips:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTrips();
  }, []);

  const handleContact = async (trip: TripItem) => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.uid === trip.userId) {
      router.push("/dashboard");
      return;
    }

    setConnectingId(trip.id);
    try {
      const convId = await getOrCreateConversation(
        {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
        },
        {
          uid: trip.userId,
          displayName: trip.userName,
          photoURL: trip.userPhoto,
        },
        {
          tripId: trip.id,
          tripRoute: `${trip.from} → ${trip.to}`,
        }
      );

      router.push(`/messages?id=${convId}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setConnectingId(null);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      trip.from?.toLowerCase().includes(term) ||
      trip.to?.toLowerCase().includes(term) ||
      trip.notes?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("browseTitle")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("browseSubtitle")}</p>
        </div>
        <Link
          href="/trips/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>{t("publish")}</span>
        </Link>
      </div>

      {/* Search Filter */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute start-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={tCommon("search")}
          className="w-full rounded-xl border border-slate-200 ps-9 pe-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTrips.length === 0 && (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Plane className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">{t("noTrips")}</p>
          <p className="text-xs text-slate-400 mt-1">{tCommon("noResults")}</p>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 mt-4 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition"
          >
            <Plus className="h-4 w-4" /> {t("publish")}
          </Link>
        </div>
      )}

      {/* Trip cards */}
      {!loading && filteredTrips.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map((trip) => {
            const isOwn = user?.uid === trip.userId;
            const isConnecting = connectingId === trip.id;

            return (
              <div
                key={trip.id}
                className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 hover:border-purple-200 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                      <Plane className="h-4 w-4" />
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {trip.from} <span className="text-purple-600">→</span> {trip.to}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{trip.departureDate}</span>
                      {trip.arrivalDate && <span className="text-slate-400">→ {trip.arrivalDate}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Weight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{t("availableSpace")}: <strong className="text-slate-900 font-bold">{trip.capacity} kg</strong></span>
                    </div>
                  </div>

                  {trip.notes && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 italic">
                      "{trip.notes}"
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      {trip.userPhoto ? (
                        <img src={trip.userPhoto} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-semibold">
                          {trip.userName?.[0]?.toUpperCase() || "T"}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-medium text-slate-800 truncate max-w-[120px]">
                          {trip.userName}
                        </div>
                        <div className="text-[10px] text-slate-400">{t("traveledBy")}</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleContact(trip)}
                    disabled={isConnecting}
                    className={`w-full mt-3 rounded-lg px-3 py-2 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      isOwn
                        ? "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                        : "border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white"
                    }`}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    {isOwn ? tCommon("details") : t("sendRequest")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
