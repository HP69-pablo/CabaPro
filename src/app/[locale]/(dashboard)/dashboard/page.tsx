"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { queryDocs, deleteDoc } from "@/lib/firestore";
import { where, orderBy } from "firebase/firestore";
import { Package, Plane, Loader2, Plus, Trash2 } from "lucide-react";

interface RequestItem {
  id: string;
  productName: string;
  fromCountry: string;
  toCity: string;
  budget: number;
  reward: number;
  status: string;
  createdAt: any;
}

interface TripItem {
  id: string;
  from: string;
  to: string;
  departureDate: string;
  capacity: number;
  status: string;
  createdAt: any;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<"requests" | "trips">("requests");
  const [myRequests, setMyRequests] = useState<RequestItem[]>([]);
  const [myTrips, setMyTrips] = useState<TripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [requests, trips] = await Promise.all([
          queryDocs<RequestItem>("requests", where("userId", "==", user.uid), orderBy("createdAt", "desc")),
          queryDocs<TripItem>("trips", where("userId", "==", user.uid), orderBy("createdAt", "desc")),
        ]);
        setMyRequests(requests);
        setMyTrips(trips);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleDeleteRequest = async (id: string) => {
    if (!confirm(tCommon("confirm") || "Are you sure?")) return;
    setDeletingId(id);
    try {
      await deleteDoc("requests", id);
      setMyRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete request:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!confirm(tCommon("confirm") || "Are you sure?")) return;
    setDeletingId(id);
    try {
      await deleteDoc("trips", id);
      setMyTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete trip:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{t("noActivity")}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            {tCommon("login" as any) || "Sign In"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <div className="flex gap-2">
          <Link
            href="/requests/new"
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Request</span>
          </Link>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Trip</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 max-w-xs">
        <button
          onClick={() => setTab("requests")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
            tab === "requests"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Package className="h-4 w-4" />
          {t("myRequests")} ({myRequests.length})
        </button>
        <button
          onClick={() => setTab("trips")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
            tab === "trips"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Plane className="h-4 w-4" />
          {t("myTrips")} ({myTrips.length})
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && tab === "requests" && (
        <>
          {myRequests.length === 0 ? (
            <EmptyState
              icon={<Package className="h-10 w-10 text-slate-300" />}
              message={t("noActivity")}
              href="/requests/new"
            />
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{req.productName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{req.fromCountry} → {req.toCity}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <span className="text-sm font-bold text-slate-900">€{req.budget}</span>
                      <StatusBadge status={req.status} />
                    </div>
                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      disabled={deletingId === req.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title={tCommon("delete")}
                    >
                      {deletingId === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loading && tab === "trips" && (
        <>
          {myTrips.length === 0 ? (
            <EmptyState
              icon={<Plane className="h-10 w-10 text-slate-300" />}
              message={t("noActivity")}
              href="/trips/new"
            />
          ) : (
            <div className="space-y-3">
              {myTrips.map((trip) => (
                <div key={trip.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{trip.from} → {trip.to}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{trip.departureDate}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <span className="text-sm font-bold text-slate-900">{trip.capacity} kg</span>
                      <StatusBadge status={trip.status} />
                    </div>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      disabled={deletingId === trip.id}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title={tCommon("delete")}
                    >
                      {deletingId === trip.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    completed: "bg-blue-50 text-blue-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return (
    <div className={`mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold text-center ${colors[status] || "bg-slate-50 text-slate-600"}`}>
      {status}
    </div>
  );
}

function EmptyState({ icon, message, href }: { icon: React.ReactNode; message: string; href: string }) {
  return (
    <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
      <div className="mx-auto mb-3">{icon}</div>
      <p className="text-sm text-slate-500 mb-4">{message}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
      >
        <Plus className="h-4 w-4" /> Post Now
      </Link>
    </div>
  );
}
