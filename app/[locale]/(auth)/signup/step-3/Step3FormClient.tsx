"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Image from "next/image";
import styles from "@/lib/styles/IntakeForm.module.css";
import { translateStep3Data } from "@/app/[locale]/(auth)/signup/actions";

const FAMILY_IMAGE = "/images/step3-family.svg";
const TOTAL_SCREENS = 5;

// --- Helpers ---
function BiInline({ ar, he }: { ar: string; he: string }) {
  return (
    <>
      <span>{ar}</span>
      <span>{he}</span>
    </>
  );
}

// --- Custom Select ---
function CustomSelect({ 
  labelAr, labelHe, value, onChange, options, placeholder 
}: { 
  labelAr: string, labelHe: string, value: string, onChange: (val: string) => void, 
  options: { value: string, label: React.ReactNode }[], placeholder: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || "";

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.comboboxWrap}>
        <div 
          className={styles.inputBase} 
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
           <span style={{ color: value ? '#0B1B2B' : '#9CA3AF' }}>
             {value ? selectedLabel : placeholder}
           </span>
           <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: 'rotate(270deg)', opacity: 0.5 }}>
              <path d="M4 2L0 6L4 10" stroke="currentColor" fill="none" strokeWidth="1.5"/>
           </svg>
        </div>
        {isOpen && (
          <ul className={styles.comboboxMenu} style={{ zIndex: 100 }}>
             <li 
                className={styles.comboboxItem} 
                onClick={() => { onChange(""); setIsOpen(false); }}
                style={{ color: '#9CA3AF' }}
              >
                {placeholder}
              </li>
            {options.map((opt) => (
              <li 
                key={opt.value} 
                className={styles.comboboxItem} 
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
        {isOpen && <div style={{position: 'fixed', inset: 0, zIndex: 99}} onClick={() => setIsOpen(false)} />}
      </div>
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

// --- DateField ---
function DateField({ labelAr, labelHe, name, defaultValue }: { 
  labelAr: string; labelHe: string; name: string; defaultValue: string 
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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
          type="date" 
          name={name}
          defaultValue={defaultValue} 
          className={styles.dateInput}
          style={{paddingLeft:'40px', fontSize: '15px'}}
        />
      </div>
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

export default function Step3FormClient({
  locale,
  saved,
  defaults,
  saveDraftAction,
  saveAndNextAction,
  saveDraftAndBackAction,
}: Props) {
  const [screen, setScreen] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  // --- Logic State ---
  const [maritalStatus, setMaritalStatus] = useState(defaults.maritalStatus || "");
  const showDate = maritalStatus === "married" || maritalStatus === "divorced";

  const [housingType, setHousingType] = useState(defaults.housingType || "");
  const [mailingDifferent, setMailingDifferent] = useState(defaults.mailingDifferent || false);
  
  const [empStatus, setEmpStatus] = useState(defaults.employmentStatus || "");
  const [notWorkingSub, setNotWorkingSub] = useState(defaults.notWorkingSub || ""); 

  const [assets, setAssets] = useState<string[]>(defaults.assets || []);
  
  const toggleAsset = (val: string) => {
    if (val === 'none') {
        setAssets(prev => prev.includes('none') ? [] : ['none']);
    } else {
        setAssets(prev => {
            const newAssets = prev.filter(x => x !== 'none');
            return newAssets.includes(val) 
                ? newAssets.filter(x => x !== val) 
                : [...newAssets, val];
        });
    }
  };

  const [regCityText, setRegCityText] = useState(defaults.regCity || "");
  const [regCityOpts, setRegCityOpts] = useState<CityOpt[]>([]);
  const [mailCityText, setMailCityText] = useState(defaults.mailingAddress?.city || "");
  const [mailCityOpts, setMailCityOpts] = useState<CityOpt[]>([]);

  const [formDataState, setFormDataState] = useState<any>({});
  const [translations, setTranslations] = useState<any>({});
  const formRef = useRef<HTMLFormElement>(null);
  const draftTimerRef = useRef<number | null>(null);

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
    if (screen > TOTAL_SCREENS) return 100;
    return Math.round((screen / TOTAL_SCREENS) * 100); 
  }, [screen]);

  const goNext = () => {
    if (screen === 2 && !mailingDifferent) {
      setScreen(4); 
    } else {
      setScreen(s => Math.min(TOTAL_SCREENS + 1, s + 1));
    }
  };

  const goBack = () => {
    if (screen === 4 && !mailingDifferent) {
      setScreen(2); 
    } else {
      setScreen(s => Math.max(0, s - 1));
    }
  };

  const handleFinishStep3 = async (e?: any) => {
    e?.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const currentData: any = {};
    formData.forEach((value, key) => { currentData[key] = value; });
    currentData.assets = assets;
    
    setFormDataState(currentData);
    setIsTranslating(true);

    try {
      const translatedResult = await translateStep3Data(formData, locale);
      setTranslations(translatedResult || {});
      setScreen(TOTAL_SCREENS + 1); 
    } catch (error) {
      console.error("Translation error:", error);
      setTranslations({});
      setScreen(TOTAL_SCREENS + 1);
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

      {/* Intro Screen */}
      {screen === 0 && (
        <div className={styles.stepSplashContainer}>
          <Image src={FAMILY_IMAGE} alt="Family" width={280} height={200} className={styles.stepSplashImage} priority />
          <div className={styles.stepSplashContent}>
            <div className={styles.stepNumberTitle}><span>المرحلة </span><span>שלב 3</span></div>
            <div className={styles.stepMainTitle}><span>مركز الحياة</span>  <span>מרכז חיים</span></div>
            <div className={styles.stepDescription}>
               <p dir="rtl">بهالمرحلة بنسأل عن عنوان السكن، الشغل، والحالة العائلية<br/>الوقت المتوقع للتعبئة: 6 دقيقة</p>
               <br/>
               <p dir="rtl">שלב זה עוסק בכתובת מגורים, תעסוקה ומצב משפחתי<br/>זמן מילוי משוער: 6 דקות</p>
            </div>
          </div>
          <button type="button" className={styles.btnDark} onClick={goNext}>
            <BiInline ar="ابدأ" he="התחל" />
          </button>
        </div>
      )}

      {/* --- FORM 1: Screens 1-5 --- */}
      {screen > 0 && screen <= TOTAL_SCREENS && (
      <>
        {/* Top Bar (Outside Form) */}
        <div className={styles.topBar}>
            <div className={styles.topRow}>
               <button type="button" className={styles.backBtn} onClick={goBack}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
               </button>
               <div className={styles.stepMeta}><span>المرحلة 3 من 7</span> <span>שלב 3 מתוך 7</span></div>
            </div>
            <div className={styles.progressBarTrack}><div className={styles.progressBarFill} style={{ width: `${progress}%` }} /></div>
            <div className={styles.titleBlock}>
                <h1 className={styles.formTitle} style={{justifyContent:'flex-start'}}><BiInline ar="مركز الحياة" he="מרכז חיים" /></h1>
            </div>
        </div>

        <form 
            ref={formRef} 
            className={styles.scrollableContent} 
            onSubmit={(e) => e.preventDefault()} 
        >
            {/* --- Screen 1: Marital Status --- */}
            <div style={{ display: screen === 1 ? 'block' : 'none', paddingTop: '40px' }}>
            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}><BiInline ar="الحالة الاجتماعية" he="מצב משפחתי" /></div>
            </div>
            
            <CustomSelect 
                labelAr="اختر" labelHe="בחר"
                value={maritalStatus}
                onChange={setMaritalStatus}
                placeholder="اختر  בחר" 
                options={[
                    { value: "single", label: "רווק/ה  أعزب/ة" },
                    { value: "married", label: "נשוי/ה  متزوج/ة" },
                    { value: "divorced", label: "גרוש/ה  مطلق/ة" },
                    { value: "widowed", label: "אלמן/ה  أرمل/ة" }
                ]}
            />
            <input type="hidden" name="maritalStatus" value={maritalStatus} />

            {showDate && (
                <DateField 
                    labelAr={maritalStatus === "married" ? "تاريخ الزواج" : "تاريخ الطلاق"}
                    labelHe={maritalStatus === "married" ? "תאריך נישואין" : "תאריך גירושין"}
                    name="statusDate"
                    defaultValue={defaults.statusDate}
                />
            )}

            <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={goNext}>
                    <BiInline ar="التالي" he="המשך" />
                </button>
                <button type="button" onClick={handleSaveDraft} className={styles.btnSecondary}>
                    <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                </button>
            </div>
            </div>

            {/* --- Screen 2: Residence Address --- */}
            <div style={{ display: screen === 2 ? 'block' : 'none', paddingTop: '40px' }}>
                <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}><BiInline ar="عنوان السكن" he="כתובת מגורים" /></div>
                <div className={styles.formSubtitle}><BiInline ar="المسجل في وزارة الداخلية" he="הרשומה במשרד הפנים" /></div>
                </div>

                <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="مدينة" he="עיר" /></div>
                <div className={styles.comboboxWrap}>
                    <input 
                        list="regCities" 
                        name="regCity" 
                        value={regCityText}
                        onChange={e => setRegCityText(e.target.value)}
                        className={styles.inputBase}
                        placeholder="اختر مدينة  בחר עיר"
                    />
                    <datalist id="regCities">
                        {regCityOpts.map(c => <option key={c.id} value={c.label} />)}
                    </datalist>
                </div>
                </div>

                <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="شارع" he="רחוב" /></div>
                <input name="regStreet" defaultValue={defaults.regStreet} className={styles.inputBase} />
                </div>

                <div className={styles.fieldGroup}>
                <div className={styles.addressGrid}>
                    <div>
                    <div className={styles.label}><BiInline ar="منزل" he="בית" /></div>
                    <input name="regHouseNumber" defaultValue={defaults.regHouseNumber} className={styles.inputBase} />
                    </div>
                    <div>
                    <div className={styles.label}><BiInline ar="دخول" he="כניסה" /></div>
                    <input name="regEntry" defaultValue={defaults.regEntry} className={styles.inputBase} />
                    </div>
                    <div>
                    <div className={styles.label}><BiInline ar="شقة" he="דירה" /></div>
                    <input name="regApartment" defaultValue={defaults.regApartment} className={styles.inputBase} />
                    </div>
                </div>
                </div>

                <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="الرمز البريدي" he="מיקוד" /></div>
                <input name="regZip" defaultValue={defaults.regZip} className={styles.inputBase} inputMode="numeric" />
                </div>

                <CustomSelect 
                    labelAr="شقة مستأجرة / بملكية" labelHe="דירה שכורה / בבעלות"
                    value={housingType}
                    onChange={setHousingType}
                    placeholder="اختر  בחר"
                    options={[
                        { value: "rented", label: "דירה שכורה  شقة مستأجرة" },
                        { value: "owned", label: "דירה בבעלות  شقة بملكية" },
                        { value: "other", label: "אחר  آخر" },
                    ]}
                />
                <input type="hidden" name="housingType" value={housingType} />

                <label className={styles.toggleLabel}>
                    <input 
                    className={styles.checkInput} 
                    type="checkbox" 
                    checked={mailingDifferent} 
                    onChange={(e) => setMailingDifferent(e.target.checked)} 
                    style={{width: 20, height: 20, accentColor: '#EE7248'}}
                    />
                    <BiInline ar="عنوان المراسلات مختلف؟" he="כתובת למכתבים שונה?" />
                    <input type="hidden" name="mailingDifferent" value={mailingDifferent ? "true" : "false"} />
                </label>

                <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={goNext}>
                    <BiInline ar="التالي" he="המשך" />
                </button>
                <button type="button" onClick={handleSaveDraft} className={styles.btnSecondary}>
                    <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                </button>
            </div>
            </div>

            {/* --- Screen 3: Mailing Address --- */}
            <div style={{ display: screen === 3 ? 'block' : 'none', paddingTop: '40px' }}>
                <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}><BiInline ar="عنوان المراسلات" he="כתובת למכתבים" /></div>
                </div>
                <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="مدينة" he="עיר" /></div>
                <div className={styles.comboboxWrap}>
                    <input 
                        list="mailCities" 
                        name="mailCity" 
                        value={mailCityText}
                        onChange={e => setMailCityText(e.target.value)}
                        className={styles.inputBase}
                    />
                    <datalist id="mailCities">
                        {mailCityOpts.map(c => <option key={c.id} value={c.label} />)}
                    </datalist>
                </div>
                </div>
                <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="شارع" he="רחוב" /></div>
                <input name="mailStreet" defaultValue={defaults.mailingAddress?.street} className={styles.inputBase} />
                </div>
                <div className={styles.fieldGroup}>
                <div className={styles.addressGrid}>
                    <div>
                    <div className={styles.label}><BiInline ar="منزل" he="בית" /></div>
                    <input name="mailHouseNumber" className={styles.inputBase} />
                    </div>
                    <div>
                    <div className={styles.label}><BiInline ar="دخول" he="כניסה" /></div>
                    <input name="mailEntry" className={styles.inputBase} />
                    </div>
                    <div>
                    <div className={styles.label}><BiInline ar="شقة" he="דירה" /></div>
                    <input name="mailApartment" className={styles.inputBase} />
                    </div>
                </div>
                </div>
                <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="الرمز البريدي" he="מיקוד" /></div>
                <input name="mailZip" className={styles.inputBase} inputMode="numeric" />
                </div>
                <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={goNext}>
                    <BiInline ar="التالي" he="המשך" />
                </button>
                <button type="button" onClick={handleSaveDraft} className={styles.btnSecondary}>
                    <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                </button>
            </div>
            </div>

            {/* --- Screen 4: Employment --- */}
            <div style={{ display: screen === 4 ? 'block' : 'none', paddingTop: '40px' }}>
                <div className={styles.sectionHead}>
                    <div className={styles.sectionTitle}><BiInline ar="العمل" he="תעסוקה" /></div>
                    <div className={styles.formSubtitle}><BiInline ar="مهنة في البلاد" he="עיסוק בארץ" /></div>
                </div>

                <CustomSelect 
                    labelAr="الوضع" labelHe="סטטוס"
                    value={empStatus}
                    onChange={setEmpStatus}
                    placeholder="اختر  בחר" 
                    options={[
                        { value: "selfEmployed", label: "עצמאי  مستقل" },
                        { value: "employee", label: "שכיר  موظف" },
                        { value: "notWorking", label: "לא עובד  غير موظف" },
                    ]}
                />
                <input type="hidden" name="employmentStatus" value={empStatus} />

                {/* Not Working - כפתורים אליפטיים (בלי ריבוע V) */}
                {empStatus === 'notWorking' && (
                <div className={styles.fieldGroup}>
                    <div className={styles.label}><BiInline ar="هل لديك دخل؟" he="האם יש הכנסות?" /></div>
                    <div className={styles.assetsStack}>
                        <label className={styles.selectionLabel}>
                        <input 
                            type="radio" 
                            name="notWorkingSub" 
                            value="income" 
                            checked={notWorkingSub === 'income'} 
                            onChange={() => setNotWorkingSub('income')}
                        />
                        <span className={styles.selectionSpan}>
                            <BiInline ar="لدي دخل (غير العمل)" he="יש לי הכנסה (שלא מעבודה)" />
                        </span>
                        </label>

                        <label className={styles.selectionLabel}>
                        <input 
                            type="radio" 
                            name="notWorkingSub" 
                            value="no_income" 
                            checked={notWorkingSub === 'no_income'} 
                            onChange={() => setNotWorkingSub('no_income')}
                        />
                        <span className={styles.selectionSpan}>
                            <BiInline ar="ليس لدي دخل أين لي (دخل)" he="אין לי הכנסה כלל" />
                        </span>
                        </label>
                    </div>
                </div>
                )}

                {/* Employee */}
                {empStatus === 'employee' && (
                    <>
                    <div className={styles.fieldGroup}>
                        <div className={styles.label}><BiInline ar="اسم صاحب العمل" he="שם המעסיק" /></div>
                        <input name="employerName" defaultValue={defaults.employerName} className={styles.inputBase} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <div className={styles.label}><BiInline ar="عنوان صاحب العمل" he="כתובת המעסיק" /></div>
                        <input name="workAddress" defaultValue={defaults.workAddress} className={styles.inputBase} />
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
                    <div className={styles.fieldGroup}>
                        <div className={styles.label}><BiInline ar="اسم صاحب العمل" he="שם המעסיק" /></div>
                        <input name="businessName" defaultValue={defaults.employerName} className={styles.inputBase} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <div className={styles.label}><BiInline ar="عنوان المصلحة" he="כתובת העסק" /></div>
                        <input name="workAddress" defaultValue={defaults.workAddress} className={styles.inputBase} />
                    </div>
                    <DateField 
                        labelAr="تاريخ الافتتاح" 
                        labelHe="תאריך פתיחה" 
                        name="workStartDate"
                        defaultValue={defaults.workStartDate}
                    />
                    </>
                )}

                <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={goNext}>
                    <BiInline ar="التالي" he="המשך" />
                </button>
                <button type="button" onClick={handleSaveDraft} className={styles.btnSecondary}>
                    <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                </button>
            </div>
            </div>

            {/* --- Screen 5: Assets --- */}
            <div style={{ display: screen === 5 ? 'block' : 'none', paddingTop: '40px' }}>
                <div className={styles.sectionHead}>
                    <div className={styles.sectionTitle}><BiInline ar="ممتلكات" he="רכוש" /></div>
                    <div className={styles.formSubtitle}><BiInline ar="إذا كنت تملك أحد ما يلي" he="האם בבעלותך אחד מהבאים" /></div>
                </div>

                <div className={styles.fieldGroup}>
                    <div className={styles.assetsStack}>
                        {[
                        { val: 'business', ar: 'عمل', he: 'עסק' },
                        { val: 'apartment', ar: 'شقة', he: 'דירה' },
                        { val: 'other', ar: 'ممتلكات أخرى', he: 'רכוש אחר' },
                        { val: 'none', ar: 'ليس لدي ممتلكات', he: 'אין לי רכוש' },
                        ].map(item => (
                        <label key={item.val} className={styles.selectionLabel}>
                            <input 
                                type="checkbox" 
                                name="assets" 
                                value={item.val} 
                                checked={assets.includes(item.val)} 
                                onChange={() => toggleAsset(item.val)} 
                            />
                            <span className={styles.selectionSpan} style={{justifyContent: 'right'}}>
                                <BiInline ar={item.ar} he={item.he} />
                            </span>
                        </label>
                        ))}
                    </div>
                </div>

                <div className={styles.fixedFooter}>
                    <button type="button" className={styles.btnPrimary} onClick={handleFinishStep3}>
                    <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
                    </button>
                    <button type="button" onClick={handleSaveDraft} className={styles.btnSecondary}>
                    <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                    </button>
                </div>
            </div>
        </form>
      </>
      )}

      {/* --- FORM 2: Screen 6 (Summary) - Allows Submit --- */}
      {screen === 6 && (
        <form className={styles.scrollableContent} action={saveAndNextAction} style={{paddingTop: 0}}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewTitle}>
                  <span>نهاية المرحلة </span><span>סוף שלב 3</span>
                </div>
                <div className={styles.summarySub} style={{ lineHeight: '1.6' }}>
                   <span>يرجى التحقق من صحة التفاصيل وترجمتها</span>
                   <br />
                   <span>אנא וודא/י כי כל הפרטים ותרגומם נכונים</span>
                </div>
              </div>

              {/* 1. Marital Status */}
              <div className={styles.fieldGroup}>
                 <div className={styles.label}><BiInline ar="الحالة الاجتماعية" he="מצב משפחתי" /></div>
                 <input className={styles.readOnlyInput} 
                    value={
                      formDataState.maritalStatus === 'single' ? 'רווק/ה  أعزب/ة' :
                      formDataState.maritalStatus === 'married' ? 'נשוי/ה  متزوج/ة' :
                      formDataState.maritalStatus === 'divorced' ? 'גרוש/ה  مطلق/ة' :
                      formDataState.maritalStatus === 'widowed' ? 'אלמן/ה  أرمل/ة' : ''
                    } 
                    readOnly 
                 />
              </div>

              {formDataState.statusDate && (
                <div className={styles.fieldGroup}>
                   <div className={styles.label}>
                      {formDataState.maritalStatus === 'married' ? <BiInline ar="تاريخ الزواج" he="תאריך נישואין" /> : <BiInline ar="تاريخ الطلاق" he="תאריך גירושין" />}
                   </div>
                   <div className={styles.readOnlyWrapper}>
                      <Image src="/images/calendar.svg" alt="cal" width={24} height={24} className={styles.calendarIcon} style={{ left: '12px' }} />
                      <input className={styles.readOnlyInput} value={formDataState.statusDate.split('-').reverse().join('.')} readOnly style={{paddingLeft: 40, direction: 'ltr', textAlign: 'right'}} />
                   </div>
                </div>
              )}

              {/* 2. Residence Address */}
              <div className={styles.sectionHead} style={{marginTop: 20}}>
                 <div className={styles.sectionTitle}><BiInline ar="عنوان السكن" he="כתובת מגורים" /></div>
              </div>

              {/* עיר - שדה רגיל (כי הוא מרשימה) */}
              <div className={styles.fieldGroup}>
                 <div className={styles.label}><BiInline ar="مدينة" he="עיר" /></div>
                 <input className={styles.readOnlyInput} value={formDataState.regCity} readOnly />
              </div>

              {/* רחוב - שדה מתורגם כתום */}
              {renderTranslatedField("regStreet", "شارع", "רחוב")}

              <div className={styles.addressGrid} style={{marginBottom: 20}}>
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

              <div className={styles.fieldGroup}>
                  <div className={styles.label}><BiInline ar="الرمز البريدي" he="מיקוד" /></div>
                  <input className={styles.readOnlyInput} value={formDataState.regZip} readOnly />
              </div>

              <div className={styles.fieldGroup}>
                 <div className={styles.label}><BiInline ar="شقة مستأجرة / بملكية" he="דירה שכורה / בבעלות" /></div>
                 <input className={styles.readOnlyInput} 
                    value={
                       formDataState.housingType === 'rented' ? 'דירה שכורה  شقة مستأجرة' :
                       formDataState.housingType === 'owned' ? 'דירה בבעלות  شقة بملكية' :
                       formDataState.housingType === 'other' ? 'אחר  آخر' : ''
                    }
                    readOnly
                 />
              </div>

              {/* 3. Mailing Address (If different) */}
              {formDataState.mailingDifferent === "true" && (
                <>
                  <div className={styles.sectionHead} style={{marginTop: 20}}>
                     <div className={styles.sectionTitle}><BiInline ar="عنوان المراسلات" he="כתובת למכתבים" /></div>
                  </div>
                  
                  <div className={styles.fieldGroup}>
                     <div className={styles.label}><BiInline ar="مدينة" he="עיר" /></div>
                     <input className={styles.readOnlyInput} value={formDataState.mailCity} readOnly />
                  </div>
                  
                  {/* לרחוב דואר אין תרגום ב-Action שלך כרגע, אז נציג כרגיל */}
                  <div className={styles.fieldGroup}>
                     <div className={styles.label}><BiInline ar="شارع" he="רחוב" /></div>
                     <input className={styles.readOnlyInput} value={formDataState.mailStreet} readOnly />
                  </div>

                  <div className={styles.addressGrid} style={{marginBottom: 20}}>
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
                  <div className={styles.fieldGroup}>
                      <div className={styles.label}><BiInline ar="الرمز البريدي" he="מיקוד" /></div>
                      <input className={styles.readOnlyInput} value={formDataState.mailZip} readOnly />
                  </div>
                </>
              )}

              {/* 4. Employment */}
              <div className={styles.sectionHead} style={{marginTop: 20}}>
                 <div className={styles.sectionTitle}><BiInline ar="العمل" he="תעסוקה" /></div>
              </div>

              <div className={styles.fieldGroup}>
                 <input className={styles.readOnlyInput} 
                    value={
                       formDataState.employmentStatus === 'employee' ? 'שכיר  موظف' :
                       formDataState.employmentStatus === 'selfEmployed' ? 'עצמאי  مستقل' :
                       formDataState.employmentStatus === 'notWorking' ? 'לא עובד  لا يعمل' : ''
                    }
                    readOnly 
                 />
              </div>
              
              {/* שדות מתורגמים לתעסוקה */}
              {renderTranslatedField("employerName", "اسم صاحب العمل", "שם המעסיק")}
              {renderTranslatedField("businessName", "اسم المصلحة", "שם העסק")}
              {renderTranslatedField("workAddress", "عنوان العمل", "כתובת העבודה")}

              {formDataState.employmentStatus === 'notWorking' && formDataState.notWorkingSub && (
                  <div className={styles.fieldGroup}>
                        <input className={styles.readOnlyInput} 
                          value={formDataState.notWorkingSub === 'income' ? 'יש לי הכנסה  لدي دخل' : 'אין לי הכנסה  ليس لدي دخل'}
                          readOnly
                        />
                  </div>
              )}

              {formDataState.workStartDate && (
                <div className={styles.fieldGroup}>
                   <div className={styles.label}>
                      {formDataState.employmentStatus === 'selfEmployed' ? <BiInline ar="تاريخ الافتتاح" he="תאריך פתיחה" /> : <BiInline ar="تاريخ بدء العمل" he="תאריך תחילת העבודה" />}
                   </div>
                   <div className={styles.readOnlyWrapper}>
                      <Image src="/images/calendar.svg" alt="cal" width={24} height={24} className={styles.calendarIcon} style={{ left: '12px' }} />
                      <input className={styles.readOnlyInput} value={formDataState.workStartDate.split('-').reverse().join('.')} readOnly style={{paddingLeft: 40, direction: 'ltr', textAlign: 'right'}} />
                   </div>
                </div>
              )}

              {/* 5. Assets Summary */}
              {assets.length > 0 && (
                 <>
                   <div className={styles.sectionHead} style={{marginTop: 20}}>
                      <div className={styles.sectionTitle}><BiInline ar="ممتلكات" he="רכוש" /></div>
                   </div>
                   <div className={styles.fieldGroup}>
                         <input className={styles.readOnlyInput} 
                           value={assets.map(a => 
                             a === 'business' ? 'עסק  عمل' : 
                             a === 'apartment' ? 'דירה  شقة' : 
                             a === 'none' ? 'אין לי רכוש  ليس لدي ممتلكات' :
                             'רכוש אחר  ممتلكات أخرى'
                           ).join(', ')} 
                           readOnly
                         />
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

              <div className={styles.fixedFooter}>
                  <button type="submit" className={styles.btnPrimary}>
                    <BiInline ar="موافقة" he="אישור וסיום" />
                  </button>
                  <button type="button" onClick={() => setScreen(5)} className={styles.btnSecondary}>
                    <BiInline ar="تعديل" he="חזור לעריכה" />
                  </button>
              </div>
        </form>
      )}

    </div>
  );
}
