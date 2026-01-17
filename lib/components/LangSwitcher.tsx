'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

export default function LangSwitcher() {
  // 1. קודם כל קוראים לכל ה-Hooks (אסור שיהיה return לפניהם)
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  // משתנים ללוגיקה
  const currentLabel = locale === 'ar' ? 'עב' : 'عر';
  const nextLocale = locale === 'ar' ? 'he' : 'ar';

  const onToggle = () => {
    const nextPath = pathname.replace(/^\/(he|ar)(?=\/|$)/, `/${nextLocale}`);
    router.push(nextPath);
  };

  // ה-useEffect המקורי שלך (נשאר במקומו)
  useEffect(() => {
    const setTopFromTitle = () => {
      const styles = getComputedStyle(document.documentElement);
      const fixedTop = styles.getPropertyValue("--langFabTopFixed").trim();
      if (fixedTop === "1") {
        return;
      }

      const titleEl =
        (document.querySelector('main h1') as HTMLElement | null) ||
        (document.querySelector('main.page h1') as HTMLElement | null) ||
        (document.querySelector('.dashboardTitle') as HTMLElement | null);

      if (!titleEl) {
        document.documentElement.style.setProperty('--langFabTop', '85px');
        return;
      }

      const rect = titleEl.getBoundingClientRect();
      const topPx = Math.max(16, Math.round(rect.top));

      document.documentElement.style.setProperty('--langFabTop', `${topPx}px`);
    };

    const raf = requestAnimationFrame(setTopFromTitle);
    window.addEventListener('resize', setTopFromTitle);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setTopFromTitle);
    };
  }, [pathname, locale]);

  // ============================================================
  // 2. רק עכשיו, אחרי שכל ה-Hooks הוגדרו, בודקים אם להסתיר
  // ============================================================
  
  const shouldHide = 
    pathname.includes('/login') || 
    pathname.includes('/signup') || 
    pathname.includes('/intake') || 
    pathname.includes('/callback') ||
    pathname.includes('step-'); // הוספתי גם את זה ליתר ביטחון לצעדים

  if (shouldHide) {
    return null; // עכשיו זה חוקי כי זה אחרי ה-Hooks
  }

  // 3. אם לא הסתרנו, מחזירים את הכפתור
  return (
    <button type="button" className="langFab" onClick={onToggle}>
      {currentLabel}
    </button>
  );
}
