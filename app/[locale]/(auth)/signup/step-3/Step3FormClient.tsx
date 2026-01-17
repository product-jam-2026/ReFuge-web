"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import styles from "./step3.module.css";
import { translateStep3Data } from "@/app/[locale]/(auth)/signup/actions";

// --- Constants & Images ---
const FAMILY_IMAGE = "/images/step3-family.svg";

// --- Visual Helpers ---
function BiInline({ ar, he }: { ar: string; he: string }) {
  return (
    <div className={styles.biLine}>
      <span className={styles.biAr}>{ar}</span>
      <span className={styles.biHe}>{he}</span>
    </div>
  );
}

// --- DateField Component (כמו בשלב 1) ---
function DateField({ labelAr, labelHe, name, defaultValue }: { 
  labelAr: string; labelHe: string; name: string; defaultValue: string 
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    try {
      // מנסה לפתוח את הפיקר בצורה תכנותית
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
        <input 
          ref={inputRef}
          type="date" 
          name={name}
          defaultValue={defaultValue} 
          className={styles.dateInput} 
        />
      </div>
    </div>
  );
}

// --- Custom Select Component ---
function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholderAr = "اختر", 
  placeholderHe = "בחר" 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { value: string; labelAr: string; labelHe: string }[];
  placeholderAr?: string;
  placeholderHe?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={styles.customSelectWrap} ref={containerRef}>
      <div 
        className={styles.customSelectTrigger} 
        onClick={() => setIsOpen(!isOpen)}
        data-open={isOpen}
      >
        <span>
          {selectedOption ? (
            <BiInline ar={selectedOption.labelAr} he={selectedOption.labelHe} />
          ) : (
             <span style={{color: '#9CA3AF'}}>{placeholderAr} / {placeholderHe}</span>
          )}
        </span>
        <div className={styles.customSelectArrow} />
      </div>

      {isOpen && (
        <div className={styles.customSelectOptions}>
           {options.map((opt) => (
             <div 
               key={opt.value} 
               className={styles.customOption}
               data-selected={value === opt.value}
               onClick={() => {
                 onChange(opt.value);
                 setIsOpen(false);
               }}
             >
                <BiInline ar={opt.labelAr} he={opt.labelHe} />
             </div>
           ))}
        </div>
      )}
    </div>
  );
}

// --- GeoNames Fetcher ---
type CityOpt = { id: number; ar: string; he: string; label: string };

async function fetchCities(query: string): Promise<CityOpt[]> {
  const username = process.env.NEXT_PUBLIC_GEONAMES_USERNAME || "demo";
  const country = "IL"; 
  if (query.trim().length < 2) return [];
  const base = "https://secure.geonames.org/searchJSON";
  const url = `${base}?country=${country}&name_startsWith=${encodeURIComponent(query)}&maxRows=5&username=${username}&lang=en`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.geonames) return [];
    return data.geonames.map((item: any) => ({
      id: item.geonameId,
      ar: item.alternateNames?.find((n:any) => n.lang === 'ar')?.name || item.name,
      he: item.alternateNames?.find((n:any) => n.lang === 'he')?.name || item.name,
      label: item.name 
    }));
  } catch {
    return [];
  }
}

type Props = {
  locale: string;
  saved: boolean;
  defaults: any;
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
};

export default function Step3FormClient({
  saved,
  defaults,
  saveDraftAction,
  saveAndNextAction,
  saveDraftAndBackAction,
}: Props) {
  const [screen, setScreen] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);

  // --- Logic State ---
  const [maritalStatus, setMaritalStatus] = useState(defaults.maritalStatus || "");
  const showDate = maritalStatus === "married" || maritalStatus === "divorced";

  const [housingType, setHousingType] = useState(defaults.housingType || "");
  const [mailingDifferent, setMailingDifferent] = useState(defaults.mailingDifferent || false);
  
  // Employment Logic
  const [empStatus, setEmpStatus] = useState(defaults.employmentStatus || "");
  const [notWorkingSub, setNotWorkingSub] = useState(defaults.notWorkingSub || ""); 

  // Assets Logic
  const [assets, setAssets] = useState<string[]>(defaults.assets || []);
  const toggleAsset = (val: string) => {
    setAssets(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  // Cities
  const [regCityText, setRegCityText] = useState(defaults.regCity || "");
  const [regCityOpts, setRegCityOpts] = useState<CityOpt[]>([]);
  const [mailCityText, setMailCityText] = useState(defaults.mailingAddress?.city || "");
  const [mailCityOpts, setMailCityOpts] = useState<CityOpt[]>([]);

  // Summary Data
  const [formDataState, setFormDataState] = useState<any>({});
  const [translations, setTranslations] = useState<any>({});
  const formRef = useRef<HTMLFormElement>(null);

  // --- Effects ---
  useEffect(() => {
    if(regCityText.length < 2) return;
    const t = setTimeout(async () => {
      const res = await fetchCities(regCityText);
      setRegCityOpts(res.map(c => ({...c, label: `${c.ar} ${c.he}`})));
    }, 400);
    return () => clearTimeout(t);
  }, [regCityText]);

  useEffect(() => {
    if(mailCityText.length < 2) return;
    const t = setTimeout(async () => {
      const res = await fetchCities(mailCityText);
      setMailCityOpts(res.map(c => ({...c, label: `${c.ar} ${c.he}`})));
    }, 400);
    return () => clearTimeout(t);
  }, [mailCityText]);

  // --- Navigation ---
  const progress = useMemo(() => {
    if (screen === 0) return 0;
    return Math.round((screen / 6) * 100); 
  }, [screen]);

  const goNext = () => {
    if (screen === 2 && !mailingDifferent) {
      setScreen(4); 
    } else {
      setScreen(s => Math.min(6, s + 1));
    }
  };

  const goBack = () => {
    if (screen === 4 && !mailingDifferent) {
      setScreen(2); 
    } else {
      setScreen(s => Math.max(0, s - 1));
    }
  };

  const handleFinishStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const currentData: any = {};
    formData.forEach((value, key) => { currentData[key] = value; });
    currentData.assets = assets;
    
    setFormDataState(currentData);
    setIsTranslating(true);

    try {
      const translatedResult = await translateStep3Data(formData);
      setTranslations(translatedResult || {});
      setScreen(6);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslations({});
      setScreen(6);
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
             <BiInline ar="جاري الترجمة..." he="מתרגם נתונים..." />
          </div>
        </div>
      )}

      {/* Intro Screen (0) */}
      {screen === 0 && (
        <div className={styles.introFull}>
          <Image src={FAMILY_IMAGE} alt="Family" width={280} height={200} className={styles.introImage} priority />
          <div className={styles.introContent}>
            <h1 className={styles.introTitle}><BiInline ar="المرحلة 3" he="שלב 3" /></h1>
            <h2 className={styles.introSubtitle}><BiInline ar="مركز الحياة" he="מרכז חיים" /></h2>
            <div className={styles.introBody}>
               <p dir="rtl">بهالمرحلة بنسأل عن عنوان السكن، الشغل، والحالة العائلية<br/>الوقت المتوقع للتعبئة: 6 دقيقة</p>
               <p dir="rtl">שלב זה עוסק בכתובת מגורים, תעסוקה ומצב משפחתי<br/>זמן מילוי משוער: 6 דקות</p>
            </div>
          </div>
          <button type="button" className={styles.introButton} onClick={goNext}>
            <BiInline ar="ابدأ" he="התחל" />
          </button>
        </div>
      )}

      {/* Form Container */}
      <form 
        ref={formRef} 
        className={screen > 0 ? styles.form : styles.screenHide} 
        action={saveAndNextAction}
        onSubmit={(e) => {
            if (screen === 5) handleFinishStep3(e);
        }}
      >
        
        {screen < 6 && (
        <div className={styles.headerArea}>
            <div className={styles.topRow}>
               <button type="button" className={styles.backBtn} onClick={goBack}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
               </button>
               <div className={styles.stepMeta}><span>المرحلة 3 من 7</span><span> | </span><span>שלב 3 מתוך 7</span></div>
            </div>
            <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
            <div className={styles.titleBlock}>
                <div className={styles.h1}><BiInline ar="مركز الحياة" he="מרכז חיים" /></div>
            </div>
        </div>
        )}

        {/* --- Screen 1: Marital Status --- */}
        <div className={screen === 1 ? styles.screenShow : styles.screenHide}>
           <div className={styles.sectionHead}>
              <div className={styles.sectionTitle}><BiInline ar="الحالة الاجتماعية" he="מצב משפחתי" /></div>
           </div>
           
           <div className={styles.field}>
              <div className={styles.label}><BiInline ar="اختر" he="בחר" /></div>
              <CustomSelect 
                value={maritalStatus} 
                onChange={setMaritalStatus} 
                options={[
                  { value: "single", labelAr: "أعزب/ة", labelHe: "רווק/ה" },
                  { value: "married", labelAr: "متزوج/ة", labelHe: "נשוי/ה" },
                  { value: "divorced", labelAr: "مطلق/ة", labelHe: "גרוש/ה" },
                  { value: "widowed", labelAr: "أرمل/ة", labelHe: "אלמן/ה" },
                ]}
              />
              <input type="hidden" name="maritalStatus" value={maritalStatus} />
           </div>

           {showDate && (
              <DateField 
                labelAr={maritalStatus === "married" ? "تاريخ الزواج" : "تاريخ الطلاق"}
                labelHe={maritalStatus === "married" ? "תאריך נישואין" : "תאריך גירושין"}
                name="statusDate"
                defaultValue={defaults.statusDate}
              />
           )}

           <div className={styles.actions}>
              <button type="button" className={styles.btnPrimary} onClick={goNext}>
                <BiInline ar="التالي" he="המשך" />
              </button>
              <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}>
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
           </div>
        </div>

        {/* --- Screen 2: Residence Address --- */}
        <div className={screen === 2 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
               <div className={styles.sectionTitle}><BiInline ar="عنوان السكن" he="כתובת מגורים" /></div>
               <div className={styles.subtitle}><BiInline ar="المسجل في وزارة الداخلية" he="הרשומה במשרד הפנים" /></div>
            </div>

            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="مدينة" he="עיר" /></div>
              <input 
                list="regCities" 
                name="regCity" 
                value={regCityText}
                onChange={e => setRegCityText(e.target.value)}
                className={styles.inputControl}
                placeholder="اختر / בחר"
              />
              <datalist id="regCities">
                {regCityOpts.map(c => <option key={c.id} value={c.label} />)}
              </datalist>
            </div>

            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="شارع" he="רחוב" /></div>
              <input name="regStreet" defaultValue={defaults.regStreet} className={styles.inputControl} />
            </div>

            <div className={styles.field}>
              <div className={styles.gridRow}>
                 <div>
                   <div className={styles.label}><BiInline ar="منزل" he="בית" /></div>
                   <input name="regHouseNumber" defaultValue={defaults.regHouseNumber} className={styles.inputControl} />
                 </div>
                 <div>
                   <div className={styles.label}><BiInline ar="دخول" he="כניסה" /></div>
                   <input name="regEntry" defaultValue={defaults.regEntry} className={styles.inputControl} />
                 </div>
                 <div>
                   <div className={styles.label}><BiInline ar="شقة" he="דירה" /></div>
                   <input name="regApartment" defaultValue={defaults.regApartment} className={styles.inputControl} />
                 </div>
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="الرمز البريدي" he="מיקוד" /></div>
              <input name="regZip" defaultValue={defaults.regZip} className={styles.inputControl} inputMode="numeric" />
            </div>

            <div className={styles.field}>
                <div className={styles.label}><BiInline ar="شقة مستأجرة / بملكية" he="דירה שכורה / בבעלות" /></div>
                <CustomSelect
                  value={housingType}
                  onChange={setHousingType}
                  options={[
                    { value: "rented", labelAr: "شقة مستأجرة", labelHe: "דירה שכורה" },
                    { value: "owned", labelAr: "شقة بملكية", labelHe: "דירה בבעלות" },
                    { value: "other", labelAr: "آخر", labelHe: "אחר" }
                  ]}
                />
                <input type="hidden" name="housingType" value={housingType} />
            </div>

            <div className={styles.toggleSection}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={mailingDifferent} 
                    onChange={(e) => setMailingDifferent(e.target.checked)} 
                  />
                  <BiInline ar="عنوان المراسلات مختلف؟" he="כתובת למכתבים שונה?" />
                  <input type="hidden" name="mailingDifferent" value={mailingDifferent ? "true" : "false"} />
                </label>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.btnPrimary} onClick={goNext}>
                <BiInline ar="التالي" he="המשך" />
              </button>
              <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}>
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
           </div>
        </div>

        {/* --- Screen 3: Mailing Address --- */}
        <div className={screen === 3 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
               <div className={styles.sectionTitle}><BiInline ar="عنوان المراسلات" he="כתובת למכתבים" /></div>
            </div>
            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="مدينة" he="עיר" /></div>
              <input 
                list="mailCities" 
                name="mailCity" 
                value={mailCityText}
                onChange={e => setMailCityText(e.target.value)}
                className={styles.inputControl}
              />
              <datalist id="mailCities">
                {mailCityOpts.map(c => <option key={c.id} value={c.label} />)}
              </datalist>
            </div>
            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="شارع" he="רחוב" /></div>
              <input name="mailStreet" defaultValue={defaults.mailingAddress?.street} className={styles.inputControl} />
            </div>
            <div className={styles.field}>
              <div className={styles.gridRow}>
                 <div>
                   <div className={styles.label}><BiInline ar="منزل" he="בית" /></div>
                   <input name="mailHouseNumber" className={styles.inputControl} />
                 </div>
                 <div>
                   <div className={styles.label}><BiInline ar="دخول" he="כניסה" /></div>
                   <input name="mailEntry" className={styles.inputControl} />
                 </div>
                 <div>
                   <div className={styles.label}><BiInline ar="شقة" he="דירה" /></div>
                   <input name="mailApartment" className={styles.inputControl} />
                 </div>
              </div>
            </div>
            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="الرمز البريدي" he="מיקוד" /></div>
              <input name="mailZip" className={styles.inputControl} inputMode="numeric" />
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.btnPrimary} onClick={goNext}>
                <BiInline ar="التالي" he="המשך" />
              </button>
              <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}>
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
           </div>
        </div>

        {/* --- Screen 4: Employment --- */}
        <div className={screen === 4 ? styles.screenShow : styles.screenHide}>
             <div className={styles.sectionHead}>
                 <div className={styles.sectionTitle}><BiInline ar="العمل" he="תעסוקה" /></div>
                 <div className={styles.subtitle}><BiInline ar="مهنة في البلاد" he="עיסוק בארץ" /></div>
             </div>

             <div className={styles.field}>
                  <div className={styles.label}><BiInline ar="الوضع" he="סטטוס" /></div>
                  <CustomSelect
                    value={empStatus}
                    onChange={setEmpStatus}
                    options={[
                      { value: "selfEmployed", labelAr: "مستقل", labelHe: "עצמאי" },
                      { value: "employee", labelAr: "موظف", labelHe: "שכיר" },
                      { value: "notWorking", labelAr: "غير موظف لا يعمل", labelHe: "לא עובד" },
                    ]}
                  />
                  <input type="hidden" name="employmentStatus" value={empStatus} />
             </div>

             {/* Not Working */}
             {empStatus === 'notWorking' && (
               <div className={styles.field}>
                 <div className={styles.label}><BiInline ar="هل لديك دخل؟" he="האם יש הכנסות?" /></div>
                 <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                    <div 
                       className={`${styles.assetItem} ${notWorkingSub === 'income' ? styles.checked : ''}`}
                       onClick={() => setNotWorkingSub('income')}
                    >
                       <div className={styles.assetLabel}><BiInline ar="لدي دخل (غير العمل)" he="יש לי הכנסה (שלא מעבודה)" /></div>
                       <input type="radio" name="notWorkingSub" value="income" checked={notWorkingSub === 'income'} readOnly />
                    </div>

                    <div 
                       className={`${styles.assetItem} ${notWorkingSub === 'no_income' ? styles.checked : ''}`}
                       onClick={() => setNotWorkingSub('no_income')}
                    >
                       <div className={styles.assetLabel}><BiInline ar="ليس لدي دخل أين لي (دخل)" he="אין לי הכנסה כלל" /></div>
                       <input type="radio" name="notWorkingSub" value="no_income" checked={notWorkingSub === 'no_income'} readOnly />
                    </div>
                 </div>
               </div>
             )}

             {/* Employee */}
             {empStatus === 'employee' && (
                 <>
                   <div className={styles.field}>
                     <div className={styles.label}><BiInline ar="اسم صاحب العمل" he="שם המעסיק" /></div>
                     <input name="employerName" defaultValue={defaults.employerName} className={styles.inputControl} />
                   </div>
                   <div className={styles.field}>
                     <div className={styles.label}><BiInline ar="عنوان صاحب العمل" he="כתובת המעסיק" /></div>
                     <input name="workAddress" defaultValue={defaults.workAddress} className={styles.inputControl} />
                   </div>
                   <DateField 
                      labelAr="تاريخ بدء العمل" 
                      labelHe="תאריך תחילת העבודה" 
                      name="workStartDate"
                      defaultValue={defaults.workStartDate}
                   />
                 </>
             )}

             {/* Self Employed */}
             {empStatus === 'selfEmployed' && (
                 <>
                   <div className={styles.field}>
                      <div className={styles.label}><BiInline ar="اسم صاحب العمل" he="שם המעסיק" /></div>
                      <input name="businessName" defaultValue={defaults.employerName} className={styles.inputControl} />
                   </div>
                   <div className={styles.field}>
                      <div className={styles.label}><BiInline ar="عنوان المصلحة" he="כתובת העסק" /></div>
                      <input name="workAddress" defaultValue={defaults.workAddress} className={styles.inputControl} />
                   </div>
                   <DateField 
                      labelAr="تاريخ الافتتاح" 
                      labelHe="תאריך פתיחה" 
                      name="workStartDate"
                      defaultValue={defaults.workStartDate}
                   />
                 </>
             )}

             <div className={styles.actions}>
              <button type="button" className={styles.btnPrimary} onClick={goNext}>
                <BiInline ar="التالي" he="המשך" />
              </button>
              <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}>
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
           </div>
        </div>

        {/* --- Screen 5: Assets --- */}
        <div className={screen === 5 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
                 <div className={styles.sectionTitle}><BiInline ar="ممتلكات" he="רכוש" /></div>
                 <div className={styles.subtitle}><BiInline ar="إذا كنت تملك أحد ما يلي" he="האם בבעלותך אחד מהבאים" /></div>
            </div>

            <div className={styles.field}>
                 <div className={styles.assetsList}>
                    {[
                      { val: 'business', ar: 'عمل', he: 'עסק' },
                      { val: 'apartment', ar: 'شقة', he: 'דירה' },
                      { val: 'other', ar: 'ممتلكات أخرى', he: 'רכוש אחר' },
                    ].map(item => (
                      <label 
                        key={item.val} 
                        className={`${styles.assetItem} ${assets.includes(item.val) ? styles.checked : ''}`}
                      >
                         <BiInline ar={item.ar} he={item.he} />
                         <input type="checkbox" name="assets" value={item.val} checked={assets.includes(item.val)} onChange={() => toggleAsset(item.val)} />
                      </label>
                    ))}
                 </div>
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

        {/* --- Screen 6: Summary --- */}
        {/* --- Screen 6: Summary --- */}
        {screen === 6 && (
           <div className={styles.screenShow}>
              <div className={styles.summaryHeader}>
                <div className={styles.summaryTitle} style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <span>نهاية المرحلة 3</span>
                  <span>סוף שלב 3</span>
                </div>
                <div className={styles.summarySub} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <span>يرجى التحقق من صحة التفاصيل وترجمتها</span>
                   <span>אנא וודא/י כי כל הפרטים ותרגומם נכונים</span>
                </div>
              </div>

              {/* --- 1. שדות מתורגמים (יופיעו למעלה לבדיקה) --- */}
              {[
                  { key: "regStreet", labelAr: "الشارع (السكن)", labelHe: "רחוב (מגורים)" },
                  { key: "employerName", labelAr: "اسم صاحب العمل", labelHe: "שם המעסיק" },
                  { key: "businessName", labelAr: "اسم المصلحة", labelHe: "שם העסק" },
                  { key: "workAddress", labelAr: "عنوان العمل", labelHe: "כתובת העבודה" },
              ].map(field => {
                  const data = translations[field.key];
                  // מציג רק אם יש ערך מקורי
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
                         <input className={styles.originalInput} defaultValue={data.original} readOnly tabIndex={-1} />
                         <input type="hidden" name={originalName} value={data.original} />
                         <input className={styles.translatedInput} defaultValue={data.translated} name={translatedName} />
                      </div>
                      <input type="hidden" name={field.key} value={data.original} />
                    </div>
                  );
              })}

              {/* --- 2. מצב משפחתי --- */}
              <div className={styles.sectionHead} style={{marginTop: 30}}>
                 <div className={styles.sectionTitle}><BiInline ar="الحالة الاجتماعية" he="מצב משפחתי" /></div>
              </div>

              <div className={styles.summaryField}>
                 <div className={styles.readOnlyInputWrap}>
                    <input className={styles.readOnlyInput} 
                       value={
                         formDataState.maritalStatus === 'single' ? 'רווק/ה / أعزب/ة' :
                         formDataState.maritalStatus === 'married' ? 'נשוי/ה / متزوج/ة' :
                         formDataState.maritalStatus === 'divorced' ? 'גרוש/ה / مطلق/ة' :
                         formDataState.maritalStatus === 'widowed' ? 'אלמן/ה / أرمل/ة' : ''
                       } 
                       readOnly 
                    />
                 </div>
              </div>

              {/* תאריך נישואין/גירושין (אם רלוונטי) */}
              {formDataState.statusDate && (
                <div className={styles.summaryField}>
                   <div className={styles.label}>
                      {formDataState.maritalStatus === 'married' ? <BiInline ar="تاريخ الزواج" he="תאריך נישואין" /> : <BiInline ar="تاريخ الطلاق" he="תאריך גירושין" />}
                   </div>
                   <div className={styles.readOnlyInputWrap}>
                      <svg className={`${styles.fieldIcon} ${styles.fieldIconLeft}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <input className={styles.readOnlyInput} value={formDataState.statusDate.split('-').reverse().join('.')} readOnly style={{paddingLeft: 40, direction: 'ltr'}} />
                   </div>
                </div>
              )}

              {/* --- 3. כתובת מגורים (כל הפרטים) --- */}
              <div className={styles.sectionHead} style={{marginTop: 20}}>
                 <div className={styles.sectionTitle}><BiInline ar="عنوان السكن" he="כתובת מגורים" /></div>
              </div>

              <div className={styles.summaryField}>
                 <div className={styles.label}><BiInline ar="مدينة" he="עיר" /></div>
                 <div className={styles.readOnlyInputWrap}>
                    <input className={styles.readOnlyInput} value={formDataState.regCity} readOnly />
                 </div>
              </div>

              {/* (הרחוב מופיע למעלה בתרגומים, כאן נציג את המספרים) */}
              <div className={styles.gridRow} style={{marginBottom: 20}}>
                 <div>
                   <div className={styles.label}><BiInline ar="منزل" he="בית" /></div>
                   <input className={styles.readOnlyInput} value={formDataState.regHouseNumber} readOnly style={{textAlign: 'center'}} />
                 </div>
                 <div>
                   <div className={styles.label}><BiInline ar="دخول" he="כניסה" /></div>
                   <input className={styles.readOnlyInput} value={formDataState.regEntry} readOnly style={{textAlign: 'center'}} />
                 </div>
                 <div>
                   <div className={styles.label}><BiInline ar="شقة" he="דירה" /></div>
                   <input className={styles.readOnlyInput} value={formDataState.regApartment} readOnly style={{textAlign: 'center'}} />
                 </div>
              </div>

              <div className={styles.summaryField}>
                  <div className={styles.label}><BiInline ar="الرمز البريدي" he="מיקוד" /></div>
                  <div className={styles.readOnlyInputWrap}>
                     <input className={styles.readOnlyInput} value={formDataState.regZip} readOnly />
                  </div>
              </div>

              <div className={styles.summaryField}>
                 <div className={styles.label}><BiInline ar="شقة مستأجرة / بملكية" he="דירה שכורה / בבעלות" /></div>
                 <div className={styles.readOnlyInputWrap}>
                    <input className={styles.readOnlyInput} 
                       value={
                          formDataState.housingType === 'rented' ? 'דירה שכורה / شقة مستأجرة' :
                          formDataState.housingType === 'owned' ? 'דירה בבעלות / شقة بملكية' :
                          formDataState.housingType === 'other' ? 'אחר / آخر' : ''
                       }
                       readOnly
                    />
                 </div>
              </div>

              {/* --- 4. כתובת למכתבים (אם שונה) --- */}
              {formDataState.mailingDifferent === "true" && (
                <>
                  <div className={styles.sectionHead} style={{marginTop: 20}}>
                     <div className={styles.sectionTitle}><BiInline ar="عنوان المراسلات" he="כתובת למכתבים" /></div>
                  </div>
                  
                  <div className={styles.summaryField}>
                     <div className={styles.label}><BiInline ar="مدينة" he="עיר" /></div>
                     <div className={styles.readOnlyInputWrap}>
                        <input className={styles.readOnlyInput} value={formDataState.mailCity} readOnly />
                     </div>
                  </div>
                  <div className={styles.summaryField}>
                     <div className={styles.label}><BiInline ar="شارع" he="רחוב" /></div>
                     <div className={styles.readOnlyInputWrap}>
                        <input className={styles.readOnlyInput} value={formDataState.mailStreet} readOnly />
                     </div>
                  </div>
                  <div className={styles.gridRow} style={{marginBottom: 20}}>
                     <div>
                       <div className={styles.label}><BiInline ar="منزل" he="בית" /></div>
                       <input className={styles.readOnlyInput} value={formDataState.mailHouseNumber} readOnly style={{textAlign: 'center'}} />
                     </div>
                     <div>
                       <div className={styles.label}><BiInline ar="دخول" he="כניסה" /></div>
                       <input className={styles.readOnlyInput} value={formDataState.mailEntry} readOnly style={{textAlign: 'center'}} />
                     </div>
                     <div>
                       <div className={styles.label}><BiInline ar="شقة" he="דירה" /></div>
                       <input className={styles.readOnlyInput} value={formDataState.mailApartment} readOnly style={{textAlign: 'center'}} />
                     </div>
                  </div>
                  <div className={styles.summaryField}>
                      <div className={styles.label}><BiInline ar="الرمز البريدي" he="מיקוד" /></div>
                      <div className={styles.readOnlyInputWrap}>
                         <input className={styles.readOnlyInput} value={formDataState.mailZip} readOnly />
                      </div>
                  </div>
                </>
              )}

              {/* --- 5. תעסוקה --- */}
              <div className={styles.sectionHead} style={{marginTop: 20}}>
                 <div className={styles.sectionTitle}><BiInline ar="العمل" he="תעסוקה" /></div>
              </div>

              <div className={styles.summaryField}>
                 <div className={styles.readOnlyInputWrap}>
                    <svg className={`${styles.fieldIcon} ${styles.fieldIconLeft}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    <input className={styles.readOnlyInput} 
                       value={
                          formDataState.employmentStatus === 'employee' ? 'שכיר / موظف' :
                          formDataState.employmentStatus === 'selfEmployed' ? 'עצמאי / مستقل' :
                          formDataState.employmentStatus === 'notWorking' ? 'לא עובד / لا يعمل' : ''
                       }
                       readOnly 
                       style={{paddingLeft: 40}}
                    />
                 </div>
              </div>
              
              {/* סטטוס הכנסה למי שלא עובד */}
              {formDataState.employmentStatus === 'notWorking' && formDataState.notWorkingSub && (
                  <div className={styles.summaryField}>
                    <div className={styles.readOnlyInputWrap}>
                        <input className={styles.readOnlyInput} 
                          value={formDataState.notWorkingSub === 'income' ? 'יש לי הכנסה / لدي دخل' : 'אין לי הכנסה / ليس لدي دخل'}
                          readOnly
                        />
                    </div>
                  </div>
              )}

              {/* תאריך התחלה (לעובדים/עצמאים) */}
              {formDataState.workStartDate && (
                <div className={styles.summaryField}>
                   <div className={styles.label}>
                      {formDataState.employmentStatus === 'selfEmployed' ? <BiInline ar="تاريخ الافتتاح" he="תאריך פתיחה" /> : <BiInline ar="تاريخ بدء العمل" he="תאריך תחילת העבודה" />}
                   </div>
                   <div className={styles.readOnlyInputWrap}>
                      <svg className={`${styles.fieldIcon} ${styles.fieldIconLeft}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <input className={styles.readOnlyInput} value={formDataState.workStartDate.split('-').reverse().join('.')} readOnly style={{paddingLeft: 40, direction: 'ltr'}} />
                   </div>
                </div>
              )}

              {/* --- 6. רכוש --- */}
              {assets.length > 0 && (
                 <>
                   <div className={styles.sectionHead} style={{marginTop: 20}}>
                      <div className={styles.sectionTitle}><BiInline ar="ممتلكات" he="רכוש" /></div>
                   </div>
                   <div className={styles.summaryField}>
                      <div className={styles.readOnlyInputWrap}>
                         <input className={styles.readOnlyInput} 
                           value={assets.map(a => 
                             a === 'business' ? 'עסק / عمل' : 
                             a === 'apartment' ? 'דירה / شقة' : 
                             'רכוש אחר / ممتلكات أخرى'
                           ).join(', ')} 
                           readOnly
                         />
                      </div>
                   </div>
                 </>
              )}

              {/* Hidden Inputs for Submission */}
              <input type="hidden" name="maritalStatus" value={formDataState.maritalStatus || ""} />
              <input type="hidden" name="statusDate" value={formDataState.statusDate || ""} />
              <input type="hidden" name="regCity" value={formDataState.regCity || ""} />
              <input type="hidden" name="regHouseNumber" value={formDataState.regHouseNumber || ""} />
              <input type="hidden" name="regEntry" value={formDataState.regEntry || ""} />
              <input type="hidden" name="regApartment" value={formDataState.regApartment || ""} />
              <input type="hidden" name="regZip" value={formDataState.regZip || ""} />
              <input type="hidden" name="housingType" value={formDataState.housingType || ""} />
              <input type="hidden" name="mailingDifferent" value={formDataState.mailingDifferent || "false"} />
              {formDataState.mailingDifferent === "true" && (
                <>
                  <input type="hidden" name="mailCity" value={formDataState.mailCity || ""} />
                  <input type="hidden" name="mailStreet" value={formDataState.mailStreet || ""} />
                  <input type="hidden" name="mailHouseNumber" value={formDataState.mailHouseNumber || ""} />
                  <input type="hidden" name="mailEntry" value={formDataState.mailEntry || ""} />
                  <input type="hidden" name="mailApartment" value={formDataState.mailApartment || ""} />
                  <input type="hidden" name="mailZip" value={formDataState.mailZip || ""} />
                </>
              )}
              <input type="hidden" name="employmentStatus" value={formDataState.employmentStatus || ""} />
              <input type="hidden" name="notWorkingSub" value={formDataState.notWorkingSub || ""} />
              <input type="hidden" name="workStartDate" value={formDataState.workStartDate || ""} />
              {assets.map(a => <input key={a} type="hidden" name="assets" value={a} />)}

              <div className={styles.actions}>
                  <button type="submit" className={styles.btnPrimary}>
                    <BiInline ar="موافقة" he="אישור וסיום" />
                  </button>
                  <button type="button" onClick={() => setScreen(5)} className={styles.btnSecondary}>
                    <BiInline ar="تعديل" he="חזור לעריכה" />
                  </button>
              </div>

           </div>
        )}

      </form>

    </div>
  );
}