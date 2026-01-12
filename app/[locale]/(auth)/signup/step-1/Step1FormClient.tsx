"use client";

import { useMemo, useRef, useState } from "react";
import styles from "./step1.module.css";

type Props = {
  locale: string;
  saved: boolean;
  defaults: {
    lastName: string;
    firstName: string;
    oldLastName: string;
    oldFirstName: string;
    gender: string;
    birth: { y: string; m: string; d: string };
    nationality: string;
    israeliId: string;
    passportNumber: string;
    passIssue: { y: string; m: string; d: string };
    passExp: { y: string; m: string; d: string };
    passportIssueCountry: string;
    phone: string;
    email: string;
  };
  saveDraftAction: (formData: FormData) => Promise<void>;
  saveAndNextAction: (formData: FormData) => Promise<void>;
};

function partsToIso(p: { y: string; m: string; d: string }) {
  if (!p.y || !p.m || !p.d) return "";
  return `${p.y}-${p.m.padStart(2, "0")}-${p.d.padStart(2, "0")}`;
}
function isoToParts(iso: string) {
  if (!iso) return { y: "", m: "", d: "" };
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { y: "", m: "", d: "" };
  return { y: m[1], m: m[2], d: m[3] };
}

/** קצר: ערבית ואז עברית באותה שורה (בלי נקודה) */
function BiInline({ ar, he, className }: { ar: string; he: string; className?: string }) {
  return (
    <span className={`${styles.biLine} ${className || ""}`}>
      <span className={styles.biAr}>{ar}</span>
      <span className={styles.biHe}>{he}</span>
    </span>
  );
}

/** ארוך: ערבית מעל עברית */
function BiStack({
  ar,
  he,
  className,
}: {
  ar: string;
  he: string;
  className?: string;
}) {
  return (
    <div className={`${styles.biStack} ${className || ""}`}>
      <div className={styles.biAr}>{ar}</div>
      <div className={styles.biHe}>{he}</div>
    </div>
  );
}

function DateField({
  labelHe,
  labelAr,
  namePrefix,
  defaultParts,
  placeholder = "dd / mm / yyyy",
}: {
  labelHe: string;
  labelAr: string;
  namePrefix: string; // birthDate / passportIssueDate / passportExpiryDate
  defaultParts: { y: string; m: string; d: string };
  placeholder?: string;
}) {
  const [iso, setIso] = useState<string>(partsToIso(defaultParts));
  const inputRef = useRef<HTMLInputElement | null>(null);

  const parts = useMemo(() => isoToParts(iso), [iso]);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    // showPicker לא תמיד מוגדר בטייפים -> ניגשים דרך any
    const anyEl = el as any;
    if (typeof anyEl.showPicker === "function") anyEl.showPicker();
    else el.focus();
  };

  return (
    <div className={styles.field}>
      <label>
        <BiInline ar={labelAr} he={labelHe} className={styles.label} />
      </label>

      <div className={styles.dateWrap}>
        <input
  ref={inputRef}
  className={`${styles.dateInput} ${!iso ? styles.isEmpty : ""}`}
  type="date"
  value={iso}
  onChange={(e) => setIso(e.target.value)}
  onClick={openPicker}
  onFocus={openPicker}
/>

        {!iso && <div className={styles.datePlaceholder}>{placeholder}</div>}
      </div>

      {/* hidden fields – לשמור שמות שדות לאוטומציה */}
      <input type="hidden" name={`${namePrefix}_y`} value={parts.y} />
      <input type="hidden" name={`${namePrefix}_m`} value={parts.m} />
      <input type="hidden" name={`${namePrefix}_d`} value={parts.d} />
    </div>
  );
}

/** מדינות (לדאטאליסט/אוטוקומפליט) */
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon",
  "Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo (Congo-Brazzaville)","Costa Rica",
  "Croatia","Cuba","Cyprus","Czechia (Czech Republic)","Democratic Republic of the Congo","Denmark","Djibouti","Dominica",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini (fmr. \"Swaziland\")",
  "Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea",
  "Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia",
  "Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands",
  "Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar",
  "Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway",
  "Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
  "São Tomé and Príncipe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden",
  "Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia",
  "Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan",
  "Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

export default function Step1FormClient({
  saved,
  defaults,
  saveDraftAction,
  saveAndNextAction,
}: Props) {
  // 0=intro, 1..4 screens
  const [screen, setScreen] = useState<number>(0);

  const progress = useMemo(() => {
    if (screen <= 0) return 0;
    return Math.min(100, Math.round((screen / 4) * 100));
  }, [screen]);

  const goNext = () => setScreen((s) => Math.min(4, s + 1));
  const goBack = () => setScreen((s) => Math.max(0, s - 1));

  const titleBlock = (
    <div className={styles.titleBlock}>
      <BiInline ar="البيانات الشخصية" he="פרטים אישיים" className={styles.h1} />
      <div className={styles.subtitle}>
        <BiInline ar="كما هو مدون في جواز السفر" he="כפי שרשומים בדרכון" />
      </div>
    </div>
  );

  return (
    <div className={styles.wrap}>
      {/* Intro — מסך כתום מלא */}
      {screen === 0 ? (
        <div className={styles.introFull}>
          <div className={styles.introContent}>
            <div className={styles.introTop}>
              <BiInline ar="المرحلة 1" he="שלב 1" className={styles.introStep} />
            </div>

            <div className={styles.introMain}>
              <BiInline ar="تفاصيل شخصية" he="פרטים אישיים" className={styles.introH1} />
            </div>

            <div className={styles.introText}>
              <BiStack
                ar="في هذه المرحلة نحتاج إلى بعض المعلومات الأساسية للتعرّف عليك. ستساعدنا هذه المعلومات لاحقًا في تعبئة النماذج بسرعة."
                he="בשלב הזה נבקש ממך כמה פרטים בסיסיים לצורך היכרות. הפרטים יעזרו לנו בהמשך למלא טפסים מהר יותר."
              />
              <div className={styles.introMeta}>
                <BiInline ar="الوقت المتوقع: 8 دقائق" he="זמן משוער: 8 דקות" />
              </div>
            </div>

            <button type="button" className="btnPrimary" onClick={goNext}>
              <BiInline ar="ابدأ" he="התחל" />
            </button>
          </div>
        </div>
      ) : (
        <form className={styles.form} action={saveAndNextAction}>
          {/* חץ חזור קטן — למעלה ימין */}
          <button
            type="button"
            className={styles.backBtn}
            onClick={goBack}
            aria-label="Back"
            title="Back"
          >
             →
          </button>

          {/* Progress + title */}
          <div className={styles.headerArea}>
            <div className={styles.topMeta}>
              <BiInline ar="المرحلة 1 من 7" he="שלב 1 מתוך 7" className={styles.stepMeta} />
              <div className={styles.progressTrack} aria-hidden="true">
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>

            {titleBlock}

            {saved && (
              <div className={styles.savedNote}>
                <BiInline ar="تم حفظ المسودة" he="הטיוטה נשמרה" />
              </div>
            )}
          </div>

          {/* Screen 1: names */}
          <div className={screen === 1 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
              <BiInline ar="عام" he="כללי" className={styles.sectionTitle} />
            </div>

            <div className={styles.field}>
              <label>
                <BiInline ar="اسم العائلة" he="שם משפחה" className={styles.label} />
              </label>
              <input name="lastName" defaultValue={defaults.lastName} />
            </div>

            <div className={styles.field}>
              <label>
                <BiInline ar="الاسم الشخصي" he="שם פרטי" className={styles.label} />
              </label>
              <input name="firstName" defaultValue={defaults.firstName} />
            </div>

            <div className={styles.field}>
              <label>
                <BiInline ar="اسم العائلة السابق" he="שם משפחה קודם" className={styles.label} />
              </label>
              <input name="oldLastName" defaultValue={defaults.oldLastName} />
            </div>

            <div className={styles.field}>
              <label>
                <BiInline ar="الاسم الشخصي السابق" he="שם פרטי קודם" className={styles.label} />
              </label>
              <input name="oldFirstName" defaultValue={defaults.oldFirstName} />
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

          {/* Screen 2: gender + birth + nationality + ids */}
          <div className={screen === 2 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
              <BiInline ar="عام" he="כללי" className={styles.sectionTitle} />
            </div>

            <div className={styles.field}>
              <label>
                <BiInline ar="الجنس" he="מין" className={styles.label} />
              </label>

              <div className={styles.genderRow}>
                <label className={styles.pillRadio}>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    defaultChecked={defaults.gender === "female"}
                  />
                  <span>
                    <BiInline ar="أنثى" he="נקבה" />
                  </span>
                </label>

                <label className={styles.pillRadio}>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    defaultChecked={defaults.gender === "male"}
                  />
                  <span>
                    <BiInline ar="ذكر" he="זכר" />
                  </span>
                </label>
              </div>
            </div>

            <DateField
              labelAr="تاريخ الميلاد"
              labelHe="תאריך לידה"
              namePrefix="birthDate"
              defaultParts={defaults.birth}
            />

            {/* אזרחות — אוטוקומפליט מדינות */}
            <div className={styles.field}>
              <label>
                <BiInline ar="الجنسية" he="אזרחות" className={styles.label} />
              </label>
              <input
                name="nationality"
                defaultValue={defaults.nationality}
                list="countriesList"
                placeholder=""
              />
            </div>

            <div className={styles.field}>
              <label>
                <BiInline
                  ar="رقم الهوية الإسرائيلية (إن وجد)"
                  he="מספר תעודת זהות ישראלית (אם יש)"
                  className={styles.label}
                />
              </label>
              <input name="israeliId" defaultValue={defaults.israeliId} inputMode="numeric" />
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

          {/* Screen 3: passport */}
          <div className={screen === 3 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
              <BiInline ar="جواز السفر" he="דרכון" className={styles.sectionTitle} />
            </div>

            <div className={styles.field}>
              <label>
                <BiInline ar="رقم جواز السفر" he="מספר דרכון" className={styles.label} />
              </label>
              <input name="passportNumber" defaultValue={defaults.passportNumber} />
            </div>

            <DateField
              labelAr="تاريخ إصدار جواز السفر"
              labelHe="תאריך הוצאת דרכון"
              namePrefix="passportIssueDate"
              defaultParts={defaults.passIssue}
            />

            <DateField
              labelAr="تاريخ انتهاء جواز السفر"
              labelHe="תאריך פקיעת דרכון"
              namePrefix="passportExpiryDate"
              defaultParts={defaults.passExp}
            />

            {/* מדינת הנפקה — אוטוקומפליט מדינות */}
            <div className={styles.field}>
              <label>
                <BiInline ar="بلد إصدار جواز السفر" he="ארץ הוצאת דרכון" className={styles.label} />
              </label>
              <input
                name="passportIssueCountry"
                defaultValue={defaults.passportIssueCountry}
                list="countriesList"
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

          {/* Screen 4: contact */}
          <div className={screen === 4 ? styles.screenShow : styles.screenHide}>
            <div className={styles.sectionHead}>
              <BiInline ar="وسائل الاتصال" he="דרכי התקשרות" className={styles.sectionTitle} />
            </div>

            <div className={styles.field}>
              <label>
                <BiInline ar="هاتف" he="טלפון" className={styles.label} />
              </label>
              <input name="phone" defaultValue={defaults.phone} placeholder="+972" />
            </div>

            <div className={styles.field}>
              <label>
                <BiInline ar="بريد إلكتروني" he="אימייל" className={styles.label} />
              </label>
              <input name="email" defaultValue={defaults.email} inputMode="email" />
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

          {/* shared datalist */}
          <datalist id="countriesList">
            {COUNTRIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </form>
      )}
    </div>
  );
}
