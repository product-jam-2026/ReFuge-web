import "@/styles/global.css"; // הנתיב המקורי מה-Starter Kit
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { Metadata } from "next";
import Navbar from "@/lib/components/Navbar";
import Footer from "@/lib/components/Footer";

// השארנו את המטא-דאטה המקורי
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
  // 1. טעינת התרגומים
  const messages = await getMessages();

  // 2. קביעת כיוון הטקסט (RTL/LTR)
  const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <head>
        {/* --- חלקים מקוריים מה-Starter Kit --- */}
        <link rel="icon" href="/icons/favicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* סקריפט להתחברות עם גוגל */}
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      
      <body>
        {/* עוטפים את הכל בספק התרגומים */}
        <NextIntlClientProvider messages={messages}>
          
          <Navbar />
          
          {/* הוספתי min-h-screen כדי שהפוטר לא יעלה למעלה אם הדף ריק */}
          <div className="min-h-[80vh]">
            {children}
          </div>

          <Footer />

        </NextIntlClientProvider>
      </body>
    </html>
  );
}