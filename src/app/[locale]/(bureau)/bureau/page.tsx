"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Search,
  Upload,
  Send,
  DollarSign,
  FileCheck,
  Shield,
  ArrowRight,
} from "lucide-react";

export default function BureauPortalPage() {
  const [activeTab, setActiveTab] = useState<"intake" | "transfers" | "cashbook">("intake");

  // Cash intake form state
  const [bureauCode, setBureauCode] = useState("BPR-2026-ALG-089");
  const [payerName, setPayerName] = useState("Amine Boumediene");
  const [amountDzd, setAmountDzd] = useState("78624");
  const [idChecked, setIdChecked] = useState(true);
  const [intakeSuccess, setIntakeSuccess] = useState(false);

  // Outbound transfer state
  const [transferTarget, setTransferTarget] = useState("Yacine Benali (Paris)");
  const [transferAmountEur, setTransferAmountEur] = useState("280.00");
  const [transferProvider, setTransferProvider] = useState("Paysera Wire");
  const [transferSuccess, setTransferSuccess] = useState(false);

  const handleConfirmCashIntake = (e: React.FormEvent) => {
    e.preventDefault();
    setIntakeSuccess(true);
    setTimeout(() => setIntakeSuccess(false), 3000);
  };

  const handleDispatchWire = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferSuccess(true);
    setTimeout(() => setTransferSuccess(false), 3000);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
              BRANCH #01 ACTIVE
            </span>
            <span className="text-xs text-slate-500 font-medium">14 Rue Didouche Mourad, Alger</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-blue-600" />
            Caba Bureau Partner Portal
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Official cash deposit intake, ID checking, outbound wires to bringers, and daily cashbook reconciliation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("intake")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "intake" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Cash Intake
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("transfers")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "transfers" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Outbound Wires
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cashbook")}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === "cashbook" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Cashbook
          </button>
        </div>
      </div>

      {/* Tab 1: Cash Intake */}
      {activeTab === "intake" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">In-Person Cash Payment Deposit</h2>
              <p className="text-xs text-slate-500">
                Buyer presents payment code. Verify official national ID before recording cash in register.
              </p>
            </div>

            {intakeSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>
                  Deposit of <strong>{amountDzd} DZD</strong> recorded. Transaction state transitioned to <strong>PAID</strong> in Escrow.
                </span>
              </div>
            )}

            <form onSubmit={handleConfirmCashIntake} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Reference Code / QR Lookup
                </label>
                <div className="relative">
                  <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={bureauCode}
                    onChange={(e) => setBureauCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 ps-9 pe-3 py-2 text-sm font-mono font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payer Full Name (from ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cash Amount Received (in DZD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={amountDzd}
                    onChange={(e) => setAmountDzd(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono font-bold text-emerald-600 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idChecked}
                    onChange={(e) => setIdChecked(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Official Government ID verified (Passport / CNI biometric checked)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stamped Physical Receipt Proof
                </label>
                <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 cursor-pointer transition">
                  <div className="space-y-1">
                    <Upload className="mx-auto h-6 w-6 text-slate-400" />
                    <p className="text-xs text-slate-600 font-medium">Click to upload stamped receipt photo</p>
                    <p className="text-[10px] text-slate-400">EXIF metadata automatically scrubbed</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm Cash Intake
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Register Summary */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Current Register Float
              </h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Opening Balance:</span>
                  <span className="font-semibold text-slate-900">250,000.00 DZD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cash In Today (4 deposits):</span>
                  <span className="font-semibold text-emerald-600">+194,500.00 DZD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cash Paid Out (Refunds):</span>
                  <span className="font-semibold text-slate-900">0.00 DZD</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Current Register Total:</span>
                  <span className="text-blue-600">444,500.00 DZD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Outbound Wires */}
      {activeTab === "transfers" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 max-w-2xl">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Outbound Wire to Bringer (Purchase Advance)
            </h2>
            <p className="text-xs text-slate-500">
              Wire the product price portion to the traveler's European bank account to fund in-store shopping.
            </p>
          </div>

          {transferSuccess && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                Wire of <strong>{transferAmountEur} EUR</strong> dispatched. Traveler notified to confirm funds.
              </span>
            </div>
          )}

          <form onSubmit={handleDispatchWire} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recipient Bringer & Destination
              </label>
              <input
                type="text"
                disabled
                value={transferTarget}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wire Method / Provider
                </label>
                <select
                  value={transferProvider}
                  onChange={(e) => setTransferProvider(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none bg-white"
                >
                  <option value="Paysera Wire">Paysera SEPA</option>
                  <option value="Wise Transfer">Wise International</option>
                  <option value="Societe Generale">Société Générale Wire</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advance Amount (EUR)
                </label>
                <input
                  type="text"
                  required
                  value={transferAmountEur}
                  onChange={(e) => setTransferAmountEur(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Transfer Reference / Screenshot Proof
              </label>
              <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 cursor-pointer transition">
                <div className="space-y-1">
                  <Upload className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="text-xs text-slate-600 font-medium">Upload bank transfer confirmation receipt</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
              >
                <Send className="h-4 w-4" />
                Dispatch Advance Wire
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Daily Cashbook */}
      {activeTab === "cashbook" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Daily Cashbook Reconciliation</h2>
              <p className="text-xs text-slate-500">Reconcile cash received, wires sent, and closing register balance.</p>
            </div>
            <span className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              STATUS: OPEN
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Opening Balance</span>
              <span className="text-lg font-black text-slate-900 mt-1 block">250,000 DZD</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Cash Intake Today</span>
              <span className="text-lg font-black text-emerald-600 mt-1 block">+194,500 DZD</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Outbound Wires</span>
              <span className="text-lg font-black text-blue-600 mt-1 block">1,120.00 EUR</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Closing Register</span>
              <span className="text-lg font-black text-purple-600 mt-1 block">444,500 DZD</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition"
            >
              <FileCheck className="h-4 w-4" />
              Submit Daily Cashbook for Finance Approval
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
