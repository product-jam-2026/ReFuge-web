"use client";

import { useState, useRef, useMemo } from "react";
import Image from "next/image";
import styles from "@/lib/styles/IntakeForm.module.css"; 

const INTRO_IMAGE = "/images/step7-files.svg"; // התמונה שביקשת

function BiInline({ ar, he }: { ar: string; he: string }) {
  return (
    <>
      <span>{ar}</span>
      <span>{he}</span>
    </>
  );
}

type Props = {
  locale: string;
  saved: boolean;
  defaults: any;
  saveDraftAction: (formData: FormData) => Promise<void>;
  finishAction: (formData: FormData) => Promise<void>;
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
};

export default function Step7FormClient({
  saved,
  defaults,
  saveDraftAction,
  finishAction,
  saveDraftAndBackAction,
}: Props) {
  const [screen, setScreen] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ניהול שמות הקבצים לתצוגה
  const [fileNames, setFileNames] = useState({
    passportCopy: defaults.passportCopy ? "קובץ קיים / ملف موجود" : "",
    rentalContract: defaults.rentalContract ? "קובץ קיים / ملف موجود" : "",
    propertyOwnership: defaults.propertyOwnership ? "קובץ קיים / ملف موجود" : "",
    childPassportPhoto: defaults.childPassportPhoto ? "קובץ קיים / ملف موجود" : "",
    otherDocs: defaults.otherDocs ? "קובץ קיים / ملف موجود" : "",
  });

  const goBack = () => setScreen(0);
  const startForm = () => setScreen(1);

  // עדכון שם הקובץ כשבוחרים אחד חדש
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileNames(prev => ({
        ...prev,
        [fieldName]: e.target.files![0].name
      }));
    }
  };

  const handleSubmit = async (formData: FormData) => {
      setIsSubmitting(true);
      await finishAction(formData);
      // לא צריך להפוך ל-false כי השרת יעשה redirect לדף הבית
  };

  return (
    <div className={styles.pageContainer} dir="rtl">
      
      {isSubmitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText} style={{marginTop: 20}}>
             <p style={{fontSize: 18, fontWeight: 'bold'}}>שומר נתונים...</p>
             <p style={{fontSize: 14, color: '#666'}}>جاري الحفظ...</p>
          </div>
        </div>
      )}

      {/* Intro Screen */}
      {screen === 0 && (
        <div className={styles.stepSplashContainer}>
          <Image src={INTRO_IMAGE} alt="Files" width={280} height={200} className={styles.stepSplashImage} priority />
          <div className={styles.stepSplashContent}>
            <div className={styles.stepNumberTitle}><span>المرحلة 7</span><span>שלב 7</span></div>
            <div className={styles.stepMainTitle}><span>تحميل المستندات</span><span>העלאת מסמכים</span></div>
            <div className={styles.stepDescription}>
                <p dir="rtl">بهالمرحلة الأخيرة نرفع صور الهوية، الجوازات وأي مستندات تانية<br/>الوقت المتوقع للتعبئة: 3 دقائق</p>
                <br/>
                <p dir="rtl">בשלב אחרון זה נעלה צילומי תעודות זהות, דרכונים ומסמכים נוספים<br/>זמן מילוי משוער: 3 דקות</p>
            </div>
          </div>
          <button type="button" className={styles.btnDark} onClick={startForm}>
            <BiInline ar="ابدأ" he="התחל" />
          </button>
        </div>
      )}

      {/* Main Form Screen */}
      {screen === 1 && (
        <form className={styles.scrollableContent} action={handleSubmit}>
          
          {/* Header */}
          <div className={styles.topBar}>
            <div className={styles.topRow} style={{justifyContent: 'flex-start'}}>
               {/* חזרה לאינטרו או שלב קודם */}
               <button type="submit" formAction={saveDraftAndBackAction} className={styles.backBtn}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
               </button>
               <div className={styles.stepMeta} style={{marginRight: 10}}><span>المرحلة 7 من 7</span><span> | </span><span>שלב 7 מתוך 7</span></div>
            </div>
            <div className={styles.progressBarTrack}><div className={styles.progressBarFill} style={{ width: '100%' }} /></div>
            <div className={styles.titleBlock}>
                <h1 className={styles.formTitle} style={{justifyContent:'flex-start'}}><BiInline ar="تحميل المستندات" he="העלאת מסמכים" /></h1>
            </div>
          </div>

          {/* Fields */}
          
          {/* 1. Passport / ID Copy */}
          <div className={styles.fieldGroup}>
            <div className={styles.label}>
               <BiInline ar="صورة بطاقة الهوية / جواز السفر" he="צילום תעודת זהות / דרכון" />
            </div>
            <label className={`${styles.fileInputLabel} ${fileNames.passportCopy ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              {fileNames.passportCopy ? (
                  <span className={styles.fileName}>{fileNames.passportCopy}</span>
              ) : (
                  <span className={styles.filePlaceholder}><BiInline ar="اضغط للرفع" he="לחץ להעלאה" /></span>
              )}
              <input 
                type="file" 
                name="passportCopy" 
                accept="image/*,.pdf"
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'passportCopy')}
              />
            </label>
          </div>

          {/* 2. Rental Contract */}
          <div className={styles.fieldGroup}>
            <div className={styles.label}>
               <BiInline ar="عقد إيجار" he="חוזה שכירות" />
            </div>
            <label className={`${styles.fileInputLabel} ${fileNames.rentalContract ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              {fileNames.rentalContract ? (
                  <span className={styles.fileName}>{fileNames.rentalContract}</span>
              ) : (
                  <span className={styles.filePlaceholder}><BiInline ar="اضغط للرفع" he="לחץ להעלאה" /></span>
              )}
              <input 
                type="file" 
                name="rentalContract"
                accept="image/*,.pdf" 
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'rentalContract')}
              />
            </label>
          </div>

          {/* 3. Property Ownership */}
          <div className={styles.fieldGroup}>
            <div className={styles.label}>
               <BiInline ar="ملكية العقار (طابو)" he="בעלות על נכס (טאבו)" />
            </div>
            <label className={`${styles.fileInputLabel} ${fileNames.propertyOwnership ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              {fileNames.propertyOwnership ? (
                  <span className={styles.fileName}>{fileNames.propertyOwnership}</span>
              ) : (
                  <span className={styles.filePlaceholder}><BiInline ar="اضغط للرفع" he="לחץ להעלאה" /></span>
              )}
              <input 
                type="file" 
                name="propertyOwnership" 
                accept="image/*,.pdf"
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'propertyOwnership')}
              />
            </label>
          </div>

          {/* 4. Child Passport Photo */}
          <div className={styles.fieldGroup}>
            <div className={styles.label}>
               <BiInline ar="صورة جواز سفر الطفل/الطفلة" he="תמונת פספורט ילד.ה" />
            </div>
            <label className={`${styles.fileInputLabel} ${fileNames.childPassportPhoto ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              {fileNames.childPassportPhoto ? (
                  <span className={styles.fileName}>{fileNames.childPassportPhoto}</span>
              ) : (
                  <span className={styles.filePlaceholder}><BiInline ar="اضغط للرفع" he="לחץ להעלאה" /></span>
              )}
              <input 
                type="file" 
                name="childPassportPhoto" 
                accept="image/*,.pdf"
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'childPassportPhoto')}
              />
            </label>
          </div>

          {/* 5. Other Documents */}
          <div className={styles.fieldGroup}>
            <div className={styles.label}>
               <BiInline ar="وثائق إضافية" he="מסמכים נוספים" />
            </div>
            <label className={`${styles.fileInputLabel} ${fileNames.otherDocs ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              {fileNames.otherDocs ? (
                  <span className={styles.fileName}>{fileNames.otherDocs}</span>
              ) : (
                  <span className={styles.filePlaceholder}><BiInline ar="اضغط للرفع" he="לחץ להעלאה" /></span>
              )}
              <input 
                type="file" 
                name="otherDocs" 
                accept="image/*,.pdf"
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'otherDocs')}
              />
            </label>
          </div>

          <div className={styles.fixedFooter}>
            <button type="submit" className={styles.btnPrimary}>
              <BiInline ar="إنهاء التسجيل" he="סיום הרשמה" />
            </button>

            <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}>
              <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
            </button>
          </div>

        </form>
      )}
    </div>
  );
}