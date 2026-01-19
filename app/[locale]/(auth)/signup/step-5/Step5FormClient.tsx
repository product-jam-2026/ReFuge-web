"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import styles from "@/lib/styles/IntakeForm.module.css";
import { countriesList } from "@/lib/geo/countries"; 
import { translateStep5Data } from "@/app/[locale]/(auth)/signup/actions"; 

const INTRO_IMAGE = "/images/step5-intro-parent.svg";
const TOTAL_SCREENS = 4; // מסכי מילוי

// --- Phone Prefixes ---
const MOBILE_PREFIXES = [
  { label: "ישראל (+972) – إسرائيل", value: "+972" },
  { label: "רשות פלסטינית (+970) – فلسطين", value: "+970" },
  { label: "ארה\"ב (+1) – الولايات المتحدة", value: "+1" },
];

type Props = {
  locale: string;
  saved: boolean;
  defaults: any;
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
};

// --- Helpers ---
function partsToIso(p: { y: string; m: string; d: string }) {
  if (!p || !p.y || !p.m || !p.d) return "";
  return `${p.y}-${p.m.padStart(2, "0")}-${p.d.padStart(2, "0")}`;
}
function isoToParts(iso: string) {
  if (!iso) return { y: "", m: "", d: "" };
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { y: "", m: "", d: "" };
  return { y: m[1], m: m[2], d: m[3] };
}
function formatDateDisplay(iso: string) {
  if (!iso) return "";
  return iso.split('-').reverse().join('.');
}
function BiInline({ ar, he }: { ar: string; he: string }) {
  return (
    <>
      <span>{ar}</span>
      <span>{he}</span>
    </>
  );
}
function getCountryLabel(value: string) {
  if (!value) return "";
  const c = countriesList.find((o: any) => o.iso2 === value || o.he === value || o.originalName === value);
  return c ? `${c.ar} ${c.he}` : value;
}

// --- Components ---

function DateField({ labelHe, labelAr, namePrefix, defaultParts, isoValue }: { 
  labelHe: string; labelAr: string; namePrefix: string; defaultParts: {y:string, m:string, d:string}; isoValue?: string 
}) {
  const initialIso = isoValue || partsToIso(defaultParts);
  const [iso, setIso] = useState<string>(initialIso);
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
        <Image src="/images/calendar.svg" alt="Calendar" width={24} height={24} className={styles.calendarIcon} style={{left:'12px'}} priority />
        <input 
          ref={inputRef} 
          className={styles.dateInput} 
          type="date" 
          value={iso} 
          onChange={(e) => setIso(e.target.value)} 
          lang="he-IL" 
          style={{paddingLeft:'40px', fontSize: '15px'}}
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

  useState(() => {
      if (defaultValue) {
        const found = countriesList.find((c: any) => c.iso2 === defaultValue || c.he === defaultValue);
        if (found) setQuery(`${found.ar} ${found.he}`);
        else setQuery(defaultValue);
      }
  });

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
          placeholder="اختر دولة בחר מדינה" 
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

// --- Main Component ---
export default function Step5FormClient({ locale, saved, defaults, saveDraftAction, saveAndNextAction, saveDraftAndBackAction }: Props) {
  const [screen, setScreen] = useState<number>(0);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const [formDataState, setFormDataState] = useState<any>({});
  const [translations, setTranslations] = useState<any>({});

  const formRef = useRef<HTMLFormElement>(null);

  const progress = useMemo(() => {
    if (screen === 0) return 0;
    if (screen > TOTAL_SCREENS) return 100;
    return Math.round((screen / TOTAL_SCREENS) * 100);
  }, [screen]);

  const goNext = () => setScreen(s => Math.min(TOTAL_SCREENS + 1, s + 1));
  const goBack = () => setScreen(s => Math.max(0, s - 1));

  const handleFinishStep5 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const currentData: any = {};
    formData.forEach((value, key) => { currentData[key] = value; });
    setFormDataState(currentData);

    setIsTranslating(true);

    try {
      const translatedResult = await translateStep5Data(formData, locale);
      setTranslations(translatedResult || {});
      setScreen(TOTAL_SCREENS + 1);
    } catch (error) {
      console.error("Translation error:", error);
      setScreen(TOTAL_SCREENS + 1);
    } finally {
      setIsTranslating(false);
    }
  };

  // פונקציית עזר לשמירת הערכים בעת חזרה אחורה: בודקת קודם ב-State ואז ב-Defaults
  const val = (key: string) => formDataState[key] || defaults[key];

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

      {/* Intro Screen */}
      {screen === 0 && (
        <div className={styles.stepSplashContainer}>
          <Image src={INTRO_IMAGE} alt="Family" width={280} height={280} className={styles.stepSplashImage} priority />
          <div className={styles.stepSplashContent}>
            <div className={styles.stepNumberTitle}><span>المرحلة</span><span>שלב 5</span></div>
            <div className={styles.stepMainTitle}><span>أم/أب أولادي</span><span>הורה נוסף</span></div>
            <div className={styles.stepDescription}>
                <p dir="rtl">بهالمرحلة لازم تعبي تفاصيل شخصية عن الوالد الثاني للطفل<br/>الوقت المتوقع للتعبئة: 5 دقيقة</p>
                <br/>
                <p dir="rtl">בשלב זה יש למלא פרטים אישיים על ההורה השני לילד<br/>זמן מילוי משוער: 5 דקות</p>
            </div>
          </div>
          <button type="button" className={styles.btnDark} onClick={goNext}><BiInline ar="ابدأ" he="התחל" /></button>
        </div>
      )}

      {/* --- FORM 1: Input Screens (1-4) --- */}
      {screen > 0 && screen <= TOTAL_SCREENS && (
        <>
          {/* Top Bar (Outside Form) */}
          <div className={styles.topBar}>
            <div className={styles.topRow} style={{justifyContent: 'flex-start'}}>
               <button type="button" className={styles.backBtn} onClick={goBack}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
               <div className={styles.stepMeta} style={{marginRight: 10}}><span>المرحلة 5 من 7</span> <span>שלב 5 מתוך 7</span></div>
            </div>
            <div className={styles.progressBarTrack}><div className={styles.progressBarFill} style={{ width: `${progress}%` }} /></div>
            <div className={styles.titleBlock}>
                <h1 className={styles.formTitle} style={{justifyContent:'flex-start', fontSize: '19px'}}><BiInline ar="بيانات الزوج/الزوجة" he="פרטי ההורה הנוסף" /></h1>
                <p className={styles.formSubtitle}><BiInline ar="كما هو مدون في جواز السفر" he="כפי שרשומים בדרכון" /></p>
            </div>
          </div>

          <form 
            ref={formRef} 
            className={styles.scrollableContent} 
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Screen 1: Names */}
            <div style={{ display: screen === 1 ? 'block' : 'none', paddingTop: '40px' }}>
              <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div></div>
              <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="الاسم الشخصي" he="שם פרטי" /></div><input name="firstName" defaultValue={val("firstName")} className={styles.inputBase} /></div>
              <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="اسم العائلة" he="שם משפחה" /></div><input name="lastName" defaultValue={val("lastName")} className={styles.inputBase} /></div>
              <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="الاسم الشخصي السابق" he="שם פרטי קודם" /></div><input name="oldFirstName" defaultValue={val("oldFirstName")} className={styles.inputBase} /></div>
              <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="اسم العائلة السابق" he="שם משפחה קודם" /></div><input name="oldLastName" defaultValue={val("oldLastName")} className={styles.inputBase} /></div>
              <div className={styles.fixedFooter}>
                  <button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button>
                  <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}><BiInline ar="حفظ كمسودة" he="שמור כטיוטה" /></button>
              </div>
            </div>

            {/* Screen 2: Details */}
            <div style={{ display: screen === 2 ? 'block' : 'none', paddingTop: '40px' }}>
              <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div></div>
              <div className={styles.fieldGroup}>
                  <div className={styles.label}><BiInline ar="الجنس" he="מין" /></div>
                  <div className={styles.selectionRow}>
                      <label className={styles.selectionLabel}>
                      <input type="radio" name="gender" value="male" defaultChecked={val("gender") === "male"} />
                      <span className={styles.selectionSpan}><BiInline ar="ذكر" he="זכר" /></span>
                      </label>
                      <label className={styles.selectionLabel}>
                      <input type="radio" name="gender" value="female" defaultChecked={val("gender") === "female"} />
                      <span className={styles.selectionSpan}><BiInline ar="أنثى" he="נקבה" /></span>
                      </label>
                  </div>
              </div>
              <DateField labelAr="تاريخ الميلاد" labelHe="תאריך לידה" namePrefix="birthDate" defaultParts={defaults.birthDate} isoValue={formDataState.birthDate} />
              <CountrySelect defaultValue={val("nationality")} name="nationality" labelAr="الجنسية" labelHe="אזרחות" />
              <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="رقم بطاقة الهوية" he="מספר תעודת זהות" /></div><input name="israeliId" defaultValue={val("israeliId")} className={styles.inputBase} inputMode="numeric" /></div>
              <div className={styles.fixedFooter}>
                  <button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button>
                  <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}><BiInline ar="حفظ كمسودة" he="שמור כטיוטה" /></button>
              </div>
            </div>

            {/* Screen 3: Passport */}
            <div style={{ display: screen === 3 ? 'block' : 'none', paddingTop: '40px' }}>
              <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="جواز السفر" he="דרכון" /></div></div>
              <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="رقم جواز السفر" he="מספר דרכון" /></div><input name="passportNumber" defaultValue={val("passportNumber")} className={styles.inputBase} /></div>
              <DateField labelAr="تاريخ إصدار جواز السفر" labelHe="תאריך הוצאת דרכון" namePrefix="passportIssueDate" defaultParts={defaults.passportIssueDate} isoValue={formDataState.passportIssueDate} />
              <DateField labelAr="تاريخ انتهاء جواز السفر" labelHe="תאריך פקיעת דרכון" namePrefix="passportExpiryDate" defaultParts={defaults.passportExpiryDate} isoValue={formDataState.passportExpiryDate} />
              <CountrySelect defaultValue={val("passportIssueCountry")} name="passportIssueCountry" labelAr="بلد إصدار جواز السفر" labelHe="ארץ הוצאת דרכון" />
              <div className={styles.fixedFooter}>
                  <button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button>
                  <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}><BiInline ar="حفظ كمسودة" he="שמור כטיוטה" /></button>
              </div>
            </div>

            {/* Screen 4: Contact */}
            <div style={{ display: screen === 4 ? 'block' : 'none', paddingTop: '40px' }}>
              <div className={styles.titleBlock} style={{textAlign: 'right', marginTop: 0}}>
                  <h2 className={styles.formTitle} style={{fontSize: 20}}><BiInline ar="وسائل الاتصال" he="דרכי התקשרות" /></h2>
              </div>

              <PhoneField labelAr="هاتف" labelHe="טלפון נייד" name="phone" defaultValue={val("phone")} prefixes={MOBILE_PREFIXES} />

              <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="بريد إلكتروني" he="אימייל" /></div>
                <input name="email" defaultValue={val("email")} className={styles.inputBase} inputMode="email" style={{direction: 'ltr', textAlign: 'left'}} placeholder="example@email.com" />
              </div>

              <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={handleFinishStep5}>
                  <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
                </button>
                <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}>
                  <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                </button>
              </div>
            </div>
          </form>
        </>
      )}

      {/* --- FORM 2: Screen 5 (Summary) - Allows Submit --- */}
      {screen === 5 && (
        <form className={styles.scrollableContent} action={saveAndNextAction} style={{paddingTop: 0}}>
          
          <div className={styles.reviewHeader}>
            <div className={styles.reviewTitle}>
               <span>نهاية المرحلة</span><span>סוף שלב 5</span>
            </div>
            <div className={styles.summarySub} style={{ lineHeight: '1.6' }}>
               <span>يرجى التحقق من صحة التفاصيل وترجمتها</span>
               <br />
               <span>אנא וודא/י כי כל הפרטים ותרגומם נכונים</span>
            </div>
          </div>

          {/* 1. Translated Names */}
          {[
            { key: "firstName", labelAr: "الاسم الشخصي", labelHe: "שם פרטי" },
            { key: "lastName", labelAr: "اسم العائلة", labelHe: "שם משפחה" },
            { key: "oldFirstName", labelAr: "الاسم الشخصي السابق", labelHe: "שם פרטי קודם" },
            { key: "oldLastName", labelAr: "اسم العائلة السابق", labelHe: "שם משפחה קודם" },
          ].map((field) => {
            const data = translations[field.key];
            if (!data || !data.original) return null;

            const isHeToAr = data.direction === "he-to-ar";
            const originalName = isHeToAr ? `${field.key}He` : `${field.key}Ar`;
            const translatedName = isHeToAr ? `${field.key}Ar` : `${field.key}He`;

            return (
              <div className={styles.fieldGroup} key={field.key} style={{marginBottom: 16}}>
                <div className={styles.label}><BiInline ar={field.labelAr} he={field.labelHe} /></div>
                
                <div className={styles.translationPill}>
                   <div className={styles.transOriginal}>{data.original}</div>
                   <input type="hidden" name={originalName} value={data.original} />
                   
                   <div className={styles.transTranslated}>
                     <input className={styles.inputBase} 
                            style={{
                                background: 'transparent', 
                                border: 'none', 
                                fontWeight: 700, 
                                padding: 0, 
                                height: 'auto', 
                                textAlign: 'right'
                            }} 
                            defaultValue={data.translated} name={translatedName} 
                     />
                   </div>
                </div>
                <input type="hidden" name={field.key} value={data.original} />
              </div>
            );
          })}

          {/* 2. Read Only Details */}
          <div className={styles.sectionHead} style={{marginTop: 30}}>
             <div className={styles.sectionTitle}><BiInline ar="تفاصيل إضافية" he="פרטים נוספים" /></div>
          </div>

          <div className={styles.fieldGroup}>
             <div className={styles.label}><BiInline ar="الجنس" he="מין" /></div>
             <input className={styles.readOnlyInput} 
                value={formDataState.gender === 'male' ? 'זכר  ذكر' : formDataState.gender === 'female' ? 'נקבה  أنثى' : ''} 
                readOnly 
             />
          </div>

          {formDataState.birthDate && (
            <div className={styles.fieldGroup}>
               <div className={styles.label}><BiInline ar="تاريخ الميلاد" he="תאריך לידה" /></div>
               <div className={styles.readOnlyWrapper}>
                  <Image src="/images/calendar.svg" alt="cal" width={24} height={24} className={styles.calendarIcon} style={{ left: '12px' }} />
                  <input className={styles.readOnlyInput} value={formatDateDisplay(formDataState.birthDate)} readOnly style={{paddingLeft: 40, direction: 'ltr', textAlign: 'right'}} />
               </div>
            </div>
          )}

          {formDataState.nationality && (
             <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="الجنسية" he="אזרחות" /></div>
                <input className={styles.readOnlyInput} value={getCountryLabel(formDataState.nationality)} readOnly />
             </div>
          )}

          {formDataState.israeliId && (
             <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="رقم بطاقة الهوية" he="מספר תעודת זהות" /></div>
                <input className={styles.readOnlyInput} value={formDataState.israeliId} readOnly style={{direction: 'ltr', textAlign: 'right'}} />
             </div>
          )}

          {/* 3. Passport Details */}
          {formDataState.passportNumber && (
             <>
                <div className={styles.sectionHead} style={{marginTop: 30}}>
                   <div className={styles.sectionTitle}><BiInline ar="جواز السفر" he="דרכון" /></div>
                </div>
                <div className={styles.fieldGroup}>
                   <div className={styles.label}><BiInline ar="رقم جواز السفر" he="מספר דרכון" /></div>
                   <input className={styles.readOnlyInput} value={formDataState.passportNumber} readOnly style={{direction: 'ltr', textAlign: 'right'}} />
                </div>
                <div className={styles.fieldGroup}>
                   <div className={styles.label}><BiInline ar="تاريخ إصدار جواز السفر" he="תאריך הוצאת דרכון" /></div>
                   <input className={styles.readOnlyInput} value={formatDateDisplay(formDataState.passportIssueDate)} readOnly style={{direction: 'ltr', textAlign: 'right'}} />
                </div>
                <div className={styles.fieldGroup}>
                   <div className={styles.label}><BiInline ar="تاريخ انتهاء جواز السفر" he="תאריך פקיעת דרכון" /></div>
                   <input className={styles.readOnlyInput} value={formatDateDisplay(formDataState.passportExpiryDate)} readOnly style={{direction: 'ltr', textAlign: 'right'}} />
                </div>
                <div className={styles.fieldGroup}>
                   <div className={styles.label}><BiInline ar="بلد إصدار جواز السفر" he="ארץ הוצאת דרכון" /></div>
                   <input className={styles.readOnlyInput} value={getCountryLabel(formDataState.passportIssueCountry)} readOnly />
                </div>
             </>
          )}

          {/* 4. Contact Details */}
          <div className={styles.sectionHead} style={{marginTop: 30}}>
             <div className={styles.sectionTitle}><BiInline ar="وسائل الاتصال" he="דרכי התקשרות" /></div>
          </div>
          <div className={styles.fieldGroup}>
             <div className={styles.label}><BiInline ar="هاتف" he="טלפון נייד" /></div>
             <input className={styles.readOnlyInput} value={formDataState.phone} readOnly style={{direction: 'ltr', textAlign: 'left'}} />
          </div>
          <div className={styles.fieldGroup}>
             <div className={styles.label}><BiInline ar="بريد إلكتروني" he="אימייל" /></div>
             <input className={styles.readOnlyInput} value={formDataState.email} readOnly style={{direction: 'ltr', textAlign: 'left'}} />
          </div>

          {/* Hidden Fields for Submit */}
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