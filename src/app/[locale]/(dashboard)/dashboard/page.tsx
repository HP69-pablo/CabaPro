"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  queryDocs, 
  deleteDoc, 
  BuyerRequestItem, 
  BringerTripItem, 
  calculateMatches, 
  MatchResult,
  getOrCreateConversation 
} from "@/lib/firestore";
import { where, orderBy } from "firebase/firestore";
import { 
  Package, 
  Plane, 
  Loader2, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Wallet, 
  Star, 
  MapPin, 
  Calendar, 
  Weight, 
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  Settings as SettingsIcon
} from "lucide-react";
import SettingsView from "@/components/settings/SettingsView";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<"matches" | "orders" | "requests" | "trips" | "wallet" | "settings">("matches");
  const [handoverConfirmed, setHandoverConfirmed] = useState(false);
  const [myRequests, setMyRequests] = useState<BuyerRequestItem[]>([]);
  const [myTrips, setMyTrips] = useState<BringerTripItem[]>([]);
  const [allRequests, setAllRequests] = useState<BuyerRequestItem[]>([]);
  const [allTrips, setAllTrips] = useState<BringerTripItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [connectingMatchId, setConnectingMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        const [myReqs, myTrps, allReqs, allTrps] = await Promise.all([
          queryDocs<BuyerRequestItem>("requests", where("userId", "==", user.uid), orderBy("createdAt", "desc")),
          queryDocs<BringerTripItem>("trips", where("userId", "==", user.uid), orderBy("createdAt", "desc")),
          queryDocs<BuyerRequestItem>("requests", orderBy("createdAt", "desc")),
          queryDocs<BringerTripItem>("trips", orderBy("createdAt", "desc")),
        ]);

        setMyRequests(myReqs);
        setMyTrips(myTrps);
        setAllRequests(allReqs);
        setAllTrips(allTrps);
      } catch (err) {
        console.error("Dashboard fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  // Calculate matches:
  // 1. User's requests matched with other travelers' trips
  // 2. User's trips matched with other buyers' requests
  const matchesForMyRequests = calculateMatches(
    myRequests,
    allTrips.filter((t) => t.userId !== user?.uid)
  );

  const matchesForMyTrips = calculateMatches(
    allRequests.filter((r) => r.userId !== user?.uid),
    myTrips
  );

  const allMatches = [...matchesForMyRequests, ...matchesForMyTrips];

  const handleStartChatFromMatch = async (match: MatchResult) => {
    if (!user) return;

    setConnectingMatchId(match.id);
    try {
      const isMyRequest = match.request.userId === user.uid;
      const targetUserId = isMyRequest ? match.trip.userId : match.request.userId;
      const targetUserName = isMyRequest ? match.trip.userName : match.request.userName;

      const convId = await getOrCreateConversation(
        {
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
        },
        {
          uid: targetUserId,
          displayName: targetUserName,
          photoURL: null,
        },
        {
          requestId: match.request.id,
          requestTitle: match.request.productName,
          tripId: match.trip.id,
          tripRoute: `${match.trip.originCity || match.trip.from} → ${match.trip.destCity || match.trip.to}`,
        }
      );

      router.push(`/messages?id=${convId}`);
    } catch (err) {
      console.error("Failed to connect match:", err);
      setConnectingMatchId(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm(tCommon("confirm") || "Are you sure?")) return;
    setDeletingId(id);
    try {
      await deleteDoc("requests", id);
      setMyRequests((prev) => prev.filter((r) => r.id !== id));
      setAllRequests((prev) => prev.filter((r) => r.id !== id));
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
      setAllTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete trip:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded-md w-1/4" />
        <div className="h-24 bg-slate-100 rounded-xl" />
        <div className="h-48 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 max-w-sm">
          <Package className="h-12 w-12 text-brand-accent mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Access Your Dashboard</h2>
          <p className="text-xs text-slate-500 mb-4">Sign in to manage your requests, trips, and view smart matches.</p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-teal-800 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const wallet = userProfile?.wallet || { availableBalance: 140, escrowBalance: 0, currency: "EUR" };
  const rating = userProfile?.rating || 4.9;
  const completedDeals = userProfile?.completedTransactions || 3;
  const verificationLevel = userProfile?.verificationLevel || "ID_VERIFIED";

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-5xl">
      {/* Header Profile Bar - Deep Teal Theme matching Mockup */}
      <div className="bg-gradient-to-r from-brand-teal to-[#11494b] rounded-3xl p-6 text-white mb-6 shadow-md shadow-brand-teal/15">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-[#ffffff]/15 backdrop-blur-md flex items-center justify-center text-xl font-bold text-white border border-white/20 shadow-inner">
              {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight">{user.displayName || user.email?.split("@")[0]}</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#ffffff]/20 text-white border border-white/30 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> {verificationLevel}
                </span>
              </div>
              <p className="text-xs text-teal-100 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 border-white/10 pt-3 md:pt-0">
            <div className="bg-[#ffffff]/10 rounded-2xl p-2.5 text-center border border-white/10">
              <div className="flex items-center justify-center gap-1 text-amber-300 font-bold text-sm">
                <Star className="h-3.5 w-3.5 fill-amber-300" /> {rating}
              </div>
              <div className="text-[10px] text-teal-200">Rating</div>
            </div>
            <div className="bg-[#ffffff]/10 rounded-2xl p-2.5 text-center border border-white/10">
              <div className="font-bold text-sm text-white">{completedDeals}</div>
              <div className="text-[10px] text-teal-200">Deals Done</div>
            </div>
            <div className="bg-[#ffffff]/10 rounded-2xl p-2.5 text-center border border-white/10">
              <div className="font-bold text-sm text-emerald-300">€{wallet.availableBalance}</div>
              <div className="text-[10px] text-teal-200">Wallet</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between gap-3 mb-6 overflow-x-auto pb-1">
        <div className="flex gap-1 bg-brand-bg p-1.5 rounded-2xl border border-brand-border shrink-0">
          <button
            onClick={() => setTab("matches")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              tab === "matches"
                ? "bg-white text-brand-accent shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Smart Matches ({allMatches.length})</span>
          </button>

          <button
            onClick={() => setTab("orders")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              tab === "orders"
                ? "bg-white text-brand-accent shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-brand-accent" />
            <span>Orders & Code</span>
          </button>

          <button
            onClick={() => setTab("requests")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              tab === "requests"
                ? "bg-white text-brand-accent shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="h-3.5 w-3.5 text-brand-accent" />
            <span>My Requests ({myRequests.length})</span>
          </button>

          <button
            onClick={() => setTab("trips")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              tab === "trips"
                ? "bg-white text-brand-accent shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Plane className="h-3.5 w-3.5 text-brand-coral" />
            <span>My Trips ({myTrips.length})</span>
          </button>

          <button
            onClick={() => setTab("wallet")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              tab === "wallet"
                ? "bg-white text-brand-accent shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wallet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Wallet & Escrow</span>
          </button>

          <button
            onClick={() => setTab("settings")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              tab === "settings"
                ? "bg-white text-brand-accent shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <SettingsIcon className="h-3.5 w-3.5 text-brand-accent" />
            <span>Settings</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/requests/new"
            className="inline-flex items-center gap-1 rounded-xl bg-brand-teal px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-teal-800 shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Request</span>
          </Link>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-1 rounded-xl bg-brand-coral px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-coral-600 shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Trip</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 py-6">
          <div className="h-28 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-28 bg-slate-100 rounded-xl animate-pulse" />
        </div>
      )}

      {/* TAB 1: SMART MATCHES */}
      {!loading && tab === "matches" && (
        <div className="space-y-4">
          {allMatches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <Sparkles className="h-10 w-10 text-amber-400 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800 text-sm">No matches found right now</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Our rule-based engine automatically pairs your requests with active travelers heading your route.
              </p>
              <div className="flex justify-center gap-2">
                <Link href="/requests/new" className="text-xs font-semibold text-brand-accent bg-brand-teal-50 px-3 py-2 rounded-lg hover:bg-brand-teal-100">
                  + Post a Request
                </Link>
                <Link href="/trips/new" className="text-xs font-semibold text-brand-coral bg-brand-coral-50 px-3 py-2 rounded-lg hover:bg-brand-coral-100">
                  + Post a Trip
                </Link>
              </div>
            </div>
          ) : (
            allMatches.map((match) => (
              <div
                key={match.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-brand-accent/40 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      {match.score}% Match
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {match.request.productName}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-medium">
                    Route: <strong className="text-slate-800">{match.trip.originCity || match.trip.from} → {match.trip.destCity || match.trip.to}</strong>
                  </div>
                </div>

                {/* Match Reasons Checklist from PDF Page 4 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 bg-slate-50 rounded-xl p-3">
                  {match.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Traveler: <strong className="text-slate-800">{match.trip.userName}</strong>
                    <span className="text-slate-400 ms-1">({match.trip.remainingCapacity || match.trip.capacity} kg remaining)</span>
                  </div>

                  <button
                    onClick={() => handleStartChatFromMatch(match)}
                    disabled={connectingMatchId === match.id}
                    className="inline-flex items-center gap-1.5 bg-brand-teal text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-teal-800 transition"
                  >
                    {connectingMatchId === match.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5" />
                    )}
                    <span>Chat & Agree</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: ORDERS & HANDOVER ESCROW CODE (SCREEN 4 MOCKUP) */}
      {!loading && tab === "orders" && (
        <div className="max-w-xl mx-auto space-y-5">
          {/* Order Header */}
          <div className="bg-white rounded-3xl border border-brand-border p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-brand-teal-50 text-brand-accent flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5 text-brand-accent" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Order #4521</h2>
                  <p className="text-xs text-slate-500">Paris (CDG) → Algiers (ALG)</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                handoverConfirmed 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                  : "bg-brand-teal-50 text-brand-accent border border-brand-accent/20"
              }`}>
                {handoverConfirmed ? "Delivered & Released" : "In Transit (Escrow Secured)"}
              </span>
            </div>

            {/* 4-Step Stepper */}
            <div className="mb-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />
                <div 
                  className="absolute top-1/2 left-0 h-0.5 bg-brand-teal -translate-y-1/2 -z-0 transition-all duration-500" 
                  style={{ width: handoverConfirmed ? "100%" : "66%" }} 
                />

                {/* Step 1: Request Accepted */}
                <div className="flex flex-col items-center relative z-10">
                  <div className="h-7 w-7 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    ✓
                  </div>
                  <span className="text-[10px] font-bold text-brand-accent mt-1.5 text-center">Accepted</span>
                </div>

                {/* Step 2: Payment Secured */}
                <div className="flex flex-col items-center relative z-10">
                  <div className="h-7 w-7 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    ✓
                  </div>
                  <span className="text-[10px] font-bold text-brand-accent mt-1.5 text-center">Secured</span>
                </div>

                {/* Step 3: In Transit */}
                <div className="flex flex-col items-center relative z-10">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors ${
                    handoverConfirmed ? "bg-brand-teal text-white" : "bg-brand-teal text-white ring-4 ring-brand-accent/20"
                  }`}>
                    {handoverConfirmed ? "✓" : "3"}
                  </div>
                  <span className="text-[10px] font-bold text-brand-accent mt-1.5 text-center">In Transit</span>
                </div>

                {/* Step 4: Delivered */}
                <div className="flex flex-col items-center relative z-10">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors ${
                    handoverConfirmed ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : "bg-slate-200 text-slate-500"
                  }`}>
                    {handoverConfirmed ? "✓" : "4"}
                  </div>
                  <span className={`text-[10px] font-bold mt-1.5 text-center ${
                    handoverConfirmed ? "text-emerald-700" : "text-slate-400"
                  }`}>Delivered</span>
                </div>
              </div>
            </div>

            {/* Item Card */}
            <div className="bg-brand-bg rounded-2xl p-4 border border-brand-border/60 mb-5 flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-white border border-brand-border flex items-center justify-center shrink-0 shadow-xs">
                <Package className="h-8 w-8 text-brand-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm truncate">Sony WH-1000XM5</h3>
                  <span className="font-black text-slate-900 text-sm">€320</span>
                </div>
                <p className="text-xs text-slate-500 mb-1.5">Weight: 0.8 kg • Fnac Paris</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-600">
                  <span>Buyer: <strong className="text-slate-800">Sarah J.</strong></span>
                  <span>•</span>
                  <span>Bringer: <strong className="text-brand-accent">Karim B.</strong></span>
                </div>
              </div>
            </div>

            {/* Escrow & Delivery Code Box - Screen 4 highlight */}
            <div className="bg-brand-teal-50 rounded-2xl p-5 border border-brand-accent/20 mb-5 text-center">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-accent mb-2">
                <ShieldCheck className="h-4 w-4 text-brand-accent" />
                <span>One-Time Delivery Code</span>
              </div>
              <div>
                <span className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-brand-accent mb-2 bg-white/80 py-2.5 px-6 rounded-xl border border-brand-accent/15 shadow-inner inline-block">
                  457 991
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-xs mx-auto mt-2 leading-relaxed">
                {handoverConfirmed 
                  ? "Code verified! €30 Bringer Reward has been released to Karim's wallet."
                  : "Share this 6-digit code with traveler Karim upon in-person delivery to release escrow payment."}
              </p>
            </div>

            {/* Action Button */}
            {!handoverConfirmed ? (
              <button
                onClick={() => setHandoverConfirmed(true)}
                className="w-full bg-brand-teal hover:bg-brand-teal-800 text-white rounded-2xl py-3.5 text-sm font-bold shadow-md shadow-brand-teal/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Handover & Release Payment</span>
              </button>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-center">
                <p className="text-xs font-bold mb-1">🎉 Handover Successfully Confirmed!</p>
                <p className="text-[11px] text-emerald-600">
                  The transaction is complete and €30 reward has been released.
                </p>
                <button
                  onClick={() => setHandoverConfirmed(false)}
                  className="mt-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 underline"
                >
                  Reset Demo State
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY REQUESTS (DEMANDS) */}
      {!loading && tab === "requests" && (
        <div className="space-y-3">
          {myRequests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 mb-3">You haven't posted any product requests yet.</p>
              <Link href="/requests/new" className="inline-flex items-center gap-1.5 bg-brand-teal text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-teal-800 transition">
                <Plus className="h-3.5 w-3.5" /> Post Your First Request
              </Link>
            </div>
          ) : (
            myRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{req.productName}</h3>
                    {req.condition && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                        {req.condition}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1 mb-2">{req.description}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{req.sourceCity || req.fromCountry} → {req.destCity || req.toCity}</span>
                    </div>
                    {req.storeName && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <ShoppingBag className="h-3.5 w-3.5 text-slate-400" />
                        <span>{req.storeName}</span>
                      </div>
                    )}
                    {req.deadline && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>Needed by: {req.deadline}</span>
                      </div>
                    )}
                    {req.weight && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <Weight className="h-3.5 w-3.5 text-slate-400" />
                        <span>{req.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                  <div className="text-end">
                    <div className="text-sm font-black text-slate-900">€{req.budget || req.price}</div>
                    <div className="text-[11px] font-semibold text-emerald-600">+€{req.reward || req.preferredFee} bringer fee</div>
                  </div>

                  <button
                    onClick={() => handleDeleteRequest(req.id)}
                    disabled={deletingId === req.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
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
            ))
          )}
        </div>
      )}

      {/* TAB 3: MY TRIPS */}
      {!loading && tab === "trips" && (
        <div className="space-y-3">
          {myTrips.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
              <Plane className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 mb-3">You haven't posted any travel trips yet.</p>
              <Link href="/trips/new" className="inline-flex items-center gap-1.5 bg-brand-coral text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-brand-coral-600 transition">
                <Plus className="h-3.5 w-3.5" /> Post Your Upcoming Trip
              </Link>
            </div>
          ) : (
            myTrips.map((trip) => {
              const totalCap = trip.totalCapacity || trip.capacity || 15;
              const resCap = trip.reservedCapacity || 0;
              const remCap = trip.remainingCapacity !== undefined ? trip.remainingCapacity : totalCap - resCap;
              const usedPercentage = Math.round((resCap / totalCap) * 100);

              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-coral-50 text-brand-coral flex items-center justify-center">
                        <Plane className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {trip.originCity || trip.from} → {trip.destCity || trip.to}
                        </h3>
                        <p className="text-xs text-slate-500">Departure: {trip.departureDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-end">
                        <div className="text-sm font-black text-slate-900">{remCap} kg left</div>
                        <div className="text-[10px] text-slate-400">of {totalCap} kg total capacity</div>
                      </div>

                      <button
                        onClick={() => handleDeleteTrip(trip.id)}
                        disabled={deletingId === trip.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
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

                  {/* Concurrency-safe capacity bar according to PDF Page 3 */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                    <div className="bg-brand-coral h-2 rounded-full transition-all" style={{ width: `${usedPercentage}%` }} />
                  </div>

                  {trip.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-xl">
                      "{trip.notes}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: WALLET & TRUST */}
      {!loading && tab === "wallet" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Available Balance</span>
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              €{wallet.availableBalance.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mb-4">Ready for withdrawal to CCP or BaridiMob</p>
            <button className="w-full bg-emerald-600 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-emerald-700 transition">
              Request Payout
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Escrow Protected</span>
              <ShieldCheck className="h-4 w-4 text-brand-accent" />
            </div>
            <div className="text-3xl font-black text-slate-900 mb-1">
              €{wallet.escrowBalance.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mb-4">Locked safely until delivery code is verified</p>
            <div className="text-xs font-medium text-brand-accent bg-brand-teal-50 p-2.5 rounded-xl border border-brand-accent/20">
              ✓ All payments held in escrow under Caba Pro Guarantee
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {!loading && tab === "settings" && (
        <div className="pt-1">
          <SettingsView />
        </div>
      )}
    </div>
  );
}
