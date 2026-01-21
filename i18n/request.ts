import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

const locales = ['he', 'ar'];

export default getRequestConfig(async (params: any) => {
  // קבלת השפה (תומך בכל הגרסאות)
  const baseLocale = params.requestLocale || params.locale;
  let locale = await baseLocale;

  // אם אין שפה תקינה - שגיאה
  if (!locale || !locales.includes(locale)) notFound();

  return {
    locale, // <--- הנה התיקון! חייבים להחזיר גם את השפה עצמה
    // שימי לב: נקודה-נקודה אחת בלבד כי התיקיות אחיות
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
