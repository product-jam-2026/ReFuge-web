"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // ייבוא הניווט

const WelcomeFlow = ({ locale }: { locale: string }) => {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter(); // הוק לניווט

  useEffect(() => {
    // טיימר ל-2 שניות להצגת ה-Splash Screen
    const timer = setTimeout(() => {
      setShowForm(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // כאן תהיה בעתיד הלוגיקה של שליחת המייל ובדיקה בשרת
    // כרגע, לצורך הדגמה, אנחנו מעבירים את המשתמש ישירות לדאשבורד
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden font-sans" dir="rtl">
      
      {/* --- שכבה 1: תמונת פתיחה (Splash) --- */}
      <div 
        className={`absolute inset-0 z-20 flex items-center justify-center bg-[#C8E3FF] transition-opacity duration-1000 ease-in-out ${
          showForm ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* ודאי שהתמונה קיימת בתיקיית public/images */}
        <Image
          src="/public/images/welcome-splash.png" 
          alt="Welcome"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* --- שכבה 2: טופס כניסה --- */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-6 pt-20">
        <div className="text-right mb-8">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">כניסה</h1>
          <p className="text-[#4A4A4A] text-sm">
            כדי להתחבר לאפליקציה, יש להזין את שמך המלא והאימייל שלך ולאחר מכן למלא את הקוד שקיבלת
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-right text-xs text-[#4A4A4A] mb-1 pr-2">שם משפחה</label>
              <input type="text" className="w-full border border-gray-300 rounded-full py-3 px-4 text-right focus:outline-none focus:border-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-right text-xs text-[#4A4A4A] mb-1 pr-2">שם פרטי</label>
              <input type="text" className="w-full border border-gray-300 rounded-full py-3 px-4 text-right focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-right text-xs text-[#4A4A4A] mb-1 pr-2">אימייל</label>
            <input type="email" required className="w-full border border-gray-300 rounded-full py-3 px-4 text-right focus:outline-none focus:border-blue-500" />
          </div>
            
          <div className="mt-10">
            <button
              type="submit"
              className="w-full bg-[#0A1428] text-white rounded-full py-4 font-medium hover:bg-opacity-90 transition-colors"
            >
              שלח קוד
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WelcomeFlow;