import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LangSwitcher from '@/lib/components/LangSwitcher'; // וודאי שהנתיב נכון

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <main className="p-6 pb-24 max-w-md mx-auto min-h-screen bg-white">
      {/* כפתור שפה צף בצד */}
      <div className="flex justify-end mb-4">
         <LangSwitcher />
      </div>

      {/* כותרת ופתיח */}
      <header className="mb-8 text-right">
        <h1 className="text-3xl font-bold mb-3 text-gray-900 leading-tight">
          {t('greeting')}
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          {t('intro')}
        </p>
      </header>

      {/* רשימת הכרטיסים */}
      <div className="flex flex-col gap-4">
        
        {/* כרטיס 1: טפסים (כחול) */}
        <Link href="/forms" className="bg-indigo-300 p-6 rounded-2xl shadow-sm text-right hover:opacity-90 transition-opacity">
          <h2 className="text-xl font-bold text-indigo-900 mb-2">{t('cards.allForms.title')}</h2>
          <p className="text-indigo-800 text-sm">{t('cards.allForms.desc')}</p>
        </Link>

        {/* כרטיס 2: טפסים שלי (תכלת) */}
        <Link href="/profile" className="bg-blue-100 p-6 rounded-2xl shadow-sm text-right hover:opacity-90 transition-opacity">
          <h2 className="text-xl font-bold text-blue-900 mb-2">{t('cards.myForms.title')}</h2>
          <p className="text-blue-800 text-sm">{t('cards.myForms.desc')}</p>
        </Link>

        {/* כרטיס 3: טיוטות (כתום) */}
        <Link href="/forms" className="bg-orange-300 p-6 rounded-2xl shadow-sm text-right hover:opacity-90 transition-opacity">
          <h2 className="text-xl font-bold text-orange-900 mb-2">{t('cards.drafts.title')}</h2>
          <p className="text-orange-900 text-sm">{t('cards.drafts.desc')}</p>
        </Link>

      </div>
    </main>
  );
}