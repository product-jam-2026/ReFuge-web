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
  const dir = locale === "en" ? "ltr" : "rtl";

  return (
    <html lang={locale} dir={dir} className={simplerPro.variable}>
      <head>
        <link rel="icon" href="/icons/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className={`${simplerPro.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <LangSwitcher />

          {/* ✅ wrapper אחיד לכל המסכים */}
          <div className="appShell">
            <div className="appFrame">
              <main className="page">{children}</main>
            </div>
          </div>
        </NextIntlClientProvider>

        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
