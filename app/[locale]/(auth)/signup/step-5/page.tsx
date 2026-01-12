import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitStep5 } from "../actions"; // ייבוא הפעולה שיצרנו
import Step5FormClient from "./Step5FormClient";

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

  if (profile?.registration_completed) redirect(`/${params.locale}/home`);

  const step5 = profile?.data?.intake?.step5 || {};
  const p = step5.person || {};

  const defaults = {
    firstName: p.firstName || "",
    lastName: p.lastName || "",
    oldFirstName: p.oldFirstName || "",
    oldLastName: p.oldLastName || "",
    gender: p.gender || "",
    birthDate: p.birthDate || "",
    nationality: p.nationality || "",
    israeliId: p.israeliId || "",
    passportNumber: p.passportNumber || "",
    passportIssueDate: p.passportIssueDate || "",
    passportExpiryDate: p.passportExpiryDate || "",
    passportIssueCountry: p.passportIssueCountry || "",
    maritalStatus: step5.maritalStatus || "",
    statusDate: step5.statusDate || "",
    phone: step5.phone || "",
    email: step5.email || "",
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