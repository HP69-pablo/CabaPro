"use client";

import { useState } from "react";
import { Wallet, ArrowDownRight, ArrowUpRight, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

export default function WalletPage() {
  const [payoutRequested, setPayoutRequested] = useState(false);

  // Derived ledger transactions
  const ledgerHistory = [
    {
      id: "entry-1",
      date: "Today, 14:30",
      description: "Escrow completion split - Trip Paris → Algiers",
      type: "CREDIT",
      account: "BRINGER_AVAILABLE",
      amount: "+40.00 €",
      currency: "EUR",
      reference: "CP-TX-2026-84920",
    },
    {
      id: "entry-2",
      date: "Yesterday, 11:15",
      description: "Advance product purchase funds from Bureau",
      type: "CREDIT",
      account: "BRINGER_PENDING",
      amount: "+280.00 €",
      currency: "EUR",
      reference: "FT-2026-0042",
    },
    {
      id: "entry-3",
      date: "Oct 28, 2026",
      description: "Payout to BaridiMob account",
      type: "DEBIT",
      account: "PAYOUTS",
      amount: "-9,600.00 DZD",
      currency: "DZD",
      reference: "PO-2026-081",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Wallet className="h-7 w-7 text-emerald-600" />
            My Ledger Wallet
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Derived directly from immutable double-entry ledger entries. Zero mutable balance columns.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPayoutRequested(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          <ArrowDownRight className="h-4 w-4" />
          Request Payout
        </button>
      </div>

      {payoutRequested && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>
              Payout request of <strong>40.00 €</strong> queued to your encrypted BaridiMob / IBAN account.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPayoutRequested(false)}
            className="text-xs text-emerald-700 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Available for Payout
          </span>
          <span className="text-3xl font-black text-emerald-600 mt-2 block">40.00 €</span>
          <span className="text-xs text-slate-400 mt-1 block">≈ 9,600.00 DZD</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Pending Escrow
          </span>
          <span className="text-3xl font-black text-blue-600 mt-2 block">327.60 €</span>
          <span className="text-xs text-slate-400 mt-1 block">Releases upon delivery code</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Default Payout Destination
          </span>
          <div className="mt-2 text-xs font-mono font-bold text-slate-800">
            BaridiMob: DZ00••••1234
          </div>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold inline-block mt-1">
            AES-256-GCM ENCRYPTED
          </span>
        </div>
      </div>

      {/* Double-Entry Ledger History Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Append-Only Double-Entry Audit History
          </h2>
          <span className="text-xs text-slate-400">Strictly balanced ledger</span>
        </div>

        <div className="divide-y divide-slate-100">
          {ledgerHistory.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{item.description}</span>
                  <span className="font-mono text-[10px] text-slate-400">({item.reference})</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {item.date} • Account: <code className="font-bold text-slate-700">{item.account}</code>
                </div>
              </div>

              <div className="text-end">
                <span
                  className={`font-mono text-sm font-bold ${
                    item.type === "CREDIT" ? "text-emerald-600" : "text-slate-900"
                  }`}
                >
                  {item.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
