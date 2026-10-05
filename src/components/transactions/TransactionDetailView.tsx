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
  Upload,
  Eye,
  Copy,
  ExternalLink,
  Shield,
  ShoppingBag,
} from "lucide-react";
import { Transaction, ReceptionMethod, MeetingStatus, TransactionStatus } from "@/lib/transactions/types";
import { TransactionService } from "@/lib/transactions/transactionService";
import { DemoSimulator, DEMO_TRANSACTION_ID } from "@/lib/transactions/demoSimulator";
import { PARTNER_BUREAUS } from "@/lib/transactions/constants";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  transactionId?: string;
}

export default function TransactionDetailView({ transactionId = DEMO_TRANSACTION_ID }: Props) {
  const { user } = useAuth();
  const [tx, setTx] = useState<Transaction | null>(null);

  // Active view perspective (defaults to authenticated role, or buyer)
  const [activeRole, setActiveRole] = useState<"buyer" | "bringer">("buyer");

  // UI state
  const [codeInputValue, setCodeInputValue] = useState("");
  const [codeVerificationResult, setCodeVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [slipLocale, setSlipLocale] = useState<"fr" | "en" | "ar">("fr");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [payoutRequested, setPayoutRequested] = useState(false);

  // Meeting coordination form
  const [selectedMethod, setSelectedMethod] = useState<ReceptionMethod>("bureau_pickup");
  const [meetPoint, setMeetPoint] = useState("");
  const [meetTime, setMeetTime] = useState("");

  // Purchase proof form
  const [purchaseReceiptUrl, setPurchaseReceiptUrl] = useState("https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600");
  const [purchaseProductUrl, setPurchaseProductUrl] = useState("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600");
  const [purchasePackagingUrl, setPurchasePackagingUrl] = useState("https://images.unsplash.com/photo-1589363460779-cd717d7e8fa5?w=600");

  // Safe Handover checklist state
  const [checklist, setChecklist] = useState({
    itemMatchesListing: true,
    modelQuantityVerified: true,
    packagingInspected: true,
    noProhibitedItems: true,
    receiptAttached: true,
  });

  // Review state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Load transaction & subscribe
  useEffect(() => {
    DemoSimulator.getOrCreateDemoTransaction().then((loaded) => {
      setTx(loaded);
      setSelectedMethod(loaded.reception?.method || "bureau_pickup");
      setMeetPoint(loaded.reception?.meetingPoint || loaded.bureauAddress);
      setMeetTime(loaded.reception?.meetingTime || "Demain à 14:00");
    });

    const unsub = TransactionService.subscribeToTransaction(transactionId, (updated) => {
      if (updated) {
        setTx(updated);
        setSelectedMethod(updated.reception?.method || "bureau_pickup");
        setMeetPoint(updated.reception?.meetingPoint || updated.bureauAddress);
        setMeetTime(updated.reception?.meetingTime || "Demain à 14:00");
      }
    });

    return () => unsub();
  }, [transactionId]);

  // Sync role perspective with logged-in user
  useEffect(() => {
    if (user && tx) {
      if (user.uid === tx.bringerId) setActiveRole("bringer");
      else if (user.uid === tx.buyerId) setActiveRole("buyer");
    }
  }, [user, tx]);

  if (!tx) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-accent" />
          <p className="text-xs text-slate-500 font-semibold">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  const isUserBuyer = Boolean(user && user.uid === tx.buyerId);
  const isUserBringer = Boolean(user && user.uid === tx.bringerId);

  // ---------------- HANDLERS ----------------
  const handleCopyPaymentCode = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(tx.paymentCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Bringer confirms receipt of advance funds from bureau
  const handleConfirmBringerFunds = async () => {
    try {
      const updated = await TransactionService.confirmBringerFunds({
        transactionId: tx.id,
        bringerId: tx.bringerId,
      });
      setTx(updated);
      setActionNotice("💶 Avance confirmée reçue ! Vous pouvez maintenant acheter le produit en magasin.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Bringer submits purchase proof photos
  const handleSubmitPurchaseProof = async () => {
    try {
      const updated = await TransactionService.submitPurchaseProof({
        transactionId: tx.id,
        bringerId: tx.bringerId,
        receiptUrl: purchaseReceiptUrl,
        productPhotoUrl: purchaseProductUrl,
        packagingPhotoUrl: purchasePackagingUrl,
      });
      setTx(updated);
      setActionNotice("📸 Preuves d'achat transmises à l'acheteur avec succès !");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Buyer approves purchase proof photos
  const handleApprovePurchaseProof = async () => {
    try {
      const updated = await TransactionService.approvePurchaseProof({
        transactionId: tx.id,
        buyerId: tx.buyerId,
      });
      setTx(updated);
      setActionNotice("✅ Preuves d'achat approuvées ! Le voyageur va finaliser son contrôle avant départ.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Bringer validates Safe Handover checklist
  const handleSubmitSafeHandover = async () => {
    try {
      const updated = await TransactionService.submitSafeHandoverChecklist({
        transactionId: tx.id,
        bringerId: tx.bringerId,
        checklist: {
          ...checklist,
          bringerConfirmed: true,
          buyerConfirmedProof: true,
        },
      });
      setTx(updated);
      setActionNotice("🛡️ Contrôle Safe Handover validé ! Votre statut passe à HANDED_OVER.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Bringer starts transit
  const handleStartTransit = async () => {
    try {
      const updated = await TransactionService.startTransit({
        transactionId: tx.id,
        bringerId: tx.bringerId,
        flightNumber: "AH-1005",
      });
      setTx(updated);
      setActionNotice("✈️ Bon vol ! Statut mis à jour : En Transit.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Bringer confirms arrival in Algeria
  const handleConfirmArrival = async () => {
    try {
      const updated = await TransactionService.confirmArrival({
        transactionId: tx.id,
        bringerId: tx.bringerId,
        arrivalCity: tx.travelDetails?.arrivalCity || "Alger",
      });
      setTx(updated);
      setActionNotice("📍 Arrivée confirmée en Algérie ! L'acheteur a été notifié pour le rendez-vous.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Schedule meeting
  const handleUpdateMeeting = async () => {
    try {
      const updated = await TransactionService.arrangeMeeting({
        transactionId: tx.id,
        actorId: activeRole === "buyer" ? tx.buyerId : tx.bringerId,
        method: selectedMethod,
        meetingPoint: meetPoint,
        meetingTime: meetTime,
      });
      setTx(updated);
      setActionNotice("🤝 Modalités de rendez-vous enregistrées avec succès !");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Quick live status ping
  const handleQuickStatus = async (status: MeetingStatus) => {
    try {
      const updated = await TransactionService.updateMeetingStatus({
        transactionId: tx.id,
        actorId: activeRole === "buyer" ? tx.buyerId : tx.bringerId,
        status,
        locationPing:
          status === "arrived"
            ? { lat: 36.7538, lng: 3.0588, label: "Position partagée (Alger Centre)" }
            : null,
      });
      setTx(updated);
      setActionNotice(`Statut mis à jour : ${status.replace("_", " ")}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Bringer verifies buyer's 6-digit code
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
        setActionNotice("🎉 Code vérifié avec succès ! Remise physique validée.");
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

  // Buyer confirms final delivery
  const handleBuyerConfirmDelivery = async () => {
    try {
      const updated = await TransactionService.confirmDelivery({
        transactionId: tx.id,
        buyerId: tx.buyerId,
        buyerReview: {
          rating: reviewRating,
          comment: reviewComment || "Produit neuf impeccable et conforme. Recommandé !",
        },
      });
      setTx(updated);
      setReviewSubmitted(true);
      setActionNotice("🏆 Transaction clôturée ! Les fonds ont été transférés sur le compte du voyageur.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Open dispute
  const handleOpenDispute = async () => {
    if (!disputeReason) return;
    try {
      const updated = await TransactionService.openDispute({
        transactionId: tx.id,
        openedBy: activeRole === "buyer" ? tx.buyerId : tx.bringerId,
        openedByName: activeRole === "buyer" ? tx.buyerName : tx.bringerName,
        reason: disputeReason,
      });
      setTx(updated);
      setShowDisputeModal(false);
      setActionNotice("⚠️ Litige ouvert. Le déblocage des fonds est gelé et transmis à la modération.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Payout request
  const handleRequestPayout = () => {
    setPayoutRequested(true);
    setActionNotice("💸 Demande de virement envoyée à l'équipe Finance Caba Pro. Exécution sous 24-48h.");
  };

  // Step indicator stages
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
      {/* ---------------- PERSPECTIVE SELECTOR (CLEAN & MINIMAL) ---------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-brand-border shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Mode d&apos;affichage :</span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveRole("buyer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeRole === "buyer"
                  ? "bg-brand-teal text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Vue Acheteur</span>
              {isUserBuyer && (
                <span className="text-[10px] bg-white/25 text-white px-1.5 py-0.2 rounded-full font-bold">
                  Vous
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveRole("bringer")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeRole === "bringer"
                  ? "bg-brand-teal text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Plane className="h-3.5 w-3.5" />
              <span>Vue Voyageur</span>
              {isUserBringer && (
                <span className="text-[10px] bg-white/25 text-white px-1.5 py-0.2 rounded-full font-bold">
                  Vous
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/messages${tx.conversationId ? `?id=${tx.conversationId}` : ""}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-teal text-slate-700 text-xs font-bold transition hover:bg-slate-50"
          >
            <MessageSquare className="h-3.5 w-3.5 text-brand-accent" />
            <span>Ouvrir la Discussion</span>
          </Link>
        </div>
      </div>

      {/* Action feedback notice */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs">
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
                <span>
                  Acheteur: <strong>{tx.buyerName}</strong>
                </span>
                <span>•</span>
                <span>
                  Voyageur: <strong className="text-brand-accent">{tx.bringerName}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Locked Price badge */}
          <div className="sm:text-right bg-brand-bg px-4 py-3 rounded-2xl border border-brand-border">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Garanti Caba Pro</span>
            <span className="text-xl font-black text-brand-accent">
              {tx.priceBreakdown.totalDzd.toLocaleString()} DZD
            </span>
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
                  {idx > 0 && (
                    <div
                      className={`absolute top-3.5 -left-1/2 w-full h-0.5 -z-0 ${
                        status === "completed" || status === "current" ? "bg-brand-teal" : "bg-slate-200"
                      }`}
                    />
                  )}
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

        {/* ---------------- WORKFLOW STAGE PANELS ---------------- */}
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Action Panel (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* STAGE 1: AWAITING PAYMENT */}
            {tx.status === "AWAITING_PAYMENT" && (
              <div className="bg-brand-teal-50 border border-brand-accent/25 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-brand-accent" />
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Étape 1 : Dépôt & Sécurisation des Fonds
                    </h3>
                  </div>
                  {activeRole === "buyer" && (
                    <button
                      onClick={() => setShowSlipModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-brand-accent/30 text-brand-accent text-xs font-bold hover:bg-brand-teal-50 transition shadow-xs"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Imprimer Bordereau
                    </button>
                  )}
                </div>

                {activeRole === "buyer" ? (
                  <>
                    <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                      Présentez-vous au bureau partenaire Caba Pro avec votre pièce d&apos;identité et ce code pour déposer le montant. Vos fonds seront placés sous séquestre bancaire garanti jusqu&apos;à confirmation de la livraison.
                    </p>

                    <div className="bg-white rounded-2xl p-4 border border-brand-accent/20 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Code de Dépôt Guichet</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-2xl font-black text-brand-accent tracking-wider">
                            {tx.paymentCode}
                          </span>
                          <button
                            onClick={handleCopyPaymentCode}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition"
                            title="Copier le code"
                          >
                            {copiedCode ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Bureau : <strong>{tx.bureauName}</strong>
                        </span>
                      </div>

                      <div className="text-center sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Montant Requis en Espèces</span>
                        <span className="text-xl font-black text-slate-900">
                          {tx.priceBreakdown.totalDzd.toLocaleString()} DZD
                        </span>
                        <span className="text-[11px] text-amber-600 font-bold block">
                          Délai : Avant demain 18:00
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white/70 rounded-xl border border-brand-accent/15 text-xs text-slate-600 flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-brand-accent shrink-0 mt-0.5" />
                      <div>
                        <strong>Adresse :</strong> {tx.bureauAddress} • <strong>Horaires :</strong> Samedi - Jeudi 08:30 - 18:00
                      </div>
                    </div>

                    {/* BaridiMob / CCP fallback info */}
                    <div className="mt-4 pt-3 border-t border-brand-accent/20 text-xs text-slate-600">
                      <p className="font-bold text-slate-800 mb-1">Option BaridiMob / Virement CCP :</p>
                      <p className="text-[11px] text-slate-500">
                        RIP : <span className="font-mono font-bold text-slate-700">007 99999 0023456789 42</span> • Intitulé : <em>Caba Pro Sarl</em>. Envoyez la capture du reçu avec la référence <strong>{tx.paymentCode}</strong> dans le chat.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl p-5 border border-brand-accent/20 text-center">
                    <Clock className="h-8 w-8 text-brand-accent mx-auto mb-2 animate-pulse" />
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                      En attente du dépôt de l&apos;acheteur
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      L&apos;acheteur ({tx.buyerName}) doit déposer les {tx.priceBreakdown.totalDzd.toLocaleString()} DZD au bureau partenaire ({tx.bureauName}). Dès confirmation par le guichet, vous recevrez l&apos;avance pour effectuer l&apos;achat.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 2 & 3: PAID & ADVANCE FUNDS TO BRINGER */}
            {(tx.status === "PAID" || tx.status === "FUNDS_TRANSFER_PENDING" || tx.status === "FUNDS_SENT_TO_BRINGER") && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Fonds Consignés sous Séquestre • Avance Voyageur
                  </h3>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Le paiement de {tx.priceBreakdown.totalDzd.toLocaleString()} DZD a été consigné par le bureau partenaire Caba Pro.
                  {tx.status === "FUNDS_SENT_TO_BRINGER"
                    ? ` Le bureau a émis le virement international de l'avance (€${tx.priceBreakdown.productPrice}) vers le voyageur.`
                    : ` Le bureau prépare le virement de l'avance d'achat (€${tx.priceBreakdown.productPrice}) vers le voyageur.`}
                </p>

                {activeRole === "bringer" ? (
                  tx.status === "FUNDS_SENT_TO_BRINGER" ? (
                    <div className="bg-white rounded-2xl p-5 border border-emerald-200 text-center space-y-3">
                      <p className="text-xs font-bold text-slate-800">
                        Avez-vous bien reçu le virement de l&apos;avance d&apos;achat sur votre compte ?
                      </p>
                      <span className="font-mono text-xl font-black text-brand-teal block">
                        €{tx.priceBreakdown.productPrice}
                      </span>
                      <button
                        onClick={handleConfirmBringerFunds}
                        className="px-6 py-2.5 bg-brand-teal hover:bg-brand-teal-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                      >
                        ✓ Je confirme avoir reçu les fonds (€{tx.priceBreakdown.productPrice})
                      </button>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-4 border border-emerald-200 text-xs text-slate-600 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-emerald-600 shrink-0" />
                      <span>Le virement bancaire de votre avance d&apos;achat (€{tx.priceBreakdown.productPrice}) est en cours d&apos;émission par le bureau Caba Pro.</span>
                    </div>
                  )
                ) : (
                  <div className="bg-white rounded-2xl p-4 border border-emerald-200 text-xs text-slate-600 flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Vos fonds sont protégés sous séquestre. Le voyageur procèdera à l&apos;achat dès réception de son avance.</span>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 4: PURCHASING & PROOF UPLOAD */}
            {tx.status === "PURCHASING" && (
              <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <ShoppingBag className="h-5 w-5 text-brand-accent" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Achat du Produit & Dépôt des Preuves
                  </h3>
                </div>

                {activeRole === "bringer" ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Achetez l&apos;article en magasin ou sur le site marchand et téléversez les 3 preuves requises pour rassurer l&apos;acheteur.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">1. Ticket / Facture</label>
                        <input
                          type="text"
                          value={purchaseReceiptUrl}
                          onChange={(e) => setPurchaseReceiptUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-brand-accent"
                          placeholder="URL photo ticket..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">2. Photo du Produit</label>
                        <input
                          type="text"
                          value={purchaseProductUrl}
                          onChange={(e) => setPurchaseProductUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-brand-accent"
                          placeholder="URL photo produit..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">3. Photo Emballage</label>
                        <input
                          type="text"
                          value={purchasePackagingUrl}
                          onChange={(e) => setPurchasePackagingUrl(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-brand-accent"
                          placeholder="URL photo boîte..."
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitPurchaseProof}
                      className="w-full py-2.5 bg-brand-teal hover:bg-brand-teal-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Confirmer l&apos;Achat & Soumettre les Preuves</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-brand-bg rounded-2xl p-5 border border-brand-border text-center">
                    <ShoppingBag className="h-8 w-8 text-brand-accent mx-auto mb-2 animate-bounce" />
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                      Achat en cours par le voyageur
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Le voyageur ({tx.bringerName}) procède à l&apos;achat de votre produit à l&apos;étranger. Vous recevrez une notification avec les photos de preuve dès qu&apos;il aura validé.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 5: PURCHASED & SAFE HANDOVER CHECKLIST */}
            {tx.status === "PURCHASED" && (
              <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs space-y-6">
                {/* Proof Gallery */}
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-brand-accent" />
                      <h3 className="font-extrabold text-sm text-slate-900">Preuves d&apos;Achat Validées</h3>
                    </div>
                    {activeRole === "buyer" && (
                      <button
                        onClick={handleApprovePurchaseProof}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                      >
                        ✓ Approuver les Preuves
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video relative group">
                      <img
                        src={tx.purchaseProof?.receiptUrl || purchaseReceiptUrl}
                        alt="Reçu"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        Ticket Caissier
                      </span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video relative group">
                      <img
                        src={tx.purchaseProof?.productPhotoUrl || purchaseProductUrl}
                        alt="Article"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        Produit
                      </span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video relative group">
                      <img
                        src={tx.purchaseProof?.packagingPhotoUrl || purchasePackagingUrl}
                        alt="Boîte"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                        Emballage
                      </span>
                    </div>
                  </div>
                </div>

                {/* Safe Handover checklist (Origin inspection before departure) */}
                <div className="bg-brand-bg rounded-2xl p-5 border border-brand-border">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-5 w-5 text-brand-accent" />
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Contrôle Obligatoire Safe Handover (Avant Départ)
                    </h4>
                  </div>

                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    <strong>Règle de sécurité Caba Pro :</strong> Ne transportez jamais un paquet scellé inconnu. Le voyageur inspecte personnellement les objets avant de valider.
                  </p>

                  <div className="space-y-2 mb-4">
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={checklist.itemMatchesListing}
                        onChange={(e) => setChecklist({ ...checklist, itemMatchesListing: e.target.checked })}
                        disabled={activeRole !== "bringer"}
                        className="h-4 w-4 rounded text-brand-teal focus:ring-brand-teal"
                      />
                      <span>L&apos;article correspond exactement au produit demandé</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={checklist.modelQuantityVerified}
                        onChange={(e) => setChecklist({ ...checklist, modelQuantityVerified: e.target.checked })}
                        disabled={activeRole !== "bringer"}
                        className="h-4 w-4 rounded text-brand-teal focus:ring-brand-teal"
                      />
                      <span>Modèle, couleur et quantité vérifiés</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={checklist.packagingInspected}
                        onChange={(e) => setChecklist({ ...checklist, packagingInspected: e.target.checked })}
                        disabled={activeRole !== "bringer"}
                        className="h-4 w-4 rounded text-brand-teal focus:ring-brand-teal"
                      />
                      <span>Emballage ouvert et contenu inspecté</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={checklist.noProhibitedItems}
                        onChange={(e) => setChecklist({ ...checklist, noProhibitedItems: e.target.checked })}
                        disabled={activeRole !== "bringer"}
                        className="h-4 w-4 rounded text-brand-teal focus:ring-brand-teal"
                      />
                      <span>Aucun produit prohibé, dangereux ou réglementé</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={checklist.receiptAttached}
                        onChange={(e) => setChecklist({ ...checklist, receiptAttached: e.target.checked })}
                        disabled={activeRole !== "bringer"}
                        className="h-4 w-4 rounded text-brand-teal focus:ring-brand-teal"
                      />
                      <span>Facture ou ticket d&apos;achat d&apos;origine conservé</span>
                    </label>
                  </div>

                  {activeRole === "bringer" ? (
                    <button
                      onClick={handleSubmitSafeHandover}
                      className="w-full py-2.5 bg-brand-teal hover:bg-brand-teal-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      Valider le Contrôle Safe Handover
                    </button>
                  ) : (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-500 text-center font-medium">
                      En attente de validation du contrôle de sécurité par le voyageur.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 6: HANDED_OVER & START TRANSIT */}
            {tx.status === "HANDED_OVER" && (
              <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs text-center space-y-4">
                <ShieldCheck className="h-10 w-10 text-emerald-600 mx-auto" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Contrôle Safe Handover Validé !
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  L&apos;article est certifié conforme et prêt pour le voyage vers l&apos;Algérie ({tx.tripRoute}).
                </p>

                {activeRole === "bringer" ? (
                  <button
                    onClick={handleStartTransit}
                    className="px-6 py-2.5 bg-brand-teal hover:bg-brand-teal-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 mx-auto"
                  >
                    <Plane className="h-4 w-4" />
                    <span>Départ : Je commence mon voyage vers l&apos;Algérie</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-500 font-medium">
                    Le voyageur est prêt pour le départ de son vol/trajet.
                  </div>
                )}
              </div>
            )}

            {/* STAGE 7: IN_TRANSIT */}
            {tx.status === "IN_TRANSIT" && (
              <div className="bg-brand-bg rounded-3xl p-6 border border-brand-border shadow-xs space-y-4 text-center">
                <Plane className="h-10 w-10 text-brand-coral mx-auto animate-pulse" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Voyage en cours vers l&apos;Algérie
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Trajet : <strong>{tx.tripRoute}</strong>. L&apos;acheteur sera notifié dès que le voyageur aura atterri.
                </p>

                {activeRole === "bringer" ? (
                  <button
                    onClick={handleConfirmArrival}
                    className="px-6 py-2.5 bg-brand-coral hover:bg-brand-coral/90 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 mx-auto"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>📍 Je suis bien arrivé en Algérie (Alger)</span>
                  </button>
                ) : (
                  <div className="text-xs text-brand-coral font-bold bg-brand-coral/10 py-2 px-4 rounded-xl max-w-sm mx-auto">
                    Le voyageur est en transit. Vous recevrez une alerte dès son arrivée pour convenir du rendez-vous.
                  </div>
                )}
              </div>
            )}

            {/* STAGE 8: ARRIVED / MEETING COORDINATION */}
            {(tx.status === "ARRIVED" || tx.status === "MEETING_ARRANGED") && (
              <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-brand-coral" />
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Arrivée en Algérie & Coordination du Rendez-vous
                    </h3>
                  </div>
                </div>

                {/* Status banner */}
                <div className="mb-6 p-4 rounded-2xl bg-brand-bg border border-brand-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">État du Voyageur</span>
                    <span className="font-bold text-slate-800 text-sm">
                      Arrivé à {tx.travelDetails?.arrivalCity || "Alger"}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Mode Convenu</span>
                    <span className="font-bold text-brand-accent text-sm capitalize">
                      {tx.reception?.method === "bureau_pickup"
                        ? "Au Bureau Caba Pro (Sécurisé)"
                        : tx.reception?.method === "public_meetup"
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
                      placeholder="Ex: Aujourd'hui à 15:30"
                    />
                  </div>
                </div>

                <button
                  onClick={handleUpdateMeeting}
                  className="w-full mb-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Confirmer l&apos;Horaire et le Lieu de Rencontre
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

                  {tx.reception?.locationPing?.enabled && (
                    <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-600 animate-bounce" />
                        <span>{tx.reception.locationPing.label} (Éphémère & effacé après remise)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 9: 6-DIGIT CODE HANDSHAKE */}
            {(tx.status === "ARRIVED" || tx.status === "MEETING_ARRANGED" || tx.status === "DELIVERED" || tx.status === "COMPLETED") && (
              <div className="bg-brand-bg rounded-3xl p-6 border border-brand-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand-accent" />
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Protocole de Remise & Validation par Code Secret
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Tentatives : {tx.deliveryCode.attempts}/{tx.deliveryCode.maxAttempts}
                  </span>
                </div>

                {/* Instructions */}
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs text-amber-900 mb-5 leading-relaxed">
                  <strong>Règle d&apos;or de sécurité :</strong> L&apos;acheteur inspecte d&apos;abord le produit (emballage, numéro de série). Ce n&apos;est qu&apos;une fois 100% satisfait qu&apos;il communique son code secret 6 chiffres au voyageur.
                </div>

                {/* Role-tailored Card */}
                {activeRole === "buyer" ? (
                  <div className="bg-white p-6 rounded-2xl border border-brand-border text-center space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Code Secret de Livraison (Réservé à l&apos;Acheteur)
                    </span>
                    <p className="text-xs text-slate-600">
                      Dictez ce code au voyageur <strong>uniquement en main propre</strong> après avoir vérifié votre produit :
                    </p>
                    <div className="font-mono text-3xl font-black text-brand-accent tracking-widest bg-brand-teal-50 py-3.5 px-6 rounded-2xl border border-brand-accent/20 inline-block shadow-inner">
                      {tx.deliveryCode.plaintextForDemo || "457 991"}
                    </div>
                    <p className="text-[11px] text-amber-700 font-semibold max-w-sm mx-auto">
                      ⚠️ Ne partagez jamais ce code par message ou téléphone avant d&apos;avoir le produit entre les mains.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-brand-border space-y-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Validation de la Remise (Réservé au Voyageur)
                    </span>
                    <p className="text-xs text-slate-600">
                      Après avoir remis le produit à l&apos;acheteur et obtenu sa pleine satisfaction, demandez-lui son code secret à 6 chiffres et saisissez-le ici :
                    </p>

                    <div className="max-w-xs mx-auto space-y-3">
                      <input
                        type="text"
                        maxLength={6}
                        value={codeInputValue}
                        onChange={(e) => setCodeInputValue(e.target.value.replace(/\D/g, ""))}
                        placeholder="Ex: 457991"
                        className="w-full text-center font-mono text-2xl font-black tracking-widest py-2.5 rounded-xl border border-slate-200 focus:border-brand-accent outline-none"
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
                          <span>Valider la Remise (Vérifier Code)</span>
                        )}
                      </button>
                    </div>

                    {codeVerificationResult && (
                      <div
                        className={`p-3 rounded-xl text-xs font-semibold max-w-xs mx-auto text-center ${
                          codeVerificationResult.success
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        {codeVerificationResult.message}
                      </div>
                    )}
                  </div>
                )}

                {/* Final buyer confirmation & Escrow release */}
                {tx.status === "DELIVERED" && (
                  <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                    <h4 className="font-extrabold text-sm text-emerald-900 mb-1">
                      🎉 Remise physique confirmée par code !
                    </h4>
                    <p className="text-xs text-emerald-700 max-w-md mx-auto mb-3">
                      L&apos;acheteur confirme la conformité finale pour libérer la prime du voyageur.
                    </p>
                    {activeRole === "buyer" ? (
                      <button
                        onClick={handleBuyerConfirmDelivery}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        Acheteur : Confirmer la Réception & Libérer le Paiement
                      </button>
                    ) : (
                      <div className="text-xs text-emerald-800 font-semibold">
                        En attente de la confirmation finale par l&apos;acheteur (déblocage automatique garanti sous 24h).
                      </div>
                    )}
                  </div>
                )}

                {/* Completed banner & Payout */}
                {tx.status === "COMPLETED" && (
                  <div className="mt-6 p-5 bg-purple-50 border border-purple-200 rounded-2xl text-center space-y-3">
                    <h4 className="font-extrabold text-sm text-purple-900">
                      🏆 Transaction Clôturée avec Succès !
                    </h4>
                    <p className="text-xs text-purple-700 max-w-md mx-auto">
                      Les fonds (€{tx.priceBreakdown.bringerFee}) sont disponibles dans le portefeuille du voyageur.
                    </p>

                    {activeRole === "bringer" && (
                      <div className="pt-2">
                        {payoutRequested ? (
                          <div className="p-3 bg-white rounded-xl border border-purple-200 text-xs text-purple-800 font-bold inline-block">
                            ✓ Demande de virement enregistrée (€{tx.priceBreakdown.bringerFee})
                          </div>
                        ) : (
                          <button
                            onClick={handleRequestPayout}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                          >
                            Demander un Virement vers mon Compte (€{tx.priceBreakdown.bringerFee})
                          </button>
                        )}
                      </div>
                    )}

                    {/* Mutual review form */}
                    {!reviewSubmitted && (
                      <div className="mt-4 pt-4 border-t border-purple-200 max-w-md mx-auto text-left">
                        <label className="block text-xs font-bold text-purple-900 mb-2">
                          Laissez une évaluation (1 à 5 étoiles) :
                        </label>
                        <div className="flex gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className={`p-1 rounded-lg ${reviewRating >= star ? "text-amber-500" : "text-slate-300"}`}
                            >
                              <Star className="h-5 w-5 fill-current" />
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Commentaire sur la ponctualité, le soin apporté..."
                          className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs outline-none mb-2"
                        />
                        <button
                          onClick={() => {
                            setReviewSubmitted(true);
                            setActionNotice("⭐ Merci pour votre évaluation !");
                          }}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition"
                        >
                          Publier l&apos;Avis
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* STAGE 12: DISPUTED */}
            {tx.status === "DISPUTED" && (
              <div className="bg-red-50 border border-red-200 rounded-3xl p-6 space-y-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Dossier en Litige • Déblocage Gelé
                  </h3>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  Ce dossier fait l&apos;objet d&apos;une médiation ouverte par <strong>{tx.dispute?.openedByName}</strong> pour le motif : &laquo; {tx.dispute?.reason} &raquo;.
                </p>
                <p className="text-[11px] text-slate-600">
                  Le déblocage de l&apos;escrow est suspendu. Un modérateur Caba Pro étudie actuellement l&apos;historique des échanges, les photos de preuve et le rapport d&apos;inspection.
                </p>
              </div>
            )}
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
                Taux de change fixé : 1 EUR = {tx.priceBreakdown.fxRate} DZD
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
                  <span className="text-slate-700">Conformité de l&apos;article</span>
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
                  <span className="text-slate-700">Reçu d&apos;achat officiel vérifié</span>
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
                    {slipLocale === "ar" ? "المكتب المختار:" : slipLocale === "en" ? "Selected Bureau:" : "Bureau Désigné :"}
                  </span>
                  <span className="font-bold text-slate-800">{tx.bureauName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {slipLocale === "ar" ? "العنوان:" : slipLocale === "en" ? "Address:" : "Adresse :"}
                  </span>
                  <span className="font-semibold text-slate-700">{tx.bureauAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {slipLocale === "ar" ? "اسم المشتري:" : slipLocale === "en" ? "Buyer Name:" : "Nom de l'Acheteur :"}
                  </span>
                  <span className="font-bold text-slate-800">{tx.buyerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {slipLocale === "ar" ? "المبلغ المطلوب نقداً:" : slipLocale === "en" ? "Required Cash Deposit:" : "Montant Requis en Espèces :"}
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
              L&apos;ouverture d&apos;un litige gèle immédiatement tout déblocage d&apos;argent jusqu&apos;à décision d&apos;un modérateur Caba Pro.
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
                Confirmer l&apos;Ouverture du Dossier
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
