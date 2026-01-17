"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import styles from "./step1.module.css";
import { countriesList } from "@/lib/geo/countries"; 
import { translateStep1Data } from "@/app/[locale]/(auth)/signup/actions"; 

const HAND_IMAGE = "/images/step1-intro-hand.svg";

// --- Phone Prefixes ---
const MOBILE_PREFIXES = [
  { label: "🇮🇱 ישראל (+972)", value: "+972" },
  { label: "🇵🇸 רשות פלסטינית (+970)", value: "+970" },
  { label: "🇺🇸 ארה\"ב (+1)", value: "+1" },
  { label: "🇺🇦 אוקראינה (+380)", value: "+380" },
  { label: "🇷🇺 רוסיה (+7)", value: "+7" },
  { label: "🇬🇧 בריטניה (+44)", value: "+44" },
  { label: "🇫🇷 צרפת (+33)", value: "+33" },
  { label: "🇪🇹 אתיופיה (+251)", value: "+251" },
  { label: "🇪🇷 אריתריאה (+291)", value: "+291" },
  { label: "🇸🇩 סודאן (+249)", value: "+249" },
];

const LANDLINE_PREFIXES = [
  { label: "02 (ירושלים)", value: "02" },
  { label: "03 (תל אביב)", value: "03" },
  { label: "04 (חיפה והצפון)", value: "04" },
  { label: "08 (השפלה והדרום)", value: "08" },
  { label: "09 (השרון)", value: "09" },
  { label: "077 (כללי)", value: "077" },
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
    <div className={styles.field}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.dateWrap} onClick={openPicker}>
        <svg className={styles.calendarIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <input ref={inputRef} className={`${styles.dateInput} ${!iso ? styles.isEmpty : ""}`} type="date" value={iso} onChange={(e) => setIso(e.target.value)} lang="he-IL" />
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
    <div className={styles.field}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.comboboxWrap}>
        <input 
          type="text" 
          className={styles.comboboxInput} 
          placeholder="בחר מדינה... / اختر دولة..." 
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
    <div className={styles.field}>
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
            <ul className={styles.phoneDropdown}>
              {prefixes.map(p => (
                <li key={p.value} className={styles.phoneItem} onMouseDown={() => { setPrefix(p.value); setIsOpen(false); }}>
                  {p.label}
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
export default function Step1FormClient({ saved, defaults, saveDraftAction, saveAndNextAction }: Props) {
  const [screen, setScreen] = useState<number>(0);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [formDataState, setFormDataState] = useState<any>({});
  const [translations, setTranslations] = useState<any>({});

  const formRef = useRef<HTMLFormElement>(null);

  const progress = useMemo(() => screen <= 0 ? 0 : Math.min(100, Math.round((screen / 7) * 100)), [screen]);
  const goNext = () => setScreen(s => Math.min(5, s + 1));
  const goBack = () => setScreen(s => Math.max(0, s - 1));

  const handleFinishStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const currentData: any = {};
    formData.forEach((value, key) => { currentData[key] = value; });
    setFormDataState(currentData);

    setIsTranslating(true);

    try {
      const translatedResult = await translateStep1Data(formData);
      setTranslations(translatedResult);
      setScreen(5);
    } catch (error) {
      console.error("Translation error:", error);
      setScreen(5);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className={styles.wrap} dir="rtl">
      
      {isTranslating && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText} style={{marginTop: 20}}>
             <p style={{fontSize: 18, fontWeight: 'bold'}}>מתרגם את הנתונים...</p>
             <p style={{fontSize: 14, color: '#666'}}>جارٍ ترجمة البيانات...</p>
          </div>
        </div>
      )}

      {screen === 0 && (
        <div className={styles.introFull}>
          <Image src={HAND_IMAGE} alt="Hand" width={280} height={280} className={styles.introHandImage} priority />
          <div className={styles.introContent}>
            <h1 className={styles.introTitle}><BiInline ar="المرحلة 1" he="שלב 1" /></h1>
            <h2 className={styles.introSubtitle}><BiInline ar="تفاصيل شخصية" he="פרטים אישיים" /></h2>
            <div className={styles.introBody}><p dir="rtl">بهالمرحلة بنطلب منك تدخل معلومات أساسية للتعريف<br/>الوقت المتوقع للتعبئة: 8 دقيقة</p><p dir="rtl">בשלב זה תתבקשו להזין מידע בסיסי לצורך זיהוי<br/>זמן מילוי משוער: 8 דקות</p></div>
          </div>
          <button type="button" className={styles.introButton} onClick={goNext}><BiInline ar="ابدأ" he="התחל" /></button>
        </div>
      )}

      {screen > 0 && screen < 5 && (
        <form 
          ref={formRef} 
          className={styles.form} 
          onSubmit={(e) => {
             if (screen === 4) handleFinishStep1(e);
          }}
        >
          <div className={styles.headerArea}>
            <div className={styles.topRow}>
               <button type="button" className={styles.backBtn} onClick={goBack}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
               <div className={styles.stepMeta}><span>المرحلة 1 من 7</span><span> | </span><span>שלב 1 מתוך 7</span></div>
            </div>
            <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
            <div className={styles.titleBlock}><div className={styles.h1}><BiInline ar="البيانات الشخصية" he="פרטים אישיים" /></div><div className={styles.subtitle}><BiInline ar="كما هو مدون في جواز السفر" he="כפי שרשומים בדרכון" /></div></div>
          </div>

          {/* Screen 1 */}
          <div className={screen === 1 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div></div>
            <div className={styles.field}><div className={styles.label}><BiInline ar="اسم العائلة" he="שם משפחה" /></div><input name="lastName" defaultValue={defaults.lastName} /></div>
            <div className={styles.field}><div className={styles.label}><BiInline ar="الاسم الشخصي" he="שם פרטי" /></div><input name="firstName" defaultValue={defaults.firstName} /></div>
            <div className={styles.field}><div className={styles.label}><BiInline ar="اسم العائلة السابق" he="שם משפחה קודם" /></div><input name="oldLastName" defaultValue={defaults.oldLastName} /></div>
            <div className={styles.field}><div className={styles.label}><BiInline ar="الاسم الشخصي السابق" he="שם פרטי קודם" /></div><input name="oldFirstName" defaultValue={defaults.oldFirstName} /></div>
            <div className={styles.actions}><button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button><button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}><BiInline ar="حفظ كمسودة" he="שמור כטיוטה" /></button></div>
          </div>

          {/* Screen 2 */}
          <div className={screen === 2 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div></div>
            <div className={styles.field}><div className={styles.label}><BiInline ar="الجنس" he="מין" /></div><div className={styles.genderRow}><label className={styles.pillRadio}><input type="radio" name="gender" value="male" defaultChecked={defaults.gender === "male"} /><span><BiInline ar="ذكر" he="זכר" /></span></label><label className={styles.pillRadio}><input type="radio" name="gender" value="female" defaultChecked={defaults.gender === "female"} /><span><BiInline ar="أنثى" he="נקבה" /></span></label></div></div>
            <DateField labelAr="تاريخ الميلاد" labelHe="תאריך לידה" namePrefix="birthDate" defaultParts={defaults.birth} />
            <CountrySelect defaultValue={defaults.nationality} name="nationality" labelAr="الجنسية" labelHe="אזרחות" />
            <div className={styles.field}><div className={styles.label}><BiInline ar="رقم الهوية الإسرائيلية" he="מספר תעודת זהות ישראלית" /></div><input name="israeliId" defaultValue={defaults.israeliId} inputMode="numeric" /></div>
            <div className={styles.actions}><button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button><button type="button" onClick={goBack} className={styles.btnSecondary}><BiInline ar="سابق" he="חזור" /></button></div>
          </div>

          {/* Screen 3 */}
          <div className={screen === 3 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="جواز السفر" he="דרכון" /></div></div>
            <div className={styles.field}><div className={styles.label}><BiInline ar="رقم جواز السفر" he="מספר דרכון" /></div><input name="passportNumber" defaultValue={defaults.passportNumber} /></div>
            <DateField labelAr="تاريخ إصدار جواز السفر" labelHe="תאריך הוצאת דרכון" namePrefix="passportIssueDate" defaultParts={defaults.passIssue} />
            <DateField labelAr="تاريخ انتهاء جواز السفر" labelHe="תאריך פקיעת דרכון" namePrefix="passportExpiryDate" defaultParts={defaults.passExp} />
            <CountrySelect defaultValue={defaults.passportIssueCountry} name="passportIssueCountry" labelAr="بلد إصدار جواز السفر" labelHe="ארץ הוצאת דרכון" />
            <div className={styles.actions}><button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button><button type="button" onClick={goBack} className={styles.btnSecondary}><BiInline ar="سابق" he="חזור" /></button></div>
          </div>

          {/* Screen 4 */}
          <div className={screen === 4 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
              <div className={styles.titleBlock} style={{textAlign: 'right', marginTop: 0}}>
                <div className={styles.h1} style={{fontSize: 18}}><BiInline ar="وسائل الاتصال" he="דרכי התקשרות" /></div>
                <div className={styles.subtitle}><BiInline ar="المسجّلون في وزارة الداخلية" he="הרשומים במשרד הפנים" /></div>
              </div>
            </div>

            <PhoneField labelAr="هاتف" labelHe="טלפון נייד" name="phone" defaultValue={defaults.phone} prefixes={MOBILE_PREFIXES} />
            <PhoneField labelAr="هاتف أرضي" labelHe="טלפון קווי" name="landline" defaultValue="" prefixes={LANDLINE_PREFIXES} />

            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="بريد إلكتروني" he="אימייל" /></div>
              <input name="email" defaultValue={defaults.email} inputMode="email" style={{direction: 'ltr', textAlign: 'left'}} placeholder="example@email.com" />
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.btnPrimary}>
                <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
              </button>
              <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}>
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* --- Screen 5: Summary (שמירת שדות מפוצלים He/Ar) --- */}
      {screen === 5 && (
        <form className={styles.form} action={saveAndNextAction}>
          
          <div className={styles.summaryHeader}>
            <div className={styles.summaryTitle}>
               <BiInline ar="نهاية المرحلة 1" he="סוף שלב 1" />
            </div>
            <div className={styles.summarySub}>
               <BiInline ar="يرجى التحقق من صحة التفاصيل وترجمتها" he="אנא וודא/י כי כל הפרטים ותרגומם נכונים" />
            </div>
          </div>

          {/* הוסרה הכותרת "כללי" לבקשתך */}

          {/* --- חלק 1: שדות שמות (מפוצלים - עברית/ערבית) --- */}
          {[
            { key: "lastName", labelAr: "اسم العائلة", labelHe: "שם משפחה" },
            { key: "firstName", labelAr: "الاسم الشخصي", labelHe: "שם פרטי" },
            { key: "oldLastName", labelAr: "اسم العائلة السابق", labelHe: "שם משפחה קודם" },
            { key: "oldFirstName", labelAr: "الاسم الشخصي السابق", labelHe: "שם פרטי קודם" },
          ].map((field) => {
            const data = translations[field.key];
            if (!data || !data.original) return null;

            const isHeToAr = data.direction === "he-to-ar";
            const originalName = isHeToAr ? `${field.key}He` : `${field.key}Ar`;
            const translatedName = isHeToAr ? `${field.key}Ar` : `${field.key}He`;

            return (
              <div className={styles.summaryPair} key={field.key}>
                <div className={styles.summaryPairLabel}>
                   <span>{field.labelAr} / {field.labelHe}</span>
                </div>
                
                <div className={styles.summaryInputs}>
                   {/* שדה המקור */}
                   <input 
                     className={styles.originalInput} 
                     defaultValue={data.original} 
                     readOnly tabIndex={-1}
                   />
                   <input type="hidden" name={originalName} value={data.original} />
                   
                   {/* שדה התרגום */}
                   <input 
                     className={styles.translatedInput} 
                     defaultValue={data.translated} 
                     name={translatedName} 
                   />
                </div>
                <input type="hidden" name={field.key} value={data.original} />
              </div>
            );
          })}

          {/* --- חלק 2: שאר השדות (קריאה בלבד) --- */}

          {/* תאריך לידה */}
          {formDataState.birthDate && (
            <div className={styles.summaryField}>
              <div className={styles.label}><BiInline ar="تاريخ الميلاد" he="תאריך לידה" /></div>
              <div className={styles.readOnlyInputWrap}>
                <svg className={`${styles.fieldIcon} ${styles.fieldIconLeft}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <input 
                  className={styles.readOnlyInput} 
                  value={formDataState.birthDate.split('-').reverse().join('.')} 
                  readOnly 
                  style={{paddingLeft: 50, direction: 'ltr', textAlign: 'right'}} 
                />
              </div>
            </div>
          )}

          {/* אזרחות */}
          {formDataState.nationality && (
             <div className={styles.summaryField}>
               <div className={styles.label}><BiInline ar="الجنسية" he="אזרחות" /></div>
               <div className={styles.readOnlyInputWrap}>
                 <svg className={`${styles.fieldIcon} ${styles.fieldIconLeft}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                 <input className={styles.readOnlyInput} value={formDataState.nationality} readOnly />
               </div>
             </div>
          )}

           {/* מין */}
           {formDataState.gender && (
             <div className={styles.summaryField}>
               <div className={styles.label}><BiInline ar="الجنس" he="מין" /></div>
               <div className={styles.readOnlyInputWrap}>
                  <input 
                    className={styles.readOnlyInput} 
                    value={
                      formDataState.gender === 'male' ? 'זכר / ذكر' : 
                      formDataState.gender === 'female' ? 'נקבה / أنثى' : formDataState.gender
                    } 
                    readOnly 
                  />
               </div>
             </div>
          )}

          {/* תעודת זהות */}
          {formDataState.israeliId && (
            <div className={styles.summaryField}>
              <div className={styles.label}><BiInline ar="رقم الهوية" he="ת.ז ישראלית" /></div>
              <div className={styles.readOnlyInputWrap}>
                <input 
                  className={styles.readOnlyInput} 
                  value={formDataState.israeliId} 
                  readOnly 
                  style={{direction: 'ltr', textAlign: 'right'}}
                />
              </div>
            </div>
          )}

          {/* דרכון */}
          {formDataState.passportNumber && (
            <div className={styles.summaryField}>
              <div className={styles.label}><BiInline ar="رقم جواز السفر" he="מספר דרכון" /></div>
              <div className={styles.readOnlyInputWrap}>
                 <input 
                   className={styles.readOnlyInput} 
                   value={formDataState.passportNumber} 
                   readOnly 
                   style={{direction: 'ltr', textAlign: 'right'}}
                  />
              </div>
            </div>
          )}

          {/* טלפון */}
          {formDataState.phone && (
            <div className={styles.summaryField}>
              <div className={styles.label}><BiInline ar="هاتف" he="טלפון נייד" /></div>
              <div className={styles.readOnlyInputWrap}>
                 <input 
                   className={styles.readOnlyInput} 
                   value={formDataState.phone} 
                   readOnly 
                   style={{direction: 'ltr', textAlign: 'left'}} // מוצג משמאל לימין
                  />
              </div>
            </div>
          )}

          {/* אימייל */}
          {formDataState.email && (
            <div className={styles.summaryField}>
              <div className={styles.label}><BiInline ar="بريد إلكتروني" he="אימייל" /></div>
              <div className={styles.readOnlyInputWrap}>
                 <input 
                   className={styles.readOnlyInput} 
                   value={formDataState.email} 
                   readOnly 
                   style={{direction: 'ltr', textAlign: 'left'}} // מוצג משמאל לימין
                  />
              </div>
            </div>
          )}

          {/* Hidden Inputs for Form Submission */}
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

          <div className={styles.actions}>
             <button type="submit" className={styles.btnPrimary}>
               <BiInline ar="موافقة" he="אישור וסיום" />
             </button>
             <button type="button" onClick={() => setScreen(4)} className={styles.btnSecondary}>
               <BiInline ar="تعديل" he="חזור לעריכה" />
             </button>
          </div>

        </form>
      )}
    </div>
  );
}