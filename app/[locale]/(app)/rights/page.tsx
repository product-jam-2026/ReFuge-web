'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import LangSwitcher from '@/lib/components/LangSwitcher';
import { useTextToSpeech } from '@/lib/hooks/useTextToSpeech';

export default function RightsPage() {
  const t = useTranslations('RightsPage');
  const locale = useLocale(); // זיהוי השפה הנוכחית (he, ar, en)
  
  // שימוש בהוק שיצרנו לדיבור
  const { speak, stop } = useTextToSpeech();

  // ניהול מצב האקורדיון (פתוח/סגור)
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleItem = (id: number) => {
    // כשפותחים/סוגרים - תמיד לעצור דיבור אם היה
    stop(); 
    
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
    }
  };

  // בניית רשימת הפריטים
  const items = [1, 2, 3].map((id) => ({
    id,
    question: t(`items.${id - 1}.question`),
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
        <button className="flex items-center gap-2 bg-[#0f172a] text-white px-4 py-1.5 rounded-full text-sm hover:bg-gray-800 transition-colors">
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
              className="bg-[#dcfccf] rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
            >
              {/* כותרת האקורדיון */}
              {/* text-start: מתאים את הטקסט לשמאל באנגלית ולימין בעברית/ערבית */}
              <button 
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 flex justify-between items-start text-start gap-4"
              >
                {/* אייקון חץ */}
                <div className={`bg-[#0f172a] rounded-full p-1 min-w-[24px] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M6 9l6 6 6-6"/>
                   </svg>
                </div>
                
                <span className="font-bold text-gray-900 leading-snug">
                  {item.question}
                </span>
              </button>

              {/* התוכן הנפתח */}
              {isOpen && (
                <div className="px-4 pb-6 pt-0 text-start">
                  {/* pe-11: Padding End - רווח בצד "הסוף" של השורה (שמאל בעברית, ימין באנגלית) */}
                  <p className="text-gray-800 mb-4 pe-11 text-sm leading-relaxed border-t border-green-300/50 pt-3">
                    {item.answer}
                  </p>
                  
                  {/* שורת פעולות (הקראה ולינק) */}
                  <div className="flex justify-between items-center pe-11">
                    
                    {/* כפתור הקראה */}
                    <button 
                      onClick={() => speak(item.answer, locale)}
                      className="text-gray-600 hover:text-[#0f172a] hover:bg-green-200/50 p-2 rounded-full transition-all"
                      title="Read text / הקרא טקסט"
                      aria-label="Listen to text"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    </button>

                    {item.linkText && (
                      <a 
                        href="#" 
                        className="text-blue-600 underline text-sm font-bold hover:text-blue-800 transition-colors"
                      >
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