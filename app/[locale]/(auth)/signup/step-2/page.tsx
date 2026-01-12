import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { saveSignupStep } from "../actions";
import Step2FormClient from "./Step2FormClient";

function normalizeText(v: FormDataEntryValue | null, max = 120) {
  return String(v || "").trim().slice(0, max);
}

// עזר לשמירת תאריך בפורמט ISO
function buildISODateFromForm(formData: FormData, fieldName: string) {
  const val = String(formData.get(fieldName) || "").trim();
  // אם מגיע תאריך בפורמט yyyy-mm-dd זה מצוין, אם לא נחזיר ריק
  if (!val) return "";
  return val; 
}

export default async function Step2Page({
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

  // שליפת תרגומים (Labels) - נשתמש בזה בקליינט אם נרצה, או בהארד-קוד שעשינו
  const t = await getTranslations("signup.step2");
  
  // שליפת נתונים קיימים (Resume Draft)
  const step2 = profile?.data?.intake?.step2 || {};
  const defaults = {
    visaType: step2.visaType || "",
    visaStartDate: step2.visaStartDate || "",
    visaEndDate: step2.visaEndDate || "",
    entryDate: step2.entryDate || "",
    residenceCountry: step2.residenceCountry || "",
    residenceCity: step2.residenceCity || "",
    residenceAddress: step2.residenceAddress || "", // משמש עבור מטרת שהייה
  };

  async function saveDraftAction(formData: FormData) {
    "use server";
    const patch = {
      visaType: normalizeText(formData.get("visaType")),
      visaStartDate: buildISODateFromForm(formData, "visaStartDate"),
      visaEndDate: buildISODateFromForm(formData, "visaEndDate"),
      entryDate: buildISODateFromForm(formData, "entryDate"),
      residenceCountry: normalizeText(formData.get("residenceCountry")),
      residenceCity: normalizeText(formData.get("residenceCity")),
      residenceAddress: normalizeText(formData.get("residenceAddress")),
    };

    await saveSignupStep({ locale: params.locale, step: 2, patch, goNext: false });
  }

  async function saveAndNextAction(formData: FormData) {
    "use server";
    const patch = {
      visaType: normalizeText(formData.get("visaType")),
      visaStartDate: buildISODateFromForm(formData, "visaStartDate"),
      visaEndDate: buildISODateFromForm(formData, "visaEndDate"),
      entryDate: buildISODateFromForm(formData, "entryDate"),
      residenceCountry: normalizeText(formData.get("residenceCountry")),
      residenceCity: normalizeText(formData.get("residenceCity")),
      residenceAddress: normalizeText(formData.get("residenceAddress")),
    };

    await saveSignupStep({ locale: params.locale, step: 2, patch, goNext: true });
  }

  const dir = params.locale === "en" ? "ltr" : "rtl";

  return (
    <div className="appShell" dir={dir}>
      <div className="appFrame">
        <Step2FormClient
          locale={params.locale}
          saved={searchParams?.saved === "1"}
          labels={{}} // הטקסטים נמצאים בקליינט עצמו כפי שביקשת
          defaults={defaults}
          saveDraftAction={saveDraftAction}
          saveAndNextAction={saveAndNextAction}
        />
      </div>
    </div>
  );
}