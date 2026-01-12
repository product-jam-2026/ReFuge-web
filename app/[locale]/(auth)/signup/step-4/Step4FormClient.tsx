"use client";

import { useMemo, useState, CSSProperties } from "react";
import styles from "./step4.module.css";

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

type HasYesNo = "yes" | "no" | "";

type Props = {
  locale: string;
  saved: boolean;
  defaults: {
    healthFund: string;
    bankName: string;
    branch: string;
    accountNumber: string;
    hasFile: HasYesNo;
    fileNumber: string;
    getsAllowance: HasYesNo;
    allowanceType: string;
    allowanceFileNumber: string;
  };
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
  // Screens: 0=Intro, 1=Health, 2=Bank, 3=National Insurance
  const [screen, setScreen] = useState(0);

  // --- Logic State ---
  const [hasFile, setHasFile] = useState<HasYesNo>(defaults.hasFile || "");
  const [getsAllowance, setGetsAllowance] = useState<HasYesNo>(defaults.getsAllowance || "");

  // Bank Logic
  const [bankName, setBankName] = useState(defaults.bankName || "");
  const [branch, setBranch] = useState(defaults.branch || "");

  // Lists (Hardcoded for UI demo, expand as needed)
  const healthFunds = [
    { val: "clalit", ar: "כללית", he: "כללית" },
    { val: "maccabi", ar: "מכבי", he: "מכבי" },
    { val: "meuhedet", ar: "מאוחדת", he: "מאוחדת" },
    { val: "leumit", ar: "לאומית", he: "לאומית" },
  ];

  const banks = [
    { val: "hapoalim", ar: "בנק הפועלים", he: "בנק הפועלים" },
    { val: "leumi", ar: "בנק לאומי", he: "בנק לאומי" },
    { val: "discount", ar: "בנק דיסקונט", he: "בנק דיסקונט" },
    { val: "mizrahi", ar: "מזרחי טפחות", he: "מזרחי טפחות" },
  ];

  const branches = [
    { val: "001", ar: "סניף ראשי (001)", he: "סניף ראשי (001)" },
    { val: "123", ar: "סניף מרכז (123)", he: "סניף מרכז (123)" },
  ];

  const allowanceTypes = [
    { val: "income_support", ar: "הבטחת הכנסה", he: "הבטחת הכנסה" },
    { val: "disability", ar: "נכות", he: "נכות" },
    { val: "child", ar: "קצבת ילדים", he: "קצבת ילדים" },
  ];

  // --- Navigation ---
  const progress = useMemo(() => {
    if (screen === 0) return 0;
    return Math.round((screen / 3) * 100);
  }, [screen]);

  const goNext = () => setScreen((s) => Math.min(3, s + 1));
  const goBack = () => setScreen((s) => Math.max(0, s - 1));

  return (
    <div className={styles.wrap}>
      
      {/* Intro Screen (0) */}
      {screen === 0 && (
        <div className={styles.introFull}>
          <div className={styles.introContent}>
            <div className={styles.introTop}>
              <BiInline ar="المرحلة 4 من 7" he="שלב 4 מתוך 7" className={styles.introStep} />
            </div>
            <div className={styles.introMain}>
              <BiInline ar="جهات رسمية" he="מוסדות" className={styles.introH1} />
            </div>
            <div className={styles.introText}>
              <BiStack 
                ar="صندوق المرضى، البنك، والتأمين الوطني." 
                he="קופת חולים, בנק וביטוח לאומי." 
              />
              <div className={styles.introMeta}>
                <BiInline ar="الوقت المتوقع: 5 دقائق" he="זמן משוער: 5 דקות" />
              </div>
            </div>
            <button type="button" className="btnPrimary" style={{background: '#0b2a4a'}} onClick={goNext}>
              <BiInline ar="ابدأ" he="התחל" />
            </button>
          </div>
        </div>
      )}

      {/* Form Container */}
      <form className={screen > 0 ? styles.form : styles.screenHide} action={saveAndNextAction}>
        
        {/* Header */}
        <button type="button" className={styles.backBtn} onClick={goBack}>➜</button>

        <div className={styles.headerArea}>
          <div className={styles.topMeta}>
            <BiInline ar="المرحلة 4 من 7" he="שלב 4 מתוך 7" className={styles.stepMeta} />
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className={styles.titleBlock}>
            <BiInline ar="جهات رسمية" he="מוסדות" className={styles.h1} />
          </div>
          {saved && (
            <div className={styles.savedNote}>
              <BiInline ar="تم حفظ المسودة" he="הטיוטה נשמרה" />
            </div>
          )}
        </div>

        {/* --- Screen 1: Health Fund --- */}
        <div className={screen === 1 ? styles.screenShow : styles.screenHide}>
           <div className={styles.titleBlock}>
             <BiInline ar="صندوق المرضى" he="קופת חולים" className={styles.label} style={{fontSize: 18}} />
           </div>
           
           <div className={styles.field}>
              <label><BiInline ar="اختر" he="בחר" className={styles.label} /></label>
              <div className={styles.selectWrapper}>
                <select name="healthFund" defaultValue={defaults.healthFund} className={styles.inputControl}>
                  <option value="" disabled hidden>اختر / בחר</option>
                  {healthFunds.map(h => (
                    <option key={h.val} value={h.val}>{h.ar} / {h.he}</option>
                  ))}
                </select>
              </div>
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

        {/* --- Screen 2: Bank Details --- */}
        <div className={screen === 2 ? styles.screenShow : styles.screenHide}>
            <div className={styles.titleBlock}>
               <BiInline ar="تفاصيل حساب بنكي" he="פרטי חשבון בנק" className={styles.label} style={{fontSize: 18}} />
            </div>

            <div className={styles.field}>
              <label><BiInline ar="بنك" he="בנק" className={styles.label} /></label>
              <div className={styles.selectWrapper}>
                <select 
                  name="bankName" 
                  value={bankName} 
                  onChange={e => setBankName(e.target.value)}
                  className={styles.inputControl}
                >
                  <option value="" disabled hidden>اختر / בחר</option>
                  {banks.map(b => (
                    <option key={b.val} value={b.val}>{b.ar} / {b.he}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label><BiInline ar="اسم ورقم الفرع" he="שם ומספר סניף" className={styles.label} /></label>
              <div className={styles.selectWrapper}>
                <select 
                  name="branch" 
                  value={branch} 
                  onChange={e => setBranch(e.target.value)}
                  className={styles.inputControl}
                  disabled={!bankName}
                >
                  <option value="" disabled hidden>اختر / בחר</option>
                  {branches.map(b => (
                    <option key={b.val} value={b.val}>{b.ar} / {b.he}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.field}>
              <label><BiInline ar="رقم الحساب" he="מספר חשבון" className={styles.label} /></label>
              <input 
                name="accountNumber" 
                defaultValue={defaults.accountNumber} 
                className={styles.inputControl} 
                inputMode="numeric" 
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

        {/* --- Screen 3: National Insurance --- */}
        <div className={screen === 3 ? styles.screenShow : styles.screenHide}>
            <div className={styles.titleBlock}>
               <BiInline ar="التأمين الوطني" he="ביטוח לאומי" className={styles.label} style={{fontSize: 18}} />
            </div>

            {/* Q1: File Exists? */}
            <div className={styles.field}>
              <label>
                <BiInline ar="هل أنت بدفع أو دفعت قبل هيك تأمين وطني؟" he="האם את.ה משלמ.ת / שילמת בעבר ביטוח לאומי?" className={styles.label} />
              </label>
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
                <label><BiInline ar="رقم ملف التحصيل" he="מספר תיק גבייה" className={styles.label} /></label>
                <input name="fileNumber" defaultValue={defaults.fileNumber} className={styles.inputControl} />
              </div>
            )}

            {/* Q2: Allowance? */}
            <div className={styles.field}>
              <label>
                <BiInline ar="هل استلمت أو عم تستلم معاش من التأمين الوطني؟" he="האם קיבלת או שהינך מקבל כעת קצבה מביטוח לאומי?" className={styles.label} />
              </label>
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
                  <label><BiInline ar="نوع المعاش" he="סוג הקצבה" className={styles.label} /></label>
                  <div className={styles.selectWrapper}>
                    <select name="allowanceType" defaultValue={defaults.allowanceType} className={styles.inputControl}>
                      <option value="" disabled hidden>اختر / בחר</option>
                      {allowanceTypes.map(t => (
                        <option key={t.val} value={t.val}>{t.ar} / {t.he}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.field}>
                  <label><BiInline ar="رقم الملف في التأمين الوطني" he="מספר תיק בביטוח לאומי" className={styles.label} /></label>
                  <input name="allowanceFileNumber" defaultValue={defaults.allowanceFileNumber} className={styles.inputControl} />
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button type="submit" className="btnPrimary">
                <BiInline ar="إنهاء المرحلة" he="סיום שלב" />
              </button>
              <button type="submit" formAction={saveDraftAction} className="btnSecondary">
                <BiInline ar="حفظ كمسودة" he="שמור כטיוטה" />
              </button>
              <button type="submit" formAction={saveDraftAndBackAction} className="btnSecondary" style={{border: 'none', color: 'var(--c-muted)', fontSize: 13}}>
                  <BiInline ar="حفظ والعودة" he="שמור וחזור" />
              </button>
           </div>
        </div>

      </form>

    </div>
  );
}