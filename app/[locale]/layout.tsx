import "@/styles/global.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import LangSwitcher from "@/lib/components/LangSwitcher";

const simplerPro = localFont({
  src: [
    { path: "../../public/fonts/SimplerPro-Regular.otf", weight: "400", style: "normal" },
    { path: "../../public/fonts/SimplerPro-Semibold.otf", weight: "600", style: "normal" },
    { path: "../../public/fonts/SimplerPro-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-simpler",
  display: "swap",
});

const simplerProArabic = localFont({
  src: [
    { path: "../../public/fonts/SimplerPro_HLAR-Regular.18a7124eda5acf4f0b6b9588053aeb15.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/SimplerPro_HLAR-Semibold.6f8ad05254f860aac6f501f167ed14cd.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/SimplerPro_HLAR-Bold.3b698aade71399026000e6b9ef7f06a7.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-simpler-ar",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ReFuge",
  description: "Assisting refugees with bureaucracy and rights.",
};

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const dir = "rtl";

  return (
    <html lang={locale} dir={dir} className={`${simplerPro.variable} ${simplerProArabic.variable}`}>
      <head>
        <link rel="icon" href="/logos/logo32.png" sizes="32x32" type="image/png" />
        <link rel="shortcut icon" href="/logos/logo32.png" type="image/png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/logos/logo180.jpeg" />
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className={`${simplerPro.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {/* ✅ wrapper אחיד לכל המסכים */}
          <div className="appShell">
            <div className="appFrame">
              <LangSwitcher />
              <main className="page">{children}</main>
            </div>
          </div>
        </NextIntlClientProvider>

        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
