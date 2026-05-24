import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PrivyAppProvider } from "@/components/privy-provider";
import { ThemeInit } from "@/components/theme-init";
import { isRtl } from "@/lib/locales";
import { resolveLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Halo - Care Communication",
  description:
    "A bridge between caregivers, family, and social & protective services. Built for clarity and trust.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await resolveLocale();
  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? "rtl" : "ltr"}
      data-theme="dark"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col relative">
        <ThemeInit />
        <PrivyAppProvider>
          <div className="relative z-10 flex flex-col flex-1">{children}</div>
        </PrivyAppProvider>
      </body>
    </html>
  );
}
