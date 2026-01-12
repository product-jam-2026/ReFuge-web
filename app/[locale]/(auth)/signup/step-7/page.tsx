import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitStep7 } from "../actions"; 
import Step7FormClient from "./Step7FormClient";

export default async function Step7Page({
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

  const step7 = profile?.data?.intake?.step7 || {};
  const docs = step7.documents || {};

  const defaults = {
    passportCopy: docs.passportCopy || "",
    rentalContract: docs.rentalContract || "",
    propertyOwnership: docs.propertyOwnership || "",
    childPassportPhoto: docs.childPassportPhoto || "",
    otherDocs: docs.otherDocs || "",
  };

  const saveDraftAction = submitStep7.bind(null, params.locale, "draft");
  const finishAction = submitStep7.bind(null, params.locale, "finish");
  const saveDraftAndBackAction = submitStep7.bind(null, params.locale, "back");

  return (
    <div className="appShell" dir="rtl">
      <div className="appFrame">
        <Step7FormClient
          locale={params.locale}
          saved={searchParams?.saved === "1"}
          defaults={defaults}
          saveDraftAction={saveDraftAction}
          finishAction={finishAction}
          saveDraftAndBackAction={saveDraftAndBackAction}
        />
      </div>
    </div>
  );
}