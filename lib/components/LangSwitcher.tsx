'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

export default function LangSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  // כמו שביקשת: בערבית יוצג "עב", בעברית יוצג "عر"
  const currentLabel = locale === 'ar' ? 'עב' : 'عر';
  const nextLocale = locale === 'ar' ? 'he' : 'ar';

  const onToggle = () => {
    const nextPath = pathname.replace(/^\/(he|ar)(?=\/|$)/, `/${nextLocale}`);
    router.push(nextPath);
  };

  useEffect(() => {
    const setTopFromTitle = () => {
      const styles = getComputedStyle(document.documentElement);
      const fixedTop = styles.getPropertyValue("--langFabTopFixed").trim();
      if (fixedTop === "1") {
        return;
      }

      // מחפשים כותרת "ראשית" בדף. אפשר להרחיב אם צריך.
      const titleEl =
        (document.querySelector('main.page h1') as HTMLElement | null) ||
        (document.querySelector('.dashboardTitle') as HTMLElement | null);

      if (!titleEl) {
        // fallback – אם אין כותרת, נשאר על ברירת מחדל
        document.documentElement.style.setProperty('--langFabTop', '85px');
        return;
      }

      const rect = titleEl.getBoundingClientRect();

      // אותו "גובה" של הכותרת על המסך (עם מינימום מרווח קטן מלמעלה)
      const topPx = Math.max(16, Math.round(rect.top));

      document.documentElement.style.setProperty('--langFabTop', `${topPx}px`);
    };

    // למדוד אחרי רינדור
    const raf = requestAnimationFrame(setTopFromTitle);

    // לעדכן אם המסך משתנה (אייפון/רוטציה וכו')
    window.addEventListener('resize', setTopFromTitle);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setTopFromTitle);
    };
  }, [pathname, locale]);

  return (
    <button type="button" className="langFab" onClick={onToggle}>
      {currentLabel}
    </button>
  );
}
