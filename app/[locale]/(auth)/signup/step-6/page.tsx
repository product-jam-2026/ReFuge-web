import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitStep6 } from "../actions"; 
import Step6FormClient from "./Step6FormClient";

export default async function Step6Page({
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

  // שליפת נתונים
  const step6 = profile?.data?.intake?.step6 || {};
  const child0 = step6.children?.[0] || {};

  const defaults = {
    childLastName: child0.lastName || "",
    childFirstName: child0.firstName || "",
    childGender: child0.gender || "",
    childBirthDate: child0.birthDate || "",
    childNationality: child0.nationality || "",
    childIsraeliId: child0.israeliId || "",
    childResidenceCountry: child0.residenceCountry || "",
    childEntryDate: child0.entryDate || "",
    childBirthCity: child0.birthCity || "",
    childArrivalToIsraelDate: child0.arrivalToIsraelDate || "",
    childArrivalToIsraelReason: child0.arrivalToIsraelReason || "",
  };

  const saveDraftAction = submitStep6.bind(null, params.locale, "draft");
  const saveDraftAndBackAction = submitStep6.bind(null, params.locale, "back");
  const finishAction = submitStep6.bind(null, params.locale, "finish");
  const addAnotherAction = submitStep6.bind(null, params.locale, "add_another");

  return (
    <div className="appShell" dir="rtl">
      <div className="appFrame">
        <Step6FormClient
          locale={params.locale}
          saved={searchParams?.saved === "1"}
          defaults={defaults}
          saveDraftAction={saveDraftAction}
          saveDraftAndBackAction={saveDraftAndBackAction}
          finishAction={finishAction}
          addAnotherAction={addAnotherAction}
        />
      </div>
    </div>
  );
}