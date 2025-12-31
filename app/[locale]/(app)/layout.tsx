import BottomNav from "@/lib/components/BottomNav";

// הגדרת ה-Props שהקומפוננטה מקבלת, כולל ה-params של השפה
interface AppLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function AppLayout({ children, params: { locale } }: AppLayoutProps) {
  // בדיקה: אם השפה היא אנגלית - LTR (שמאל לימין), אחרת RTL (ימין לשמאל)
  const dir = locale === 'en' ? 'ltr' : 'rtl';

  return (
    <>
      {/* הוספנו את המאפיין dir. 
         זה גורם לכל התוכן (טקסטים, אקורדיונים, כותרות) להתיישר לצד הנכון אוטומטית.
      */}
      <div className="min-h-screen bg-gray-50" dir={dir}>
        {/* טיפ: אם את רוצה שכפתור החלפת השפה יופיע בכל הדפים (ולא רק בזכויות),
           את יכולה להוסיף את <LangSwitcher /> כאן למעלה.
        */}
        {children}
      </div>
      
      {/* ה-BottomNav נשאר קבוע למטה */}
      <BottomNav />
    </>
  );
}