import { useTranslations } from 'next-intl';
import Link from 'next/link'; // שימי לב: אולי צריך להשתמש ב-Link מותאם אם הגדרנו כזה, אבל נתחיל ברגיל
import LangSwitcher from './LangSwitcher';

export default function Navbar() {
  const t = useTranslations('Navbar'); // נצטרך להוסיף את זה ל-JSON תיכף

  return (
    <nav className="p-4 bg-white shadow-sm flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600">ReFuge</div>
      
      <div className="flex gap-4 items-center">
         {/* הקישורים לדפים של הצוות */}
        <Link href="/login" className="hover:text-blue-600">התחברות</Link>
        <Link href="/forms" className="hover:text-blue-600">טפסים</Link>
        <Link href="/rights" className="hover:text-blue-600">זכויות</Link>
        
        {/* הרכיב שבנינו */}
        <LangSwitcher />
      </div>
    </nav>
  );
}