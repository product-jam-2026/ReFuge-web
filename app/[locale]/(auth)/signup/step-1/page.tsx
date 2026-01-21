import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
// ✅ מייבאים את פעולת השרת מהקובץ החיצוני
import { submitStep1 } from "../actions"; 
import Step1FormClient from "./Step1FormClient";

// פונקציית עזר: יודעת לקבל או מחרוזת או אובייקט {he, ar} ולהחזיר מחרוזת לתצוגה
// זה קריטי כדי שהטופס יציג נתונים גם אם הם נשמרו בפורמט החדש
function getStringValue(field: any): string {
  if (!field) return "";
  if (typeof field === 'string') return field;
  if (typeof field === 'object') return field.he || field.ar || "";
  return String(field);
}

function getDualValue(field: any): { he?: string; ar?: string } | null {
  if (!field || typeof field !== "object") return null;
  return { he: field.he || "", ar: field.ar || "" };
}

function normalizeGenderValue(existing?: string) {
  const s = String(existing || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "male" || s === "m" || s.includes("זכר") || s.includes("ذكر")) return "male";
  if (s === "female" || s === "f" || s.includes("נקב") || s.includes("أنث")) return "female";
  return "";
}

export default async function Step1Page({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { saved?: string };
}) {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${params.locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("data")
    .eq("id", data.user.id)
    .single();

  // שימוש ב-as any כדי למנוע שגיאות TypeScript אם הטיפוסים לא מעודכנים
  const step1 = (profile?.data as any)?.intake?.step1 || {};
  
  function isoToParts(iso: string) {
    if (!iso) return { y: "", m: "", d: "" };
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return { y: "", m: "", d: "" };
    return { y: m[1], m: m[2], d: m[3] };
  }

  const birth = isoToParts(getStringValue(step1.birthDate));
  const passIssue = isoToParts(getStringValue(step1.passportIssueDate));
  const passExp = isoToParts(getStringValue(step1.passportExpiryDate));
  const genderDefault = normalizeGenderValue(getStringValue(step1.gender));

  // ✅ יצירת Actions תקינים לקומפוננטת לקוח
  // השימוש ב-bind יוצר פונקציה חדשה שכבר כוללת את ה-locale וה-mode,
  // ונקסט יודע להעביר אותה בצורה בטוחה לקלאיינט כ-Server Action.
  const saveDraft = submitStep1.bind(null, params.locale, "draft");
  const saveAndNext = submitStep1.bind(null, params.locale, "next");

  return (
    <div className="appShell" dir="rtl">
      <div className="appFrame">
        <Step1FormClient
          locale={params.locale}
          saved={searchParams?.saved === "1"}
          defaults={{
            // שימוש ב-getStringValue לכל השדות שעלולים להיות אובייקטים
            lastName: getStringValue(step1.lastName),
            firstName: getStringValue(step1.firstName),
            oldLastName: getStringValue(step1.oldLastName),
            oldFirstName: getStringValue(step1.oldFirstName),
            
            gender: genderDefault,
            birth,
            passIssue,
            passExp,
            
            nationality: getStringValue(step1.nationality),
            israeliId: getStringValue(step1.israeliId),
            passportNumber: getStringValue(step1.passportNumber),
            passportIssueCountry: getStringValue(step1.passportIssueCountry),
            phone: getStringValue(step1.phone),
            email: getStringValue(step1.email) || data.user.email || "",
          }}
          nameTranslations={{
            lastName: getDualValue(step1.lastName),
            firstName: getDualValue(step1.firstName),
            oldLastName: getDualValue(step1.oldLastName),
            oldFirstName: getDualValue(step1.oldFirstName),
          }}
          // העברת הפונקציות המוכנות
          saveDraftAction={saveDraft}
          saveAndNextAction={saveAndNext}
        />
      </div>
    </div>
  );
}
