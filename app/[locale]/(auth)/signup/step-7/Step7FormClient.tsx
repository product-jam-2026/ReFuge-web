"use client";

import { useState, CSSProperties, ChangeEvent } from "react";
import styles from "./step7.module.css";

interface BiProps {
  ar: string;
  he: string;
  className?: string;
  style?: CSSProperties;
}

function BiInline({ ar, he, className, style }: BiProps) {
  return (
    <div className={`${styles.biLine} ${className || ""}`} style={style}>
      <span className={styles.biAr}>{ar}</span>
      <span className={styles.biHe}>{he}</span>
    </div>
  );
}

function BiStack({ ar, he, className, style }: BiProps) {
  return (
    <div className={`${styles.biStack} ${className || ""}`} style={style}>
      <div className={styles.biAr}>{ar}</div>
      <div className={styles.biHe}>{he}</div>
    </div>
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
  // Screens: 0=Intro, 1=Form
  const [screen, setScreen] = useState(0);

  const goNext = () => setScreen(1);
  const goBack = () => setScreen(0);

  // State to show selected file names (Visual only)
  const [files, setFiles] = useState<Record<string, string>>({
    passportCopy: defaults.passportCopy || "",
    rentalContract: defaults.rentalContract || "",
    propertyOwnership: defaults.propertyOwnership || "",
    childPassportPhoto: defaults.childPassportPhoto || "",
    otherDocs: defaults.otherDocs || "",
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [fieldName]: e.target.files![0].name }));
    }
  };

  return (
    <div className={styles.wrap}>
      
      {/* Intro Screen (0) */}
      {screen === 0 ? (
        <div className={styles.introFull}>
          <div className={styles.introContent}>
            <div className={styles.introTop}>
              <BiInline ar="المرحلة 7 من 7" he="שלב 7 מתוך 7" className={styles.introStep} />
            </div>
            <div className={styles.introMain}>
              <BiInline ar="رفع المستندات" he="העלאת מסמכים" className={styles.introH1} />
            </div>
            <div className={styles.introText}>
              <BiStack 
                ar="بهالمرحلة نرفع صورة جواز السفر، عقد الإيجار، وصورة حديثة." 
                he="בשלב זה תתבקשו להעלות צילומים של מסמכים, כגון דרכון, חוזה שכירות ותמונה עדכנית." 
              />
              <div className={styles.introMeta}>
                <BiInline ar="الوقت المتوقع: 2 دقيقة" he="זמן משוער: 2 דקות" />
              </div>
            </div>
            <button type="button" className="btnPrimary" style={{background: '#0b2a4a'}} onClick={goNext}>
              <BiInline ar="ابدأ" he="התחל" />
            </button>
          </div>
        </div>
      ) : (
        /* Form Screen (1) */
        <form className={styles.form} action={finishAction}>
          {/* Header */}
          <button type="button" className={styles.backBtn} onClick={goBack}>➜</button>

          <div className={styles.headerArea}>
            <div className={styles.topMeta}>
              <BiInline ar="المرحلة 7 من 7" he="שלב 7 מתוך 7" className={styles.stepMeta} />
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: '100%' }} />
              </div>
            </div>
            <div className={styles.titleBlock}>
              <BiInline ar="رفع المستندات" he="העלאת מסמכים" className={styles.h1} />
            </div>
            {saved && (
              <div className={styles.savedNote}>
                <BiInline ar="تم حفظ المسودة" he="הטיוטה נשמרה" />
              </div>
            )}
          </div>

          {/* 1. Passport Copy */}
          <div className={styles.field}>
            <label className={styles.label}>
              <BiInline ar="نسخة من جواز السفر" he="צילום דרכון" />
            </label>
            <label className={`${styles.fileInputLabel} ${files.passportCopy ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.fileName}>{files.passportCopy || ""}</span>
              <input 
                type="file" 
                name="passportCopy" 
                className={styles.hiddenInput} 
                onChange={(e) => handleFileChange(e, 'passportCopy')}
              />
            </label>
          </div>

          {/* 2. Rental Contract */}
          <div className={styles.field}>
            <label className={styles.label}>
              <BiInline ar="عقد إيجار" he="חוזה שכירות" />
            </label>
            <label className={`${styles.fileInputLabel} ${files.rentalContract ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.fileName}>{files.rentalContract || ""}</span>
              <input 
                type="file" 
                name="rentalContract" 
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'rentalContract')}
              />
            </label>
          </div>

          {/* 3. Property Ownership */}
          <div className={styles.field}>
            <label className={styles.label}>
              <BiInline ar="شهادة ملكية الممتلكات" he="אישור בעלות רכוש" />
            </label>
            <label className={`${styles.fileInputLabel} ${files.propertyOwnership ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.fileName}>{files.propertyOwnership || ""}</span>
              <input 
                type="file" 
                name="propertyOwnership" 
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'propertyOwnership')}
              />
            </label>
          </div>

          {/* 4. Child Passport Photo */}
          <div className={styles.field}>
            <label className={styles.label}>
              <BiInline ar="صورة جواز سفر الطفل/الطفلة" he="תמונת פספורט ילד.ה" />
            </label>
            <label className={`${styles.fileInputLabel} ${files.childPassportPhoto ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.fileName}>{files.childPassportPhoto || ""}</span>
              <input 
                type="file" 
                name="childPassportPhoto" 
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'childPassportPhoto')}
              />
            </label>
          </div>

          {/* 5. Other Documents */}
          <div className={styles.field}>
            <label className={styles.label}>
              <BiInline ar="إضافة مستند" he="הוספת מסמך" />
              <div style={{fontSize: 11, fontWeight: 400, marginTop: 2, color: '#666'}}>
                 <BiInline ar="صورة جواز سفر الطفل/الطفلة، وثائق إضافية" he="תמונת פספורט ילד.ה, מסמכים נוספים" />
              </div>
            </label>
            <label className={`${styles.fileInputLabel} ${files.otherDocs ? styles.fileSelected : ''}`}>
              <span className={styles.plusIcon}>+</span>
              <span className={styles.fileName}>{files.otherDocs || ""}</span>
              <input 
                type="file" 
                name="otherDocs" 
                className={styles.hiddenInput}
                onChange={(e) => handleFileChange(e, 'otherDocs')}
              />
            </label>
          </div>

          <div className={styles.actions}>
            <button type="submit" className="btnPrimary" style={{background: '#0b2a4a'}}>
              <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
            </button>

            <button type="submit" formAction={saveDraftAction} className="btnSecondary">
              <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}