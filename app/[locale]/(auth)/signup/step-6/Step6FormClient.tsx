"use client";

import { useMemo, useState, useRef } from "react";
import Image from "next/image";
import styles from "@/lib/styles/IntakeForm.module.css";
import isoCountries from "i18n-iso-countries";
import arLocale from "i18n-iso-countries/langs/ar.json";
import heLocale from "i18n-iso-countries/langs/he.json";
import { submitStep6Child, translateStep6Data, proceedToStep7 } from "@/app/[locale]/(auth)/signup/actions"; 

// Register locales for countries
isoCountries.registerLocale(arLocale as any);
isoCountries.registerLocale(heLocale as any);

const INTRO_IMAGE = "/images/step6-intro-baby.svg";
const TOTAL_SCREENS = 3; // מסכי מילוי לילד בודד

// --- Helpers ---
function BiInline({ ar, he }: { ar: string; he: string }) {
  return (
    <>
      <span>{ar}</span>
      <span>{he}</span>
    </>
  );
}

function formatDateDisplay(iso: string) {
  if (!iso) return "";
  return iso.split('-').reverse().join('.');
}

// --- Components ---

function CountrySelect({ name, labelAr, labelHe }: { name: string, labelAr: string, labelHe: string }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const countries = useMemo(() => {
    const arNames = isoCountries.getNames("ar", { select: "official" });
    const heNames = isoCountries.getNames("he", { select: "official" });
    return Object.keys(arNames).map(code => ({
      code,
      labelAr: arNames[code],
      labelHe: heNames[code],
      searchVal: `${arNames[code]} ${heNames[code]}`
    }));
  }, []);

  const filtered = useMemo(() => {
    if (!query) return countries;
    const lower = query.toLowerCase();
    return countries.filter(c => c.searchVal.toLowerCase().includes(lower));
  }, [query, countries]);

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.comboboxWrap}>
        <input 
          type="text" 
          className={styles.inputBase} 
          placeholder="اختر دولة / בחר מדינה" 
          value={query} 
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }} 
          onFocus={() => setIsOpen(true)} 
          onBlur={() => setTimeout(() => setIsOpen(false), 200)} 
        />
        <input type="hidden" name={name} value={query} />
        {isOpen && filtered.length > 0 && (
          <ul className={styles.comboboxMenu}>
            {filtered.map((c) => (
              <li key={c.code} className={styles.comboboxItem} onMouseDown={() => { setQuery(`${c.labelAr} ${c.labelHe}`); setIsOpen(false); }}>
                <span>{c.labelHe}</span><span>{c.labelAr}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DateField({ labelHe, labelAr, name }: { labelHe: string; labelAr: string; name: string }) {
  return (
    <div className={styles.fieldGroup}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.dateWrapper}>
        <Image src="/images/calendar.svg" alt="Calendar" width={24} height={24} className={styles.calendarIcon} style={{left:'12px'}} />
        <input className={styles.dateInput} type="date" name={name} style={{paddingLeft:'40px', fontSize: '15px'}} />
      </div>
    </div>
  );
}

type Props = {
  locale: string;
  saved: boolean;
  existingChildren: any[];
};

export default function Step6FormClient({ locale, saved }: Props) {
  const [screen, setScreen] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // מפתח לריענון הטופס - כשזה משתנה, הטופס נמחק ומתאפס
  const [formKey, setFormKey] = useState(0); 
  const [formGender, setFormGender] = useState(""); // לאיפוס כפתורי רדיו
  const formRef = useRef<HTMLFormElement>(null);
  
  const [allChildrenTranslated, setAllChildrenTranslated] = useState<any[]>([]);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const progress = useMemo(() => screen === 0 ? 0 : Math.min(100, Math.round((screen / 3) * 100)), [screen]);
  const goNext = () => setScreen(s => Math.min(3, s + 1));
  const goBack = () => setScreen(s => Math.max(0, s - 1));

  // --- Handlers ---

  // הוספת ילד נוסף
  const handleAddAnother = async () => {
    if (!formRef.current) return;
    setIsProcessing(true);
    
    try {
      const formData = new FormData(formRef.current);
      // קריאה לשרת ללא redirect
      const res = await submitStep6Child(locale, "add_another", formData);
      
      if (res?.success) {
        // איפוס מלא של הטופס
        setFormKey(prev => prev + 1);
        setFormGender("");
        setScreen(1); // חזרה להתחלה
        setShowSavedMsg(true);
        window.scrollTo(0,0);
        
        setTimeout(() => setShowSavedMsg(false), 3000);
      }
    } catch (e) {
      console.error(e);
      alert("Error saving child.");
    } finally {
      setIsProcessing(false);
    }
  };

  // סיום שלב ומעבר לסיכום
  const handleFinishStep = async () => {
    if (!formRef.current) return;
    setIsProcessing(true);
    
    try {
      const formData = new FormData(formRef.current);
      const res = await submitStep6Child(locale, "finish_step", formData);
      
      if (res?.updatedChildren) {
         const translated = await translateStep6Data(res.updatedChildren);
         setAllChildrenTranslated(translated);
         setScreen(4); // מעבר למסך סיכום
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalApprove = async () => {
     setIsProcessing(true);
     await proceedToStep7(locale);
  };

  return (
    <div className={styles.pageContainer} dir="rtl">
      
      {isProcessing && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText} style={{marginTop: 20}}>
             <p style={{fontSize: 18, fontWeight: 'bold'}}>מעבד נתונים...</p>
             <p style={{fontSize: 14, color: '#666'}}>جاري المعالجة...</p>
          </div>
        </div>
      )}

      {/* Intro Screen */}
      {screen === 0 && (
        <div className={styles.stepSplashContainer}>
          <Image src={INTRO_IMAGE} alt="Baby" width={280} height={200} className={styles.stepSplashImage} priority />
          <div className={styles.stepSplashContent}>
            <div className={styles.stepNumberTitle}><span>المرحلة 6</span><span>שלב 6</span></div>
            <div className={styles.stepMainTitle}><span>أولاد</span><span>ילדים</span></div>
            <div className={styles.stepDescription}>
                <p dir="rtl">بهالمرحلة لازم تعبي معلومات عن الأولاد تحت جيل 18<br/>الوقت المتوقع للتعبئة: 2 دقيقة</p>
                <br/>
                <p dir="rtl">בשלב זה יש למלא מידע על ילדים מתחת לגיל 18<br/>זמן מילוי משוער: 2 דקות</p>
            </div>
          </div>
          <button type="button" className={styles.btnDark} onClick={goNext}><BiInline ar="ابدأ" he="התחל" /></button>
        </div>
      )}

      {/* Form Screens (1-3) */}
      {screen > 0 && screen < 4 && (
        <form 
          key={formKey} // זה הטריק שמאפס את הטופס!
          ref={formRef} 
          className={styles.scrollableContent} 
          onSubmit={(e) => e.preventDefault()}
        >
          <div className={styles.topBar}>
            <div className={styles.topRow} style={{justifyContent: 'flex-start'}}>
               <button type="button" className={styles.backBtn} onClick={goBack}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
               </button>
               <div className={styles.stepMeta} style={{marginRight: 10}}><span>المرحلة 6 من 7</span><span> | </span><span>שלב 6 מתוך 7</span></div>
            </div>
            <div className={styles.progressBarTrack}><div className={styles.progressBarFill} style={{ width: `${progress}%` }} /></div>
            <div className={styles.titleBlock}>
                <h1 className={styles.formTitle} style={{justifyContent:'flex-start'}}><BiInline ar="بيانات الأطفال" he="פרטי ילדים" /></h1>
            </div>
            {showSavedMsg && (
                <div style={{
                    background: '#dcfce7', color: '#166534', padding: '12px', 
                    borderRadius: '8px', textAlign: 'center', fontSize: '15px', marginBottom: '15px', fontWeight: 'bold'
                }}>
                    <BiInline ar="تم حفظ الطفل بنجاح" he="הילד נשמר בהצלחה! ניתן להזין ילד נוסף" />
                </div>
            )}
          </div>

          {/* Screen 1: General A */}
          <div style={{ display: screen === 1 ? 'block' : 'none' }}>
            <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div></div>
            <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="اسم العائلة" he="שם משפחה" /></div><input name="childLastName" className={styles.inputBase} /></div>
            <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="الاسم الشخصي" he="שם פרטי" /></div><input name="childFirstName" className={styles.inputBase} /></div>
            
            <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="النوع" he="מין" /></div>
                <div className={styles.selectionRow}>
                    <label className={styles.selectionLabel}>
                        <input type="radio" name="childGender" value="male" onChange={() => setFormGender('male')} checked={formGender === 'male'} />
                        <span className={styles.selectionSpan}><BiInline ar="ذكر" he="זכר" /></span>
                    </label>
                    <label className={styles.selectionLabel}>
                        <input type="radio" name="childGender" value="female" onChange={() => setFormGender('female')} checked={formGender === 'female'} />
                        <span className={styles.selectionSpan}><BiInline ar="أنثى" he="נקבה" /></span>
                    </label>
                </div>
            </div>

            <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button>
            </div>
          </div>

          {/* Screen 2: General B */}
          <div style={{ display: screen === 2 ? 'block' : 'none' }}>
            <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="عام" he="כללי" /></div></div>
            <DateField labelAr="تاريخ الميلاد" labelHe="תאריך לידה" name="childBirthDate" />
            <CountrySelect name="childNationality" labelAr="الجنسية" labelHe="אזרחות" />
            <div className={styles.fieldGroup}><div className={styles.label}><BiInline ar="رقم بطاقة الهوية" he="מספר תעודת זהות" /></div><input name="childIsraeliId" className={styles.inputBase} inputMode="numeric" /></div>
            
            <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={goNext}><BiInline ar="التالي" he="המשך" /></button>
            </div>
          </div>

          {/* Screen 3: Migration & Actions */}
          <div style={{ display: screen === 3 ? 'block' : 'none' }}>
            <div className={styles.sectionHead}><div className={styles.sectionTitle}><BiInline ar="الهجرة" he="הגירה" /></div></div>
            <CountrySelect name="childResidenceCountry" labelAr="بلد الميلاد" labelHe="ארץ לידה" />
            <DateField labelAr="تاريخ الهجرة إلى البلاد" labelHe="תאריך עלייה לארץ" name="childEntryDate" />
            <DateField labelAr="تاريخ الدخول إلى البلاد" labelHe="תאריך כניסה לארץ" name="childArrivalToIsraelDate" />

            <div className={styles.fixedFooter}>
               {/* כפתור הוספת ילד - שומר ומנקה את הטופס */}
               <button type="button" onClick={handleAddAnother} className={styles.btnPrimary} style={{marginBottom: 10, background: '#0b2a4a'}}>
                 <BiInline ar="إضافة طفل/طفلة" he="הוספת ילד.ה" />
               </button>

               {/* כפתור סיום - שומר ומעביר לסיכום */}
               <button type="button" onClick={handleFinishStep} className={styles.btnPrimary}>
                 <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
               </button>
            </div>
          </div>
        </form>
      )}

      {/* --- Screen 4: Summary --- */}
      {screen === 4 && (
        <div className={styles.scrollableContent} style={{paddingTop: 0}}>
            <div className={styles.reviewHeader}>
                <div className={styles.reviewTitle}>
                    <span>نهاية المرحلة 6</span><span>סוף שלב 6</span>
                </div>
                <div className={styles.summarySub} style={{ lineHeight: '1.6' }}>
                    <span>يرجى التحقق من صحة التفاصيل وترجمتها</span><br/>
                    <span>אנא וודא/י כי כל הפרטים ותרגומם נכונים</span>
                </div>
            </div>

            {/* Loop through all children */}
            {allChildrenTranslated.map((child, index) => (
                <div key={index} style={{marginBottom: 40, borderBottom: '1px solid #eee', paddingBottom: 20}}>
                    <div className={styles.sectionHead}>
                        <div className={styles.sectionTitle} style={{color: '#EE7248'}}>
                            <BiInline ar={`الطفل ${index + 1}`} he={`ילד.ה ${index + 1}`} />
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <div className={styles.label}><BiInline ar="الاسم الشخصي" he="שם פרטי" /></div>
                        <div className={styles.translationPill}>
                           <div className={styles.transOriginal}>{child.firstNameTranslation.original}</div>
                           <div className={styles.transTranslated}>
                             <input className={styles.inputBase} 
                                    style={{background: 'transparent', border: 'none', fontWeight: 700, padding: 0, height: 'auto', textAlign: 'right'}} 
                                    defaultValue={child.firstNameTranslation.translated} disabled 
                             />
                           </div>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <div className={styles.label}><BiInline ar="اسم العائلة" he="שם משפחה" /></div>
                        <div className={styles.translationPill}>
                           <div className={styles.transOriginal}>{child.lastNameTranslation.original}</div>
                           <div className={styles.transTranslated}>
                             <input className={styles.inputBase} 
                                    style={{background: 'transparent', border: 'none', fontWeight: 700, padding: 0, height: 'auto', textAlign: 'right'}} 
                                    defaultValue={child.lastNameTranslation.translated} disabled 
                             />
                           </div>
                        </div>
                    </div>

                    <div className={styles.fieldGroup}>
                        <div className={styles.label}><BiInline ar="تاريخ الميلاد" he="תאריך לידה" /></div>
                        <input className={styles.readOnlyInput} value={formatDateDisplay(child.birthDate)} readOnly />
                    </div>
                    {child.israeliId && (
                        <div className={styles.fieldGroup}>
                            <div className={styles.label}><BiInline ar="رقم الهوية" he="ת.ז ישראלית" /></div>
                            <input className={styles.readOnlyInput} value={child.israeliId} readOnly style={{direction: 'ltr', textAlign: 'right'}} />
                        </div>
                    )}
                </div>
            ))}

            {allChildrenTranslated.length === 0 && (
                <div style={{textAlign: 'center', padding: 20, color: '#666'}}>
                    <BiInline ar="لم يتم إضافة أطفال" he="לא נוספו ילדים" />
                </div>
            )}

            <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={handleFinalApprove}>
                    <BiInline ar="موافقة" he="אישור וסיום" />
                </button>
                <button type="button" onClick={() => window.location.reload()} className={styles.btnSecondary}>
                    <BiInline ar="تعديل (إعادة تعيين)" he="עריכה (איפוס)" />
                </button>
            </div>
        </div>
      )}

    </div>
  );
}