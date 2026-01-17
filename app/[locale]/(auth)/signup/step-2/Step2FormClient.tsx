"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./step2.module.css";
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
function BiInline({ ar, he }: { ar: string; he: string }) {
  return (<><span>{ar}</span><span>{he}</span></>);
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

function DateField({ labelHe, labelAr, namePrefix, defaultParts, placeholder, isSmall }: any) {
  const [iso, setIso] = useState<string>(partsToIso(defaultParts));
  const inputRef = useRef<HTMLInputElement>(null);
  const parts = useMemo(() => isoToParts(iso), [iso]);
  const openPicker = () => { try { inputRef.current?.showPicker?.() || inputRef.current?.focus(); } catch(e) {} };
  return (
    <div className={styles.field} style={isSmall ? { marginBottom: 0 } : {}}>
      {(labelHe || labelAr) && <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>}
      <div className={styles.dateWrap} onClick={openPicker}>
        <svg className={`${styles.calendarIcon} ${isSmall ? styles.calendarIconSmall : ''}`} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <input ref={inputRef} className={`${styles.inputControl} ${styles.dateInput} ${isSmall ? styles.dateInputSmall : ''}`} type="date" value={iso} onChange={(e) => setIso(e.target.value)} lang="he-IL" />
        {!iso && placeholder && <div style={{position:'absolute', right: isSmall ? 35 : 50, top:'50%', transform:'translateY(-50%)', color:'#999', pointerEvents:'none', fontSize: isSmall ? 14 : 16}}>{placeholder}</div>}
      </div>
      <input type="hidden" name={`${namePrefix}_y`} value={parts.y} />
      <input type="hidden" name={`${namePrefix}_m`} value={parts.m} />
      <input type="hidden" name={`${namePrefix}_d`} value={parts.d} />
      <input type="hidden" name={namePrefix} value={iso} />
    </div>
  );
}

function AutoComplete({ labelAr, labelHe, name, defaultValue, options, onSelect, placeholder }: any) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  useEffect(() => {
    if (defaultValue && options.length > 0) {
      const found = options.find((o: any) => o.iso2 === defaultValue || o.he === defaultValue || o.originalName === defaultValue);
      setQuery(found ? `${found.ar} ${found.he}` : defaultValue);
    } else if (defaultValue) setQuery(defaultValue);
  }, [defaultValue, options]);
  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((c: any) => (c.he?.includes(query) || c.ar?.includes(query) || c.originalName?.toLowerCase().includes(query.toLowerCase())));
  }, [query, options]);
  return (
    <div className={styles.field}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.comboboxWrap}>
        <input type="text" className={styles.inputControl} placeholder={placeholder || "בחר..."} value={query} onChange={e => { setQuery(e.target.value); setIsOpen(true); setSelectedValue(e.target.value); if (onSelect) onSelect(null); }} onFocus={() => setIsOpen(true)} onBlur={() => setTimeout(() => setIsOpen(false), 200)} />
        <input type="hidden" name={name} value={selectedValue} />
        {isOpen && filtered.length > 0 && (
          <ul className={styles.comboboxMenu}>
            {filtered.map((c: any, i: number) => (
              <li key={i} className={styles.comboboxItem} onMouseDown={() => { const display = `${c.ar} ${c.he}`; setQuery(display); setSelectedValue(c.he || c.originalName || c.iso2); setIsOpen(false); if (onSelect) onSelect(c); }}>
                <span>{c.he}</span><span>{c.ar}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SelectField({ labelAr, labelHe, name, defaultValue, options, placeholder }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedValue, setSelectedValue] = useState(defaultValue);
  useEffect(() => { const found = options.find((o: any) => o.value === defaultValue); if (found) setSelectedLabel(found.label); }, [defaultValue, options]);
  return (
    <div className={styles.field}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.comboboxWrap}>
        <div className={styles.selectButton} onClick={() => setIsOpen(!isOpen)} onBlur={() => setTimeout(() => setIsOpen(false), 200)} tabIndex={0}>
          <span>{selectedLabel || placeholder || "בחר / اختر"}</span>
          <svg className={styles.selectArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <input type="hidden" name={name} value={selectedValue} />
        {isOpen && (
          <ul className={styles.comboboxMenu}>
            {options.map((opt: any, i: number) => (
              <li key={i} className={styles.comboboxItem} onMouseDown={() => { setSelectedLabel(opt.label); setSelectedValue(opt.value); setIsOpen(false); }}><span>{opt.label}</span></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function Step2FormClient({ saved, defaults, saveDraftAction, saveAndNextAction }: Props) {
  const [screen, setScreen] = useState<number>(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [formDataState, setFormDataState] = useState<any>({});
  const [translations, setTranslations] = useState<any>({});
  const formRef = useRef<HTMLFormElement>(null);
  
  const progress = useMemo(() => screen === 0 ? 0 : Math.min(100, Math.round(((screen + 4) / 7) * 20)), [screen]);
  const goNext = () => setScreen(s => Math.min(3, s + 1));
  const goBack = () => setScreen(s => Math.max(0, s - 1));

  // Cities logic
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const handleCountrySelect = (country: any) => { if (country?.iso2) { setSelectedCountryCode(country.iso2); setCityOptions([]); } else setSelectedCountryCode(null); };
  const fetchCities = async (q: string) => {
    if (!selectedCountryCode || q.length < 2) return;
    try {
      const res = await fetch(`/api/geo/cities?country=${selectedCountryCode}&q=${q}`);
      const data = await res.json();
      setCityOptions(data.items || []);
    } catch (e) { console.error(e); }
  };

  const handleFinishStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const currentData: any = {};
    formData.forEach((value, key) => { currentData[key] = value; });
    setFormDataState(currentData);
    setIsTranslating(true);
    try {
      const translatedResult = await translateStep2Data(formData);
      setTranslations(translatedResult || {});
      setScreen(3);
    } catch (error) { console.error(error); setTranslations({}); setScreen(3); } finally { setIsTranslating(false); }
  };

  return (
    <div className={styles.wrap} dir="rtl">
      {isTranslating && <div className={styles.loadingOverlay}><div className={styles.spinner}></div><div className={styles.loadingText} style={{marginTop: 20}}>מתרגם נתונים...</div></div>}
      
      {screen === 0 && (
        <div className={styles.introFull}>
          <Image src={PLANE_IMAGE} alt="Plane" width={320} height={150} className={styles.introImage} priority />
          <div className={styles.introContent}>
            <h1 className={styles.introTitle}><BiInline ar="المرحلة 2" he="שלב 2" /></h1>
            <h2 className={styles.introSubtitle}><BiInline ar="الوضع القانوني" he="מעמד" /></h2>
            <div className={styles.introBody}><p dir="rtl">بهالمرحلة بنسأل عن بلد الأصل والوصول لإسرائيل<br/>الوقت المتوقع للتعبئة: 2 دقيقة</p><p dir="rtl" style={{marginTop: 8}}>בשלב זה נעסוק בארץ המקור ובעלייה לישראל<br/>זמן מילוי משוער: 2 דקות</p></div>
          </div>
          <button type="button" className={styles.introButton} onClick={goNext}><BiInline ar="ابدأ" he="התחל" /></button>
        </div>
      )}

      {/* Main Form Container */}
      <form ref={formRef} className={styles.form} action={saveAndNextAction} onSubmit={(e) => { if (screen === 2) handleFinishStep2(e); }}>
        
        {screen > 0 && (
          <div className={styles.headerArea}>
            <div className={styles.topRow}>
               <button type="button" className={styles.backBtn} onClick={goBack}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
               <div className={styles.stepMeta}><span>المرحلة 2 من 7</span><span> | </span><span>שלב 2 מתוך 7</span></div>
            </div>
            <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
            <div className={styles.titleBlock}>
                {screen === 3 ? (
                    <div className={styles.h1}><BiInline ar="نهاية المرحلة 2" he="סוף שלב 2" /></div>
                ) : (
                    <div className={styles.h1}><BiInline ar="الوضع القانوني" he="מעמד" /></div>
                )}
            </div>
          </div>
        )}

        {/* Screen 1: Migration */}
        <div style={{ display: screen === 1 ? 'block' : 'none' }}>
          <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="الهجرة" he="הגירה" /></div></div>
          <AutoComplete labelAr="بلد الميلاد" labelHe="ארץ לידה" name="residenceCountry" defaultValue={defaults.residenceCountry} options={countriesList} onSelect={handleCountrySelect} placeholder="اختر / בחר" />
          <div className={styles.field}>
            <div className={styles.label}><BiInline ar="مدينة الميلاد" he="עיר לידה" /></div>
            <input className={styles.inputControl} name="residenceCity" defaultValue={defaults.residenceCity} placeholder="הזן עיר..." onChange={(e) => fetchCities(e.target.value)} list="city-suggestions" />
            <datalist id="city-suggestions">{cityOptions.map((c, i) => <option key={i} value={c.he || c.originalName}>{c.ar}</option>)}</datalist>
          </div>
          <div className={styles.field}><div className={styles.label}><BiInline ar="هدف الإقامة في البلاد" he="מטרת שהייה בארץ" /></div><input className={styles.inputControl} name="residenceAddress" defaultValue={defaults.residenceAddress} /></div>
          <div className={styles.actions}><button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button><button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}><BiInline ar="حفظ كمسودة" he="שמור כטיוטה" /></button></div>
        </div>

        {/* Screen 2: Visa */}
        <div style={{ display: screen === 2 ? 'block' : 'none' }}>
          <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="التأشيرة" he="אשרה" /></div></div>
          <SelectField labelAr="نوع التأشيرة" labelHe="סוג אשרה" name="visaType" defaultValue={defaults.visaType} options={VISA_OPTIONS} placeholder="اختر / בחר" />
          <div className={styles.field}><div className={styles.label}><BiInline ar="توقيف" he="תוקף" /></div>
            <div className={styles.dateRow}>
              <div className={styles.dateCol}><DateField namePrefix="visaEndDate" defaultParts={defaults.visaEndDate} placeholder="עד" isSmall={true} /></div><span style={{color: '#aaa', marginTop: 5}}>-</span>
              <div className={styles.dateCol}><DateField namePrefix="visaStartDate" defaultParts={defaults.visaStartDate} placeholder="מ" isSmall={true} /></div>
            </div>
          </div>
          <DateField labelAr="تاريخ الدخول إلى البلاد" labelHe="תאריך כניסה לארץ" namePrefix="entryDate" defaultParts={defaults.entryDate} />
          <div className={styles.actions}><button type="submit" className={styles.btnPrimary}><BiInline ar="إنهاء المرحلة" he="סיום שלב" /></button><button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}><BiInline ar="حفظ كمسودة" he="שמור כטיוטה" /></button></div>
        </div>

        {/* Screen 3: Summary */}
        <div style={{ display: screen === 3 ? 'block' : 'none' }}>
          <div className={styles.summarySub} style={{textAlign: 'center', marginBottom: 20}}><BiInline ar="يرجى التحقق من صحة الترجمة" he="אנא וודא/י כי התרגום האוטומטי נכון" /></div>
          
          {/* Country (Read-only) */}
          <div className={styles.summaryPair}>
             <div className={styles.summaryPairLabel}><span>بلد الميلاد / ארץ לידה</span></div>
             <input className={styles.readOnlyControl} defaultValue={getCountryLabel(formDataState.residenceCountry)} readOnly />
          </div>

          {/* City (Translated) */}
          <div className={styles.summaryPair}>
            <div className={styles.summaryPairLabel}><span>مدينة الميلاد / עיר לידה</span><span style={{fontSize: 10, opacity: 0.5}}>{translations['residenceCity']?.direction === "he-to-ar" ? "(עב->ער)" : "(ער->עב)"}</span></div>
            <div className={styles.summaryCard}>
                <input className={styles.originalInput} defaultValue={formDataState.residenceCity || ""} readOnly tabIndex={-1} />
                {translations['residenceCity'] ? (
                  <>
                    <input type="hidden" name={translations['residenceCity'].direction === "he-to-ar" ? "residenceCityHe" : "residenceCityAr"} value={formDataState.residenceCity} />
                    <input className={styles.translatedInput} defaultValue={translations['residenceCity'].translated} name={translations['residenceCity'].direction === "he-to-ar" ? "residenceCityAr" : "residenceCityHe"} />
                  </>
                ) : (
                  <input className={styles.translatedInput} defaultValue="" name="residenceCityHe" placeholder="תרגום..." />
                )}
            </div>
            <input type="hidden" name="residenceCity" value={formDataState.residenceCity} />
          </div>

          {/* Address (Translated) */}
          <div className={styles.summaryPair}>
            <div className={styles.summaryPairLabel}><span>هدف الإقامة / מטרת שהייה</span><span style={{fontSize: 10, opacity: 0.5}}>{translations['residenceAddress']?.direction === "he-to-ar" ? "(עב->ער)" : "(ער->עב)"}</span></div>
            <div className={styles.summaryCard}>
                <input className={styles.originalInput} defaultValue={formDataState.residenceAddress || ""} readOnly tabIndex={-1} />
                {translations['residenceAddress'] ? (
                  <>
                    <input type="hidden" name={translations['residenceAddress'].direction === "he-to-ar" ? "residenceAddressHe" : "residenceAddressAr"} value={formDataState.residenceAddress} />
                    <input className={styles.translatedInput} defaultValue={translations['residenceAddress'].translated} name={translations['residenceAddress'].direction === "he-to-ar" ? "residenceAddressAr" : "residenceAddressHe"} />
                  </>
                ) : (
                   <input className={styles.translatedInput} defaultValue="" name="residenceAddressHe" placeholder="תרגום..." />
                )}
            </div>
            <input type="hidden" name="residenceAddress" value={formDataState.residenceAddress} />
          </div>

          {/* Visa (Read-only) */}
          <div className={styles.summaryPair}>
             <div className={styles.summaryPairLabel}><span>نوع التأشيرة / סוג אשרה</span></div>
             <input className={styles.readOnlyControl} defaultValue={getVisaLabel(formDataState.visaType)} readOnly />
          </div>

          {/* Dates (Read-only) */}
          <div className={styles.summaryPair}>
            <div className={styles.summaryPairLabel}><span>توقيف / תוקף אשרה</span></div>
            <div style={{display:'flex', gap: 10, alignItems:'center'}}>
               <input className={styles.readOnlyControl} defaultValue={formDataState.visaEndDate} readOnly style={{textAlign:'center'}} />
               <span>-</span>
               <input className={styles.readOnlyControl} defaultValue={formDataState.visaStartDate} readOnly style={{textAlign:'center'}} />
            </div>
          </div>

          <div className={styles.summaryPair}>
             <div className={styles.summaryPairLabel}><span>تاريخ الدخول / תאריך כניסה</span></div>
             <input className={styles.readOnlyControl} defaultValue={formDataState.entryDate} readOnly style={{direction:'ltr'}} />
          </div>

          {/* Hidden Submit Data */}
          <input type="hidden" name="residenceCountry" value={formDataState.residenceCountry} />
          <input type="hidden" name="visaType" value={formDataState.visaType} />
          <input type="hidden" name="visaStartDate" value={formDataState.visaStartDate} />
          <input type="hidden" name="visaEndDate" value={formDataState.visaEndDate} />
          <input type="hidden" name="entryDate" value={formDataState.entryDate} />

          <div className={styles.actions}><button type="submit" className={styles.btnPrimary}><BiInline ar="موافقة" he="אישור וסיום" /></button><button type="button" onClick={() => setScreen(2)} className={styles.btnSecondary}><BiInline ar="تعديل" he="חזור לעריכה" /></button></div>
        </div>

      </form>
    </div>
  );
}