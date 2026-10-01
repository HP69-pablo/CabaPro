"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  Package,
  Plane,
  Building2,
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  MessageSquare,
  User,
} from "lucide-react";

interface NavbarProps {
  locale: string;
}

export default function Navbar({ locale }: NavbarProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
              CP
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Caba<span className="text-blue-600">Pro</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link
              href="/requests"
              className="flex items-center gap-1.5 hover:text-blue-600 transition"
            >
              <Package className="h-4 w-4" />
              {t("requests")}
            </Link>
            <Link
              href="/trips"
              className="flex items-center gap-1.5 hover:text-blue-600 transition"
            >
              <Plane className="h-4 w-4" />
              {t("trips")}
            </Link>
            <Link
              href="/bureau"
              className="flex items-center gap-1.5 hover:text-blue-600 transition"
            >
              <Building2 className="h-4 w-4" />
              {t("bureauLocations")}
            </Link>
          </nav>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} />

          {/* User Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              {t("dashboard")}
            </Link>
            <Link
              href="/wallet"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <Wallet className="h-3.5 w-3.5" />
              {t("wallet")}
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("adminPanel")}
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <User className="h-3.5 w-3.5" />
              {t("login")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
