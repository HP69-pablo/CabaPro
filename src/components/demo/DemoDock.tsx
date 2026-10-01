"use client";

import { useState } from "react";
import { Wrench, FastForward, RefreshCw, UserCheck, Shield, ChevronUp, ChevronDown } from "lucide-react";

interface DemoDockProps {
  locale: string;
}

export default function DemoDock({ locale }: DemoDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [simulatedRole, setSimulatedRole] = useState<string>("buyer");
  const [fastForwardHours, setFastForwardHours] = useState<number>(0);

  const handleFastForward = (hours: number) => {
    setFastForwardHours((prev) => prev + hours);
    // Dispatches custom event for components listening to demo time offsets
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("caba-demo-fast-forward", { detail: { addedHours: hours } })
      );
    }
  };

  const handleReset = () => {
    if (confirm("Reset all demo data and transactions back to initial state?")) {
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-3 end-4 z-50">
      {/* Floating Toggle Pill */}
      <div className="flex items-center shadow-lg rounded-full border border-blue-300 bg-blue-900/90 text-white backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 hover:text-blue-200 transition"
        >
          <Wrench className="h-3.5 w-3.5 text-amber-400" />
          <span>Demo Controls</span>
          {fastForwardHours > 0 && (
            <span className="rounded bg-amber-400/20 px-1 text-[10px] text-amber-300">
              +{fastForwardHours}h
            </span>
          )}
          {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded Controls Panel */}
      {isOpen && (
        <div className="mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Role Switcher
            </span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              Active: {simulatedRole}
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setSimulatedRole("buyer")}
              className={`flex items-center gap-1.5 rounded-lg border p-2 text-start transition ${
                simulatedRole === "buyer"
                  ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-blue-600" />
              <div>
                <p>Amine (Buyer)</p>
                <p className="text-[10px] text-slate-500">Algiers</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSimulatedRole("bringer")}
              className={`flex items-center gap-1.5 rounded-lg border p-2 text-start transition ${
                simulatedRole === "bringer"
                  ? "border-purple-600 bg-purple-50 text-purple-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 text-purple-600" />
              <div>
                <p>Yacine (Bringer)</p>
                <p className="text-[10px] text-slate-500">Paris (15kg)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSimulatedRole("bureau")}
              className={`flex items-center gap-1.5 rounded-lg border p-2 text-start transition ${
                simulatedRole === "bureau"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <div>
                <p>Bureau Staff</p>
                <p className="text-[10px] text-slate-500">Algiers Bureau</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSimulatedRole("admin")}
              className={`flex items-center gap-1.5 rounded-lg border p-2 text-start transition ${
                simulatedRole === "admin"
                  ? "border-amber-600 bg-amber-50 text-amber-900 font-semibold"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-amber-600" />
              <div>
                <p>Super Admin</p>
                <p className="text-[10px] text-slate-500">Finance & Mod</p>
              </div>
            </button>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Time Fast-Forward
            </span>
            <div className="mt-1.5 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleFastForward(24)}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <FastForward className="h-3 w-3 text-blue-600" />
                +24h
              </button>
              <button
                type="button"
                onClick={() => handleFastForward(72)}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <FastForward className="h-3 w-3 text-purple-600" />
                +72h (Flight)
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-slate-500 hover:text-red-600 transition"
            >
              <RefreshCw className="h-3 w-3" />
              Reset State
            </button>
            <span className="text-[10px] text-slate-400">Demo Mode v1.0</span>
          </div>
        </div>
      )}
    </div>
  );
}
