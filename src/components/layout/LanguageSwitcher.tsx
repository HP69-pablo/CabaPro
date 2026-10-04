"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  currentLocale: string;
}

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-brand-border bg-white px-2.5 py-1 text-xs shadow-xs">
      <Globe className="h-3.5 w-3.5 text-slate-500" />
      <button
        type="button"
        onClick={() => handleLocaleChange("en")}
        className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
          currentLocale === "en"
            ? "bg-brand-teal text-white shadow-xs"
            : "text-slate-600 hover:text-brand-accent"
        }`}
      >
        EN
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="button"
        onClick={() => handleLocaleChange("fr")}
        className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
          currentLocale === "fr"
            ? "bg-brand-teal text-white shadow-xs"
            : "text-slate-600 hover:text-brand-accent"
        }`}
      >
        FR
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="button"
        onClick={() => handleLocaleChange("ar")}
        className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition ${
          currentLocale === "ar"
            ? "bg-brand-teal text-white shadow-xs"
            : "text-slate-600 hover:text-brand-accent"
        }`}
      >
        عربي
      </button>
    </div>
  );
}
