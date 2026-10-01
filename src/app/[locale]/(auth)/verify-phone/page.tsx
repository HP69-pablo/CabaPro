"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Phone, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";

export default function VerifyPhonePage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [phone, setPhone] = useState("+213 555 123 456");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"send" | "verify">("send");
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      if (data.codeForDemo) {
        setDemoCodeHint(data.codeForDemo);
        setCode(data.codeForDemo);
      }
      setStep("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify phone");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 mb-3">
            <Phone className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {t("verifyPhone")}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Verify your mobile number to unlock verified contact trust
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-2" />
            <h3 className="text-sm font-bold text-emerald-900">Phone Verified Successfully!</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Your account has been upgraded to Contact Verified. Redirecting to dashboard...
            </p>
          </div>
        ) : step === "send" ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("phoneLabel")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? tCommon("loading") : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  {t("verificationCode")}
                </label>
                {demoCodeHint && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Demo OTP: {demoCodeHint}
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full text-center tracking-widest font-mono text-xl rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                placeholder="123456"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? tCommon("loading") : "Confirm & Verify"}
            </button>

            <button
              type="button"
              onClick={() => setStep("send")}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition"
            >
              Change Phone Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
