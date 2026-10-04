"use client";

import SettingsView from "@/components/settings/SettingsView";
import { Settings as SettingsIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("settings");

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-brand-teal text-white flex items-center justify-center shadow-sm shadow-brand-teal/20">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t("title")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <SettingsView />
    </div>
  );
}
