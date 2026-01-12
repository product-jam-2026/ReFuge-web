"use client";

import { useEffect, useMemo, useState, CSSProperties } from "react";
import styles from "./step3.module.css";

// --- Visual Helpers ---
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

// ✅ התיקון כאן: הוספנו את saveDraftAndBackAction לטיפוסים
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
  saveDraftAndBackAction, // ✅ וגם כאן
}: Props) {
  // Screens: 
  // 0: Intro
  // 1: Marital Status
  // 2: Residence Address (+ Mailing Toggle)
  // 3: Mailing Address (Only if toggle is true)
  // 4: Employment
  // 5: Assets
  const [screen, setScreen] = useState(0);

  // --- Logic State ---
  const [maritalStatus, setMaritalStatus] = useState(defaults.maritalStatus || "");
  const isMarried = maritalStatus === "married";

  const [mailingDifferent, setMailingDifferent] = useState(defaults.mailingDifferent || false);
  const [empStatus, setEmpStatus] = useState(defaults.employmentStatus || "");
  const [assets, setAssets] = useState<string[]>(defaults.assets || []);

  const toggleAsset = (val: string) => {
    setAssets(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  // Cities
  const [regCityText, setRegCityText] = useState(defaults.regCity || "");
  const [regCityOpts, setRegCityOpts] = useState<CityOpt[]>([]);
  const [mailCityText, setMailCityText] = useState(defaults.mailingAddress?.city || "");
  const [mailCityOpts, setMailCityOpts] = useState<CityOpt[]>([]);

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

  // --- Navigation Logic ---
  const progress = useMemo(() => {
    if (screen === 0) return 0;
    return Math.round((screen / 5) * 100);
  }, [screen]);

  const goNext = () => {
    if (screen === 2 && !mailingDifferent) {
      // If on Address screen and mailing is same -> Skip Mailing screen (3) -> Go to 4
      setScreen(4);
    } else {
      setScreen(s => Math.min(5, s + 1));
    }
  };

  const goBack = () => {
    if (screen === 4 && !mailingDifferent) {
      // If on Employment and mailing was same -> Skip Mailing screen (3) -> Go to 2
      setScreen(2);
    } else {
      setScreen(s => Math.max(0, s - 1));
    }
  };

  return (
    <div className={styles.wrap}>
      
      {/* Intro Screen (0) */}
      {screen === 0 && (
        <div className={styles.introFull}>
          <div className={styles.introContent}>
            <div className={styles.introTop}>
              <BiInline ar="المرحلة 3 من 7" he="שלב 3 מתוך 7" className={styles.introStep} />
            </div>
            <div className={styles.introMain}>
              <BiInline ar="مركز الحياة" he="מרכז חיים" className={styles.introH1} />
            </div>
            <div className={styles.introText}>
              <BiStack 
                ar="مكان سكنك وحياتك. نسأل عن عنوان السكن، الشغل، والحالة العائلية." 
                he="מקום המגורים והחיים שלך. נשאל על כתובת המגורים, העבודה, והמצב המשפחתי." 
              />
              <div className={styles.introMeta}>
                <BiInline ar="الوقت المتوقع: 6 دقيقة" he="זמן משוער: 6 דקות" />
              </div>
            </div>
            <button type="button" className="btnPrimary" style={{background: '#0b2a4a'}} onClick={goNext}>
              <BiInline ar="ابدأ" he="התחל" />
            </button>
          </div>
        </div>
      )}

      {/* Form Container (Screens 1-5) */}
      <form className={screen > 0 ? styles.form : styles.screenHide} action={saveAndNextAction}>
        
        {/* Header (Back, Title, Progress) */}
        <button type="button" className={styles.backBtn} onClick={goBack}>➜</button>

        <div className={styles.headerArea}>
          <div className={styles.topMeta}>
            <BiInline ar="المرحلة 3 من 7" he="שלב 3 מתוך 7" className={styles.stepMeta} />
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className={styles.titleBlock}>
            <BiInline ar="مركز الحياة" he="מרכז חיים" className={styles.h1} />
          </div>
          {saved && (
            <div className={styles.savedNote}>
              <BiInline ar="تم حفظ المسودة" he="הטיוטה נשמרה" />
            </div>
          )}
        </div>

        {/* --- Screen 1: Marital Status --- */}
        <div className={screen === 1 ? styles.screenShow : styles.screenHide}>
           <div className={styles.titleBlock}>
             <BiInline ar="الحالة الاجتماعية" he="מצב משפחתי" className={styles.label} style={{fontSize: 18}} />
           </div>
           
           <div className={styles.field}>
              <label><BiInline ar="اختر" he="בחר" className={styles.label} /></label>
              <div className={styles.selectWrapper}>
                <select 
                  name="maritalStatus" 
                  value={maritalStatus} 
                  onChange={e => setMaritalStatus(e.target.value)}
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

           {isMarried && (
              <div className={styles.field}>
                <label><BiInline ar="تاريخ ميلاد الزوج/ة" he="תאריך לידה (בן/בת הזוג)" className={styles.label} /></label>
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

        {/* --- Screen 2: Residence Address --- */}
        <div className={screen === 2 ? styles.screenShow : styles.screenHide}>
            <div className={styles.titleBlock}>
               <BiInline ar="عنوان السكن" he="כתובת מגורים" className={styles.label} style={{fontSize: 18}} />
               <div className={styles.subtitle}><BiInline ar="المسجل في وزارة الداخلية" he="הרשומה במשרד הפנים" /></div>
            </div>

            <div className={styles.field}>
              <label><BiInline ar="مدينة" he="עיר" className={styles.label} /></label>
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
              <label><BiInline ar="شارع" he="רחוב" className={styles.label} /></label>
              <input name="regStreet" defaultValue={defaults.regStreet} className={styles.inputControl} />
            </div>

            <div className={styles.field}>
              <div className={styles.gridRow}>
                 <div>
                   <label><BiInline ar="منزل" he="בית" className={styles.label} /></label>
                   <input name="regHouseNumber" defaultValue={defaults.regHouseNumber} className={styles.inputControl} />
                 </div>
                 <div>
                   <label><BiInline ar="دخول" he="כניסה" className={styles.label} /></label>
                   <input name="regEntry" defaultValue={defaults.regEntry} className={styles.inputControl} />
                 </div>
                 <div>
                   <label><BiInline ar="شقة" he="דירה" className={styles.label} /></label>
                   <input name="regApartment" defaultValue={defaults.regApartment} className={styles.inputControl} />
                 </div>
              </div>
            </div>

            <div className={styles.field}>
              <label><BiInline ar="الرمز البريدي" he="מיקוד" className={styles.label} /></label>
              <input name="regZip" defaultValue={defaults.regZip} className={styles.inputControl} inputMode="numeric" />
            </div>

            <div className={styles.field}>
                <label><BiInline ar="شقة مستأجرة / بملكية" he="דירה שכורה / בבעלות" className={styles.label} /></label>
                <div className={styles.selectWrapper}>
                  <select name="housingType" defaultValue={defaults.housingType} className={styles.inputControl}>
                     <option value="rented">شقة مستأجرة / דירה שכורה</option>
                     <option value="owned">شقة بملكية / דירה בבעלות</option>
                     <option value="other">آخر / אחר</option>
                  </select>
                </div>
            </div>

            {/* Mailing Address Question */}
            <div className={styles.toggleSection}>
                <label className={styles.checkboxLabel}>
                  <BiInline ar="عنوان المراسلات مختلف؟" he="כתובת למכתבים שונה?" />
                  <input 
                    type="checkbox" 
                    checked={mailingDifferent} 
                    onChange={(e) => setMailingDifferent(e.target.checked)} 
                  />
                  <input type="hidden" name="mailingDifferent" value={mailingDifferent ? "true" : "false"} />
                </label>
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

        {/* --- Screen 3: Mailing Address (Optional) --- */}
        <div className={screen === 3 ? styles.screenShow : styles.screenHide}>
            <div className={styles.titleBlock}>
               <BiInline ar="عنوان المراسلات" he="כתובת למכתבים" className={styles.label} style={{fontSize: 18}} />
            </div>

            <div className={styles.field}>
              <label><BiInline ar="مدينة" he="עיר" className={styles.label} /></label>
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
              <label><BiInline ar="شارع" he="רחוב" className={styles.label} /></label>
              <input name="mailStreet" defaultValue={defaults.mailingAddress?.street} className={styles.inputControl} />
            </div>
            
            {/* Same grid for Mailing */}
            <div className={styles.field}>
              <div className={styles.gridRow}>
                 <div>
                   <label><BiInline ar="منزل" he="בית" className={styles.label} /></label>
                   <input name="mailHouseNumber" className={styles.inputControl} />
                 </div>
                 <div>
                   <label><BiInline ar="دخول" he="כניסה" className={styles.label} /></label>
                   <input name="mailEntry" className={styles.inputControl} />
                 </div>
                 <div>
                   <label><BiInline ar="شقة" he="דירה" className={styles.label} /></label>
                   <input name="mailApartment" className={styles.inputControl} />
                 </div>
              </div>
            </div>

            <div className={styles.field}>
              <label><BiInline ar="الرمز البريدي" he="מיקוד" className={styles.label} /></label>
              <input name="mailZip" className={styles.inputControl} inputMode="numeric" />
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

        {/* --- Screen 4: Employment --- */}
        <div className={screen === 4 ? styles.screenShow : styles.screenHide}>
             <div className={styles.titleBlock}>
                 <BiInline ar="العمل" he="תעסוקה" className={styles.label} style={{fontSize: 18}} />
                 <div className={styles.subtitle}><BiInline ar="مهنة في البلاد" he="עיסוק בארץ" /></div>
             </div>

             <div className={styles.field}>
                  <label><BiInline ar="الوضع" he="סטטוס" className={styles.label} /></label>
                  <div className={styles.selectWrapper}>
                    <select 
                      name="employmentStatus" 
                      value={empStatus} 
                      onChange={e => setEmpStatus(e.target.value)} 
                      className={styles.inputControl}
                    >
                      <option value="" disabled hidden>اختر / בחר</option>
                      <option value="selfEmployed">مستقل / עצמאי</option>
                      <option value="employee">موظف / שכיר</option>
                      <option value="notWorking">لا يعمل / לא עובד</option>
                    </select>
                  </div>
             </div>

             {/* Logic for Employee */}
             {empStatus === 'employee' && (
                 <>
                   <div className={styles.field}>
                     <label><BiInline ar="اسم صاحب العمل" he="שם המעסיק" className={styles.label} /></label>
                     <input name="employerName" defaultValue={defaults.employerName} className={styles.inputControl} />
                   </div>
                   <div className={styles.field}>
                     <label><BiInline ar="عنوان صاحب العمل" he="כתובת המעסיק" className={styles.label} /></label>
                     <input name="workAddress" defaultValue={defaults.workAddress} className={styles.inputControl} />
                   </div>
                   <div className={styles.field}>
                     <label><BiInline ar="تاريخ بدء العمل" he="תאריך תחילת העבודה" className={styles.label} /></label>
                     <input type="date" name="workStartDate" defaultValue={defaults.workStartDate} className={styles.inputControl} />
                   </div>
                 </>
             )}

             {/* Logic for Self Employed */}
             {empStatus === 'selfEmployed' && (
                 <>
                   <div className={styles.field}>
                      <label><BiInline ar="اسم المصلحة" he="שם העסק" className={styles.label} /></label>
                      <input name="businessName" defaultValue={defaults.employerName} className={styles.inputControl} />
                   </div>
                   <div className={styles.field}>
                      <label><BiInline ar="عنوان المصلحة" he="כתובת העסק" className={styles.label} /></label>
                      <input name="workAddress" defaultValue={defaults.workAddress} className={styles.inputControl} />
                   </div>
                   <div className={styles.field}>
                      <label><BiInline ar="تاريخ الافتتاح" he="תאריך פתיחה" className={styles.label} /></label>
                      <input type="date" name="workStartDate" defaultValue={defaults.workStartDate} className={styles.inputControl} />
                   </div>
                 </>
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

        {/* --- Screen 5: Assets --- */}
        <div className={screen === 5 ? styles.screenShow : styles.screenHide}>
            <div className={styles.titleBlock}>
                 <BiInline ar="ممتلكات" he="רכוש" className={styles.label} style={{fontSize: 18}} />
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
                         <BiInline ar={item.ar} he={item.he} className={styles.assetLabel} />
                         <input 
                           type="checkbox" 
                           name="assets" 
                           value={item.val} 
                           checked={assets.includes(item.val)}
                           onChange={() => toggleAsset(item.val)}
                         />
                      </label>
                    ))}
                 </div>
            </div>

            <div className={styles.actions}>
                <button type="submit" className="btnPrimary">
                  <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
                </button>
                <button type="submit" formAction={saveDraftAction} className="btnSecondary">
                  <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                </button>
                {/* כאן אפשר להוסיף כפתור שמור וחזור אם נדרש, ולקשר ל-saveDraftAndBackAction */}
                <button type="submit" formAction={saveDraftAndBackAction} className="btnSecondary" style={{border: 'none', fontSize: '13px', color: '#666'}}>
                  <BiInline ar="حفظ والعودة" he="שמור וחזור" />
                </button>
            </div>
        </div>

      </form>

    </div>
  );
}