'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LangSwitcher() {
  const pathname = usePathname(); // נותן לנו את הכתובת המלאה, למשל: /en/home
  const router = useRouter();
  const currentLocale = useLocale(); // השפה הנוכחית, למשל: en

  const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value; // השפה שבחרנו, למשל: he

    // כאן הקסם קורה:
    // אם הכתובת היא /en/home והשפה הנוכחית היא en
    // אנחנו מחליפים את /en ב-/he
    // התוצאה תהיה /he/home
    
    // מוודאים שאנחנו לא מחליפים סתם אותיות באמצע מילה, אלא רק את החלק של השפה בנתיב
    let newPath = pathname;
    
    if (pathname.startsWith(`/${currentLocale}`)) {
       newPath = pathname.replace(`/${currentLocale}`, `/${nextLocale}`);
    } else {
       // למקרה קצה שהשפה לא מופיעה בכתובת (נדיר במבנה שלך)
       newPath = `/${nextLocale}${pathname}`;
    }

    router.replace(newPath);
  };

  return (
    <select
      defaultValue={currentLocale}
      onChange={onSelectChange}
      className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 text-sm rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
    >
      <option value="he">עברית</option>
      <option value="en">English</option>
      <option value="ar">العربية</option>
    </select>
  );
}