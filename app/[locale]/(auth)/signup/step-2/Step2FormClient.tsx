"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "@/lib/styles/IntakeForm.module.css";
import { countriesList } from "@/lib/geo/countries"; 
import { translateStep2Data } from "@/app/[locale]/(auth)/signup/actions"; 

const PLANE_IMAGE = "/images/step2-intro-plane.svg";

const VISA_OPTIONS = [
  { value: "A/1", label: "A/1/א/أ" },
  { value: "A/2", label: "A/2/א/أ" },
  { value: "A/3", label: "A/3/א/أ" },
  { value: "A/4", label: "A/4/א/أ" },
  { value: "A/5", label: "A/5/א/أ" },
  { value: "B/1", label: "B/1/ב/ب" },
  { value: "B/2", label: "B/2/ב/ب" },
  { value: "B/3", label: "B/3/ב/ب" },
  { value: "B/4", label: "B/4/ב/ب" },
];

type DateParts = { y: string; m: string; d: string };

type Props = {
  locale: string;
  saved: boolean;
  defaults: {
    residenceCountry: string;
    residenceCity: string;
    residenceAddress: string;
    visaType: string;
    visaStartDate: DateParts;
    visaEndDate: DateParts;
    entryDate: DateParts;
  };
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
};

// --- Helpers ---
function partsToIso(p: DateParts) {
  if (!p.y || !p.m || !p.d) return "";
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
function getVisaLabel(value: string) {
  const option = VISA_OPTIONS.find(o => o.value === value);
  return option ? option.label : value;
}
function getCountryLabel(value: string) {
  if (!value) return "";
  const c = countriesList.find((o: any) => o.iso2 === value || o.he === value || o.originalName === value);
  return c ? `${c.ar} ${c.he}` : value;
}

// --- Components ---

/**
 * רכיב בחירה מותאם אישית שנראה בדיוק כמו האינפוטים בשלב 1
 * משתמש ב-CSS הקיים ללא שינוי
 */
function CustomSelect({ 
  options, 
  defaultValue, 
  name, 
  labelAr, 
  labelHe 
}: { 
  options: {value: string, label: string}[], 
  defaultValue: string, 
  name: string, 
  labelAr: string, 
  labelHe: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVal, setSelectedVal] = useState(defaultValue);

  // מציאת הטקסט לתצוגה
  const displayLabel = useMemo(() => {
    const found = options.find(o => o.value === selectedVal);
    return found ? found.label : "";
  }, [selectedVal, options]);

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.comboboxWrap}>
        {/*
           מדמה את ה-Input של שלב 1.
           השתמשנו ב-readOnly כדי שלא יפתח מקלדת, אבל בלחיצה יפתח את התפריט.
        */}
        <input
          type="text"
          className={styles.inputBase}
          value={displayLabel}
          placeholder="اختر / בחר" // הפלייסהולדר שביקשת
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          style={{ cursor: 'pointer', caretColor: 'transparent' }} // נראה כמו כפתור
        />
        
        {/* אייקון חץ קטן כדי שיהיה ברור שזה נפתח (אופציונלי, אבל עוזר ליוזר) */}
        <div style={{
            position: 'absolute', 
            left: '20px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            pointerEvents: 'none',
            opacity: 0.5
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <input type="hidden" name={name} value={selectedVal} />
        
        {isOpen && (
          <ul className={styles.comboboxMenu}>
             {/* אופציה ראשונה לביטול בחירה או כותרת */}
             <li 
                className={styles.comboboxItem} 
                onMouseDown={() => { setSelectedVal(""); setIsOpen(false); }}
                style={{ color: '#9CA3AF' }}
             >
               اختر / בחר
             </li>
            {options.map((opt) => (
              <li 
                key={opt.value} 
                className={styles.comboboxItem} 
                onMouseDown={() => { setSelectedVal(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DateField({ labelHe, labelAr, namePrefix, defaultParts, placeholder }: { 
  labelHe?: string; labelAr?: string; namePrefix: string; defaultParts: DateParts; placeholder?: string 
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
    <div className={styles.fieldGroup} style={{marginBottom: 0}}> 
      {(labelHe || labelAr) && <div className={styles.label}><BiInline ar={labelAr!} he={labelHe!} /></div>}
      
      <div className={styles.dateWrapper} onClick={openPicker}>
        <Image 
          src="/images/calendar.svg" 
          alt="Calendar" 
          width={24} 
          height={24} 
          className={styles.calendarIcon}
          style={{ left: '12px' }} 
          priority
        />
        <input 
          ref={inputRef} 
          className={styles.dateInput} 
          type="date" 
          value={iso} 
          onChange={(e) => setIso(e.target.value)} 
          lang="he-IL" 
          style={{ paddingLeft: '40px', fontSize: '15px' }} 
        />
        {!iso && placeholder && (
           <span style={{
             position: 'absolute', 
             right: 55, 
             top: '50%', 
             transform: 'translateY(-50%)', 
             color: '#9CA3AF', 
             pointerEvents: 'none',
             fontSize: '14px',
             fontWeight: 500
           }}>
             {placeholder}
           </span>
        )}
      </div>
      <input type="hidden" name={`${namePrefix}_y`} value={parts.y} />
      <input type="hidden" name={`${namePrefix}_m`} value={parts.m} />
      <input type="hidden" name={`${namePrefix}_d`} value={parts.d} />
      <input type="hidden" name={namePrefix} value={iso} />
    </div>
  );
}

// שים לב: כאן השתמשנו באותו מבנה בדיוק של Step1 עבור בחירת מדינה
function CountrySelect({ defaultValue, name, labelAr, labelHe }: { defaultValue: string, name: string, labelAr: string, labelHe: string }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIso, setSelectedIso] = useState(defaultValue);

  useEffect(() => {
    if (defaultValue) {
      const found = countriesList.find((c: any) => c.iso2 === defaultValue || c.he === defaultValue || c.originalName === defaultValue);
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
          placeholder="اختر دولة  בחר מדינה" 
          value={query} 
          onChange={e => { setQuery(e.target.value); setIsOpen(true); setSelectedIso(e.target.value); }} 
          onFocus={() => setIsOpen(true)} 
          onBlur={() => setTimeout(() => setIsOpen(false), 200)} 
        />
        <input type="hidden" name={name} value={selectedIso} />
        {isOpen && filtered.length > 0 && (
          <ul className={styles.comboboxMenu}>
            {filtered.map((c: any, i: number) => (
              <li key={i} className={styles.comboboxItem} onMouseDown={() => { setQuery(`${c.ar} ${c.he}`); setSelectedIso(c.he || c.iso2); setIsOpen(false); }}>
                <span>{c.he}</span><span>{c.ar}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function Step2FormClient({ locale, saved, defaults, saveDraftAction, saveAndNextAction }: Props) {
  const [screen, setScreen] = useState<number>(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [formDataState, setFormDataState] = useState<any>({});
  const [translations, setTranslations] = useState<any>({});
  const formRef = useRef<HTMLFormElement>(null);
  
  const progress = useMemo(() => {
    if (screen === 1) return 0;
    if (screen === 2) return 50;
    if (screen > 2) return 100;
    return 0;
  }, [screen]);

  const goNext = () => setScreen(s => Math.min(3, s + 1));
  const goBack = () => setScreen(s => Math.max(0, s - 1));

  // Cities logic
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  
  useEffect(() => {
     if (defaults.residenceCountry) {
        const c = countriesList.find((x: any) => x.he === defaults.residenceCountry || x.iso2 === defaults.residenceCountry);
        if (c) setSelectedCountryCode(c.iso2);
     }
  }, [defaults.residenceCountry]);

  const fetchCities = async (q: string) => {
    if (q.length < 2) return;
    try {
      const url = selectedCountryCode 
         ? `/api/geo/cities?country=${selectedCountryCode}&q=${q}`
         : `/api/geo/cities?q=${q}`;
      const res = await fetch(url);
      const data = await res.json();
      setCityOptions(data.items || []);
    } catch (e) { console.error(e); }
  };

  const handleFinishStep2 = async (e?: any) => {
    e?.preventDefault();
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    const currentData: any = {};
    formData.forEach((value, key) => { currentData[key] = value; });
    setFormDataState(currentData);
    
    setIsTranslating(true);
    try {
      const translatedResult = await translateStep2Data(formData, locale);
      setTranslations(translatedResult || {});
      setScreen(3);
    } catch (error) { 
        console.error(error); 
        setTranslations({}); 
        setScreen(3); 
    } finally { 
        setIsTranslating(false); 
    }
  };

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
          {/* תיקון: עדכון מימדים לפי פיגמה */}
          <Image 
            src={PLANE_IMAGE} 
            alt="Plane" 
            width={290} 
            height={134} 
            className={styles.stepSplashImage} 
            priority 
          />
          <div className={styles.stepSplashContent}>
            <div className={styles.stepNumberTitle}>
                <span>المرحلة 2</span><span>שלב 2</span>
            </div>
            <div className={styles.stepMainTitle}>
                <span>الوضع القانوني</span><span>מעמד</span>
            </div>
            <div className={styles.stepDescription}>
                <p dir="rtl">بهالمرحلة بنسأل عن بلد الأصل والوصول لإسرائيل<br/>الوقت المتوقع للتعبئة: 2 دقيقة</p>
                <br/>
                <p dir="rtl">בשלב זה נעסוק בארץ המקור ובעלייה לישראל<br/>זמן מילוי משוער: 2 דקות</p>
            </div>
          </div>
          <button type="button" className={styles.btnDark} onClick={goNext}><BiInline ar="ابدأ" he="התחל" /></button>
        </div>
      )}

      {/* Main Form Screens */}
      {screen > 0 && screen < 3 && (
        <form 
            ref={formRef} 
            className={styles.scrollableContent} 
            onSubmit={(e) => e.preventDefault()} 
        >
            <div 
                className={styles.topBar} 
                // כאן אנחנו דורסים את ה-Padding של ה-CSS (24px) ושמים 20px כמו בפיגמה
                style={{ paddingRight: '20px', paddingLeft: '20px' }}
            >
                <div className={styles.topRow}>
                    <button type="button" className={styles.backBtn} onClick={goBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                    {/* הטקסט הזה יזוז ימינה בגלל שינוי ה-Padding למעלה */}
                    <div className={styles.stepMeta}><span>المرحلة 2 من 7</span> <span>שלב 2 מתוך 7</span></div>
                </div>
                
                {/* חישוב רוחב הבר הכתום בהתאם ל-Padding החדש (20px):
                   רוחב = 100% + 40px (פעמיים 20)
                   מרג'ין = -20px כדי לצאת החוצה עד הקצה
                */}
                <div 
                    className={styles.progressBarTrack} 
                    style={{ width: 'calc(100% + 40px)', marginRight: '-20px', marginLeft: '-20px' }}
                >
                    <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
                </div>
                
                <div className={styles.titleBlock}>
                    <h1 className={styles.formTitle}><BiInline ar="الوضع القانوني" he="מעמד" /></h1>
                </div>
            </div>

            {/* Screen 1: Migration */}
            <div style={{ display: screen === 1 ? 'block' : 'none', paddingTop: '40px' }}>
                <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="الهجرة" he="הגירה" /></div></div>
                
                <CountrySelect 
                    labelAr="بلد الميلاد" 
                    labelHe="ארץ לידה" 
                    name="residenceCountry" 
                    defaultValue={defaults.residenceCountry} 
                />
                
                <div className={styles.fieldGroup}>
                    <div className={styles.label}><BiInline ar="مدينة الميلاد" he="עיר לידה" /></div>
                    <input 
                        className={styles.inputBase} 
                        name="residenceCity" 
                        defaultValue={defaults.residenceCity} 
                        placeholder="أدخل المدينة  הזן עיר " 
                        onChange={(e) => fetchCities(e.target.value)} 
                        list="city-suggestions" 
                    />
                    <datalist id="city-suggestions">
                        {cityOptions.map((c, i) => <option key={i} value={c.he || c.originalName}>{c.ar}</option>)}
                    </datalist>
                </div>
                
                <div className={styles.fieldGroup}>
                    <div className={styles.label}><BiInline ar="هدف الإقامة في البلاد" he="מטרת שהייה בארץ" /></div>
                    <input className={styles.inputBase} name="residenceAddress" defaultValue={defaults.residenceAddress} />
                </div>
                
                <div className={styles.fixedFooter}>
                    <button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button>
                    <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}><BiInline ar="حفظ كمسودة" he="שמור כטיוטה" /></button>
                </div>
            </div>

            {/* Screen 2: Visa */}
            <div style={{ display: screen === 2 ? 'block' : 'none' }}>
                <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="التأشيرة" he="אשרה" /></div></div>
                
                {/* תיקון: שימוש ב-CustomSelect החדש במקום <select>.
                    זה מבטיח שהעיצוב ייראה בדיוק כמו CountrySelect משלב 1,
                    וכולל את האופציה "בחר" כברירת מחדל.
                */}
                <CustomSelect 
                    labelAr="نوع التأشيرة"
                    labelHe="סוג אשרה"
                    name="visaType"
                    defaultValue={defaults.visaType}
                    options={VISA_OPTIONS}
                />

                {/* Visa Dates Range */}
                <div className={styles.fieldGroup}>
                    <div className={styles.label}><BiInline ar="توقيف" he="תוקף" /></div>
                    
                    <div className={styles.dateRangeRow}>
                        <div className={styles.dateRangeItem}>
                            <DateField namePrefix="visaStartDate" defaultParts={defaults.visaStartDate} />
                        </div>
                        <div className={styles.dateSeparator}>-</div>
                        <div className={styles.dateRangeItem}>
                            <DateField namePrefix="visaEndDate" defaultParts={defaults.visaEndDate} />
                        </div>
                    </div>
                </div>

                <DateField 
                    labelAr="تاريخ الدخول إلى البلاد" 
                    labelHe="תאריך כניסה לארץ" 
                    namePrefix="entryDate" 
                    defaultParts={defaults.entryDate} 
                />
                
                <div className={styles.fixedFooter}>
                    <button type="button" className={styles.btnPrimary} onClick={handleFinishStep2}>
                        <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
                    </button>
                    <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}>
                        <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                    </button>
                </div>
            </div>
        </form>
      )}

      {/* Screen 3: Summary */}
      {screen === 3 && (
        <form className={styles.scrollableContent} action={saveAndNextAction} style={{paddingTop: 0}}>
            <div className={styles.reviewHeader}>
                <div className={styles.reviewTitle}>
                    <span>نهاية المرحلة 2</span><span>סוף שלב 2</span>
                </div>
                <div className={styles.summarySub} style={{ lineHeight: '1.6' }}>
                    يرجى التحقق من صحة التفاصيل وترجمتها
                    <br />
                    אנא וודא/י כי כל הפרטים ותרגומם נכונים
                </div>
            </div>

            {[
              { key: "residenceCity", labelAr: "مدينة الميلاد", labelHe: "עיר לידה" },
              { key: "residenceAddress", labelAr: "هدف الإقامة", labelHe: "מטרת שהייה" },
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
                       <div className={styles.transOriginal} 
                         style={{ justifyContent: 'flex-start' }} >{data.original}</div>
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
            
            {/* Read Only Fields - Country */}
            {formDataState.residenceCountry && (
              <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="بلد الميلاد" he="ארץ לידה" /></div>
                <input className={styles.readOnlyInput} defaultValue={getCountryLabel(formDataState.residenceCountry)} readOnly />
              </div>
            )}

            {/* Read Only Fields - Visa Type */}
            {formDataState.visaType && (
              <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="نوع التأشيرة" he="סוג אשרה" /></div>
                <input className={styles.readOnlyInput} defaultValue={getVisaLabel(formDataState.visaType)} readOnly />
              </div>
            )}

            {/* Read Only Fields - Dates */}
            {(formDataState.visaStartDate || formDataState.visaEndDate) && (
              <div className={styles.fieldGroup}>
                 <div className={styles.label}><BiInline ar="توقيف" he="תוקף אשרה" /></div>
                 <div className={styles.dateRangeRow}>
                    <div className={styles.dateRangeItem}>
                        <div className={styles.readOnlyWrapper}>
                            <Image src="/images/calendar.svg" alt="cal" width={24} height={24} className={styles.calendarIcon} style={{ left: '12px' }} />
                            <input className={styles.readOnlyInput} defaultValue={formatDateDisplay(formDataState.visaStartDate)} readOnly style={{paddingLeft: 40, direction: 'ltr', textAlign: 'right', fontSize: 15}} />
                        </div>
                    </div>
                    <span className={styles.dateSeparator}>-</span>
                    <div className={styles.dateRangeItem}>
                        <div className={styles.readOnlyWrapper}>
                            <Image src="/images/calendar.svg" alt="cal" width={24} height={24} className={styles.calendarIcon} style={{ left: '12px' }} />
                            <input className={styles.readOnlyInput} defaultValue={formatDateDisplay(formDataState.visaEndDate)} readOnly style={{paddingLeft: 40, direction: 'ltr', textAlign: 'right', fontSize: 15}} />
                        </div>
                    </div>
                 </div>
              </div>
            )}

            {formDataState.entryDate && (
               <div className={styles.fieldGroup}>
                 <div className={styles.label}><BiInline ar="تاريخ الدخول" he="תאריך כניסה" /></div>
                 <div className={styles.readOnlyWrapper}>
                    <Image src="/images/calendar.svg" alt="cal" width={24} height={24} className={styles.calendarIcon} style={{ left: '12px' }} />
                    <input className={styles.readOnlyInput} defaultValue={formatDateDisplay(formDataState.entryDate)} readOnly style={{paddingLeft: 40, direction: 'ltr', textAlign: 'right', fontSize: 15}} />
                 </div>
               </div>
            )}

            <input type="hidden" name="residenceCountry" value={formDataState.residenceCountry || ""} />
            <input type="hidden" name="visaType" value={formDataState.visaType || ""} />
            <input type="hidden" name="visaStartDate" value={formDataState.visaStartDate || ""} />
            <input type="hidden" name="visaEndDate" value={formDataState.visaEndDate || ""} />
            <input type="hidden" name="entryDate" value={formDataState.entryDate || ""} />

            <div className={styles.fixedFooter}>
                <button type="submit" className={styles.btnPrimary}><BiInline ar="موافقة" he="אישור וסיום" /></button>
                <button type="button" onClick={() => setScreen(2)} className={styles.btnSecondary}><BiInline ar="تعديل" he="חזור לעריכה" /></button>
            </div>
        </form>
      )}
    </div>
  );
}
