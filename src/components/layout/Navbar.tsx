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
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
            C
          </div>
          <span className="text-lg font-bold text-slate-900">
            Caba<span className="text-blue-600">Pro</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/requests"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Package className="h-4 w-4" />
            {t("requests")}
          </Link>
          <Link
            href="/trips"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Plane className="h-4 w-4" />
            {t("trips")}
          </Link>
          {user && (
            <>
              <Link
                href="/messages"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <MessageSquare className="h-4 w-4" />
                {t("messages")}
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="max-w-[100px] truncate text-sm">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition"
                    title={t("logout")}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
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
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          <Link href="/requests" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileOpen(false)}>
            <Package className="h-4 w-4" /> {t("requests")}
          </Link>
          <Link href="/trips" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileOpen(false)}>
            <Plane className="h-4 w-4" /> {t("trips")}
          </Link>
          {user ? (
            <>
              <Link href="/messages" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                <MessageSquare className="h-4 w-4" /> {t("messages")}
              </Link>
              <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                {t("myActivity")}
              </Link>
              <Link href="/profile" className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 rounded-lg" onClick={() => setMobileOpen(false)}>
                <User className="h-4 w-4" /> {t("profile")}
              </Link>
              <button
                onClick={() => { signOut(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full"
              >
                <LogOut className="h-4 w-4" /> {t("logout")}
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <Link href="/login" className="block px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg" onClick={() => setMobileOpen(false)}>
                {t("login")}
              </Link>
              <Link href="/register" className="block px-3 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg text-center" onClick={() => setMobileOpen(false)}>
                {t("register")}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
