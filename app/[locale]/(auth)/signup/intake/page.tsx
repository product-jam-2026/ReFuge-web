"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./intake.module.css";

// ודאי שהתמונה נשמרה בנתיב הזה
// אם אין לך עדיין תמונה, זה יציג ריבוע ריק בינתיים
const WOMAN_IMAGE = "/images/intake-welcome-person.svg"; 

export default function IntakeWelcomePage({ params: { locale } }: { params: { locale: string } }) {
  const router = useRouter();

  const handleStart = () => {
    // לחיצה על "התחל" לוקחת לצעד הראשון של הטופס
    // הנתיב תלוי במבנה התיקיות שלך, אני מניח שזה אחורה ל-signup ואז step-1
    router.push(`/${locale}/signup/step-1`);
  };

  return (
    <div className={styles.container} dir="rtl">
      
      {/* 1. איור האישה */}
      <Image
        src={WOMAN_IMAGE}
        alt="Welcome"
        width={200}
        height={240}
        className={styles.illustration}
        priority
      />

      <div className={styles.content}>
        
        {/* 2. כותרת שלום */}
        <h1 className={styles.title}>
          <span>مرحبًا</span>
          <span>שלום</span>
        </h1>

        {/* 3. כותרת משנה (ערבית ואז עברית) */}
        <div className={styles.subtitle}>
          <span>للبدء، نطلب منك ملء استبيان قصير</span>
          <span>כדי להתחיל, נבקש למלא שאלון קצר</span>
        </div>

        {/* 4. גוף הטקסט - הסבר ופרטיות */}
        <div className={styles.bodyText}>
          {/* ערבית */}
          <p>
            يمكنك التوقف في أي مرحلة والمتابعة لاحقًا. يحفظ النظام كل المعلومات بشكل آمن، فقط داخل التطبيق.
          </p>
          
          {/* עברית */}
          <p>
            אפשר לעצור בכל שלב ולהמשיך מאוחר יותר. המידע נשמר בצורה מאובטחת, רק בתוך האפליקציה.
          </p>
        </div>

        {/* 5. כפתור התחלה */}
        <button onClick={handleStart} className={styles.startButton}>
          <span>ابدأ</span>
          <span>התחל</span>
        </button>

      </div>
    </div>
  );
}