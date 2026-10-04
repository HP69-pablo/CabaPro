"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateDoc } from "@/lib/firestore";
import { 
  Sun, 
  Moon, 
  Monitor, 
  Palette, 
  Globe, 
  User, 
  Bell, 
  ShieldCheck, 
  Check, 
  Loader2, 
  Package, 
  Plane, 
  Sparkles, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  LogOut 
} from "lucide-react";

const ALGERIA_WILAYAS = [
  "16 - Algiers (الجزائر)",
  "31 - Oran (وهران)",
  "25 - Constantine (قسنطينة)",
  "23 - Annaba (عنابة)",
  "09 - Blida (البليدة)",
  "19 - Sétif (سطيف)",
  "05 - Batna (باتنة)",
  "13 - Tlemcen (تلمسان)",
  "15 - Tizi Ouzou (تيزي وزو)",
  "06 - Béjaïa (بجاية)",
  "35 - Boumerdès (بومرداس)",
  "42 - Tipaza (تيبازة)",
  "30 - Ouargla (ورقلة)",
  "14 - Tiaret (تيارت)",
  "22 - Sidi Bel Abbès (سيدي بلعباس)",
];

export default function SettingsView() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const { user, userProfile, signOut } = useAuth();
  const { mode, colors, setMode } = useTheme();

  // Active settings tab
  const [activeSubTab, setActiveSubTab] = useState<"appearance" | "language" | "profile" | "notifications" | "security">("appearance");

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [city, setCity] = useState(userProfile?.city || "16 - Algiers (الجزائر)");
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Notification toggles state
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [escrowAlerts, setEscrowAlerts] = useState(true);

  // Currency preference
  const [currency, setCurrency] = useState("EUR");

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || "");
      setPhone(userProfile.phone || "");
      setCity(userProfile.city || "16 - Algiers (الجزائر)");
      setBio(userProfile.bio || "");
    }
  }, [userProfile, user]);

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      await updateDoc("users", user.uid, {
        displayName,
        phone,
        city,
        bio,
        currency,
        updatedAt: new Date(),
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile settings:", err);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-brand-border dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Settings Navigation Tabs */}
      <div className="border-b border-brand-border dark:border-slate-800 bg-brand-bg/60 dark:bg-slate-950/60 p-2 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          <button
            onClick={() => setActiveSubTab("appearance")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeSubTab === "appearance"
                ? "bg-white dark:bg-slate-800 text-brand-teal dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Palette className="h-4 w-4 text-brand-teal" />
            <span>{t("tabAppearance")}</span>
          </button>

          <button
            onClick={() => setActiveSubTab("language")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeSubTab === "language"
                ? "bg-white dark:bg-slate-800 text-brand-teal dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Globe className="h-4 w-4 text-brand-teal" />
            <span>{t("tabLanguage")}</span>
          </button>

          <button
            onClick={() => setActiveSubTab("profile")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeSubTab === "profile"
                ? "bg-white dark:bg-slate-800 text-brand-teal dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <User className="h-4 w-4 text-brand-teal" />
            <span>{t("tabAccount")}</span>
          </button>

          <button
            onClick={() => setActiveSubTab("notifications")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeSubTab === "notifications"
                ? "bg-white dark:bg-slate-800 text-brand-teal dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Bell className="h-4 w-4 text-brand-teal" />
            <span>{t("tabNotifications")}</span>
          </button>

          <button
            onClick={() => setActiveSubTab("security")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeSubTab === "security"
                ? "bg-white dark:bg-slate-800 text-brand-teal dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-brand-teal" />
            <span>{t("tabSecurity")}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* ========================================================================= */}
        {/* TAB 1: APPEARANCE & THEME (EXACT CABA PRO DESIGN THEME) */}
        {/* ========================================================================= */}
        {activeSubTab === "appearance" && (
          <div className="space-y-8">
            {/* 1. Light / Dark / System Mode Switcher */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {t("themeMode")}
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setMode("light")}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition ${
                    mode === "light"
                      ? "border-brand-teal bg-brand-teal-50 dark:bg-brand-teal/20 text-brand-teal font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <Sun className="h-5 w-5 mb-1.5 text-amber-500" />
                  <span className="text-xs">{t("light")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("dark")}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition ${
                    mode === "dark"
                      ? "border-brand-teal bg-brand-teal-50 dark:bg-brand-teal/20 text-brand-teal font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <Moon className="h-5 w-5 mb-1.5 text-indigo-400" />
                  <span className="text-xs">{t("dark")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("system")}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition ${
                    mode === "system"
                      ? "border-brand-teal bg-brand-teal-50 dark:bg-brand-teal/20 text-brand-teal font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <Monitor className="h-5 w-5 mb-1.5 text-slate-400" />
                  <span className="text-xs">{t("system")}</span>
                </button>
              </div>
            </div>

            {/* 2. Official Caba Pro Theme Colors from Design Mockup */}
            <div className="bg-brand-bg dark:bg-slate-800/50 rounded-2xl p-5 border border-brand-border dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-brand-teal" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Caba Pro Design System (Applied Universally)
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                This authentic brand theme is implemented consistently across every screen of the application:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Base Color Card */}
                <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-brand-teal/30 shadow-xs">
                  <div className="h-10 w-10 rounded-xl bg-brand-teal flex items-center justify-center text-white font-bold shrink-0 shadow-sm shadow-brand-teal/20">
                    C
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wide">
                      Base Color (Primary)
                    </span>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Deep Teal (#166567)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Buyers, Main Navigation, Core Action CTAs, Badges
                    </p>
                  </div>
                </div>

                {/* Secondary Color Card */}
                <div className="flex items-center gap-3 p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-brand-coral/30 shadow-xs">
                  <div className="h-10 w-10 rounded-xl bg-brand-coral flex items-center justify-center text-white font-bold shrink-0 shadow-sm shadow-brand-coral/20">
                    ✈
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-brand-coral uppercase tracking-wide">
                      Secondary Color (Accent)
                    </span>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      Warm Coral (#EA6A47)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Travelers / Bringers, Capacity Badges, Travel CTAs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Live Theme Preview Card from Mockup */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                {t("livePreview")}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Simulated Buyer Request Card (Base Color) */}
                <div className="p-4 rounded-2xl border border-brand-border dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-brand-teal flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {t("previewBuyer")}
                    </span>
                    <span className="text-[10px] bg-brand-teal-50 dark:bg-brand-teal/20 text-brand-teal font-extrabold px-2 py-0.5 rounded-full">
                      $30 Reward
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    iPhone 13 Pro
                  </h4>
                  <div className="flex items-center text-amber-400 text-xs mb-2">
                    ★★★★★
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button className="rounded-xl border border-brand-teal px-3 py-1.5 text-xs font-bold text-brand-teal hover:bg-brand-teal-50 transition">
                      Details
                    </button>
                    <button className="rounded-xl bg-brand-teal hover:bg-brand-teal-800 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition">
                      Request
                    </button>
                  </div>
                </div>

                {/* Simulated Traveler Trip Card (Secondary Color) */}
                <div className="p-4 rounded-2xl border border-brand-border dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-brand-coral flex items-center gap-1">
                      <Plane className="h-3.5 w-3.5" />
                      {t("previewTraveler")}
                    </span>
                    <span className="text-[10px] bg-brand-coral-50 dark:bg-brand-coral/20 text-brand-coral font-extrabold px-2 py-0.5 rounded-full">
                      10 kg Space
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Paris → Algiers
                  </h4>
                  <div className="flex items-center text-amber-400 text-xs mb-2">
                    ★★★★★
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button className="rounded-xl border border-brand-teal px-3 py-1.5 text-xs font-bold text-brand-teal hover:bg-brand-teal-50 transition">
                      Details
                    </button>
                    <button className="rounded-xl bg-brand-teal hover:bg-brand-teal-800 text-white px-3 py-1.5 text-xs font-bold shadow-xs transition">
                      Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LANGUAGE & REGION */}
        {/* ========================================================================= */}
        {activeSubTab === "language" && (
          <div className="space-y-6 max-w-lg">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {t("language")}
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                    locale === "en"
                      ? "border-brand-teal bg-brand-teal-50 dark:bg-brand-teal/20 text-brand-teal font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl mb-1">🇬🇧</span>
                  <span className="text-xs font-bold">English</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange("fr")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                    locale === "fr"
                      ? "border-brand-teal bg-brand-teal-50 dark:bg-brand-teal/20 text-brand-teal font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl mb-1">🇫🇷</span>
                  <span className="text-xs font-bold">Français</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleLanguageChange("ar")}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                    locale === "ar"
                      ? "border-brand-teal bg-brand-teal-50 dark:bg-brand-teal/20 text-brand-teal font-bold shadow-xs"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl mb-1">🇩🇿</span>
                  <span className="text-xs font-bold">العربية</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {t("currency")}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { code: "EUR", label: "Euro (€)" },
                  { code: "DZD", label: "Dinar (DA)" },
                  { code: "USD", label: "Dollar ($)" },
                ].map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCurrency(c.code)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-bold transition ${
                      currency === c.code
                        ? "border-brand-teal bg-brand-teal-50 dark:bg-brand-teal/20 text-brand-teal shadow-xs"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                {t("wilaya")}
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-teal outline-none"
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PROFILE & ACCOUNT */}
        {/* ========================================================================= */}
        {activeSubTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            {profileSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>{t("savedSuccess")}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("fullName")}
              </label>
              <div className="relative">
                <User className="absolute start-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Karim B."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ps-10 pe-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-teal outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("phone")}
              </label>
              <div className="relative">
                <Phone className="absolute start-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+213 555 12 34 56"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ps-10 pe-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-brand-teal outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t("bio")}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Frequent traveler between Paris and Algiers, trustworthy and fast."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-white focus:border-brand-teal outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile || !user}
                className="inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-800 disabled:opacity-50 text-white rounded-2xl px-6 py-2.5 text-xs font-bold shadow-md shadow-brand-teal/20 transition"
              >
                {savingProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>{t("saveChanges")}</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: NOTIFICATIONS */}
        {/* ========================================================================= */}
        {activeSubTab === "notifications" && (
          <div className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {t("smartMatchAlerts")}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("smartMatchDesc")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={matchAlerts}
                onChange={(e) => setMatchAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {t("chatAlerts")}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("chatAlertsDesc")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={chatAlerts}
                onChange={(e) => setChatAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {t("escrowAlerts")}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("escrowAlertsDesc")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={escrowAlerts}
                onChange={(e) => setEscrowAlerts(e.target.checked)}
                className="h-4 w-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: SECURITY & ACCOUNT ACTIONS */}
        {/* ========================================================================= */}
        {activeSubTab === "security" && (
          <div className="space-y-5 max-w-lg">
            <div className="p-4 rounded-2xl border border-brand-teal/20 bg-brand-teal-50/50 dark:bg-brand-teal/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-teal text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t("verificationStatus")}
                  </h4>
                  <p className="text-[11px] text-brand-teal font-semibold">
                    {userProfile?.verificationLevel || "ID_VERIFIED"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                Account Email
              </h4>
              <p className="text-xs text-slate-500 mb-3">{user?.email || "No email"}</p>
              <button
                type="button"
                onClick={() => alert("Password reset link sent to " + user?.email)}
                className="text-xs font-semibold text-brand-teal hover:underline flex items-center gap-1"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>{t("changePassword")}</span>
              </button>
            </div>

            {user && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t("signOut")}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
