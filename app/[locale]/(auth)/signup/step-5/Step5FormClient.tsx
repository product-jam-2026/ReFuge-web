"use client";

import { useMemo, useState, CSSProperties } from "react";
import styles from "./step5.module.css";
import isoCountries from "i18n-iso-countries";
import arLocale from "i18n-iso-countries/langs/ar.json";
import heLocale from "i18n-iso-countries/langs/he.json";

// רישום שפות למדינות (כמו בשלב 2)
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
  saveAndNextAction: (formData: FormData) => Promise<void>;
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
};

export default function Step5FormClient({
  saved,
  defaults,
  saveDraftAction,
  saveAndNextAction,
  saveDraftAndBackAction,
}: Props) {
  // Screens: 0=Intro, 1=General, 2=Passport, 3=Marital, 4=Contact
  const [screen, setScreen] = useState(0);

  // --- Logic State ---
  const [gender, setGender] = useState(defaults.gender || "");
  const [maritalStatus, setMaritalStatus] = useState(defaults.maritalStatus || "");
  
  // לוגיקה: הצגת תאריך רק אם נשוי
  const isMarried = maritalStatus === "married";

  // --- Country Logic (GeoNames/ISO) ---
  const countryOptions = useMemo(() => {
    const ar = isoCountries.getNames("ar", { select: "official" });
    const he = isoCountries.getNames("he", { select: "official" });
    return Object.keys(ar).map(code => ({
      code,
      label: `${ar[code]} ${he[code]}`,
      search: `${ar[code]} ${he[code]}`
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  // ניהול שדות מדינה
  const [nationalityText, setNationalityText] = useState(defaults.nationality || "");
  const [issueCountryText, setIssueCountryText] = useState(defaults.passportIssueCountry || "");

  // --- Navigation ---
  const progress = useMemo(() => {
    if (screen === 0) return 0;
    return Math.round((screen / 4) * 100);
  }, [screen]);

  const goNext = () => setScreen((s) => Math.min(4, s + 1));
  const goBack = () => setScreen((s) => Math.max(0, s - 1));

  return (
    <div className={styles.wrap}>
      
      {/* Intro Screen (0) */}
      {screen === 0 && (
        <div className={styles.introFull}>
          <div className={styles.introContent}>
            <div className={styles.introTop}>
              <BiInline ar="المرحلة 5 من 7" he="שלב 5 מתוך 7" className={styles.introStep} />
            </div>
            <div className={styles.introMain}>
              <BiInline ar="بيانات الزوج/الزوجة" he="פרטי בעל/אישה" className={styles.introH1} />
            </div>
            <div className={styles.introText}>
              <BiStack 
                ar="كما هو مدوّن في جواز السفر." 
                he="כפי שמופיע בדרכון." 
              />
              <div className={styles.introMeta}>
                <BiInline ar="الوقت المتوقع: 5 دقائق" he="זמן משוער: 5 דקות" />
              </div>
            </div>
            <button type="button" className="btnPrimary" style={{background: '#0b2a4a'}} onClick={goNext}>
              <BiInline ar="ابدأ" he="התחל" />
            </button>
          </div>
        </div>
      )}

      {/* Form Container */}
      <form className={screen > 0 ? styles.form : styles.screenHide} action={saveAndNextAction}>
        
        {/* Header */}
        <button type="button" className={styles.backBtn} onClick={goBack}>➜</button>

        <div className={styles.headerArea}>
          <div className={styles.topMeta}>
            <BiInline ar="المرحلة 5 من 7" he="שלב 5 מתוך 7" className={styles.stepMeta} />
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className={styles.titleBlock}>
            <BiInline ar="بيانات الزوج/الزوجة" he="פרטי בעל/אישה" className={styles.h1} />
            <div className={styles.subtitle}><BiInline ar="كما هو مدوّن في جواز السفر" he="כפי שמופיע בדרכון" /></div>
          </div>
          {saved && (
            <div className={styles.savedNote}>
              <BiInline ar="تم حفظ المسودة" he="הטיוטה נשמרה" />
            </div>
          )}
        </div>

        {/* --- Screen 1: General Info --- */}
        <div className={screen === 1 ? styles.screenShow : styles.screenHide}>
           <div className={styles.titleBlock}>
             <BiInline ar="عام" he="כללי" className={styles.label} style={{fontSize: 18}} />
           </div>
           
           <div className={styles.field}>
             <label><BiInline ar="الاسم الشخصي" he="שם פרטי" className={styles.label} /></label>
             <input name="firstName" defaultValue={defaults.firstName} className={styles.inputControl} />
           </div>

           <div className={styles.field}>
             <label><BiInline ar="اسم العائلة" he="שם משפחה" className={styles.label} /></label>
             <input name="lastName" defaultValue={defaults.lastName} className={styles.inputControl} />
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
                <input type="hidden" name="gender" value={gender} />
              </div>
           </div>

           <div className={styles.field}>
             <label><BiInline ar="تاريخ الميلاد" he="תאריך לידה" className={styles.label} /></label>
             <input type="date" name="birthDate" defaultValue={defaults.birthDate} className={styles.inputControl} />
           </div>

           {/* Nationality with Autocomplete */}
           <div className={styles.field}>
              <label><BiInline ar="الجنسية" he="אזרחות" className={styles.label} /></label>
              <input 
                list="nationalities"
                name="nationality" 
                value={nationalityText}
                onChange={e => setNationalityText(e.target.value)}
                className={styles.inputControl}
                placeholder="اختر / בחר"
              />
              <datalist id="nationalities">
                {countryOptions.map(c => <option key={c.code} value={c.label} />)}
              </datalist>
           </div>

           <div className={styles.field}>
             <label><BiInline ar="رقم بطاقة الهوية الإسرائيلية" he="מספר תעודת זהות ישראלית" className={styles.label} /></label>
             <input name="israeliId" defaultValue={defaults.israeliId} className={styles.inputControl} inputMode="numeric" />
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

        {/* --- Screen 2: Passport --- */}
        <div className={screen === 2 ? styles.screenShow : styles.screenHide}>
            <div className={styles.titleBlock}>
               <BiInline ar="جواز السفر" he="דרכון" className={styles.label} style={{fontSize: 18}} />
            </div>

            <div className={styles.field}>
              <label><BiInline ar="رقم جواز السفر" he="מספר דרכון" className={styles.label} /></label>
              <input name="passportNumber" defaultValue={defaults.passportNumber} className={styles.inputControl} />
            </div>

            <div className={styles.field}>
              <label><BiInline ar="تاريخ الهجرة إلى البلاد" he="תאריך הנפקה" className={styles.label} /></label>
              <input type="date" name="passportIssueDate" defaultValue={defaults.passportIssueDate} className={styles.inputControl} />
            </div>

            <div className={styles.field}>
              <label><BiInline ar="تاريخ الانتهاء" he="תאריך תוקף" className={styles.label} /></label>
              <input type="date" name="passportExpiryDate" defaultValue={defaults.passportExpiryDate} className={styles.inputControl} />
            </div>

            {/* Passport Country with Autocomplete */}
            <div className={styles.field}>
              <label><BiInline ar="دولة الإصدار" he="מדינת הנפקה" className={styles.label} /></label>
              <input 
                list="issueCountries"
                name="passportIssueCountry"
                value={issueCountryText}
                onChange={e => setIssueCountryText(e.target.value)}
                className={styles.inputControl}
                placeholder="اختر / בחר"
              />
              <datalist id="issueCountries">
                {countryOptions.map(c => <option key={c.code} value={c.label} />)}
              </datalist>
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

        {/* --- Screen 3: Marital Status --- */}
        <div className={screen === 3 ? styles.screenShow : styles.screenHide}>
            <div className={styles.titleBlock}>
               <BiInline ar="الحالة الاجتماعية" he="מצב משפחתי" className={styles.label} style={{fontSize: 18}} />
            </div>

            <div className={styles.field}>
              <label><BiInline ar="اختر" he="בחר" className={styles.label} /></label>
              <div className={styles.selectWrapper}>
                <select 
                  name="maritalStatus" 
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className={styles.inputControl}
                >
                  <option value="" disabled hidden>اختر / בחר</option>
                  <option value="single">أعزب/ة / רווק/ה</option>
                  <option value="married">متزوج/ة / נשוי/ה</option>
                  <option value="divorced">مطلق/ة / גרוש/ה</option>
                  <option value="widowed">أرمل/ة / אלמן/ה</option>
                </select>
              </div>
            </div>

            {/* מופיע רק אם נשוי */}
            {isMarried && (
              <div className={styles.field} style={{animation: 'fadeIn 0.3s'}}>
                <label><BiInline ar="تاريخ ميلاد الزوج/ة" he="תאריך לידה של בן/בת הזוג" className={styles.label} /></label>
                <input type="date" name="statusDate" defaultValue={defaults.statusDate} className={styles.inputControl} />
              </div>
            )}

            <div className={styles.actions}>
              <button type="button" className="btnPrimary" onClick={goNext}>
                <BiInline ar="التالي" he="המשך" />
              </button>
              <button type="submit" formAction={saveDraftAction} className="btnSecondary">
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
           </div>
        </div>

        {/* --- Screen 4: Contact --- */}
        <div className={screen === 4 ? styles.screenShow : styles.screenHide}>
             <div className={styles.titleBlock}>
                 <BiInline ar="وسائل الاتصال" he="דרכי תקשורת" className={styles.label} style={{fontSize: 18}} />
             </div>

             <div className={styles.field}>
               <label><BiInline ar="هاتف" he="טלפון" className={styles.label} /></label>
               <input name="phone" type="tel" defaultValue={defaults.phone} className={styles.inputControl} dir="ltr" />
             </div>

             <div className={styles.field}>
               <label><BiInline ar="بريد إلكتروني" he="אימייל" className={styles.label} /></label>
               <input name="email" type="email" defaultValue={defaults.email} className={styles.inputControl} dir="ltr" />
             </div>

             <div className={styles.actions}>
              <button type="submit" className="btnPrimary">
                <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
              </button>
              <button type="submit" formAction={saveDraftAction} className="btnSecondary">
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
              <button type="submit" formAction={saveDraftAndBackAction} className="btnSecondary" style={{border: 'none', color: 'var(--c-muted)', fontSize: 13}}>
                  <BiInline ar="حفظ والعودة" he="שמור וחזור" />
              </button>
           </div>
        </div>

      </form>

    </div>
  );
}