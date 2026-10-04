import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/contexts/AuthContext";
import HydrationGuard from "@/components/common/HydrationGuard";

export const metadata: Metadata = {
  title: "Caba Pro — Get anything from abroad",
  description: "Connect with travelers heading your way. They bring what you need, you save on shipping.",
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
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var clean = function() {
                    var els = document.querySelectorAll('[bis_skin_checked], [cz-shortcut-listen]');
                    for (var i = 0; i < els.length; i++) {
                      els[i].removeAttribute('bis_skin_checked');
                      els[i].removeAttribute('cz-shortcut-listen');
                    }
                  };
                  if (typeof MutationObserver !== 'undefined') {
                    new MutationObserver(function(muts) {
                      for (var i = 0; i < muts.length; i++) {
                        var m = muts[i];
                        if (m.type === 'attributes' && m.attributeName && (m.attributeName.indexOf('bis_') === 0 || m.attributeName.indexOf('cz-') === 0)) {
                          m.target.removeAttribute(m.attributeName);
                        }
                      }
                    }).observe(document.documentElement, { attributes: true, subtree: true });
                  }
                  window.addEventListener('DOMContentLoaded', clean);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`min-h-screen bg-white text-slate-900 antialiased font-sans`} suppressHydrationWarning>
        <HydrationGuard />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar locale={locale} />
              <main className="flex-1">{children}</main>
            </div>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
