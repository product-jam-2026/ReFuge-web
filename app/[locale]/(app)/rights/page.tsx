'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import LangSwitcher from '@/lib/components/LangSwitcher';

export default function RightsPage() {
  const t = useTranslations('RightsPage');
  
  // המשתנה הזה שומר איזה "אקורדיון" פתוח כרגע. 
  // אם הוא null - הכל סגור.
  const [openId, setOpenId] = useState<number | null>(null);

  // פונקציה שפותחת או סוגרת פריט
  const toggleItem = (id: number) => {
    if (openId === id) {
      setOpenId(null); // אם לחצו על מה שפתוח - תסגור אותו
    } else {
      setOpenId(id); // אחרת - תפתח את החדש
    }
  };

  // שליפת המערך מתוך ה-JSON
  // (ב-Next-Intl זה טריק קטן כדי לקבל רשימה)
  const items = [1, 2, 3].map((id) => ({
    id,
    question: t(`items.${id - 1}.question`), // שולף לפי אינדקס
    answer: t(`items.${id - 1}.answer`),
    linkText: t.has(`items.${id - 1}.linkText`) ? t(`items.${id - 1}.linkText`) : null
  }));

  return (
    <main className="p-6 pb-24 max-w-md mx-auto min-h-screen bg-white">
      
      {/* כותרת ושפות */}
      <header className="flex justify-between items-center mb-6">
        <LangSwitcher />
        <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
      </header>

      {/* כפתור סינון */}
      <div className="flex justify-end mb-6">
        <button className="flex items-center gap-2 bg-[#0f172a] text-white px-4 py-1.5 rounded-full text-sm">
           {/* אייקון של משפך */}
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
           </svg>
           {t('filter')}
        </button>
      </div>

      {/* רשימת האקורדיונים */}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div 
              key={item.id} 
              className="bg-[#dcfccf] rounded-2xl overflow-hidden transition-all duration-300"
            >
              {/* הכותרת (תמיד רואים) */}
              <button 
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 flex justify-between items-start text-right gap-4"
              >
                {/* אייקון חץ - מסתובב כשהוא פתוח */}
                <div className={`bg-[#0f172a] rounded-full p-1 min-w-[24px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M6 9l6 6 6-6"/>
                   </svg>
                </div>
                
                <span className="font-bold text-gray-900 leading-snug">
                  {item.question}
                </span>
              </button>

              {/* התוכן הנפתח (רואים רק אם isOpen אמת) */}
              {isOpen && (
                <div className="px-4 pb-6 pt-0 text-right">
                  <p className="text-gray-800 mb-4 pr-11 text-sm leading-relaxed border-t border-green-300/50 pt-3">
                    {item.answer}
                  </p>
                  
                  {/* אזור קישורים ואייקונים */}
                  <div className="flex justify-between items-center pr-11">
                    {/* אייקון רמקול (הקראה) */}
                    <button className="text-gray-600 hover:text-black">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                    </button>

                    {item.linkText && (
                      <a href="#" className="text-blue-600 underline text-sm font-bold">
                        {item.linkText}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </main>
  );
}