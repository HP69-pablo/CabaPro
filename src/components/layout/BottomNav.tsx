"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Home, MessageSquare, PlusCircle, User, Package } from "lucide-react";

export default function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      label: t("home") || "Home",
      href: "/",
      icon: Home,
      active: pathname === "/" || pathname === "/en" || pathname === "/fr" || pathname === "/ar",
    },
    {
      label: t("requests") || "Requests",
      href: "/requests",
      icon: Package,
      active: pathname?.includes("/requests") && !pathname?.includes("/new"),
    },
    {
      label: "Post",
      href: "/requests/new",
      icon: PlusCircle,
      highlight: true,
      active: pathname?.includes("/new"),
    },
    {
      label: t("messages") || "Messages",
      href: user ? "/messages" : "/login",
      icon: MessageSquare,
      active: pathname?.includes("/messages"),
    },
    {
      label: t("profile") || "Account",
      href: user ? "/dashboard" : "/login",
      icon: User,
      active: pathname?.includes("/dashboard") || pathname?.includes("/profile") || pathname?.includes("/settings"),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-brand-border shadow-lg px-2 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          if (item.highlight) {
            return (
              <Link
                key={idx}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal text-white shadow-md shadow-brand-teal/30 hover:scale-105 transition-transform active:scale-95">
                  <Icon className="h-6 w-6 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-semibold text-brand-accent mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                item.active
                  ? "text-brand-accent font-semibold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className={`h-5 w-5 ${item.active ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
