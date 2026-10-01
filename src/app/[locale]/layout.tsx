import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";
import Navbar from "@/components/layout/Navbar";
import DemoDock from "@/components/demo/DemoDock";

export const metadata: Metadata = {
  title: "Caba Pro - Two-Sided Travel Delivery Marketplace",
  description: "Connect Buyers in Algeria with Bringers worldwide. Secure escrow, safe handover, verified trust.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const isRtl = locale === "ar";

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"}>
      <body className={`min-h-screen bg-slate-50 text-slate-900 antialiased ${isRtl ? "font-sans" : "font-sans"}`}>
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Navbar locale={locale} />
            <main className="flex-1">{children}</main>
          </div>
          <DemoDock locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
