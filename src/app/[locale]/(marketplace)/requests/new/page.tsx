"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Package, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function NewRequestPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [sourceCountry, setSourceCountry] = useState("FR");
  const [sourceCity, setSourceCity] = useState("Paris");
  const [destCountry, setDestCountry] = useState("DZ");
  const [destCity, setDestCity] = useState("Algiers");
  const [quantity, setQuantity] = useState(1);
  const [weightKg, setWeightKg] = useState(0.85);
  const [estimatedPrice, setEstimatedPrice] = useState(280);
  const [currency, setCurrency] = useState("EUR");
  const [preferredFee, setPreferredFee] = useState(40);
  const [isFeeNegotiable, setIsFeeNegotiable] = useState(true);
  const [deadlineDate, setDeadlineDate] = useState("2026-11-20");
  const [purchaseMethod, setPurchaseMethod] = useState("BRINGER_BUYS");
  const [condition, setCondition] = useState("NEW_SEALED");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // In production/demo, posts to API
      setTimeout(() => {
        setSuccess(true);
        setTimeout(() => {
          router.push("/requests");
        }, 1500);
      }, 600);
    } catch (err: any) {
      setError(err.message || "Failed to publish request");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-10 max-w-3xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Post a Product Request
            </h1>
            <p className="text-xs text-slate-500">
              Describe what you want to buy abroad and let verified travelers bring it to Algeria.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-medium text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 mb-2" />
            <h3 className="text-base font-bold text-emerald-900">Request Published Successfully!</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Matching travelers are being notified. Redirecting to feed...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Product Details */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                1. Product Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Store Name / Website
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Fnac, Apple Store, Amazon"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description & Specifications (Color, Size, Model)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brand new in sealed box. Black color preferred."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Route & Weight */}
            <div className="border-t border-slate-100 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                2. Route & Package Weight
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Buy in Country / City
                  </label>
                  <input
                    type="text"
                    value={`${sourceCity}, ${sourceCountry}`}
                    onChange={(e) => setSourceCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deliver to City (Algeria)
                  </label>
                  <input
                    type="text"
                    value={destCity}
                    onChange={(e) => setDestCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Weight (in kg) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Required Delivery Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Pricing & Traveler Reward Fee */}
            <div className="border-t border-slate-100 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                3. Pricing & Reward
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Product Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Offered Traveler Reward Fee ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={preferredFee}
                    onChange={(e) => setPreferredFee(parseFloat(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="negotiable"
                  checked={isFeeNegotiable}
                  onChange={(e) => setIsFeeNegotiable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="negotiable" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Fee is negotiable with traveler during chat
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Publish Request <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
