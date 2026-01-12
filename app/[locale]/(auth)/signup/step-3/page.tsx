import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitStep3 } from "../actions"; // ✅ ייבוא נכון מתיקיית signup
import Step3FormClient from "./Step3FormClient";

export default async function Step3Page({
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

  if (profile?.registration_completed) redirect(`/${params.locale}/home`);

  // שליפת נתונים קיימים
  const step3 = profile?.data?.intake?.step3 || {};
  const reg = step3.registeredAddress || {};
  const mail = step3.mailingAddress || {};

  let occData: any = { assets: [] };
  try {
    if (step3.occupation && step3.occupation.startsWith("{")) {
      occData = JSON.parse(step3.occupation);
    }
  } catch(e) {}

  const defaults = {
    maritalStatus: step3.maritalStatus || "",
    statusDate: step3.statusDate || "",
    
    regCity: reg.city || "",
    regStreet: reg.street || "",
    regHouseNumber: reg.houseNumber || "",
    regEntry: reg.entry || "",
    regApartment: reg.apartment || "",
    regZip: reg.zip || "",
    
    housingType: step3.housingType || "rented", 
    mailingDifferent: step3.mailingDifferent || false,
    
    mailingAddress: {
       city: mail.city || "",
       street: mail.street || "",
    },

    employmentStatus: step3.employmentStatus || "",
    assets: Array.isArray(occData.assets) ? occData.assets : [],
    
    employerName: occData.employerName || "",
    workAddress: occData.workAddress || "",
    workStartDate: occData.workStartDate || "",
  };

  // ✅ יצירת הפניות לפעולות השרת באמצעות bind
  const saveDraftAction = submitStep3.bind(null, params.locale, "draft");
  const saveAndNextAction = submitStep3.bind(null, params.locale, "next"); 
  const saveDraftAndBackAction = submitStep3.bind(null, params.locale, "back");

  return (
    <div className="appShell" dir="rtl">
      <div className="appFrame">
        <Step3FormClient
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