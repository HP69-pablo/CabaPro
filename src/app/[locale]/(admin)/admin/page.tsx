"use client";

import { useState } from "react";
import {
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Users,
} from "lucide-react";

export default function AdminPortalPage() {
  const [activeSection, setActiveSection] = useState<"finance" | "disputes" | "moderation">("finance");

  // Sample pending BaridiMob / CCP receipts for Finance verification
  const [pendingPayments, setPendingPayments] = useState([
    {
      id: "pay-bm-1",
      txRef: "CP-TX-2026-84920",
      buyer: "Amine Boumediene",
      provider: "BaridiMob",
      amountDzd: "78,624.00 DZD",
      transferReference: "RIP-00799999000123456789",
      senderName: "Amine Boumediene",
      receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop",
    },
    {
      id: "pay-ccp-2",
      txRef: "CP-TX-2026-77319",
      buyer: "Karim Z.",
      provider: "CCP Algeria",
      amountDzd: "24,000.00 DZD",
      transferReference: "CCP-99218204",
      senderName: "Karim Zitouni",
      receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop",
    },
  ]);

  const handleVerifyPayment = (paymentId: string) => {
    setPendingPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const handleRejectPayment = (paymentId: string) => {
    setPendingPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-amber-600" />
            Caba Pro Admin & Finance Portal
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Dedicated back-office for payment proof audits, dispute resolutions, and listing moderation.
          </p>
        </div>

        {/* Section Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSection("finance")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === "finance" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Finance & Payments
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("disputes")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === "disputes" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Disputes Room
          </button>
          <button
            type="button"
            onClick={() => setActiveSection("moderation")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSection === "moderation" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Moderation Queue
          </button>
        </div>
      </div>

      {/* Global Health Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Escrow Holding
          </span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">14,850.00 €</span>
          <span className="text-[11px] text-slate-400">Locked across 42 orders</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Platform Revenue
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">1,820.00 €</span>
          <span className="text-[11px] text-slate-400">Earned commission (5%)</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Guarantee Fund
          </span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">728.00 €</span>
          <span className="text-[11px] text-slate-400">Insurance & claims reserve</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Bureau Cash Position
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">444,500 DZD</span>
          <span className="text-[11px] text-slate-400">Algiers Centre Register #01</span>
        </div>
      </div>

      {/* Section 1: Finance Review Queue */}
      {activeSection === "finance" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Payment Proof Review Queue (BaridiMob & CCP)
              </h2>
              <p className="text-xs text-slate-500">
                Verify buyer uploaded transaction receipts against banking records. Approving locks funds into Escrow.
              </p>
            </div>
            <span className="rounded bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
              {pendingPayments.length} PENDING VERIFICATIONS
            </span>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-medium">
              No pending payment proofs. All buyer submissions have been audited.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((pay) => (
                <div
                  key={pay.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                      <img
                        src={pay.receiptUrl}
                        alt="Transfer Receipt"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {pay.txRef}
                        </span>
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                          {pay.provider}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium">
                        Payer: <strong>{pay.senderName}</strong>
                      </p>
                      <p className="text-xs font-mono text-slate-500">
                        Ref: {pay.transferReference}
                      </p>
                      <span className="font-mono font-bold text-emerald-600 text-sm block">
                        {pay.amountDzd}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRejectPayment(pay.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      <XCircle className="h-4 w-4" /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(pay.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve & Escrow
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Section 2: Disputes Room */}
      {activeSection === "disputes" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Official Dispute Resolution Room</h2>
            <p className="text-xs text-slate-500">
              Moderator tribunal to review evidence, inspection photos, and execute refund or escrow release.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500">
                  DISPUTE #DSP-2026-0012 (CP-TX-2026-66310)
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                  Package Packaging Torn During Transit
                </h3>
              </div>
              <span className="rounded bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 border border-red-200">
                PAYOUTS FROZEN
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Buyer reported outer box crushed on arrival. Headphone electronics work perfectly, but cosmetic damage to packaging.
            </p>

            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 mr-2">Moderator Decision:</span>
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                Split 50% Refund / 50% Bringer
              </button>
              <button
                type="button"
                className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
              >
                Release 100% to Bringer
              </button>
              <button
                type="button"
                className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition"
              >
                Full Refund to Buyer
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Moderation Queue */}
      {activeSection === "moderation" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Restricted Content Moderation Queue</h2>
            <p className="text-xs text-slate-500">
              Listings containing restricted categories or flagged keywords before becoming publicly visible.
            </p>
          </div>

          <div className="p-8 text-center text-xs text-slate-400 font-medium">
            0 listings flagged for review. Prohibited keyword filter is active.
          </div>
        </section>
      )}
    </div>
  );
}
