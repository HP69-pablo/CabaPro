"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plane,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  QrCode,
  MapPin,
  Camera,
  FileText,
  AlertTriangle,
  Send,
  User,
  Users,
  ArrowRight,
  ShieldAlert,
  Star,
  RefreshCw,
  Printer,
  ChevronRight,
  Check,
  X,
  CreditCard,
  MessageSquare,
  Lock,
} from "lucide-react";
import { Transaction, ReceptionMethod, MeetingStatus, TransactionStatus } from "@/lib/transactions/types";
import { TransactionService } from "@/lib/transactions/transactionService";
import { DemoSimulator, DEMO_PERSONAS, DEMO_TRANSACTION_ID } from "@/lib/transactions/demoSimulator";
import { PARTNER_BUREAUS } from "@/lib/transactions/constants";
import { Link } from "@/i18n/navigation";

interface Props {
  transactionId?: string;
}

export default function TransactionDetailView({ transactionId = DEMO_TRANSACTION_ID }: Props) {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [activePersona, setActivePersona] = useState<"buyer" | "bringer" | "bureau_staff" | "finance" | "moderator">("buyer");
  
  // UI states
  const [codeInputValue, setCodeInputValue] = useState("");
  const [codeVerificationResult, setCodeVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipLocale, setSlipLocale] = useState<"fr" | "en" | "ar">("fr");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Meeting coordination form
  const [selectedMethod, setSelectedMethod] = useState<ReceptionMethod>("bureau_pickup");
  const [meetPoint, setMeetPoint] = useState("");
  const [meetTime, setMeetTime] = useState("");

  // Safe Handover checklist state
  const [checklist, setChecklist] = useState({
    itemMatchesListing: true,
    modelQuantityVerified: true,
    packagingInspected: true,
    noProhibitedItems: true,
    receiptAttached: true,
  });

  // Load transaction & subscribe
  useEffect(() => {
    DemoSimulator.getOrCreateDemoTransaction().then((loaded) => {
      setTx(loaded);
      setSelectedMethod(loaded.reception.method || "bureau_pickup");
      setMeetPoint(loaded.reception.meetingPoint || loaded.bureauAddress);
      setMeetTime(loaded.reception.meetingTime || "Demain à 14:00");
    });

    const unsub = TransactionService.subscribeToTransaction(transactionId, (updated) => {
      if (updated) {
        setTx(updated);
        setSelectedMethod(updated.reception.method || "bureau_pickup");
        setMeetPoint(updated.reception.meetingPoint || updated.bureauAddress);
        setMeetTime(updated.reception.meetingTime || "Demain à 14:00");
      }
    });

    return () => unsub();
  }, [transactionId]);

  if (!tx) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-accent" />
          <p className="text-xs text-slate-500 font-semibold">Initialisation du dossier transaction...</p>
        </div>
      </div>
    );
  }

  // ---------------- HANDLERS ----------------
  const handleVerifyCode = async () => {
    if (!codeInputValue.trim()) return;
    setIsVerifyingCode(true);
    setCodeVerificationResult(null);

    try {
      const res = await TransactionService.verifyDeliveryCode({
        transactionId: tx.id,
        bringerId: tx.bringerId,
        enteredCode: codeInputValue,
      });

      setCodeVerificationResult({
        success: res.success,
        message: res.message,
      });

      if (res.success) {
        setTx(res.transaction);
        setActionNotice("🎉 Code vérifié avec succès! Remise physique validée.");
      }
    } catch (e: any) {
      setCodeVerificationResult({
        success: false,
        message: e.message || "Erreur de vérification du code.",
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleConfirmArrivalDirectly = async () => {
    try {
      const updated = await TransactionService.confirmArrival({
        transactionId: tx.id,
        bringerId: tx.bringerId,
        arrivalCity: "Alger",
      });
      setTx(updated);
      setActionNotice("📍 Arrivée confirmée à Alger! La coordination du rendez-vous est maintenant ouverte.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdateMeeting = async () => {
    try {
      const updated = await TransactionService.arrangeMeeting({
        transactionId: tx.id,
        actorId: activePersona === "buyer" ? tx.buyerId : tx.bringerId,
        method: selectedMethod,
        meetingPoint: meetPoint,
        meetingTime: meetTime,
      });
      setTx(updated);
      setActionNotice("🤝 Modalités de rendez-vous enregistrées avec succès!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleQuickStatus = async (status: MeetingStatus) => {
    try {
      const updated = await TransactionService.updateMeetingStatus({
        transactionId: tx.id,
        actorId: activePersona === "buyer" ? tx.buyerId : tx.bringerId,
        status,
        locationPing:
          status === "arrived"
            ? { lat: 36.7538, lng: 3.0588, label: "Position partagée (Alger Centre)" }
            : null,
      });
      setTx(updated);
      setActionNotice(`Statut mis à jour: ${status.replace("_", " ")}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleBuyerConfirmDelivery = async () => {
    try {
      const updated = await TransactionService.confirmDelivery({
        transactionId: tx.id,
        buyerId: tx.buyerId,
        buyerReview: {
          rating: 5,
          comment: "Produit neuf impeccable et conforme. Recommandé!",
        },
      });
      setTx(updated);
      setActionNotice("🏆 Transaction clôturée! Les fonds ont été transférés au voyageur.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenDispute = async () => {
    if (!disputeReason) return;
    try {
      const updated = await TransactionService.openDispute({
        transactionId: tx.id,
        openedBy: activePersona === "buyer" ? tx.buyerId : tx.bringerId,
        openedByName: activePersona === "buyer" ? tx.buyerName : tx.bringerName,
        reason: disputeReason,
      });
      setTx(updated);
      setShowDisputeModal(false);
      setActionNotice("⚠️ Litige ouvert. Le déblocage des fonds est gelé et transmis à la modération.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // State machine step indicator helper
  const stages: { key: TransactionStatus; label: string; num: number }[] = [
    { key: "AWAITING_PAYMENT", label: "Dépôt Bureau", num: 1 },
    { key: "PAID", label: "Payé Escrow", num: 2 },
    { key: "FUNDS_SENT_TO_BRINGER", label: "Avance Virée", num: 3 },
    { key: "PURCHASED", label: "Acheté & Preuves", num: 4 },
    { key: "HANDED_OVER", label: "Safe Handover", num: 5 },
    { key: "IN_TRANSIT", label: "En Transit", num: 6 },
    { key: "ARRIVED", label: "Arrivé en Algérie", num: 7 },
    { key: "MEETING_ARRANGED", label: "Rendez-vous", num: 8 },
    { key: "DELIVERED", label: "Remis (Code Validé)", num: 9 },
    { key: "COMPLETED", label: "Clôturé", num: 10 },
  ];

  const getStepStatus = (index: number) => {
    const currentIndex = stages.findIndex((s) => s.key === tx.status);
    if (tx.status === "COMPLETED") return "completed";
    if (tx.status === "DISPUTED") return "disputed";
    if (currentIndex === -1) return "upcoming";
    if (index < currentIndex) return "completed";
    if (index === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="space-y-6">
      {/* ---------------- INTERACTIVE DEMO SIMULATOR BAR ---------------- */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              Barre de Simulation Interactive & Rôles
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/staff"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
            >
              <Building2 className="h-3.5 w-3.5" />
              Ouvrir Centre Staff / Guichet Bureau
            </Link>
            <button
              onClick={() => DemoSimulator.resetDemoTransaction().then((r) => setTx(r))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
            >
              <RefreshCw className="h-3 w-3" />
              Reset Démo
            </button>
          </div>
        </div>

        {/* Persona selector tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          {(["buyer", "bringer", "bureau_staff", "finance", "moderator"] as const).map((p) => {
            const persona = DEMO_PERSONAS[p];
            const isActive = activePersona === p;
            return (
              <button
                key={p}
                onClick={() => setActivePersona(p)}
                className={`p-2 rounded-xl text-left transition flex items-center gap-2 border ${
                  isActive
                    ? "bg-brand-teal border-brand-teal text-white shadow-sm"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <img src={persona.avatar} alt="" className="h-7 w-7 rounded-full object-cover shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold truncate">{persona.name}</span>
                  <span className="block text-[9px] text-slate-400 truncate capitalize">{p.replace("_", " ")}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* One-Click Step Simulation Triggers */}
        <div className="text-[11px] text-slate-400 mb-1.5 font-bold uppercase tracking-wider">
          Avancer Rapidement les É tapes :
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => DemoSimulator.stepPayAtBureau(tx.id).then((u) => u && setTx(u))}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
          >
            1. Payer au Bureau (Cash)
          </button>
          <button
            onClick={() => DemoSimulator.stepSendWire(tx.id).then((u) => u && setTx(u))}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
          >
            2. Virement Avance Voyageur
          </button>
          <button
            onClick={() => DemoSimulator.stepConfirmBringerFunds(tx.id).then((u) => u && setTx(u))}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
          >
            3. Voyageur Confirme Réception
          </button>
          <button
            onClick={() => DemoSimulator.stepSubmitPurchaseProof(tx.id).then((u) => u && setTx(u))}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
          >
            4. Acheter & Photos Preuves
          </button>
          <button
            onClick={() => DemoSimulator.stepSafeHandover(tx.id).then((u) => u && setTx(u))}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
          >
            5. Safe Handover
          </button>
          <button
            onClick={() => DemoSimulator.stepStartTransit(tx.id).then((u) => u && setTx(u))}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-200"
          >
            6. En Transit
          </button>
          <button
            onClick={() => DemoSimulator.stepConfirmArrival(tx.id).then((u) => u && setTx(u))}
            className="px-2.5 py-1.5 bg-brand-coral hover:bg-brand-coral/90 rounded-lg text-xs font-bold text-white shadow-xs"
          >
            📍 7. Confirmer Arrivée en Algérie
          </button>
          <button
            onClick={() => DemoSimulator.stepVerifyCorrectCode(tx.id).then((u) => u && setTx(u.transaction))}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold text-white shadow-xs"
          >
            8. Valider Bon Code (6 Chiffres)
          </button>
          <button
            onClick={() => DemoSimulator.stepCompleteDelivery(tx.id).then((u) => u && setTx(u))}
            className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-xs font-bold text-white shadow-xs"
          >
            9. Clôturer & Débloquer Escrow
          </button>
        </div>
      </div>

      {/* Action feedback */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ---------------- MAIN TRANSACTION CARD ---------------- */}
      <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-center shrink-0">
              <Package className="h-8 w-8 text-brand-accent" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wide">
                Bordereau #{tx.paymentCode} • {tx.tripRoute}
              </span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">{tx.productName}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span>Acheteur: <strong>{tx.buyerName}</strong></span>
                <span>•</span>
                <span>Voyageur: <strong className="text-brand-accent">{tx.bringerName}</strong></span>
              </div>
            </div>
          </div>

          {/* Locked Price badge */}
          <div className="sm:text-right bg-brand-bg px-4 py-3 rounded-2xl border border-brand-border">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Garanti Caba Pro</span>
            <span className="text-xl font-black text-brand-accent">{tx.priceBreakdown.totalDzd.toLocaleString()} DZD</span>
            <span className="block text-[11px] text-slate-500 font-semibold">(Soit €{tx.priceBreakdown.totalEur})</span>
          </div>
        </div>

        {/* ---------------- STEP PROGRESS TIMELINE ---------------- */}
        <div className="py-6 border-b border-brand-border overflow-x-auto">
          <div className="flex items-center justify-between min-w-[700px] px-2">
            {stages.map((st, idx) => {
              const status = getStepStatus(idx);
              return (
                <div key={st.key} className="flex flex-col items-center relative flex-1 text-center">
                  {/* Connector bar */}
                  {idx > 0 && (
                    <div
                      className={`absolute top-3.5 -left-1/2 w-full h-0.5 -z-0 ${
                        status === "completed" || status === "current" ? "bg-brand-teal" : "bg-slate-200"
                      }`}
                    />
                  )}
                  {/* Step circle */}
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                      status === "completed"
                        ? "bg-brand-teal text-white"
                        : status === "current"
                        ? "bg-brand-coral text-white ring-4 ring-brand-coral/20"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {status === "completed" ? "✓" : st.num}
                  </div>
                  <span
                    className={`text-[10px] font-bold mt-1.5 max-w-[70px] leading-tight ${
                      status === "current"
                        ? "text-brand-coral"
                        : status === "completed"
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------------- WORKFLOW STAGES ACTIONS ---------------- */}
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Action Stage Panel (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* STAGE 2: BUREAU PAYMENT CODE & SLIP */}
            {tx.status === "AWAITING_PAYMENT" && (
              <div className="bg-brand-teal-50 border border-brand-accent/25 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-brand-accent" />
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Étape 2: Paiement Sécurisé au Bureau Partenaire
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowSlipModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-brand-accent/30 text-brand-accent text-xs font-bold hover:bg-brand-teal-50 transition shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Imprimer Bordereau
                  </button>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  L'acheteur doit se présenter physiquement à l'un des bureaux partenaires Caba Pro en Algérie pour déposer le montant en espèces. Les fonds sont immédiatement placés sous séquestre bancaire.
                </p>

                <div className="bg-white rounded-2xl p-4 border border-brand-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Code de Dépôt Guichet</span>
                    <span className="font-mono text-2xl font-black text-brand-accent tracking-wider">{tx.paymentCode}</span>
                    <span className="text-xs text-slate-500 block mt-0.5">Bureau sélectionné: <strong>{tx.bureauName}</strong></span>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Montant Exact à Déposer</span>
                    <span className="text-xl font-black text-slate-900">{tx.priceBreakdown.totalDzd.toLocaleString()} DZD</span>
                    <span className="text-[11px] text-amber-600 font-bold block">Délai: Avant demain 18:00</span>
                  </div>
                </div>

                <div className="p-3 bg-white/70 rounded-xl border border-brand-accent/15 text-xs text-slate-600 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <strong>Adresse:</strong> {tx.bureauAddress} • <strong>Horaires:</strong> Samedi - Jeudi 08:30 - 18:00
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 6: ARRIVAL & MEETING COORDINATION (The requested focal point) */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-coral" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Coordination d'Arrivée & Remise en Main Propre
                  </h3>
                </div>

                {/* BRINGER CONFIRM ARRIVAL DIRECT BUTTON */}
                {tx.status !== "ARRIVED" && tx.status !== "MEETING_ARRANGED" && tx.status !== "DELIVERED" && tx.status !== "COMPLETED" && (
                  <button
                    onClick={handleConfirmArrivalDirectly}
                    className="px-3 py-1.5 rounded-xl bg-brand-coral hover:bg-brand-coral/90 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Plane className="h-3.5 w-3.5" />
                    <span>Voyageur: Confirmer Arrivée en Algérie</span>
                  </button>
                )}
              </div>

              {/* Status display */}
              <div className="mb-6 p-4 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">État du Voyageur</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {tx.travelDetails?.arrivedAt
                      ? `Arrivé à ${tx.travelDetails.arrivalCity || "Alger"} le ${new Date(tx.travelDetails.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : tx.status === "IN_TRANSIT"
                      ? "En vol / Transit vers l'Algérie"
                      : "En attente du départ"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Mode de Réception</span>
                  <span className="font-bold text-brand-accent text-sm capitalize">
                    {tx.reception.method === "bureau_pickup"
                      ? "Au Bureau Caba Pro (Sécurisé)"
                      : tx.reception.method === "public_meetup"
                      ? "Lieu Public"
                      : "À Domicile"}
                  </span>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Choisir le mode de réception convenu :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setSelectedMethod("bureau_pickup")}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedMethod === "bureau_pickup"
                        ? "border-brand-teal bg-brand-teal-50 text-brand-accent font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Building2 className="h-4 w-4 mb-1" />
                    <span className="text-xs block font-bold">Bureau Caba Pro</span>
                    <span className="text-[10px] font-normal text-slate-500">Recommandé & Neutre</span>
                  </button>

                  <button
                    onClick={() => setSelectedMethod("public_meetup")}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedMethod === "public_meetup"
                        ? "border-brand-teal bg-brand-teal-50 text-brand-accent font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Users className="h-4 w-4 mb-1" />
                    <span className="text-xs block font-bold">Lieu Public</span>
                    <span className="text-[10px] font-normal text-slate-500">Aéroport, Café, Centre</span>
                  </button>

                  <button
                    onClick={() => setSelectedMethod("door_delivery")}
                    className={`p-3 rounded-2xl border text-left transition ${
                      selectedMethod === "door_delivery"
                        ? "border-brand-teal bg-brand-teal-50 text-brand-accent font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <Package className="h-4 w-4 mb-1" />
                    <span className="text-xs block font-bold">Livraison Porte</span>
                    <span className="text-[10px] font-normal text-slate-500">Si convenue</span>
                  </button>
                </div>
              </div>

              {/* Point and Time scheduling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Point de Rendez-vous</label>
                  <input
                    type="text"
                    value={meetPoint}
                    onChange={(e) => setMeetPoint(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-brand-accent outline-none"
                    placeholder="Ex: Guichet Caba Pro Didouche Mourad"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date & Heure</label>
                  <input
                    type="text"
                    value={meetTime}
                    onChange={(e) => setMeetTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-brand-accent outline-none"
                    placeholder="Ex: Demain à 14:30"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdateMeeting}
                className="w-full mb-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Confirmer l'Horaire et le Lieu de Rencontre
              </button>

              {/* Quick Status Buttons ("Where are you?") */}
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold text-slate-600 mb-2">
                  Boutons de Statut Rapide en Direct (Live Ping) :
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickStatus("on_my_way")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    🏃 Je suis en route
                  </button>
                  <button
                    onClick={() => handleQuickStatus("arrived")}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold"
                  >
                    📍 Je suis sur place (Partager position)
                  </button>
                  <button
                    onClick={() => handleQuickStatus("running_late")}
                    className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold"
                  >
                    ⏱ 15 min de retard
                  </button>
                  <button
                    onClick={() => handleQuickStatus("reschedule")}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                  >
                    🔄 Reporter
                  </button>
                </div>

                {tx.reception.locationPing?.enabled && (
                  <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600 animate-bounce" />
                      <span>{tx.reception.locationPing.label} (Éphémère & effacé après remise)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* STAGE 6 & 7: 6-DIGIT CODE HANDSHAKE & ESCROW RELEASE */}
            <div className="bg-brand-bg rounded-3xl p-6 border border-brand-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-brand-accent" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Protocole de Remise & Validation par Code Secret
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  Tentatives: {tx.deliveryCode.attempts}/{tx.deliveryCode.maxAttempts}
                </span>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs text-amber-900 mb-5 leading-relaxed">
                <strong>Règle d'or de sécurité:</strong> L'acheteur inspecte d'abord le produit (emballage, numéro de série). Ce n'est qu'une fois 100% satisfait qu'il communique son code secret 6 chiffres au voyageur.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Buyer side: Code reveal */}
                <div className="bg-white p-5 rounded-2xl border border-brand-border text-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Côté Acheteur ({tx.buyerName})
                  </span>
                  <p className="text-xs text-slate-500 mb-3">Votre code de livraison confidentiel :</p>
                  <div className="font-mono text-3xl font-black text-brand-accent tracking-widest bg-brand-teal-50 py-3 px-4 rounded-xl border border-brand-accent/20 inline-block shadow-inner">
                    {tx.deliveryCode.plaintextForDemo || "457 991"}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    À dicter au voyageur au moment de la remise en main propre.
                  </p>
                </div>

                {/* Bringer side: Code verification input */}
                <div className="bg-white p-5 rounded-2xl border border-brand-border">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                    Côté Voyageur ({tx.bringerName})
                  </span>
                  <p className="text-xs text-slate-500 mb-2">Entrez le code 6 chiffres dicté par l'acheteur :</p>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={codeInputValue}
                      onChange={(e) => setCodeInputValue(e.target.value.replace(/\D/g, ""))}
                      placeholder="Ex: 457991"
                      className="w-full text-center font-mono text-2xl font-black tracking-widest py-2 rounded-xl border border-slate-200 focus:border-brand-accent outline-none"
                    />

                    <button
                      onClick={handleVerifyCode}
                      disabled={isVerifyingCode || tx.status === "DELIVERED" || tx.status === "COMPLETED"}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        tx.status === "DELIVERED" || tx.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 cursor-default"
                          : "bg-brand-teal hover:bg-brand-teal-800 text-white shadow-sm"
                      }`}
                    >
                      {tx.status === "DELIVERED" || tx.status === "COMPLETED" ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Code Validé Cryptographiquement</span>
                        </>
                      ) : (
                        <span>Valider la Remise (Vérifier Hash)</span>
                      )}
                    </button>
                  </div>

                  {codeVerificationResult && (
                    <div
                      className={`mt-3 p-2.5 rounded-xl text-xs font-semibold ${
                        codeVerificationResult.success
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {codeVerificationResult.message}
                    </div>
                  )}
                </div>
              </div>

              {/* Final buyer confirmation & Escrow release */}
              {tx.status === "DELIVERED" && (
                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                  <h4 className="font-extrabold text-sm text-emerald-900 mb-1">
                    🎉 Remise effectuée avec succès !
                  </h4>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto mb-3">
                    L'acheteur dispose de 24h pour confirmer ou signaler tout défaut avant le déblocage automatique des fonds.
                  </p>
                  <button
                    onClick={handleBuyerConfirmDelivery}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    Acheteur: Confirmer la Réception Conforme & Libérer le Paiement
                  </button>
                </div>
              )}

              {tx.status === "COMPLETED" && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-2xl text-center">
                  <h4 className="font-extrabold text-sm text-purple-900 mb-1">
                    🏆 Transaction Clôturée avec Succès !
                  </h4>
                  <p className="text-xs text-purple-700">
                    Les fonds ont été versés dans le portefeuille du voyageur (€{tx.priceBreakdown.bringerFee}). Merci d'utiliser Caba Pro !
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Right col) */}
          <div className="space-y-6">
            {/* Financial Breakdown card */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-brand-accent" />
                Détail Financier Verrouillé
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Prix Produit (Étranger)</span>
                  <span className="font-bold text-slate-800">€{tx.priceBreakdown.productPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Récompense Voyageur</span>
                  <span className="font-bold text-brand-accent">€{tx.priceBreakdown.bringerFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Frais de Plateforme (7%)</span>
                  <span className="font-semibold text-slate-700">€{tx.priceBreakdown.platformFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Garantie & Protection (2.5%)</span>
                  <span className="font-semibold text-slate-700">€{tx.priceBreakdown.guaranteeFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Frais Bureau Partenaire</span>
                  <span className="font-semibold text-slate-700">500 DZD</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between font-extrabold text-slate-900 text-sm">
                  <span>Total Garanti (DZD)</span>
                  <span className="text-brand-accent">{tx.priceBreakdown.totalDzd.toLocaleString()} DZD</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                Taux de change fixé: 1 EUR = {tx.priceBreakdown.fxRate} DZD
              </div>
            </div>

            {/* Safe Handover origin check */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Contrôle Safe Handover
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700">Conformité de l'article</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700">Emballage inspecté</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700">Aucun produit prohibé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700">Reçu d'achat Fnac vérifié</span>
                </div>
              </div>
            </div>

            {/* Dispute trigger button */}
            <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs text-center">
              <p className="text-xs text-slate-500 mb-3">Un problème ou une non-conformité ?</p>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="w-full py-2.5 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Signaler un Problème / Ouvrir un Litige</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- PRINTABLE SLIP MODAL (TRILINGUAL EN / FR / AR) ---------------- */}
      {showSlipModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            {/* Modal Header & Language Selector */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-brand-teal text-white flex items-center justify-center font-bold">C</div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {slipLocale === "ar"
                    ? "وصل إيداع مكتب كابا برو"
                    : slipLocale === "en"
                    ? "Caba Pro Bureau Deposit Slip"
                    : "Bordereau de Dépôt Bureau Caba Pro"}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Language pills */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setSlipLocale("en")}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      slipLocale === "en" ? "bg-brand-teal text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setSlipLocale("fr")}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      slipLocale === "fr" ? "bg-brand-teal text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    FR
                  </button>
                  <button
                    onClick={() => setSlipLocale("ar")}
                    className={`px-2 py-0.5 rounded-lg transition ${
                      slipLocale === "ar" ? "bg-brand-teal text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    العربية
                  </button>
                </div>
                <button onClick={() => setShowSlipModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="py-4 space-y-4 text-xs" dir={slipLocale === "ar" ? "rtl" : "ltr"}>
              <div className="text-center py-3 bg-brand-bg rounded-2xl border border-brand-border">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  {slipLocale === "ar"
                    ? "رمز الحجز والدفع"
                    : slipLocale === "en"
                    ? "Payment / Reservation Code"
                    : "Code Réservation / Paiement"}
                </span>
                <span className="font-mono text-3xl font-black text-brand-accent tracking-widest">{tx.paymentCode}</span>
              </div>

              <div className="space-y-2 border-y border-slate-100 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {slipLocale === "ar" ? "المكتب المختار:" : slipLocale === "en" ? "Selected Bureau:" : "Bureau Désigné:"}
                  </span>
                  <span className="font-bold text-slate-800">{tx.bureauName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {slipLocale === "ar" ? "العنوان:" : slipLocale === "en" ? "Address:" : "Adresse:"}
                  </span>
                  <span className="font-semibold text-slate-700">{tx.bureauAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {slipLocale === "ar" ? "اسم المشتري:" : slipLocale === "en" ? "Buyer Name:" : "Nom de l'Acheteur:"}
                  </span>
                  <span className="font-bold text-slate-800">{tx.buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {slipLocale === "ar" ? "المبلغ المطلوب نقداً:" : slipLocale === "en" ? "Required Cash Deposit:" : "Montant Requis en Espèces:"}
                  </span>
                  <span className="font-black text-brand-accent text-sm">{tx.priceBreakdown.totalDzd.toLocaleString()} DZD</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                {slipLocale === "ar"
                  ? "يرجى تقديم هذا الوصل أو الرمز مع بطاقة الهوية الوطنية لدى أي مكتب شريك لكابا برو. سيتم تسليمك وصلاً معتمداً ورمز التسليم المكون من 6 أرقام فور تأكيد الدفع."
                  : slipLocale === "en"
                  ? "Present this slip or code along with your national ID at the designated Caba Pro partner bureau. A certified receipt and your 6-digit delivery code will be issued immediately upon payment."
                  : "Présentez ce bordereau ou ce code avec votre pièce d'identité dans n'importe quel bureau partenaire Caba Pro. Un reçu tamponné et votre code de livraison vous seront remis dès validation."}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-brand-teal hover:bg-brand-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Printer className="h-4 w-4" />
                {slipLocale === "ar" ? "طباعة الوثيقة" : slipLocale === "en" ? "Print Document" : "Imprimer le Document"}
              </button>
              <button
                onClick={() => setShowSlipModal(false)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                {slipLocale === "ar" ? "إغلاق" : slipLocale === "en" ? "Close" : "Fermer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- DISPUTE MODAL ---------------- */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-extrabold text-base text-slate-900">Signaler un Litige</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              L'ouverture d'un litige gèle immédiatement tout déblocage d'argent jusqu'à décision d'un modérateur.
            </p>

            <div className="space-y-3 mb-4">
              <label className="block text-xs font-bold text-slate-700">Motif précis du litige :</label>
              <textarea
                rows={4}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Ex: Le produit présente un défaut, la boîte est ouverte sans accord, ou le voyageur ne s'est pas présenté..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-red-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleOpenDispute}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
              >
                Confirmer l'Ouverture du Dossier
              </button>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
