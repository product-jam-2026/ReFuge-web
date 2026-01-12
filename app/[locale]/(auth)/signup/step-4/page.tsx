import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitStep4 } from "../actions"; // Import from main actions
import Step4FormClient from "./Step4FormClient";

export default async function Step4Page({
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

  // Data fetching
  const step4 = profile?.data?.intake?.step4 || {};
  const bank = step4.bank || {};
  const ni = step4.nationalInsurance || {};

  const defaults = {
    healthFund: step4.healthFund || "",
    bankName: bank.bankName || "",
    branch: bank.branch || "",
    accountNumber: bank.accountNumber || "",
    hasFile: (ni.hasFile === "yes" || ni.hasFile === "no" ? ni.hasFile : "") as "yes" | "no" | "",
    fileNumber: ni.fileNumber || "",
    getsAllowance: (ni.getsAllowance === "yes" || ni.getsAllowance === "no" ? ni.getsAllowance : "") as "yes" | "no" | "",
    allowanceType: ni.allowanceType || "",
    allowanceFileNumber: ni.allowanceFileNumber || "",
  };

  // Bind server actions
  const saveDraftAction = submitStep4.bind(null, params.locale, "draft");
  const saveAndNextAction = submitStep4.bind(null, params.locale, "next");
  const saveDraftAndBackAction = submitStep4.bind(null, params.locale, "back");

  return (
    <div className="appShell" dir="rtl">
      <div className="appFrame">
        <Step4FormClient
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