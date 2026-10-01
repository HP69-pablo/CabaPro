"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Package,
  Plane,
  FileText,
  AlertTriangle,
  Lock,
  ArrowRight,
  Eye,
  KeyRound,
  RefreshCw,
  ShoppingBag,
  Send,
} from "lucide-react";

export default function TransactionDetailPage() {
  const params = useParams();
  const txId = params.id as string;

  // Active state within the demo lifecycle
  const [currentStatus, setCurrentStatus] = useState<
    "AGREED" | "PAID" | "PURCHASED" | "IN_TRANSIT" | "ARRIVED" | "DELIVERED" | "COMPLETED"
  >("PAID");

  // Safe Handover checklist state
  const [checklist, setChecklist] = useState({
    itemMatchesListing: true,
    modelQuantityCorrect: true,
    packagingChecked: true,
    inspectedByBringer: true,
    noProhibitedItems: true,
    photosUploaded: true,
    receiptUploaded: true,
  });

  const [enteredCode, setEnteredCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [disputeOpen, setDisputeOpen] = useState(false);

  // Secret 6-digit code shown to Buyer (hashed in DB)
  const plainDeliveryCode = "849201";

  const handleVerifyDeliveryCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    if (enteredCode.trim() === plainDeliveryCode) {
      setCodeVerified(true);
      setCurrentStatus("DELIVERED");
    } else {
      setCodeError("Invalid 6-digit delivery code. Verification failed.");
    }
  };

  const steps = [
    { key: "AGREED", label: "Offer Agreed" },
    { key: "PAID", label: "Escrow Locked" },
    { key: "PURCHASED", label: "Purchased" },
    { key: "IN_TRANSIT", label: "In Transit" },
    { key: "ARRIVED", label: "Arrived in DZ" },
    { key: "DELIVERED", label: "Delivered" },
    { key: "COMPLETED", label: "Completed" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-slate-500">CP-TX-2026-84920</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              {currentStatus}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sony WH-1000XM5 Wireless Headphones
          </h1>
          <p className="text-xs text-slate-500">
            Buyer: <strong>Amine Boumediene</strong> • Bringer: <strong>Yacine Benali</strong> (Air France CDG → ALG)
          </p>
        </div>

        {/* Demo Fast-Forward State Advance Controls */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
          <span className="text-slate-500 px-2 text-[10px] uppercase">Advance State:</span>
          {currentStatus === "AGREED" && (
            <button
              type="button"
              onClick={() => setCurrentStatus("PAID")}
              className="bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition"
            >
              Simulate Pay (Escrow)
            </button>
          )}
          {currentStatus === "PAID" && (
            <button
              type="button"
              onClick={() => setCurrentStatus("PURCHASED")}
              className="bg-purple-600 text-white px-2.5 py-1 rounded-lg hover:bg-purple-700 transition"
            >
              Upload Receipt & Photos
            </button>
          )}
          {currentStatus === "PURCHASED" && (
            <button
              type="button"
              onClick={() => setCurrentStatus("IN_TRANSIT")}
              className="bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition"
            >
              Mark In Transit
            </button>
          )}
          {currentStatus === "IN_TRANSIT" && (
            <button
              type="button"
              onClick={() => setCurrentStatus("ARRIVED")}
              className="bg-amber-600 text-white px-2.5 py-1 rounded-lg hover:bg-amber-700 transition"
            >
              Mark Arrived in Algiers
            </button>
          )}
          {currentStatus === "DELIVERED" && (
            <button
              type="button"
              onClick={() => setCurrentStatus("COMPLETED")}
              className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition"
            >
              Confirm & Release Escrow
            </button>
          )}
        </div>
      </div>

      {/* 1. Progress Stepper */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
          Order Progress Stepper
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.key}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition ${
                  isCurrent
                    ? "bg-blue-50 border border-blue-200 text-blue-900 font-bold"
                    : isDone
                    ? "text-emerald-700"
                    : "text-slate-400"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold mb-1.5 ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                </div>
                <span className="text-[11px] leading-tight">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Delivery Code & Safe Handover */}
        <div className="lg:col-span-2 space-y-6">
          {/* 2. 6-Digit Delivery Code Box */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4" /> Secret Delivery Code
              </span>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                SALTED HASH PROTECTED
              </span>
            </div>

            {/* Buyer View */}
            <div className="rounded-xl border border-blue-100 bg-white p-4 text-center">
              <span className="text-xs text-slate-500 block mb-1">
                Your 6-Digit Delivery Code (Share with Bringer ONLY upon physical handover)
              </span>
              <span className="font-mono text-3xl font-black tracking-widest text-slate-900">
                {plainDeliveryCode}
              </span>
              <p className="mt-2 text-[11px] text-amber-700 font-medium">
                ⚠️ Warning: Never share this code over chat or phone. Only provide it when you physically hold and inspect your headphones.
              </p>
            </div>

            {/* Bringer Input Box */}
            <div className="mt-4 pt-4 border-t border-blue-100">
              <span className="text-xs font-semibold text-slate-700 block mb-2">
                Traveler Code Input (Enter code received from Buyer):
              </span>
              <form onSubmit={handleVerifyDeliveryCode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder="Enter 6 digits"
                  className="w-40 text-center font-mono font-bold tracking-widest rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                >
                  Verify Delivery
                </button>
              </form>
              {codeError && <p className="mt-1.5 text-xs text-red-600 font-medium">{codeError}</p>}
              {codeVerified && (
                <p className="mt-1.5 text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Delivery verified successfully!
                </p>
              )}
            </div>
          </div>

          {/* 3. Safe Handover Checklist */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Safe Handover Inspection Checklist
              </h3>
              <span className="text-[11px] text-slate-400">Enforced by state machine guard</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.itemMatchesListing}
                  onChange={(e) => setChecklist({ ...checklist, itemMatchesListing: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Item matches the listing brand (Sony) and model (WH-1000XM5)</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.packagingChecked}
                  onChange={(e) => setChecklist({ ...checklist, packagingChecked: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Original manufacturer packaging verified intact</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.inspectedByBringer}
                  onChange={(e) => setChecklist({ ...checklist, inspectedByBringer: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Package contents inspected by traveler (no sealed unknown mystery items)</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.noProhibitedItems}
                  onChange={(e) => setChecklist({ ...checklist, noProhibitedItems: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Verified 100% free of prohibited items (no contraband, weapons, or illicit goods)</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.receiptUploaded}
                  onChange={(e) => setChecklist({ ...checklist, receiptUploaded: e.target.checked })}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Store purchase receipt & packaging photo uploaded to private storage</span>
              </label>
            </div>
          </div>

          {/* 4. Proof Photos Gallery */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Verified Purchase Proofs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                <img
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop"
                  alt="Product"
                  className="h-36 w-full object-cover"
                />
                <p className="p-2 text-[11px] text-slate-600 font-medium">Product Box Photo</p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 bg-slate-50 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-1">
                    Store Receipt Verified
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800">Fnac Saint-Lazare</p>
                  <p className="text-xs text-slate-500">Total: 280.00 €</p>
                  <p className="text-[10px] text-slate-400 mt-1">EXIF metadata stripped</p>
                </div>
                <span className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline">
                  View Full Receipt (Signed URL)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Escrow Ledger Breakdown */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 mb-4">
              Escrow Price Breakdown
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Product Price:</span>
                <span className="font-semibold text-slate-900">280.00 €</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bringer Reward Fee:</span>
                <span className="font-semibold text-slate-900">40.00 €</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Commission (5%):</span>
                <span className="font-semibold text-slate-900">2.00 €</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Caba Guarantee Protection (2%):</span>
                <span className="font-semibold text-slate-900">5.60 €</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Escrow Amount:</span>
                <span className="text-blue-600">327.60 €</span>
              </div>
              <div className="text-[11px] text-slate-400 text-end">
                Locked at 1 € = 240.00 DZD (78,624.00 DZD)
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => setDisputeOpen(true)}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
              >
                Open Official Dispute
              </button>

              <button
                type="button"
                className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Report Safety Issue
              </button>
            </div>
          </div>

          {/* Quick Chat Link */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h4 className="font-bold text-slate-900 text-xs mb-2">Direct Negotiation Chat</h4>
            <p className="text-xs text-slate-500 mb-3">
              Payment confirmed. Contact details unlocked for delivery meetup.
            </p>
            <Link
              href="/messages/conv-1"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-blue-600 transition"
            >
              Open Live Chat <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
