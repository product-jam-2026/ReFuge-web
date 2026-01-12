"use client";

import { useEffect, useMemo, useState, CSSProperties } from "react";
import styles from "./step2.module.css";
import isoCountries from "i18n-iso-countries";
import arLocale from "i18n-iso-countries/langs/ar.json";
import heLocale from "i18n-iso-countries/langs/he.json";

// רישום שפות
isoCountries.registerLocale(arLocale as any);
isoCountries.registerLocale(heLocale as any);

type Props = {
  locale: string;
  saved: boolean;
  labels: any;
  defaults: {
    visaType: string;
    visaStartDate: string;
    visaEndDate: string;
    entryDate: string;
    residenceCountry: string;
    residenceCity: string;
    residenceAddress: string;
  };
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
};

// --- רכיבי עזר לטקסט דו-לשוני (מעודכנים עם Style) ---

interface BiProps {
  ar: string;
  he: string;
  className?: string;
  style?: CSSProperties; // הוספנו את זה לתיקון השגיאה
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

// פונקציית עזר לחיפוש ערים (GeoNames)
type CityOpt = { id: number; ar: string; he: string; label: string };

async function fetchCitiesBilingual(params: { countryISO2: string; query: string }): Promise<CityOpt[]> {
  const username = process.env.NEXT_PUBLIC_GEONAMES_USERNAME || "demo"; 
  const { countryISO2, query } = params;
  if (!countryISO2 || query.trim().length < 2) return [];

  const base = "https://secure.geonames.org/searchJSON";
  const common = `featureClass=P&maxRows=10&country=${countryISO2}&name_startsWith=${encodeURIComponent(query)}&username=${username}`;

  try {
    const res = await fetch(`${base}?${common}&lang=en`);
    const data = await res.json();
    if (!data.geonames) return [];

    return data.geonames.map((item: any) => ({
      id: item.geonameId,
      ar: item.alternateNames?.find((n:any) => n.lang === 'ar')?.name || item.name,
      he: item.alternateNames?.find((n:any) => n.lang === 'he')?.name || item.name,
      label: item.name 
    }));
  } catch (e) {
    return [];
  }
}

export default function Step2FormClient({
  saved,
  labels,
  defaults,
  saveDraftAction,
  saveAndNextAction,
}: Props) {
  // ניהול מסכים: 0=כתום, 1=הגירה, 2=אשרה
  const [screen, setScreen] = useState<number>(0);

  const progress = useMemo(() => {
    if (screen === 1) return 15; 
    if (screen === 2) return 28; 
    return 0;
  }, [screen]);

  const goNext = () => setScreen((s) => Math.min(2, s + 1));
  const goBack = () => setScreen((s) => Math.max(0, s - 1));

  // --- לוגיקת מדינות ---
  const countryOptions = useMemo(() => {
    const ar = isoCountries.getNames("ar", { select: "official" });
    const he = isoCountries.getNames("he", { select: "official" });
    return Object.keys(ar).map(code => ({
      code,
      label: `${ar[code]} ${he[code]}`,
      search: `${ar[code]} ${he[code]}`
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  const [countryText, setCountryText] = useState(defaults.residenceCountry || "");
  const [countryISO2, setCountryISO2] = useState("");

  useEffect(() => {
    const found = countryOptions.find(c => c.label === countryText);
    if (found) setCountryISO2(found.code);
  }, [countryText, countryOptions]);

  // --- לוגיקת ערים ---
  const [cityText, setCityText] = useState(defaults.residenceCity || "");
  const [cityOptions, setCityOptions] = useState<CityOpt[]>([]);
  const [cityLoading, setCityLoading] = useState(false);

  useEffect(() => {
    if (!countryISO2 || cityText.length < 2) return;
    const timer = setTimeout(async () => {
      setCityLoading(true);
      const res = await fetchCitiesBilingual({ countryISO2, query: cityText });
      setCityOptions(res.map(c => ({...c, label: `${c.ar} ${c.he}`})));
      setCityLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [cityText, countryISO2]);

  return (
    <div className={styles.wrap}>
      
      {/* --- Screen 0: Intro (Orange) --- */}
      {screen === 0 && (
        <div className={styles.introFull}>
          <div className={styles.introContent}>
            <div className={styles.introTop}>
              <BiInline ar="المرحلة 2 من 7" he="שלב 2 מתוך 7" className={styles.introStep} />
            </div>
            <div className={styles.introMain}>
              <BiInline ar="الوضع القانوني" he="מעמד" className={styles.introH1} />
            </div>
            <div className={styles.introText}>
              <BiStack 
                ar="في هذه المرحلة سنسأل عن بلد الأصل، تاريخ الوصول والوضع القانوني الحالي." 
                he="בשלב זה נשאל על ארץ המקור, תאריך ההגעה והמעמד החוקי הנוכחי." 
              />
              <div className={styles.introMeta}>
                <BiInline ar="الوقت المتوقع: 2 دقائق" he="זמן משוער: 2 דקות" />
              </div>
            </div>
            <button type="button" className="btnPrimary" style={{background: '#0b2a4a'}} onClick={goNext}>
              <BiInline ar="ابدأ" he="התחל" />
            </button>
          </div>
        </div>
      )}

      {/* --- Forms (White Screens) --- */}
      {screen > 0 && (
        <form className={styles.form} action={saveAndNextAction}>
          {/* Header Area */}
          <button type="button" className={styles.backBtn} onClick={goBack}>➜</button>
          
          <div className={styles.headerArea}>
            <div className={styles.topMeta}>
              <BiInline ar="المرحلة 2 من 7" he="שלב 2 מתוך 7" className={styles.stepMeta} />
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className={styles.titleBlock}>
              <BiInline ar="الوضع القانوني" he="מעמד" className={styles.h1} />
            </div>

            {saved && (
              <div className={styles.savedNote}>
                <BiInline ar="تم حفظ المسودة" he="הטיוטה נשמרה" />
              </div>
            )}
          </div>

          {/* --- Screen 1: Migration Details --- */}
          {screen === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className={styles.titleBlock}>
                 <BiInline ar="الهجرة" he="הגירה" className={styles.label} style={{fontSize: 18, marginBottom: 15}} />
              </div>

              {/* Country Field */}
              <div className={styles.field}>
                <label><BiInline ar="بلد الميلاد" he="ארץ לידה" className={styles.label} /></label>
                <input 
                  list="countries" 
                  name="residenceCountry" 
                  value={countryText}
                  onChange={(e) => setCountryText(e.target.value)}
                  className={styles.inputControl}
                  placeholder="اختر / בחר"
                  autoComplete="off"
                />
                <datalist id="countries">
                  {countryOptions.map(c => <option key={c.code} value={c.label} />)}
                </datalist>
              </div>

              {/* City Field */}
              <div className={styles.field}>
                <label><BiInline ar="مدينة الميلاد" he="עיר לידה" className={styles.label} /></label>
                <input 
                  list="cities" 
                  name="residenceCity"
                  value={cityText}
                  onChange={(e) => setCityText(e.target.value)}
                  className={styles.inputControl}
                  placeholder={countryISO2 ? "اختر / בחר" : "בחר מדינה קודם"}
                  disabled={!countryISO2}
                  autoComplete="off"
                />
                <datalist id="cities">
                  {cityOptions.map(c => <option key={c.id} value={c.label} />)}
                </datalist>
                {cityLoading && <div className={styles.miniHint}>טוען... / جار التحميل...</div>}
              </div>

              {/* Purpose Field */}
              <div className={styles.field}>
                <label><BiInline ar="هدف الإقامة في البلد" he="מטרת שהייה בארץ" className={styles.label} /></label>
                <input 
                  name="residenceAddress" 
                  defaultValue={defaults.residenceAddress} 
                  className={styles.inputControl}
                />
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
          )}

          {/* --- Screen 2: Visa Details --- */}
          {screen === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className={styles.titleBlock}>
                 <BiInline ar="التأشيرة" he="אשרה" className={styles.label} style={{fontSize: 18, marginBottom: 15}} />
              </div>

              {/* Visa Type */}
              <div className={styles.field}>
                <label><BiInline ar="نوع التأشيرة" he="סוג אשרה" className={styles.label} /></label>
                <div className={styles.selectWrapper}>
                  <select 
                    name="visaType" 
                    defaultValue={defaults.visaType}
                    className={styles.inputControl}
                  >
                    <option value="" disabled hidden>اختر / בחר</option>
                    <option value="tourist">سائح / תייר (ב/2)</option>
                    <option value="asylum">طالب لجوء / מבקש מקלט (2أ5)</option>
                    <option value="work">عمل / עבודה (ب/1)</option>
                  </select>
                </div>
              </div>

              {/* Dates Range (Split Row) */}
              <div className={styles.field}>
                <label><BiInline ar="توقيف" he="תוקף" className={styles.label} /></label>
                <div className={styles.dateRow}>
                  <div className={styles.dateCol}>
                    <input 
                      type="date" 
                      name="visaEndDate" 
                      defaultValue={defaults.visaEndDate} 
                      className={`${styles.inputControl} ${styles.dateInput}`} 
                      placeholder="עד" 
                    />
                  </div>
                  <span>-</span>
                  <div className={styles.dateCol}>
                    <input 
                      type="date" 
                      name="visaStartDate" 
                      defaultValue={defaults.visaStartDate} 
                      className={`${styles.inputControl} ${styles.dateInput}`} 
                      placeholder="מ" 
                    />
                  </div>
                </div>
              </div>

              {/* Entry Date */}
              <div className={styles.field}>
                <label><BiInline ar="تاريخ الدخول إلى البلاد" he="תאריך כניסה לארץ" className={styles.label} /></label>
                <input 
                  type="date" 
                  name="entryDate" 
                  defaultValue={defaults.entryDate} 
                  className={`${styles.inputControl} ${styles.dateInput}`} 
                />
              </div>

              <div className={styles.actions}>
                <button type="submit" className="btnPrimary">
                  <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
                </button>
                <button type="submit" formAction={saveDraftAction} className="btnSecondary">
                  <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                </button>
              </div>
            </div>
          )}

        </form>
      )}
    </div>
  );
}