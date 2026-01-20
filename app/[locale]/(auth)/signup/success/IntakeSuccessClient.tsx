"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "@/lib/styles/IntakeSuccess.module.css"; 
// 1. ייבוא הפעולה החדשה
import { updateLanguagePreference } from "@/app/[locale]/(auth)/signup/actions";

const SUCCESS_IMAGE = "/images/intake-success-woman.svg";

type Props = {
  locale: string;
  nameObj: { he?: string; ar?: string };
};

export default function IntakeSuccessClient({ locale, nameObj }: Props) {
  const router = useRouter();
  
  const [screen, setScreen] = useState<'intro' | 'lang'>('intro');
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  // 2. סטייט לניהול שמירה
  const [isSaving, setIsSaving] = useState(false);

  const handleStartClick = () => {
    setScreen('lang');
  };

  // 3. עדכון הפונקציה ל-Async וקריאה לשרת
  const handleFinish = async () => {
    if (!selectedLang) return;
    
    setIsSaving(true); // התחלת טעינה

    try {
        // שמירה ב-Supabase
        await updateLanguagePreference(selectedLang);
    } catch (err) {
        console.error("Failed to save preference, redirecting anyway...");
    } finally {
        // מעבר דף בכל מקרה (גם אם השמירה נכשלה, לא נתקע את המשתמש)
        router.push(`/${selectedLang}/home`);
    }
  };

  const arName = nameObj?.ar?.trim();
  const heName = nameObj?.he?.trim();
  const arGreeting = arName ? `مرحباً ${arName}` : "مرحباً";
  const heGreeting = heName ? `שלום ${heName}` : "שלום";

  if (screen === 'intro') {
    return (
      <div className={styles.fullScreenContainer}>
        <div className={styles.introScreen}>
          <div className={styles.imageWrapper}>
            <Image 
              src={SUCCESS_IMAGE} 
              alt="Success" 
              width={180} 
              height={250} 
              priority
              className={styles.womanImage}
            />
          </div>
          <div className={styles.contentWrapper}>
            <h1 className={styles.greetingTitle}>
              {arGreeting}
              <br />
              {heGreeting}
            </h1>
            <p className={styles.greetingText} dir="rtl">
              تم حفظ جميع التفاصيل بنجاح وستظهر في المنطقة الشخصية. الآن يمكنك البدء بملء النماذج في التطبيق.
              <br /><br />
              כל הפרטים נשמרו בהצלחה ויופיעו באזור האישי. עכשיו אפשר להתחיל למלא טפסים באפליקציה.
            </p>
          </div>
          <button onClick={handleStartClick} className={styles.actionBtn} style={{marginTop: 'auto'}}>
             هيا نبدأ  בואו נתחיל
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.fullScreenContainer}>
      <div className={styles.langScreen}>
        <h1 className={styles.langTitle}>
          اختر لغة
          <br />
          בחר שפה
        </h1>

        <div className={styles.langButtonsContainer}>
          <button 
            className={`${styles.langBtn} ${selectedLang === 'ar' ? styles.langBtnSelected : ''}`}
            onClick={() => setSelectedLang('ar')}
          >
            عربي
          </button>

          <button 
            className={`${styles.langBtn} ${selectedLang === 'he' ? styles.langBtnSelected : ''}`}
            onClick={() => setSelectedLang('he')}
          >
            עברית
          </button>
        </div>

        <div className={styles.fixedBottomBtnWrapper}>
          <button 
              onClick={handleFinish} 
              className={styles.actionBtn}
              // שינוי ה-Opacity בזמן טעינה
              style={{ opacity: (selectedLang && !isSaving) ? 1 : 0.5 }} 
              disabled={!selectedLang || isSaving}
          >
              {isSaving ? "..." : "موافق אישור "}
          </button>
        </div>
      </div>
    </div>
  );
}