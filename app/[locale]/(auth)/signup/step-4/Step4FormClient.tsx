"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./step4.module.css";
import { translateStep4Data } from "@/app/[locale]/(auth)/signup/actions"; 

// הנתיב לתמונה לפי צילום המסך שלך
const STEP_IMAGE = "/images/step4-intro-umbrella.svg"; 

// --- Visual Helpers ---
function BiInline({ ar, he }: { ar: string; he: string }) {
  return (
    <div className={styles.biLine}>
      <span className={styles.biAr}>{ar}</span>
      <span className={styles.biHe}>{he}</span>
    </div>
  );
}

// --- Custom Select Component ---
function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholderAr = "اختر", 
  placeholderHe = "בחר",
  disabled = false
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { value: string; labelAr: string; labelHe: string }[];
  placeholderAr?: string;
  placeholderHe?: string;
  disabled?: boolean;
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
        onClick={() => !disabled && setIsOpen(!isOpen)}
        data-open={isOpen}
        style={{opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer'}}
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

      {isOpen && !disabled && (
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

  const [formDataState, setFormDataState] = useState<any>({});
  const formRef = useRef<HTMLFormElement>(null);

  // --- Logic State ---
  const [healthFund, setHealthFund] = useState(defaults.healthFund || "");
  const [bankName, setBankName] = useState(defaults.bankName || "");
  const [hasFile, setHasFile] = useState<HasYesNo>(defaults.hasFile || "");
  const [getsAllowance, setGetsAllowance] = useState<HasYesNo>(defaults.getsAllowance || "");
  const [allowanceType, setAllowanceType] = useState(defaults.allowanceType || "");

  const progress = useMemo(() => {
    if (screen === 0) return 0;
    return Math.round((screen / 4) * 100);
  }, [screen]);

  const goNext = () => setScreen((s) => Math.min(4, s + 1));
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
      setScreen(4);
    } catch (error) {
      console.error(error);
      setScreen(4);
    } finally {
      setIsTranslating(false);
    }
  };

  const getLabel = (list: any[], val: string) => {
    const found = list.find(i => i.value === val);
    return found ? `${found.labelHe} / ${found.labelAr}` : val;
  };

  return (
    <div className={styles.wrap} dir="rtl">
      
      {isTranslating && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText} style={{marginTop: 20}}>
             <BiInline ar="جاري المعالجة..." he="מעבד נתונים..." />
          </div>
        </div>
      )}

      {/* Intro Screen (0) */}
      {screen === 0 && (
        <div className={styles.introFull}>
          <Image 
            src={STEP_IMAGE} 
            alt="Intro Umbrella" 
            width={280} 
            height={200} 
            className={styles.introImage}
            priority 
          />
          <div className={styles.introContent} style={{marginTop: 'auto'}}>
            <h1 className={styles.introTitle}><BiInline ar="المرحلة 4" he="שלב 4" /></h1>
            <h2 className={styles.introSubtitle}><BiInline ar="جهات رسمية" he="מוסדות" /></h2>
            <div className={styles.introBody}>
               <p dir="rtl">بهالمرحلة بنسأل عن صندوق المرضى، البنك، والتأمين الوطني<br/>الوقت المتوقع للتعبئة: 5 دقائق</p>
               <p dir="rtl">בשלב זה נשאל על קופת חולים, בנק וביטוח לאומי<br/>זמן מילוי משוער: 5 דקות</p>
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
            if (screen === 3) handleFinishStep4(e);
        }}
      >
        
        {screen < 4 && (
        <div className={styles.headerArea}>
            <div className={styles.topRow}>
               <button type="button" className={styles.backBtn} onClick={goBack}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
               </button>
               <div className={styles.stepMeta}><span>المرحلة 4 من 7</span><span> | </span><span>שלב 4 מתוך 7</span></div>
            </div>
            <div className={styles.progressTrack}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>
            <div className={styles.titleBlock}>
                <div className={styles.h1}><BiInline ar="جهات رسمية" he="מוסדות" /></div>
            </div>
        </div>
        )}

        {/* --- Screen 1: Health Fund --- */}
        <div className={screen === 1 ? styles.screenShow : styles.screenHide}>
           <div className={styles.sectionHead}>
             <div className={styles.sectionTitle}><BiInline ar="صندوق المرضى" he="קופת חולים" /></div>
           </div>
           
           <div className={styles.field}>
              <div className={styles.label}><BiInline ar="اختر" he="בחר" /></div>
              <CustomSelect 
                value={healthFund} 
                onChange={setHealthFund} 
                options={healthFunds} 
              />
              <input type="hidden" name="healthFund" value={healthFund} />
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

        {/* --- Screen 2: Bank Details --- */}
        <div className={screen === 2 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
               <div className={styles.sectionTitle}><BiInline ar="تفاصيل حساب بنكي" he="פרטי חשבון בנק" /></div>
            </div>

            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="بنك" he="בנק" /></div>
              <CustomSelect 
                value={bankName} 
                onChange={setBankName} 
                options={banks} 
              />
              <input type="hidden" name="bankName" value={bankName} />
            </div>

            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="اسم ورقم الفرع" he="מספר סניף" /></div>
              <input name="branch" defaultValue={defaults.branch} className={styles.inputControl} inputMode="numeric" />
            </div>

            <div className={styles.field}>
              <div className={styles.label}><BiInline ar="رقم الحساب" he="מספר חשבון" /></div>
              <input name="accountNumber" defaultValue={defaults.accountNumber} className={styles.inputControl} inputMode="numeric" />
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

        {/* --- Screen 3: National Insurance --- */}
        <div className={screen === 3 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
               <div className={styles.sectionTitle}><BiInline ar="التأمين الوطني" he="ביטוח לאומי" /></div>
            </div>

            {/* Q1: File Exists? */}
            <div className={styles.field}>
              <div className={styles.label}>
                <BiInline ar="هل أنت بدفع أو دفعت قبل هيك تأمين وطني؟" he="האם את.ה משלמ.ת / שילמת בעבר ביטוח לאומי?" />
              </div>
              <div className={styles.toggleRow}>
                <button 
                  type="button" 
                  className={styles.toggleBtn} 
                  data-active={hasFile === 'yes'}
                  onClick={() => setHasFile('yes')}
                >
                  <BiInline ar="نعم" he="כן" />
                </button>
                <button 
                  type="button" 
                  className={styles.toggleBtn} 
                  data-active={hasFile === 'no'}
                  onClick={() => setHasFile('no')}
                >
                  <BiInline ar="لا" he="לא" />
                </button>
                <input type="hidden" name="hasFile" value={hasFile} />
              </div>
            </div>

            {hasFile === 'yes' && (
              <div className={styles.field} style={{animation: 'fadeIn 0.3s'}}>
                <div className={styles.label}><BiInline ar="رقم ملف التحصيل" he="מספר תיק גבייה" /></div>
                <input name="fileNumber" defaultValue={defaults.fileNumber} className={styles.inputControl} />
              </div>
            )}

            {/* Q2: Allowance? */}
            <div className={styles.field}>
              <div className={styles.label}>
                <BiInline ar="هل استلمت أو عم تستلم معاش من التأمين الوطني؟" he="האם קיבלת או שהינך מקבל כעת קצבה מביטוח לאומי?" />
              </div>
              <div className={styles.toggleRow}>
                <button 
                  type="button" 
                  className={styles.toggleBtn} 
                  data-active={getsAllowance === 'yes'}
                  onClick={() => setGetsAllowance('yes')}
                >
                  <BiInline ar="نعم" he="כן" />
                </button>
                <button 
                  type="button" 
                  className={styles.toggleBtn} 
                  data-active={getsAllowance === 'no'}
                  onClick={() => setGetsAllowance('no')}
                >
                  <BiInline ar="لا" he="לא" />
                </button>
                <input type="hidden" name="getsAllowance" value={getsAllowance} />
              </div>
            </div>

            {getsAllowance === 'yes' && (
              <div style={{animation: 'fadeIn 0.3s'}}>
                <div className={styles.field}>
                  <div className={styles.label}><BiInline ar="نوع المعاش" he="סוג הקצבה" /></div>
                  <CustomSelect 
                    value={allowanceType} 
                    onChange={setAllowanceType} 
                    options={allowanceTypes} 
                  />
                  <input type="hidden" name="allowanceType" value={allowanceType} />
                </div>
                <div className={styles.field}>
                  <div className={styles.label}><BiInline ar="رقم الملف في التأمين الوطني" he="מספר תיק בביטוח לאומי" /></div>
                  <input name="allowanceFileNumber" defaultValue={defaults.allowanceFileNumber} className={styles.inputControl} />
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button type="submit" className={styles.btnPrimary}>
                <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
              </button>
              <button type="submit" formAction={saveDraftAction} className={styles.btnSecondary}>
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
           </div>
        </div>

        {/* --- Screen 4: Summary --- */}
        {screen === 4 && (
           <div className={styles.screenShow}>
              <div className={styles.summaryHeader}>
                <div className={styles.summaryTitle} style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <span>نهاية المرحلة 4</span>
                  <span>סוף שלב 4</span>
                </div>
                <div className={styles.summarySub} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <span>يرجى التحقق من صحة التفاصيل وترجمتها</span>
                   <span>אנא וודא/י כי כל הפרטים ותרגומם נכונים</span>
                </div>
              </div>

              {/* Health Fund */}
              <div className={styles.summaryField}>
                 <div className={styles.label}><BiInline ar="صندوق المرضى" he="קופת חולים" /></div>
                 <div className={styles.readOnlyInputWrap}>
                    <input className={styles.readOnlyInput} 
                       value={getLabel(healthFunds, formDataState.healthFund)} 
                       readOnly 
                    />
                 </div>
              </div>

              {/* Bank */}
              <div className={styles.sectionHead} style={{marginTop: 20}}>
                 <div className={styles.sectionTitle}><BiInline ar="تفاصيل حساب بنكي" he="פרטי חשבון בנק" /></div>
              </div>
              <div className={styles.summaryField}>
                 <div className={styles.label}><BiInline ar="بنك" he="בנק" /></div>
                 <div className={styles.readOnlyInputWrap}>
                    <input className={styles.readOnlyInput} value={getLabel(banks, formDataState.bankName)} readOnly />
                 </div>
              </div>
              <div className={styles.gridRow}>
                 <div>
                   <div className={styles.label}><BiInline ar="رقم الحساب" he="חשבון" /></div>
                   <input className={styles.readOnlyInput} value={formDataState.accountNumber} readOnly style={{textAlign:'center'}} />
                 </div>
                 <div>
                   <div className={styles.label}><BiInline ar="فرع" he="סניף" /></div>
                   <input className={styles.readOnlyInput} value={formDataState.branch} readOnly style={{textAlign:'center'}} />
                 </div>
              </div>

              {/* National Insurance */}
              <div className={styles.sectionHead} style={{marginTop: 20}}>
                 <div className={styles.sectionTitle}><BiInline ar="التأمين الوطني" he="ביטוח לאומי" /></div>
              </div>
              
              <div className={styles.summaryField}>
                 <div className={styles.readOnlyInputWrap}>
                    <input className={styles.readOnlyInput} 
                       value={formDataState.hasFile === 'yes' ? 'משלם/ת ביטוח לאומי' : 'לא משלם/ת ביטוח לאומי'}
                       readOnly 
                    />
                 </div>
              </div>
              {formDataState.hasFile === 'yes' && (
                 <div className={styles.summaryField}>
                    <div className={styles.label}><BiInline ar="رقم ملف التحصيل" he="מספר תיק גבייה" /></div>
                    <div className={styles.readOnlyInputWrap}>
                       <input className={styles.readOnlyInput} value={formDataState.fileNumber} readOnly />
                    </div>
                 </div>
              )}

              {formDataState.getsAllowance === 'yes' && (
                 <>
                   <div className={styles.summaryField}>
                      <div className={styles.readOnlyInputWrap}>
                         <input className={styles.readOnlyInput} value={`מקבל קצבה: ${getLabel(allowanceTypes, formDataState.allowanceType)}`} readOnly />
                      </div>
                   </div>
                   <div className={styles.summaryField}>
                      <div className={styles.label}><BiInline ar="رقم الملف" he="מספר תיק" /></div>
                      <div className={styles.readOnlyInputWrap}>
                         <input className={styles.readOnlyInput} value={formDataState.allowanceFileNumber} readOnly />
                      </div>
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

              <div className={styles.actions}>
                  <button type="submit" className={styles.btnPrimary}>
                    <BiInline ar="موافقة" he="אישור וסיום" />
                  </button>
                  <button type="button" onClick={() => setScreen(3)} className={styles.btnSecondary}>
                    <BiInline ar="تعديل" he="חזור לעריכה" />
                  </button>
              </div>

           </div>
        )}

      </form>

    </div>
  );
}