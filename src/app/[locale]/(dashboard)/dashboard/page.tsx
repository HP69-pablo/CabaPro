import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Package,
  Plane,
  ArrowRight,
  Clock,
  CheckCircle2,
  Wallet,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("nav");

  // Sample active transactions for demo
  const activeTransactions = [
    {
      id: "tx-demo-1",
      referenceNumber: "CP-TX-2026-84920",
      productName: "Sony WH-1000XM5 Wireless Headphones",
      route: "Paris → Algiers",
      bringerName: "Yacine Benali",
      status: "PAID",
      statusLabel: "Escrow Locked (Paid)",
      totalAmount: "327.40 €",
      nextAction: "Traveler is purchasing the item at Fnac Paris",
    },
    {
      id: "tx-demo-2",
      referenceNumber: "CP-TX-2026-91042",
      productName: "Dior Sauvage Elixir Perfume 100ml",
      route: "Marseille → Oran",
      bringerName: "Sofiane M.",
      status: "IN_TRANSIT",
      statusLabel: "In Transit (Ferry)",
      totalAmount: "172.80 €",
      nextAction: "Arriving tomorrow in Oran Port. Prepare delivery code.",
    },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="h-7 w-7 text-blue-600" />
            My Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track your ongoing deliveries, manage requests, and inspect escrow statuses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/requests/new"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Package className="h-4 w-4 text-blue-600" />
            New Request
          </Link>
          <Link
            href="/trips/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plane className="h-4 w-4" />
            New Trip
          </Link>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Active Orders
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">2</span>
          <span className="text-[11px] text-blue-600 font-medium">In escrow & transit</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Active Trips
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">1</span>
          <span className="text-[11px] text-purple-600 font-medium">Paris → Algiers (12kg free)</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Wallet Balance
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">40.00 €</span>
          <span className="text-[11px] text-slate-500 font-medium">Available for payout</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Trust Level
          </span>
          <span className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> CONTACT VERIFIED
          </span>
          <Link href="/profile" className="text-[11px] text-blue-600 hover:underline">
            Upload ID to become ID Verified
          </Link>
        </div>
      </div>

      {/* Active Transactions List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Active Transactions</h2>
          <span className="text-xs text-slate-400">All payments secured by Caba Escrow</span>
        </div>

        <div className="divide-y divide-slate-100">
          {activeTransactions.map((tx) => (
            <div key={tx.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {tx.referenceNumber}
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                    {tx.statusLabel}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{tx.productName}</h3>
                <p className="text-xs text-slate-500">
                  {tx.route} • Traveler: <strong className="text-slate-700">{tx.bringerName}</strong>
                </p>
                <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-0.5 inline-block font-medium">
                  Next Step: {tx.nextAction}
                </p>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                <span className="text-base font-black text-slate-900">{tx.totalAmount}</span>
                <Link
                  href={`/transactions/${tx.id}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition"
                >
                  View Order <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
