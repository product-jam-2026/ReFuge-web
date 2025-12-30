import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // רשימת השפות
  locales: ['en', 'he', 'ar'],
 
  // שפת ברירת מחדל אם לא זוהתה שפה
  defaultLocale: 'he'
});
 
export const config = {
  // הגדרה שמונעת מהמידלר לרוץ על קבצים סטטיים ותמונות
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};