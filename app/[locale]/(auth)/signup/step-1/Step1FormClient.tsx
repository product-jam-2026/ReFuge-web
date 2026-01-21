"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import styles from "@/lib/styles/IntakeForm.module.css";
import { countriesList } from "@/lib/geo/countries"; 
import { translateStep1Data } from "@/app/[locale]/(auth)/signup/actions"; 

const HAND_IMAGE = "/images/step1-intro-hand.svg";

// --- Phone Prefixes ---
const MOBILE_PREFIXES = [
  { label: "ישראל (+972) – إسرائيل", value: "+972" },
  { label: "רשות פלסטינית (+970) – فلسطين", value: "+970" },
  { label: "ארה\"ב (+1) – الولايات المتحدة", value: "+1" },
];

const LANDLINE_PREFIXES = [
  { label: "02 (ירושלים) – القدس", value: "02" },
  { label: "03 (תל אביב) – تل أبيب", value: "03" },
  { label: "04 (חיפה והצפון) – حيفا والشمال", value: "04" },
  { label: "08 (השפלה והדרום) – الجنوب والسهل الساحلي", value: "08" },
  { label: "09 (השרון) – منطقة الشارون", value: "09" },
  { label: "077 (כללי) – عام", value: "077" },
];

type Props = {
  locale: string;
  saved: boolean;
  defaults: {
    lastName: string;
    firstName: string;
    oldLastName: string;
    oldFirstName: string;
    gender: string;
    birth: { y: string; m: string; d: string };
    nationality: string;
    israeliId: string;
    passportNumber: string;
    passIssue: { y: string; m: string; d: string };
    passExp: { y: string; m: string; d: string };
    passportIssueCountry: string;
    phone: string;
    email: string;
  };
  nameTranslations?: {
    lastName?: { he?: string; ar?: string } | null;
    firstName?: { he?: string; ar?: string } | null;
    oldLastName?: { he?: string; ar?: string } | null;
    oldFirstName?: { he?: string; ar?: string } | null;
  };
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
};

// --- Helpers ---
function partsToIso(p: { y: string; m: string; d: string }) {
  if (!p.y || !p.m || !p.d) return "";
  return `${p.y}-${p.m.padStart(2, "0")}-${p.d.padStart(2, "0")}`;
}
function isoToParts(iso: string) {
  if (!iso) return { y: "", m: "", d: "" };
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { y: "", m: "", d: "" };
  return { y: m[1], m: m[2], d: m[3] };
}
function BiInline({ ar, he }: { ar: string; he: string }) {
  return (
    <>
      <span>{ar}</span>
      <span>{he}</span>
    </>
  );
}

// --- Components ---

function DateField({ labelHe, labelAr, namePrefix, defaultParts }: { 
  labelHe: string; labelAr: string; namePrefix: string; defaultParts: {y:string, m:string, d:string} 
}) {
  const [iso, setIso] = useState<string>(partsToIso(defaultParts));
  const inputRef = useRef<HTMLInputElement>(null);
  const parts = useMemo(() => isoToParts(iso), [iso]);

  const openPicker = () => {
    try {
      if (inputRef.current && typeof (inputRef.current as any).showPicker === "function") {
        (inputRef.current as any).showPicker();
      } else {
        inputRef.current?.focus();
      }
    } catch(e) {}
  };

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.dateWrapper} onClick={openPicker}>
        <Image 
          src="/images/calendar.svg" 
          alt="Calendar" 
          width={24} 
          height={24} 
          className={styles.calendarIcon}
          priority
        />
        <input 
          ref={inputRef} 
          className={styles.dateInput} 
          type="date" 
          value={iso} 
          onChange={(e) => setIso(e.target.value)} 
          lang="he-IL" 
        />
      </div>
      <input type="hidden" name={`${namePrefix}_y`} value={parts.y} />
      <input type="hidden" name={`${namePrefix}_m`} value={parts.m} />
      <input type="hidden" name={`${namePrefix}_d`} value={parts.d} />
      <input type="hidden" name={namePrefix} value={iso} />
    </div>
  );
}

function CountrySelect({ defaultValue, name, labelAr, labelHe }: { defaultValue: string, name: string, labelAr: string, labelHe: string }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIso, setSelectedIso] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue) {
      const found = countriesList.find((c: any) => c.iso2 === defaultValue || c.he === defaultValue);
      if (found) setQuery(`${found.ar} ${found.he}`);
      else setQuery(defaultValue);
    }
  }, [defaultValue]);

  const filtered = useMemo(() => {
    if (!query) return countriesList;
    const lower = query.toLowerCase();
    return countriesList.filter((c: any) => c.he.includes(query) || c.ar.includes(query) || c.iso2.toLowerCase().includes(lower));
  }, [query]);

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.comboboxWrap}>
        <input 
          type="text" 
          className={styles.inputBase} 
          placeholder="ختر دولة  בחר מדינה" 
          value={query} 
          onChange={e => { setQuery(e.target.value); setIsOpen(true); setSelectedIso(e.target.value); }} 
          onFocus={() => setIsOpen(true)} 
          onBlur={() => setTimeout(() => setIsOpen(false), 200)} 
        />
        <input type="hidden" name={name} value={selectedIso} />
        {isOpen && filtered.length > 0 && (
          <ul className={styles.comboboxMenu}>
            {filtered.map((c: any) => (
              <li key={c.iso2} className={styles.comboboxItem} onMouseDown={() => { setQuery(`${c.ar} ${c.he}`); setSelectedIso(c.he); setIsOpen(false); }}>
                <span>{c.he}</span><span>{c.ar}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PhoneField({ labelAr, labelHe, name, defaultValue, prefixes }: { 
  labelAr: string; labelHe: string; name: string; defaultValue: string; prefixes: {label:string, value:string}[] 
}) {
  const initialPrefix = useMemo(() => {
    if (!defaultValue) return prefixes[0].value;
    const match = prefixes.find(p => defaultValue.startsWith(p.value));
    return match ? match.value : prefixes[0].value;
  }, [defaultValue, prefixes]);

  const initialBody = useMemo(() => {
    if (!defaultValue) return "";
    const match = prefixes.find(p => defaultValue.startsWith(p.value));
    return match ? defaultValue.slice(match.value.length) : defaultValue;
  }, [defaultValue, prefixes]);

  const [prefix, setPrefix] = useState(initialPrefix);
  const [body, setBody] = useState(initialBody);
  const [isOpen, setIsOpen] = useState(false);

  const fullValue = useMemo(() => {
    const cleanBody = body.replace(/^0+/, ''); 
    return `${prefix}${cleanBody}`;
  }, [prefix, body]);

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.phoneRow}>
        <div className={styles.prefixWrapper}>
          <button 
            type="button" 
            className={styles.prefixBtn}
            onClick={() => setIsOpen(!isOpen)}
            onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          >
            {prefix}
            <svg className={styles.arrowIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {isOpen && (
            <ul className={styles.comboboxMenu} style={{width: 200}}>
              {prefixes.map(p => (
                <li key={p.value} className={styles.comboboxItem} onMouseDown={() => { setPrefix(p.value); setIsOpen(false); }}>
                  <span style={{direction: 'ltr'}}>{p.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.phoneBodyWrapper}>
          <input 
            type="tel" 
            className={styles.phoneBodyInput} 
            value={body}
            onChange={(e) => setBody(e.target.value.replace(/\D/g, ''))} 
            placeholder="0500000000"
          />
        </div>
      </div>
      <input type="hidden" name={name} value={fullValue} />
    </div>
  );
}

// --- Main Form ---
export default function Step1FormClient({ locale, saved, defaults, nameTranslations, saveDraftAction, saveAndNextAction }: Props) {
  const [screen, setScreen] = useState<number>(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);
  
  const [formDataState, setFormDataState] = useState<any>({});
  const [translations, setTranslations] = useState<any>({});

  const formRef = useRef<HTMLFormElement>(null);
  const draftTimerRef = useRef<number | null>(null);

  const progress = useMemo(() => screen <= 0 ? 0 : Math.min(100, Math.round((screen / 7) * 100)), [screen]);
  const goNext = () => setScreen(s => Math.min(4, s + 1));
  const goBack = () => setScreen(s => Math.max(0, s - 1));

  // --- פונקציה חדשה לבדיקת שדות חובה ---
  const validateScreen = () => {
    if (!formRef.current) return true;
    const formData = new FormData(formRef.current);

    // בדיקה למסך 1 (שמות)
    if (screen === 1) {
      const firstName = formData.get("firstName")?.toString().trim();
      const lastName = formData.get("lastName")?.toString().trim();
      if (!firstName || !lastName) {
        alert("נא למלא שדות חובה (שם פרטי, שם משפחה) \n يرجى تعبئة الحقول المطلوبة (الاسم الشخصي، اسم العائلة)");
        return false;
      }
    }

    // בדיקה למסך 4 (טלפון ומייל)
    if (screen === 4) {
      const phone = formData.get("phone")?.toString().trim();
      const email = formData.get("email")?.toString().trim();
      
      // הערה: בטלפון לעיתים הקידומת נשלחת לבד, אז בודקים שאורך הטלפון הגיוני (מעל 4 תווים נניח)
      if (!phone || phone.length < 5 || !email) {
        alert("נא למלא טלפון ומייל \n يرجى تعبئة رقم الهاتف والبريد الإلكتروني");
        return false;
      }
    }

    return true;
  };
  const handleFinishStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const currentData: any = {};
    formData.forEach((value, key) => { currentData[key] = value; });
    setFormDataState(currentData);

    const existingResults: Record<string, { original: string; translated: string; direction: "he-to-ar" | "ar-to-he" }> = {};
    const maybeUseExisting = (key: keyof NonNullable<Props["nameTranslations"]>) => {
      const current = String(formData.get(key as string) || "").trim();
      if (!current) return;
      const existing = nameTranslations?.[key];
      const he = existing?.he?.trim() || "";
      const ar = existing?.ar?.trim() || "";
      if (he && ar && current === he && ar !== he) {
        existingResults[key as string] = { original: current, translated: ar, direction: "he-to-ar" };
      } else if (he && ar && current === ar && he !== ar) {
        existingResults[key as string] = { original: current, translated: he, direction: "ar-to-he" };
      }
    };
    maybeUseExisting("lastName");
    maybeUseExisting("firstName");
    maybeUseExisting("oldLastName");
    maybeUseExisting("oldFirstName");

    setIsTranslating(true);

    try {
      const translatedResult = await translateStep1Data(formData, locale);
      setTranslations({ ...translatedResult, ...existingResults });
      setScreen(5);
    } catch (error) {
      console.error("Translation error:", error);
      if (Object.keys(existingResults).length > 0) {
        setTranslations(existingResults);
      }
      setScreen(5);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formRef.current) return;
    const start = Date.now();
    setShowDraftSaved(true);
    try {
      const formData = new FormData(formRef.current);
      await saveDraftAction(formData);
    } catch (error) {
      console.error("Draft save error:", error);
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 2000 - elapsed);
      if (draftTimerRef.current) {
        window.clearTimeout(draftTimerRef.current);
      }
      draftTimerRef.current = window.setTimeout(() => setShowDraftSaved(false), remaining);
    }
  };

  // Helper to render translated field
  const renderTranslatedField = (key: string, labelAr: string, labelHe: string) => {
    const data = translations[key];
    if (!data || !data.original) return null;

    const isHeToAr = data.direction === "he-to-ar";
    const originalName = isHeToAr ? `${key}He` : `${key}Ar`;
    const translatedName = isHeToAr ? `${key}Ar` : `${key}He`;

    return (
      <div className={styles.fieldGroup} key={key} style={{marginBottom: 16}}>
        <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
        <div className={styles.translationPill}>
            <div className={styles.transOriginal}>{data.original}</div>
            <input type="hidden" name={originalName} value={data.original} />
            <div className={styles.transTranslated}>
                <input className={styles.inputBase} 
                    style={{background: 'transparent', border: 'none', fontWeight: 700, padding: 0, height: 'auto', textAlign: 'right'}} 
                    defaultValue={data.translated} name={translatedName} 
                />
            </div>
        </div>
        <input type="hidden" name={key} value={data.original} />
      </div>
    );
  };

  // --- Intro Screen ---
  if (screen === 0) {
    return (
      <div className={styles.stepSplashContainer} dir="rtl">
        <Image src={HAND_IMAGE} alt="Hand" width={280} height={280} className={styles.stepSplashImage} priority />
        <div className={styles.stepSplashContent}>
          <h1 className={styles.stepNumberTitle}><BiInline ar="المرحلة " he="שלב 1" /></h1>
          <h2 className={styles.stepMainTitle}><BiInline ar="تفاصيل شخصية" he="פרטים אישיים" /></h2>
          <div className={styles.stepDescription}>
            <p dir="rtl">بهالمرحلة بنطلب منك تدخل معلومات أساسية للتعريف<br/>الوقت المتوقع للتعبئة: 8 دقيقة</p>
            <br/>
            <p dir="rtl">בשלב זה תתבקשו להזין מידע בסיסי לצורך זיהוי<br/>זמן מילוי משוער: 8 דקות</p>
          </div>
        </div>
        <button type="button" className={styles.btnDark} onClick={goNext}><BiInline ar="ابدأ" he="התחל" /></button>
      </div>
    );
  }

  // --- Forms (Screens 1-4) & Summary (Screen 5) ---
  return (
    <div className={styles.pageContainer} dir="rtl">
      
      {isTranslating && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText} style={{marginTop: 20}}>
             <p style={{fontSize: 18, fontWeight: 'bold'}}>מעבד נתונים</p>
             <p style={{fontSize: 14, color: '#666'}}>جارٍ ترجمة البيانات</p>
          </div>
        </div>
      )}
      {showDraftSaved && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText} style={{marginTop: 20}}>
            <p style={{fontSize: 18, fontWeight: 'bold'}}>تم حفظ البيانات، ويمكن تعديلها في المنطقة الشخصية في أي وقت</p>
            <p style={{fontSize: 14, color: '#666'}}>הנתונים נשמרו, ניתן לערוך אותם תמיד באזור האישי</p>
          </div>
        </div>
      )}

      {/* אזור עליון - לא מוצג במסך הסיכום */}
      {screen < 5 && (
        <div className={styles.topBar}>
          <div className={styles.topRow}>
             <button type="button" className={styles.backBtn} onClick={goBack}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
             </button>
             <div className={styles.stepMeta}><span>المرحلة 1 من 7</span> <span>שלב 1 מתוך 7</span></div>
          </div>
          <div className={styles.progressBarTrack}><div className={styles.progressBarFill} style={{ width: `${progress}%` }} /></div>
          
          <div className={styles.titleBlock}>
            <h1 className={styles.formTitle}><BiInline ar="البيانات الشخصية" he="פרטים אישיים" /></h1>
            <p className={styles.formSubtitle}><BiInline ar="كما هو مدون في جواز السفر" he="כפי שרשומים בדרכון" /></p>
          </div>
        </div>
      )}

      {/* טפסים */}
      {screen > 0 && screen < 5 && (
        <form 
          ref={formRef} 
          className={styles.scrollableContent} 
          onSubmit={(e) => {
             e.preventDefault();
             
             // --- הוספת הבדיקה כאן ---
             if (!validateScreen()) return; 
             // -----------------------

             if (screen === 4) {
                 handleFinishStep1(e);
             } else {
                 goNext();
             }
          }}
        >
          {/* Screen 1 - הוספנו padding-top: 40px */}
          <div style={{ display: screen === 1 ? 'block' : 'none', paddingTop: '40px' }}>
            <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div></div>
            <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="الاسم الشخصي" he="שם פרטי" /> <span>*</span> </div><input className={styles.inputBase} name="firstName" defaultValue={defaults.firstName} /></div>
            <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="اسم العائلة" he="שם משפחה" /> <span>*</span> </div><input className={styles.inputBase} name="lastName" defaultValue={defaults.lastName} /></div>
            <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="الاسم الشخصي السابق" he="שם פרטי קודם" /></div><input className={styles.inputBase} name="oldFirstName" defaultValue={defaults.oldFirstName} /></div>
            <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="اسم العائلة السابق" he="שם משפחה קודם" /></div><input className={styles.inputBase} name="oldLastName" defaultValue={defaults.oldLastName} /></div>
          </div>

          {/* Screen 2 - הוספנו padding-top: 40px */}
          <div style={{ display: screen === 2 ? 'block' : 'none', paddingTop: '40px' }}>
            <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div></div>
            <div className={styles.fieldGroup}>
              <div className={styles.label}><BiInline ar="الجنس" he="מין" /></div>
              <div className={styles.selectionRow}>
                <label className={styles.selectionLabel}>
                  <input type="radio" name="gender" value="male" defaultChecked={defaults.gender === "male"} />
                  <span className={styles.selectionSpan}><BiInline ar="ذكر" he="זכר" /></span>
                </label>
                <label className={styles.selectionLabel}>
                  <input type="radio" name="gender" value="female" defaultChecked={defaults.gender === "female"} />
                  <span className={styles.selectionSpan}><BiInline ar="أنثى" he="נקבה" /></span>
                </label>
              </div>
            </div>
            <DateField labelAr="تاريخ الميلاد" labelHe="תאריך לידה" namePrefix="birthDate" defaultParts={defaults.birth} />
            <CountrySelect defaultValue={defaults.nationality} name="nationality" labelAr="الجنسية" labelHe="אזרחות" />
            <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="رقم بطاقة الهوية" he="מספר תעודת זהות" /></div><input className={styles.inputBase} name="israeliId" defaultValue={defaults.israeliId} inputMode="numeric" /></div>
          </div>

          {/* Screen 3 - הוספנו padding-top: 40px */}
          <div style={{ display: screen === 3 ? 'block' : 'none', paddingTop: '40px' }}>
            <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="جواز السفر" he="דרכון" /></div></div>
            <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="رقم جواز السفر" he="מספר דרכון" /></div><input className={styles.inputBase} name="passportNumber" defaultValue={defaults.passportNumber} /></div>
            <DateField labelAr="تاريخ إصدار جواز السفر" labelHe="תאריך הוצאת דרכון" namePrefix="passportIssueDate" defaultParts={defaults.passIssue} />
            <DateField labelAr="تاريخ انتهاء جواز السفر" labelHe="תאריך פקיעת דרכון" namePrefix="passportExpiryDate" defaultParts={defaults.passExp} />
            <CountrySelect defaultValue={defaults.passportIssueCountry} name="passportIssueCountry" labelAr="بلد إصدار جواز السفر" labelHe="ארץ הוצאת דרכון" />
          </div>

          {/* Screen 4 - הוספנו padding-top: 40px */}
          <div style={{ display: screen === 4 ? 'block' : 'none', paddingTop: '40px' }}>
            <div className={styles.titleBlock} style={{textAlign: 'right', marginTop: 0, marginBottom: 16}}>
                <h2 className={styles.formTitle} style={{fontSize: 20}}><BiInline ar="وسائل الاتصال" he="דרכי התקשרות" /></h2>
                <p className={styles.formSubtitle}><BiInline ar="المسجّلون في وزارة الداخلية" he="הרשומים במשרד הפנים" /></p>
            </div>

            <PhoneField labelAr="هاتف" labelHe="טלפון נייד  *" name="phone" defaultValue={defaults.phone} prefixes={MOBILE_PREFIXES} />
            <PhoneField labelAr="هاتف أرضي" labelHe="טלפון קווי" name="landline" defaultValue="" prefixes={LANDLINE_PREFIXES} />

            <div className={styles.fieldGroup}>
              <div className={styles.label}><BiInline ar="بريد إلكتروني" he="אימייל" /> <span>*</span> </div>
              <input className={styles.inputBase} name="email" defaultValue={defaults.email} inputMode="email" style={{direction: 'ltr', textAlign: 'right', pointerEvents: 'none'}} placeholder="example@email.com" />
            </div>
          </div>
          
          {/* כפתורים למסכים 1-4 */}
          <div className={styles.fixedFooter}>
             <button type={screen === 4 ? "submit" : "button"} onClick={screen === 4 ? undefined : goNext} className={styles.btnPrimary}>
               <BiInline ar={screen === 4 ? "إنهاء المرحلة" : "التالي"} he={screen === 4 ? "סיום שלב" : "המשך"} />
             </button>
             <button type="button" onClick={handleSaveDraft} className={styles.btnSecondary}>
               <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
             </button>
          </div>
        </form>
      )}

      {/* --- Screen 5: Summary (שמירת שדות מפוצלים He/Ar) --- */}
      {screen === 5 && (
        <form className={styles.scrollableContent} action={saveAndNextAction} style={{paddingTop: 0}}>
          
          <div className={styles.reviewHeader}>
            <div className={styles.reviewTitle}><BiInline ar="نهاية المرحلة " he="סוף שלב 1" /></div>
            <div className={styles.summarySub} style={{ lineHeight: '1.6' }}>
                يرجى التحقق من صحة التفاصيل وترجمتها
                <br />
                אנא וודא/י כי כל הפרטים ותרגומם נכונים
            </div>
          </div>

          {/* 1. שדות מתורגמים (שמות) - ראשונים */}
          {renderTranslatedField("firstName", "الاسم الشخصي", "שם פרטי")}
          {renderTranslatedField("lastName", "اسم العائلة", "שם משפחה")}
          {renderTranslatedField("oldFirstName", "الاسم الشخصي السابق", "שם פרטי קודם")}
          {renderTranslatedField("oldLastName", "اسم العائلة السابق", "שם משפחה קודם")}

          {/* 2. שדות רגילים לפי סדר המילוי */}

          {/* מגדר */}
          {formDataState.gender && (
             <div className={styles.fieldGroup}>
               <div className={styles.label}><BiInline ar="الجنس" he="מין" /></div>
               <input className={styles.inputBase} value={formDataState.gender === 'male' ? 'זכר / ذكر' : formDataState.gender === 'female' ? 'נקבה / أنثى' : formDataState.gender} readOnly style={{pointerEvents: 'none'}} />
             </div>
          )}

          {/* תאריך לידה */}
          {formDataState.birthDate && (
            <div className={styles.fieldGroup}>
              <div className={styles.label}><BiInline ar="تاريخ الميلاد" he="תאריך לידה" /></div>
              <div className={styles.readOnlyWrapper}>
                <Image src="/images/calendar.svg" alt="cal" width={24} height={24} className={styles.calendarIcon} />
                <input className={styles.inputBase} value={formDataState.birthDate.split('-').reverse().join('.')} readOnly style={{paddingLeft: 50, direction: 'ltr', textAlign: 'right', pointerEvents: 'none'}} />
              </div>
            </div>
          )}

          {/* אזרחות */}
          {formDataState.nationality && (
             <div className={styles.fieldGroup}>
               <div className={styles.label}><BiInline ar="الجنسية" he="אזרחות" /></div>
               <input className={styles.inputBase} value={formDataState.nationality} readOnly style={{pointerEvents: 'none'}} />
             </div>
          )}

          {/* תעודת זהות */}
          {formDataState.israeliId && (
            <div className={styles.fieldGroup}>
              <div className={styles.label}><BiInline ar="رقم الهوية" he="ת.ז ישראלית" /></div>
              <input className={styles.inputBase} value={formDataState.israeliId} readOnly style={{direction: 'ltr', textAlign: 'right', pointerEvents: 'none'}} />
            </div>
          )}

          {/* דרכון */}
          {formDataState.passportNumber && (
            <div className={styles.fieldGroup}>
              <div className={styles.label}><BiInline ar="رقم جواز السفر" he="מספר דרכון" /></div>
              <input className={styles.inputBase} value={formDataState.passportNumber} readOnly style={{direction: 'ltr', textAlign: 'right', pointerEvents: 'none'}} />
            </div>
          )}

          {/* טלפון */}
          {formDataState.phone && (
            <div className={styles.fieldGroup}>
              <div className={styles.label}><BiInline ar="هاتف" he="טלפון נייד" /></div>
              <input className={styles.inputBase} value={formDataState.phone} readOnly style={{direction: 'ltr', textAlign: 'left', pointerEvents: 'none'}} />
            </div>
          )}

          {/* אימייל */}
          {formDataState.email && (
            <div className={styles.fieldGroup}>
              <div className={styles.label}><BiInline ar="بريد إلكتروني" he="אימייל" /></div>
              <input className={styles.inputBase} value={formDataState.email} readOnly style={{direction: 'ltr', textAlign: 'left', pointerEvents: 'none'}} />
            </div>
          )}

          {/* Hidden Inputs */}
          <input type="hidden" name="gender" value={formDataState.gender || ""} />
          <input type="hidden" name="birthDate" value={formDataState.birthDate || ""} />
          <input type="hidden" name="nationality" value={formDataState.nationality || ""} />
          <input type="hidden" name="israeliId" value={formDataState.israeliId || ""} />
          <input type="hidden" name="passportNumber" value={formDataState.passportNumber || ""} />
          <input type="hidden" name="passportIssueDate" value={formDataState.passportIssueDate || ""} />
          <input type="hidden" name="passportExpiryDate" value={formDataState.passportExpiryDate || ""} />
          <input type="hidden" name="passportIssueCountry" value={formDataState.passportIssueCountry || ""} />
          <input type="hidden" name="phone" value={formDataState.phone || ""} />
          <input type="hidden" name="email" value={formDataState.email || ""} />

          <div className={styles.fixedFooter}>
             <button type="submit" className={styles.btnPrimary}><BiInline ar="موافقة" he="אישור וסיום" /></button>
             <button type="button" onClick={() => setScreen(4)} className={styles.btnSecondary}><BiInline ar="تعديل" he="חזור לעריכה" /></button>
          </div>
        </form>
      )}
    </div>
  );
}
