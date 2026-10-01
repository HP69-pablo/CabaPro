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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm transition"
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
            className="w-full rounded-xl border border-slate-200 ps-9 pe-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute start-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            placeholder={t("toWhere")}
            className="w-full rounded-xl border border-slate-200 ps-9 pe-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
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
            className="inline-flex items-center gap-2 mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
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
                className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-5 hover:border-blue-200 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900 line-clamp-1">
                      {req.productName}
                    </h3>
                    {req.productUrl && (
                      <a
                        href={req.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-blue-600 transition"
                        title="Product link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  {req.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{req.description}</p>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">{req.fromCountry}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-medium text-blue-600">{req.toCity}</span>
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
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      {req.userPhoto ? (
                        <img src={req.userPhoto} alt="" className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                          {req.userName?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <span className="text-xs text-slate-600 font-medium truncate max-w-[100px]">
                        {req.userName}
                      </span>
                    </div>
                    <div className="text-end">
                      <div className="text-sm font-bold text-slate-900">€{req.budget}</div>
                      <div className="text-xs text-emerald-600 font-medium">
                        +€{req.reward} {t("rewardLabel").toLowerCase()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleContact(req)}
                    disabled={isConnecting}
                    className={`w-full mt-3 rounded-lg px-3 py-2 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      isOwn
                        ? "border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                        : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white"
                    }`}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    {isOwn ? tCommon("details") : t("contactSeller")}
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
