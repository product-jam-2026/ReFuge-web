'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import LangSwitcher from './LangSwitcher';

export default function Navbar() {
  const t = useTranslations('Navbar');
  const locale = useLocale(); // שולף את השפה הנוכחית (he / en / ar)

  return (
    <nav className="p-4 bg-white shadow-sm flex justify-between items-center px-6">
      {/* לוגו - מפנה לדף הבית בשפה הנוכחית */}
      <Link href={`/${locale}`} className="text-xl font-bold text-blue-600">
        ReFuge
      </Link>
      
      <div className="flex gap-6 items-center font-medium">
         {/* קישורים דינמיים - מוסיפים את ה-locale לכתובת */}
        <Link href={`/${locale}/login`} className="hover:text-blue-600 transition-colors">
          {t('login')}
        </Link>
        
        <Link href={`/${locale}/forms`} className="hover:text-blue-600 transition-colors">
          {t('forms')}
        </Link>
        
        <Link href={`/${locale}/rights`} className="hover:text-blue-600 transition-colors">
          {t('rights')}
        </Link>
        
        {/* קו מפריד קטן בין הלינקים לשפות (אופציונלי) */}
        <div className="h-4 w-[1px] bg-gray-300 mx-2"></div>

        {/* הרכיב שבנינו */}
        <LangSwitcher />
      </div>
    </nav>
  );
}