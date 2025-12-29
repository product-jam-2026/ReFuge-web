import "@/styles/global.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from "next";
import Navbar from "@/lib/components/Navbar";
import Footer from "@/lib/components/Footer";
import localFont from 'next/font/local'; // הוספנו את זה
import Script from "next/script";

// הגדרת פונט כותרות (Bold)
const simplerBold = localFont({
  src: '../../public/fonts/SimplerPro-Bold.otf', // שתי קומות למעלה
  variable: '--font-header',
});

// טקסט רץ - semibold
const simplerSemibold = localFont({
  src: '../../public/fonts/SimplerPro-Semibold.otf', // שתי קומות למעלה
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: "ReFuge",
  description: "Assisting refugees with bureaucracy and rights.",
};

export default async function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <head>
        <link rel="icon" href="/icons/favicon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      {/* הזרקנו את ה-Variables של הפונטים לתוך ה-body */}
      <body className={`${simplerBold.variable} ${simplerSemibold.variable} antialiased font-body`}>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <div className="min-h-[80vh]">
            {children}
          </div>
          <Footer />
        </NextIntlClientProvider>
        <Script
  src="https://accounts.google.com/gsi/client"
  strategy="afterInteractive"
/>

      </body>
    </html>
  );
}