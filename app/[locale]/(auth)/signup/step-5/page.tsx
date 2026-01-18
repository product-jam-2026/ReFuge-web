import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitStep5 } from "../actions";
import Step5FormClient from "./Step5FormClient";

// פונקציית עזר למניעת [object Object]
function getStringVal(val: any) {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val.he || val.ar || "";
}

export default async function Step5Page({
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
    .select("registration_completed, data")
    .eq("id", data.user.id)
    .single();

  const step5 = profile?.data?.intake?.step5 || {};
  // תיקון: קריאה מ-spouse במקום person (בהתאם ל-actions.ts)
  const p = step5.spouse || {};

  const defaults = {
    // שמות (שימוש ב-getStringVal)
    firstName: getStringVal(p.firstName),
    lastName: getStringVal(p.lastName),
    oldFirstName: getStringVal(p.oldFirstName),
    oldLastName: getStringVal(p.oldLastName),
    
    gender: p.gender || "",
    birthDate: p.birthDate || "",
    nationality: p.nationality || "",
    israeliId: p.israeliId || "",
    
    passportNumber: p.passportNumber || "",
    passportIssueDate: p.passportIssueDate || "",
    passportExpiryDate: p.passportExpiryDate || "",
    passportIssueCountry: p.passportIssueCountry || "",
    
    phone: p.phone || "",
    email: p.email || "",
  };

  const saveDraftAction = submitStep5.bind(null, params.locale, "draft");
  const saveAndNextAction = submitStep5.bind(null, params.locale, "next");
  const saveDraftAndBackAction = submitStep5.bind(null, params.locale, "back");

  return (
    <div className="appShell" dir="rtl">
      <div className="appFrame">
        <Step5FormClient
          locale={params.locale}
          saved={searchParams?.saved === "1"}
          defaults={defaults}
          saveDraftAction={saveDraftAction}
          saveAndNextAction={saveAndNextAction}
          saveDraftAndBackAction={saveDraftAndBackAction}
        />
      </div>
    </div>
  );
}
