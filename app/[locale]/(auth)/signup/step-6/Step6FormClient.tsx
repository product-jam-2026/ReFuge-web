"use client";

import { useMemo, useState, useEffect, CSSProperties } from "react";
import styles from "./step6.module.css";
import isoCountries from "i18n-iso-countries";
import arLocale from "i18n-iso-countries/langs/ar.json";
import heLocale from "i18n-iso-countries/langs/he.json";

isoCountries.registerLocale(arLocale as any);
isoCountries.registerLocale(heLocale as any);

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
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
  finishAction: (formData: FormData) => Promise<void>;
  addAnotherAction: (formData: FormData) => Promise<void>;
};

export default function Step6FormClient({
  saved,
  defaults,
  saveDraftAction,
  saveDraftAndBackAction,
  finishAction,
  addAnotherAction
}: Props) {
  // Screens: 
  // 0: Intro
  // 1: General A (Name, Gender)
  // 2: General B (Birth, Nat, ID)
  // 3: Migration (Country, Dates + Final Actions)
  const [screen, setScreen] = useState(0);

  // --- Logic State ---
  const [gender, setGender] = useState(defaults.childGender || "");
  const [birthCountryText, setBirthCountryText] = useState(defaults.childResidenceCountry || "");
  const [nationalityText, setNationalityText] = useState(defaults.childNationality || "");

  // --- Country Logic ---
  const countryOptions = useMemo(() => {
    const ar = isoCountries.getNames("ar", { select: "official" });
    const he = isoCountries.getNames("he", { select: "official" });
    return Object.keys(ar).map(code => ({
      code,
      label: `${ar[code]} ${he[code]}`,
      search: `${ar[code]} ${he[code]}`
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  // --- Navigation ---
  const progress = useMemo(() => {
    if (screen === 0) return 0;
    return Math.round((screen / 3) * 100);
  }, [screen]);

  const goNext = () => setScreen((s) => Math.min(3, s + 1));
  const goBack = () => setScreen((s) => Math.max(0, s - 1));

  return (
    <div className={styles.wrap}>
      
      {/* --- Intro Screen (0) --- */}
      {screen === 0 && (
        <div className={styles.introFull}>
          <div className={styles.introContent}>
            <div className={styles.introTop}>
              <BiInline ar="المرحلة 6 من 7" he="שלב 6 מתוך 7" className={styles.introStep} />
            </div>
            <div className={styles.introMain}>
              <BiInline ar="أولاد" he="ילדים" className={styles.introH1} />
            </div>
            <div className={styles.introText}>
              <BiStack 
                ar="بهالمرحلة لازم تعبي معلومات عن الأولاد تحت جيل 18." 
                he="בשלב זה יש למלא מידע על ילדים מתחת לגיל 18." 
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
      )}

      {/* --- Form Container --- */}
      <form className={screen > 0 ? styles.form : styles.screenHide} action={finishAction}>
        
        {/* Header */}
        <button type="button" className={styles.backBtn} onClick={goBack}>➜</button>

        <div className={styles.headerArea}>
          <div className={styles.topMeta}>
            <BiInline ar="المرحلة 6 من 7" he="שלב 6 מתוך 7" className={styles.stepMeta} />
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className={styles.titleBlock}>
            <BiInline ar="بيانات الأطفال" he="פרטי ילדים" className={styles.h1} />
          </div>
          {saved && (
            <div className={styles.savedNote}>
              <BiInline ar="تم حفظ المسودة" he="הטיוטה נשמרה" />
            </div>
          )}
        </div>

        {/* --- Screen 1: General A (Names/Gender) --- */}
        <div className={screen === 1 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div>

            <div className={styles.field}>
              <label><BiInline ar="اسم العائلة" he="שם משפחה" className={styles.label} /></label>
              <input name="childLastName" defaultValue={defaults.childLastName} className={styles.inputControl} />
            </div>

            <div className={styles.field}>
              <label><BiInline ar="الاسم الشخصي" he="שם פרטי" className={styles.label} /></label>
              <input name="childFirstName" defaultValue={defaults.childFirstName} className={styles.inputControl} />
            </div>

            <div className={styles.field}>
               <label><BiInline ar="النوع" he="מין" className={styles.label} /></label>
               <div className={styles.toggleRow}>
                 <button 
                   type="button" 
                   className={styles.toggleBtn} 
                   data-active={gender === 'male'}
                   onClick={() => setGender('male')}
                 >
                   <BiInline ar="ذكر" he="זכר" />
                 </button>
                 <button 
                   type="button" 
                   className={styles.toggleBtn} 
                   data-active={gender === 'female'}
                   onClick={() => setGender('female')}
                 >
                   <BiInline ar="أنثى" he="נקבה" />
                 </button>
                 <input type="hidden" name="childGender" value={gender} />
               </div>
            </div>

            <div className={styles.actions}>
              <button type="button" className="btnPrimary" onClick={goNext}>
                <BiInline ar="التالي" he="המשך" />
              </button>
              <button type="submit" formAction={saveDraftAction} className="btnSecondary">
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
           </div>
        </div>

        {/* --- Screen 2: General B (Birth/Nat/ID) --- */}
        <div className={screen === 2 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div>

            <div className={styles.field}>
              <label><BiInline ar="تاريخ الميلاد" he="תאריך לידה" className={styles.label} /></label>
              <input type="date" name="childBirthDate" defaultValue={defaults.childBirthDate} className={styles.inputControl} />
            </div>

            <div className={styles.field}>
               <label><BiInline ar="الجنسية" he="אזרחות" className={styles.label} /></label>
               <input 
                 list="nats"
                 name="childNationality" 
                 value={nationalityText}
                 onChange={e => setNationalityText(e.target.value)}
                 className={styles.inputControl}
                 placeholder="اختر / בחר"
               />
               <datalist id="nats">
                 {countryOptions.map(c => <option key={c.code} value={c.label} />)}
               </datalist>
            </div>

            <div className={styles.field}>
              <label><BiInline ar="رقم بطاقة الهوية الإسرائيلية" he="מספר תעודת זהות ישראלית" className={styles.label} /></label>
              <input name="childIsraeliId" defaultValue={defaults.childIsraeliId} className={styles.inputControl} inputMode="numeric" />
            </div>

            <div className={styles.actions}>
              <button type="button" className="btnPrimary" onClick={goNext}>
                <BiInline ar="التالي" he="המשך" />
              </button>
              <button type="submit" formAction={saveDraftAction} className="btnSecondary">
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
           </div>
        </div>

        {/* --- Screen 3: Migration & Actions --- */}
        <div className={screen === 3 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionTitle}><BiInline ar="الهجرة" he="הגירה" /></div>

            <div className={styles.field}>
               <label><BiInline ar="بلد الميلاد" he="ארץ לידה" className={styles.label} /></label>
               <input 
                 list="bcountries"
                 name="childResidenceCountry" 
                 value={birthCountryText}
                 onChange={e => setBirthCountryText(e.target.value)}
                 className={styles.inputControl}
                 placeholder="اختر / בחר"
               />
               <datalist id="bcountries">
                 {countryOptions.map(c => <option key={c.code} value={c.label} />)}
               </datalist>
            </div>

            <div className={styles.field}>
              <label><BiInline ar="تاريخ الهجرة إلى البلاد" he="תאריך עלייה לארץ" className={styles.label} /></label>
              <input type="date" name="childEntryDate" defaultValue={defaults.childEntryDate} className={styles.inputControl} />
            </div>

            <div className={styles.field}>
              <label><BiInline ar="تاريخ الدخول إلى البلاد" he="תאריך כניסה לארץ" className={styles.label} /></label>
              <input type="date" name="childArrivalToIsraelDate" defaultValue={defaults.childArrivalToIsraelDate} className={styles.inputControl} />
            </div>

            <div className={styles.actions}>
               {/* הוספת ילד */}
               <button type="submit" formAction={addAnotherAction} className="btnPrimary" style={{background: '#0b2a4a'}}>
                 <BiInline ar="إضافة طفل/طفلة" he="הוספת ילד.ה" />
               </button>

               {/* סיום שלב */}
               <button type="submit" formAction={finishAction} className="btnPrimary" style={{background: '#0b2a4a'}}>
                 <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
               </button>

               <button type="submit" formAction={saveDraftAction} className="btnSecondary">
                 <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
               </button>
            </div>
        </div>

      </form>
    </div>
  );
}