import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitStep2 } from "../actions"; 
import Step2FormClient from "./Step2FormClient";

function getStringValue(field: any): string {
  if (!field) return "";
  if (typeof field === 'string') return field;
  if (typeof field === 'object') return field.he || field.ar || "";
  return String(field);
}

function buildISODateFromForm(formData: FormData, fieldName: string) {
  const val = String(formData.get(fieldName) || "").trim();
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
    .select("data")
    .eq("id", data.user.id)
    .single();

  const step2 = (profile?.data as any)?.intake?.step2 || {};

  function isoToParts(iso: string) {
    if (!iso) return { y: "", m: "", d: "" };
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return { y: "", m: "", d: "" };
    return { y: m[1], m: m[2], d: m[3] };
  }

  const visaStart = isoToParts(getStringValue(step2.visaStartDate));
  const visaEnd = isoToParts(getStringValue(step2.visaEndDate));
  const entryDate = isoToParts(getStringValue(step2.entryDate));

  const saveDraft = submitStep2.bind(null, params.locale, "draft");
  const saveAndNext = submitStep2.bind(null, params.locale, "next");

  return (
    <div className="appShell" dir="rtl">
      <div className="appFrame">
        <Step2FormClient
          locale={params.locale}
          saved={searchParams?.saved === "1"}
          defaults={{
            residenceCountry: getStringValue(step2.residenceCountry),
            residenceCity: getStringValue(step2.residenceCity),
            residenceAddress: getStringValue(step2.residenceAddress),
            visaType: getStringValue(step2.visaType),
            visaStartDate: visaStart,
            visaEndDate: visaEnd,
            entryDate: entryDate,
          }}
          saveDraftAction={saveDraft}
          saveAndNextAction={saveAndNext}
        />
      </div>
    </div>
  );
}