"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  Package,
  Plane,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  locale: string;
}

export default function Navbar({ locale }: NavbarProps) {
  const t = useTranslations("nav");
  const { user, signOut, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-border bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal text-white text-base font-bold shadow-sm shadow-brand-teal/20 group-hover:scale-105 transition-transform">
            C
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Caba <span className="text-brand-accent">Pro</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            href="/requests"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-brand-accent hover:bg-brand-teal-50 rounded-xl transition"
          >
            <Package className="h-4 w-4" />
            {t("requests")}
          </Link>
          <Link
            href="/trips"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-brand-accent hover:bg-brand-teal-50 rounded-xl transition"
          >
            <Plane className="h-4 w-4" />
            {t("trips")}
          </Link>
          {user && (
            <>
              <Link
                href="/messages"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-brand-accent hover:bg-brand-teal-50 rounded-xl transition"
              >
                <MessageSquare className="h-4 w-4" />
                {t("messages")}
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-brand-accent hover:bg-brand-teal-50 rounded-xl transition"
              >
                {t("myActivity")}
              </Link>
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale} />

          {!loading && (
            <>
              {user ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="h-6 w-6 rounded-full border border-brand-accent/20"
                      />
                    ) : (
                      <User className="h-4 w-4 text-brand-accent" />
                    )}
                    <span className="max-w-[100px] truncate">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                  </Link>
                  <Link
                    href="/settings"
                    className="p-2 text-slate-500 hover:text-brand-accent dark:hover:text-brand-accent hover:bg-slate-100 rounded-xl transition"
                    title={t("settings") || "Settings"}
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-xl transition"
                    title={t("logout")}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/settings"
                    className="p-2 text-slate-500 hover:text-brand-accent dark:hover:text-brand-accent hover:bg-slate-100 rounded-xl transition"
                    title={t("settings") || "Settings"}
                  >
                    <SettingsIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-xs font-semibold text-brand-accent hover:bg-brand-teal-50 dark:hover:bg-brand-teal/20 rounded-xl transition"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-teal hover:bg-brand-teal-800 rounded-xl shadow-sm shadow-brand-teal/20 transition"
                  >
                    {t("register")}
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-border bg-white px-4 py-3 space-y-1">
          <Link href="/requests" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-teal-50 rounded-xl" onClick={() => setMobileOpen(false)}>
            <Package className="h-4 w-4 text-brand-accent" />
            {t("requests")}
          </Link>
          <Link href="/trips" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-teal-50 rounded-xl" onClick={() => setMobileOpen(false)}>
            <Plane className="h-4 w-4 text-brand-accent" />
            {t("trips")}
          </Link>
          {user ? (
            <>
              <Link href="/messages" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-teal-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                <MessageSquare className="h-4 w-4 text-brand-accent" /> {t("messages")}
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-teal-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                {t("myActivity")}
              </Link>
              <Link href="/profile" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-teal-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                <User className="h-4 w-4 text-brand-accent" /> {t("profile")}
              </Link>
              <Link href="/settings" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-teal-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                <SettingsIcon className="h-4 w-4 text-brand-accent" /> {t("settings") || "Settings"}
              </Link>
              <button
                onClick={() => { signOut(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl w-full"
              >
                <LogOut className="h-4 w-4" /> {t("logout")}
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <Link href="/settings" className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl" onClick={() => setMobileOpen(false)}>
                <SettingsIcon className="h-4 w-4 text-brand-accent" /> {t("settings") || "Settings"}
              </Link>
              <Link href="/login" className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl" onClick={() => setMobileOpen(false)}>
                {t("login")}
              </Link>
              <Link href="/register" className="block px-3 py-2.5 text-sm font-medium text-white bg-brand-teal rounded-xl text-center shadow-sm" onClick={() => setMobileOpen(false)}>
                {t("register")}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
