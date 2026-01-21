"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
// שימוש ב-CSS הכללי
import styles from "@/lib/styles/IntakeForm.module.css";
import { translateStep4Data } from "@/app/[locale]/(auth)/signup/actions"; 

const STEP_IMAGE = "/images/step4-intro-umbrella.svg"; 
const TOTAL_SCREENS = 3; 

// --- Visual Helpers ---
function BiInline({ ar, he }: { ar: string; he: string }) {
  return (
    <>
      <span>{ar}</span>
      <span>{he}</span>
    </>
  );
}

// --- Custom Select Component ---
function CustomSelect({ 
  labelAr, labelHe, value, onChange, options, placeholder 
}: { 
  labelAr: string, labelHe: string, value: string, onChange: (val: string) => void, 
  options: { value: string, labelAr: string, labelHe: string }[], placeholder: string 
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
    <div className={styles.fieldGroup} ref={containerRef}>
      <div className={styles.label}><BiInline ar={labelAr} he={labelHe} /></div>
      <div className={styles.comboboxWrap}>
        <div 
          className={styles.inputBase} 
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            height: 'auto', 
            minHeight: '56px',
            paddingTop: '8px',
            paddingBottom: '8px'
          }}
        >
           {selectedOption ? (
             // התיקון: תצוגה בשורה אחת
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 600, color: '#0B1B2B' }}>{selectedOption.labelAr}</span>
                <span style={{ fontSize: '1em', color: '#6B7280' }}>{selectedOption.labelHe}</span>
             </div>
           ) : (
             <span style={{ color: '#9CA3AF' }}>{placeholder}</span>
           )}
           
           <svg width="12" height="12" viewBox="0 0 12 12" style={{ transform: 'rotate(270deg)', opacity: 0.5, flexShrink: 0 }}>
              <path d="M4 2L0 6L4 10" stroke="currentColor" fill="none" strokeWidth="1.5"/>
           </svg>
        </div>

        {isOpen && (
          <ul className={styles.comboboxMenu} style={{ zIndex: 100 }}>
            {options.map((opt) => (
              <li 
                key={opt.value} 
                className={styles.comboboxItem} 
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                <span style={{ fontWeight: 500 }}>{opt.labelAr}</span>
                <span style={{ opacity: 0.8 }}>{opt.labelHe}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Lists Data ---
const healthFunds = [
  { value: "clalit", labelAr: "كلاليت", labelHe: "כללית" },
  { value: "maccabi", labelAr: "مكابي", labelHe: "מכבי" },
  { value: "meuhedet", labelAr: "موؤحدت", labelHe: "מאוחדת" },
  { value: "leumit", labelAr: "لئوميت", labelHe: "לאומית" },
];

const banks = [
  { value: "10", labelAr: "بنك لئومي (10)", labelHe: "בנק לאומי (10)" },
  { value: "12", labelAr: "بنك هبوعليم (12)", labelHe: "בנק הפועלים (12)" },
  { value: "20", labelAr: "بنك مزراحي تفحوت (20)", labelHe: "בנק מזרחי טפחות (20)" },
  { value: "11", labelAr: "بنك ديسكونت (11)", labelHe: "בנק דיסקונט (11)" },
  { value: "31", labelAr: "البنك الدولي (31)", labelHe: "הבנק הבינלאומי (31)" },
  { value: "4", labelAr: "بنك ياهف (4)", labelHe: "בנק יהב (4)" },
  { value: "17", labelAr: "بنك مركنتيل ديسكونت (17)", labelHe: "בנק מרכנתיל דיסקונט (17)" },
  { value: "14", labelAr: "بنك أوتسار هحيال (14)", labelHe: "בנק אוצר החייל (14)" },
  { value: "46", labelAr: "بنك مساد (46)", labelHe: "בנק מסד (46)" },
  { value: "54", labelAr: "بنك يרושלים (54)", labelHe: "בנק ירושלים (54)" },
];

const allowanceTypes = [
  { value: "income_support", labelAr: "ضمان الدخل", labelHe: "הבטחת הכנסה" },
  { value: "disability", labelAr: "إعاقة", labelHe: "נכות" },
  { value: "child", labelAr: "مخصصات الأطفال", labelHe: "קצבת ילדים" },
  { value: "unemployment", labelAr: "بطالة", labelHe: "אבטלה" },
  { value: "old_age", labelAr: "شيخوخة", labelHe: "זקנה" },
];

type HasYesNo = "yes" | "no" | "";

type Props = {
  locale: string;
  saved: boolean;
  defaults: any;
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
  saveDraftAndBackAction: (formData: FormData) => Promise<void>;
};

export default function Step4FormClient({
  saved,
  defaults,
  saveDraftAction,
  saveAndNextAction,
  saveDraftAndBackAction,
}: Props) {
  const [screen, setScreen] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  const [formDataState, setFormDataState] = useState<any>({});
  const formRef = useRef<HTMLFormElement>(null);
  const draftTimerRef = useRef<number | null>(null);

  // --- Logic State ---
  const [healthFund, setHealthFund] = useState(defaults.healthFund || "");
  const [bankName, setBankName] = useState(defaults.bankName || "");
  const [hasFile, setHasFile] = useState<HasYesNo>(defaults.hasFile || "");
  const [getsAllowance, setGetsAllowance] = useState<HasYesNo>(defaults.getsAllowance || "");
  const [allowanceType, setAllowanceType] = useState(defaults.allowanceType || "");

  // --- Progress Logic ---
  const progress = useMemo(() => {
    if (screen === 0) return 0;
    if (screen > TOTAL_SCREENS) return 100;
    return Math.round((screen / TOTAL_SCREENS) * 100);
  }, [screen]);

  const goNext = () => setScreen((s) => Math.min(TOTAL_SCREENS + 1, s + 1));
  const goBack = () => setScreen((s) => Math.max(0, s - 1));

  const handleFinishStep4 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    const currentData: any = {};
    formData.forEach((value, key) => { currentData[key] = value; });
    setFormDataState(currentData);

    setIsTranslating(true);
    try {
      await translateStep4Data(formData);
      setScreen(TOTAL_SCREENS + 1); 
    } catch (error) {
      console.error(error);
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

  const getLabel = (list: any[], val: string) => {
    const found = list.find(i => i.value === val);
    return found ? `${found.labelAr} / ${found.labelHe}` : val;
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

      {/* Intro Screen (0) */}
      {screen === 0 && (
        <div className={styles.stepSplashContainer}>
          <Image 
            src={STEP_IMAGE} 
            alt="Intro Umbrella" 
            width={280} 
            height={200} 
            className={styles.stepSplashImage}
            priority 
          />
          <div className={styles.stepSplashContent}>
            <div className={styles.stepNumberTitle}><span>المرحلة</span><span>שלב 4</span></div>
            <div className={styles.stepMainTitle}><span>جهات رسمية</span><span>מוסדות</span></div>
            <div className={styles.stepDescription}>
               <p dir="rtl">بهالمرحلة بنسأل عن صندوق المرضى، البنك، والتأمين الوطني<br/>الوقت المتوقع للتعبئة: 5 دقائق</p>
               <br/>
               <p dir="rtl">בשלב זה נשאל על קופת חולים, בנק וביטוח לאומי<br/>זמן מילוי משוער: 5 דקות</p>
            </div>
          </div>
          <button type="button" className={styles.btnDark} onClick={goNext}>
            <BiInline ar="ابدأ" he="התחל" />
          </button>
        </div>
      )}

      {/* --- FORM 1: Input Screens (1-3) --- */}
      {screen > 0 && screen <= TOTAL_SCREENS && (
      <>
        {/* Top Bar (Outside Form) */}
        <div className={styles.topBar}>
            <div className={styles.topRow}>
               <button type="button" className={styles.backBtn} onClick={goBack}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
               </button>
               <div className={styles.stepMeta}><span>المرحلة 4 من 7</span> <span>שלב 4 מתוך 7</span></div>
            </div>
            <div className={styles.progressBarTrack}><div className={styles.progressBarFill} style={{ width: `${progress}%` }} /></div>
            <div className={styles.titleBlock}>
                <h1 className={styles.formTitle} style={{justifyContent:'flex-start'}}><BiInline ar="جهات رسمية" he="מוסדות" /></h1>
            </div>
        </div>

        <form 
            ref={formRef}
            className={styles.scrollableContent} 
            onSubmit={(e) => e.preventDefault()}
        >
            {/* --- Screen 1: Health Fund --- */}
            <div style={{ display: screen === 1 ? 'block' : 'none', paddingTop: '40px' }}>
            <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}><BiInline ar="صندوق المرضى" he="קופת חולים" /></div>
            </div>
            
            <CustomSelect 
                labelAr="اختر" labelHe="בחר"
                value={healthFund} 
                onChange={setHealthFund} 
                options={healthFunds} 
                placeholder="בחר  اختر"
            />
            <input type="hidden" name="healthFund" value={healthFund} />

            <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={goNext}>
                    <BiInline ar="التالي" he="המשך" />
                </button>
                <button type="button" onClick={handleSaveDraft} className={styles.btnSecondary}>
                    <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
                </button>
            </div>
            </div>

            {/* --- Screen 2: Bank Details --- */}
            <div style={{ display: screen === 2 ? 'block' : 'none', paddingTop: '40px' }}>
                <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}><BiInline ar="تفاصيل حساب بنكي" he="פרטי חשבון בנק" /></div>
                </div>

                <CustomSelect 
                    labelAr="بنك" labelHe="בנק"
                    value={bankName} 
                    onChange={setBankName} 
                    options={banks} 
                    placeholder="בחר  اختر"
                />
                <input type="hidden" name="bankName" value={bankName} />

                {/* שדה סניף */}
                <div className={styles.fieldGroup}>
                    <div className={styles.label}><BiInline ar="اسم ورقم الفرع" he="שם ומספר סניף" /></div>
                    <input name="branch" defaultValue={defaults.branch} className={styles.inputBase} />                </div>

                {/* שדה חשבון */}
                <div className={styles.fieldGroup}>
                    <div className={styles.label}><BiInline ar="رقم الحساب" he="מספר חשבון" /></div>
                    <input name="accountNumber" defaultValue={defaults.accountNumber} className={styles.inputBase} inputMode="numeric" />
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

            {/* --- Screen 3: National Insurance --- */}
        <div style={{ display: screen === 3 ? 'block' : 'none', paddingTop: '40px' }}>
            <div className={styles.sectionHead}>
               <div className={styles.sectionTitle}><BiInline ar="التأمين الوطني" he="ביטוח לאומי" /></div>
            </div>

            {/* Q1: File Exists? */}
            <div className={styles.fieldGroup}>
              {/* --- שינוי כאן: הוספתי style כדי לשבור שורות --- */}
              <div className={styles.label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <BiInline ar="هل أنت بدفع أو دفعت قبل هيك تأمين وطني؟" he="האם את.ה משלמ.ת / שילמת בעבר ביטוח לאומי?" />
              </div>
              
              <div className={styles.selectionRow}>
                <label className={styles.selectionLabel}>
                  <input type="radio" name="hasFile" value="yes" checked={hasFile === "yes"} onChange={() => setHasFile("yes")} />
                  <span className={styles.selectionSpan}><BiInline ar="نعم" he="כן" /></span>
                </label>
                <label className={styles.selectionLabel}>
                  <input type="radio" name="hasFile" value="no" checked={hasFile === "no"} onChange={() => setHasFile("no")} />
                  <span className={styles.selectionSpan}><BiInline ar="لا" he="לא" /></span>
                </label>
              </div>
            </div>

            {hasFile === 'yes' && (
              <div className={styles.fieldGroup}>
                <div className={styles.label}><BiInline ar="رقم ملف التحصيل" he="מספר תיק גבייה" /></div>
                <input name="fileNumber" defaultValue={defaults.fileNumber} className={styles.inputBase} />
              </div>
            )}

            <div className={styles.fieldGroup}>
              {/* --- שינוי כאן: הוספתי style כדי לשבור שורות --- */}
              <div className={styles.label} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <BiInline ar="هل استلمت أو عم تستلم معاش من التأمين الوطني؟" he="האם קיבלת או שהינך מקבל כעת קצבה מביטוח לאומי?" />
              </div>
              <div className={styles.selectionRow}>
                <label className={styles.selectionLabel}>
                  <input type="radio" name="getsAllowance" value="yes" checked={getsAllowance === "yes"} onChange={() => setGetsAllowance("yes")} />
                  <span className={styles.selectionSpan}><BiInline ar="نعم" he="כן" /></span>
                </label>
                <label className={styles.selectionLabel}>
                  <input type="radio" name="getsAllowance" value="no" checked={getsAllowance === "no"} onChange={() => setGetsAllowance("no")} />
                  <span className={styles.selectionSpan}><BiInline ar="لا" he="לא" /></span>
                </label>
              </div>
            </div>

                {getsAllowance === 'yes' && (
                <>
                    <CustomSelect 
                        labelAr="نوع المعاش" labelHe="סוג הקצבה"
                        value={allowanceType} 
                        onChange={setAllowanceType} 
                        options={allowanceTypes} 
                        placeholder="בחר  اختر"
                    />
                    <input type="hidden" name="allowanceType" value={allowanceType} />

                    <div className={styles.fieldGroup}>
                    <div className={styles.label}><BiInline ar="رقم الملف في التأمين الوطني" he="מספר תיק בביטוח לאומי" /></div>
                    <input name="allowanceFileNumber" defaultValue={defaults.allowanceFileNumber} className={styles.inputBase} />
                    </div>
                </>
                )}

                <div className={styles.fixedFooter}>
                <button type="button" className={styles.btnPrimary} onClick={handleFinishStep4}>
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

      {/* --- FORM 2: Summary Screen (4) --- */}
      {screen === 4 && (
        <form className={styles.scrollableContent} action={saveAndNextAction} style={{paddingTop: 0}}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewTitle}>
                  <span>نهاية المرحلة</span>
                  <span>סוף שלב 4</span>
                </div>
                <div className={styles.summarySub} style={{ lineHeight: '1.6' }}>
                   <span>يرجى التحقق من صحة التفاصيل وترجمتها</span>
                   <br />
                   <span>אנא וודא/י כי כל הפרטים ותרגומם נכונים</span>
                </div>
              </div>

              {/* 1. Health Fund */}
              <div className={styles.fieldGroup}>
                 <div className={styles.label}><BiInline ar="صندوق المرضى" he="קופת חולים" /></div>
                 <div className={styles.readOnlyInput} style={{height: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'}}>
                    {healthFund ? (
                        <>
                            <span style={{fontWeight: 600}}>{healthFunds.find(x=>x.value===healthFund)?.labelAr}</span>
                            <span style={{fontSize: '0.9em', color:'#666'}}>{healthFunds.find(x=>x.value===healthFund)?.labelHe}</span>
                        </>
                    ) : '-'}
                 </div>
              </div>

              {/* 2. Bank Details */}
              <div className={styles.sectionHead} style={{marginTop: 20}}>
                 <div className={styles.sectionTitle}><BiInline ar="تفاصيل حساب بنكي" he="פרטי חשבון בנק" /></div>
              </div>
              
              {/* Bank Name */}
              <div className={styles.fieldGroup}>
                 <div className={styles.label}><BiInline ar="بنك" he="בנק" /></div>
                 <div className={styles.readOnlyInput} style={{height: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'}}>
                    {bankName ? (
                        <>
                            <span style={{fontWeight: 600}}>{banks.find(x=>x.value===bankName)?.labelAr}</span>
                            <span style={{fontSize: '0.9em', color:'#666'}}>{banks.find(x=>x.value===bankName)?.labelHe}</span>
                        </>
                    ) : '-'}
                 </div>
              </div>
              
              {/* Branch */}
              <div className={styles.fieldGroup}>
                 <div className={styles.label}><BiInline ar="اسم ورقم الفرع" he="שם ומספר סניף" /></div>
                 <input className={styles.readOnlyInput} value={formDataState.branch} readOnly />
              </div>

              {/* Account */}
              <div className={styles.fieldGroup}>
                 <div className={styles.label}><BiInline ar="رقم الحساب" he="מספר חשבון" /></div>
                 <input className={styles.readOnlyInput} value={formDataState.accountNumber} readOnly />
              </div>

              {/* 3. National Insurance */}
              <div className={styles.sectionHead} style={{marginTop: 20}}>
                 <div className={styles.sectionTitle}><BiInline ar="التأمين الوطني" he="ביטוח לאומי" /></div>
              </div>
              
              {/* Has File? */}
              <div className={styles.fieldGroup}>
                 <input className={styles.readOnlyInput} 
                    value={formDataState.hasFile === 'yes' ? 'משלם/ת ביטוח לאומי  يدفع تأمين وطني' : 'לא משלם/ת ביטוח לאומי  لا يدفع تأمين وطني'}
                    readOnly 
                 />
              </div>
              {formDataState.hasFile === 'yes' && (
                 <div className={styles.fieldGroup}>
                    <div className={styles.label}><BiInline ar="رقم ملف التحصيل" he="מספר תיק גבייה" /></div>
                    <input className={styles.readOnlyInput} value={formDataState.fileNumber} readOnly />
                 </div>
              )}

              {/* Allowance? */}
              <div className={styles.fieldGroup} style={{marginTop: 10}}>
                 <input className={styles.readOnlyInput} 
                    value={formDataState.getsAllowance === 'yes' ? 'מקבל/ת קצבה  يتلقى مخصصات' : 'לא מקבל/ת קצבה  لا يتلقى مخصصات'}
                    readOnly 
                 />
              </div>

              {formDataState.getsAllowance === 'yes' && (
                 <>
                   <div className={styles.fieldGroup}>
                      <div className={styles.label}><BiInline ar="نوع المعاش" he="סוג הקצבה" /></div>
                      <div className={styles.readOnlyInput} style={{height: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'}}>
                        {formDataState.allowanceType ? (
                            <>
                                <span style={{fontWeight: 600}}>{allowanceTypes.find(x=>x.value===formDataState.allowanceType)?.labelAr}</span>
                                <span style={{fontSize: '0.9em', color:'#666'}}>{allowanceTypes.find(x=>x.value===formDataState.allowanceType)?.labelHe}</span>
                            </>
                        ) : '-'}
                      </div>
                   </div>
                   <div className={styles.fieldGroup}>
                      <div className={styles.label}><BiInline ar="رقم الملف في التأمين الوطني" he="מספר תיק בביטוח לאומי" /></div>
                      <input className={styles.readOnlyInput} value={formDataState.allowanceFileNumber} readOnly />
                   </div>
                 </>
              )}

              {/* Hidden Inputs for Submission */}
              <input type="hidden" name="healthFund" value={formDataState.healthFund || ""} />
              <input type="hidden" name="bankName" value={formDataState.bankName || ""} />
              <input type="hidden" name="branch" value={formDataState.branch || ""} />
              <input type="hidden" name="accountNumber" value={formDataState.accountNumber || ""} />
              <input type="hidden" name="hasFile" value={formDataState.hasFile || ""} />
              <input type="hidden" name="fileNumber" value={formDataState.fileNumber || ""} />
              <input type="hidden" name="getsAllowance" value={formDataState.getsAllowance || ""} />
              <input type="hidden" name="allowanceType" value={formDataState.allowanceType || ""} />
              <input type="hidden" name="allowanceFileNumber" value={formDataState.allowanceFileNumber || ""} />

              <div className={styles.fixedFooter}>
                  <button type="submit" className={styles.btnPrimary}>
                    <BiInline ar="موافقة" he="אישור וסיום" />
                  </button>
                  <button type="button" onClick={() => setScreen(3)} className={styles.btnSecondary}>
                    <BiInline ar="تعديل" he="חזור לעריכה" />
                  </button>
              </div>
        </form>
      )}

    </div>
  );
}
