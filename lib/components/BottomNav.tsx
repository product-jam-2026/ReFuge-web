'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function BottomNav() {
  const t = useTranslations('Navigation');
  const pathname = usePathname();

  // בדיקה אם הכפתור פעיל (כדי לצבוע אותו)
  const isActive = (path: string) => pathname.includes(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a] text-white p-4 pb-6 rounded-t-3xl shadow-[0_-5px_10px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-between items-center max-w-md mx-auto px-6">
        
        {/* כפתור זכויות (שמאל) */}
        <Link href="/rights" className={`flex flex-col items-center gap-1 ${isActive('/rights') ? 'text-blue-400' : 'text-gray-400'}`}>
          <span className="text-2xl">⚖️</span> 
          {/* אפשר להחליף את האימוג'י באייקון SVG בהמשך */}
        </Link>

        {/* כפתור בית (אמצע) */}
        <Link href="/home" className={`flex flex-col items-center gap-1 ${isActive('/home') ? 'text-blue-400' : 'text-white'}`}>
          <span className="text-3xl">🏠</span>
        </Link>

        {/* כפתור פרופיל (ימין) */}
        <Link href="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-blue-400' : 'text-gray-400'}`}>
          <span className="text-2xl">👤</span>
        </Link>
        
      </div>
    </nav>
  );
}