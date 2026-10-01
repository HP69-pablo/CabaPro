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
    <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm">
      <Globe className="h-3.5 w-3.5 text-slate-500" />
      <button
        type="button"
        onClick={() => handleLocaleChange("en")}
        className={`px-1.5 py-0.5 rounded font-medium transition ${
          currentLocale === "en" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        EN
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="button"
        onClick={() => handleLocaleChange("fr")}
        className={`px-1.5 py-0.5 rounded font-medium transition ${
          currentLocale === "fr" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        FR
      </button>
      <span className="text-slate-300">|</span>
      <button
        type="button"
        onClick={() => handleLocaleChange("ar")}
        className={`px-1.5 py-0.5 rounded font-medium transition ${
          currentLocale === "ar" ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
        }`}
      >
        العربية
      </button>
    </div>
  );
}
