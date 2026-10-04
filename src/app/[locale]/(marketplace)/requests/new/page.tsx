"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { addDoc, formatFirestoreError } from "@/lib/firestore";
import { serverTimestamp } from "firebase/firestore";
import { Package, CheckCircle, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function NewRequestPage() {
  const t = useTranslations("request");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user } = useAuth();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [storeName, setStoreName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [fromCountry, setFromCountry] = useState("");
  const [toCity, setToCity] = useState("");
  const [budget, setBudget] = useState("");
  const [reward, setReward] = useState("");
  const [weight, setWeight] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [deadline, setDeadline] = useState("");
  const [condition, setCondition] = useState<"NEW_SEALED" | "USED" | "ANY">("NEW_SEALED");
  const [purchaseMethod, setPurchaseMethod] = useState<"BRINGER_BUYS" | "BUYER_BUYS">("BRINGER_BUYS");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await addDoc("requests", {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        userPhoto: user.photoURL || null,
        productName,
        description: description || null,
        storeName: storeName || null,
        productUrl: productUrl || null,
        fromCountry,
        sourceCountry: fromCountry,
        sourceCity: fromCountry,
        toCity,
        destCountry: "Algeria",
        destCity: toCity,
        quantity: Number(quantity) || 1,
        budget: Number(budget),
        reward: Number(reward),
        preferredFee: Number(reward),
        isFeeNegotiable: true,
        weight: weight ? Number(weight) : 0.5,
        deadline: deadline || null,
        currency: "EUR",
        condition,
        purchaseMethod,
        deliveryPreference: "MEETUP",
        status: "active",
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err: any) {
      setError(formatFirestoreError(err));
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-sm">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">{t("published")}</h2>
          <p className="text-xs text-slate-500 mt-1">Redirecting to your dashboard matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-lg">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> {tCommon("back")}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t("newTitle")}</h1>
          <p className="text-xs text-slate-500">{t("newSubtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{t("productName")} *</label>
          <input
            type="text"
            required
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder={t("productNamePlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Store / Brand Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Apple Store, Zara, Fnac"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              max="50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{t("description")}</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">{t("productUrl")}</label>
          <input
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder={t("productUrlPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("fromWhere")} *</label>
            <input
              type="text"
              required
              value={fromCountry}
              onChange={(e) => setFromCountry(e.target.value)}
              placeholder="e.g. France, Paris"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("toWhere")} *</label>
            <input
              type="text"
              required
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              placeholder="e.g. Algiers"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("budget")} (€) *</label>
            <input
              type="number"
              required
              min="1"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="30"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("reward")} (€) *</label>
            <input
              type="number"
              required
              min="1"
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="15"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("weight")}</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.5"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">{t("deadline")}</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Item Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-none bg-white"
            >
              <option value="NEW_SEALED">Brand New / Sealed</option>
              <option value="USED">Pre-owned / Used</option>
              <option value="ANY">Any Condition</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Method</label>
            <select
              value={purchaseMethod}
              onChange={(e) => setPurchaseMethod(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 outline-none bg-white"
            >
              <option value="BRINGER_BUYS">Bringer buys in store</option>
              <option value="BUYER_BUYS">I will ship to bringer</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("publish")}
          </button>
        </div>
      </form>
    </div>
  );
}
