"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { queryDocs, getOrCreateConversation } from "@/lib/firestore";
import { orderBy, limit } from "firebase/firestore";
import { Package, MapPin, Calendar, Plus, Loader2, Search, MessageSquare, ExternalLink } from "lucide-react";

interface RequestItem {
  id: string;
  userId: string;
  productName: string;
  description?: string;
  productUrl?: string;
  fromCountry: string;
  toCity: string;
  budget: number;
  reward: number;
  deadline?: string;
  userName: string;
  userPhoto?: string;
  createdAt: any;
}

export default function RequestsPage() {
  const t = useTranslations("request");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await queryDocs<RequestItem>(
          "requests",
          orderBy("createdAt", "desc"),
          limit(50)
        );
        setRequests(data);
      } catch (err) {
        console.error("Failed to load requests:", err);
      } finally {
        setLoading(false);
      }
    };
    loadRequests();
  }, []);

  const handleContact = async (req: RequestItem) => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (user.uid === req.userId) {
      router.push("/dashboard");
      return;
    }

    setConnectingId(req.id);
    try {
      const convId = await getOrCreateConversation(
        {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
        },
        {
          uid: req.userId,
          displayName: req.userName,
          photoURL: req.userPhoto,
        },
        {
          requestId: req.id,
          requestTitle: req.productName,
        }
      );

      router.push(`/messages?id=${convId}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setConnectingId(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      !searchTerm ||
      req.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.fromCountry?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCity =
      !filterCity ||
      req.toCity?.toLowerCase().includes(filterCity.toLowerCase());

    return matchesSearch && matchesCity;
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
          href="/requests/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal-800 shadow-sm shadow-brand-teal/20 transition"
        >
          <Plus className="h-4 w-4" />
          <span>{t("publish")}</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="relative">
          <Search className="absolute start-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={tCommon("search")}
            className="w-full rounded-xl border border-slate-200 ps-9 pe-3 py-2 text-sm focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute start-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            placeholder={t("toWhere")}
            className="w-full rounded-xl border border-slate-200 ps-9 pe-3 py-2 text-sm focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredRequests.length === 0 && (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">{t("noRequests")}</p>
          <p className="text-xs text-slate-400 mt-1">{tCommon("noResults")}</p>
          <Link
            href="/requests/new"
            className="inline-flex items-center gap-2 mt-4 rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal-800 transition"
          >
            <Plus className="h-4 w-4" /> {t("publish")}
          </Link>
        </div>
      )}

      {/* Request cards */}
      {!loading && filteredRequests.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map((req) => {
            const isOwn = user?.uid === req.userId;
            const isConnecting = connectingId === req.id;

            return (
              <div
                key={req.id}
                className="flex flex-col justify-between rounded-2xl border border-brand-border bg-white p-5 hover:border-brand-teal/40 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                      {req.productName}
                    </h3>
                    <div className="text-slate-400">
                      <Package className="h-4 w-4 text-brand-teal" />
                    </div>
                  </div>

                  {/* Avatar + 5 Stars rating row matching Screen 2 */}
                  <div className="flex items-center gap-2 mb-3">
                    {req.userPhoto ? (
                      <img src={req.userPhoto} alt="" className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-brand-teal-100 text-brand-teal flex items-center justify-center text-[10px] font-bold">
                        {req.userName?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="text-xs font-medium text-slate-600 truncate max-w-[90px]">
                      {req.userName}
                    </span>
                    <div className="flex items-center text-amber-400 text-xs">
                      {"★★★★★"}
                    </div>
                  </div>

                  {req.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-brand-bg rounded-xl p-3 border border-brand-border/60">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-brand-teal shrink-0" />
                      <span className="font-semibold text-slate-800">{req.fromCountry}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold text-brand-teal">{req.toCity}</span>
                    </div>
                    {req.deadline && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{t("deadlineLabel")}: <strong className="text-slate-700">{req.deadline}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline justify-between border-t border-slate-100 pt-3 mb-3">
                    <div className="text-base font-extrabold text-slate-900">
                      €{req.reward} <span className="text-xs font-semibold text-brand-teal">Reward</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-500">
                      Budget: €{req.budget}
                    </div>
                  </div>

                  {/* Dual Action Buttons matching Screen 2 */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleContact(req)}
                      disabled={isConnecting}
                      className="rounded-xl border border-brand-teal px-3 py-2 text-xs font-bold text-brand-teal hover:bg-brand-teal-50 transition flex items-center justify-center gap-1"
                    >
                      {tCommon("details") || "Details"}
                    </button>
                    <button
                      onClick={() => handleContact(req)}
                      disabled={isConnecting}
                      className={`rounded-xl px-3 py-2 text-xs font-bold text-white transition flex items-center justify-center gap-1 shadow-sm ${
                        isOwn
                          ? "bg-slate-500 hover:bg-slate-600"
                          : "bg-brand-teal hover:bg-brand-teal-800"
                      }`}
                    >
                      {isConnecting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <MessageSquare className="h-3.5 w-3.5" />
                      )}
                      {isOwn ? "My Request" : (t("contactSeller") || "Bring this")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
