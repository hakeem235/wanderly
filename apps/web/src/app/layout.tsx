import type { Metadata } from "next";
import { Fraunces, DM_Sans, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { isRTL } from "@/i18n";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wanderly — Your trips, beautifully organized",
  description:
    "Manage every flight, hotel, and activity in one timeline. Search, book, and plan with AI — all in one place.",
  manifest: "/manifest.json",
  themeColor: "#B85C38",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wanderly",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = (await import(`../messages/${locale}.json`)).default;
  const dir = isRTL(locale) ? "rtl" : "ltr";

  return (
    <ClerkProvider>
      <html
        lang={locale}
        dir={dir}
        className={`${fraunces.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      >
        <body>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
