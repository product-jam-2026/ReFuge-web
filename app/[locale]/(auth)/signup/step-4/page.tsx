import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSignupStep } from "../actions";

export default async function Step4Page({ params, searchParams }: any) {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${params.locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("registration_completed, data")
    .eq("id", data.user.id)
    .single();

  if (profile?.registration_completed) redirect(`/${params.locale}/home`);
  const step4 = profile?.data?.intake?.step4 || {};

  async function saveDraft(formData: FormData) {
    "use server";
    const patch = {
      healthFund: String(formData.get("healthFund") || ""),
      bank: {
        bankName: String(formData.get("bankName") || ""),
        branch: String(formData.get("branch") || ""),
        accountNumber: String(formData.get("accountNumber") || ""),
      },
      nationalInsurance: {
        hasFile: String(formData.get("hasFile") || ""), // yes/no/unknown
        fileNumber: String(formData.get("fileNumber") || ""),
        getsAllowance: String(formData.get("getsAllowance") || ""), // yes/no
        allowanceType: String(formData.get("allowanceType") || ""),
        allowanceFileNumber: String(formData.get("allowanceFileNumber") || ""),
      },
    };
    await saveSignupStep({ locale: params.locale, step: 4, patch, goNext: false });
  }

  async function saveAndNext(formData: FormData) {
    "use server";
    const patch = {
      healthFund: String(formData.get("healthFund") || ""),
      bank: {
        bankName: String(formData.get("bankName") || ""),
        branch: String(formData.get("branch") || ""),
        accountNumber: String(formData.get("accountNumber") || ""),
      },
      nationalInsurance: {
        hasFile: String(formData.get("hasFile") || ""),
        fileNumber: String(formData.get("fileNumber") || ""),
        getsAllowance: String(formData.get("getsAllowance") || ""),
        allowanceType: String(formData.get("allowanceType") || ""),
        allowanceFileNumber: String(formData.get("allowanceFileNumber") || ""),
      },
    };
    await saveSignupStep({ locale: params.locale, step: 4, patch, goNext: true });
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign Up – Step 4</h1>
      {searchParams?.saved === "1" && <p>✅ Draft saved</p>}

      <form action={saveAndNext} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h3>Health</h3>
        <input name="healthFund" placeholder="Health fund" defaultValue={step4.healthFund || ""} />

        <h3>Bank</h3>
        <input name="bankName" placeholder="Bank" defaultValue={step4.bank?.bankName || ""} />
        <input name="branch" placeholder="Branch" defaultValue={step4.bank?.branch || ""} />
        <input name="accountNumber" placeholder="Account number" defaultValue={step4.bank?.accountNumber || ""} />

        <h3>National Insurance</h3>
        <input name="hasFile" placeholder="Has file? (yes/no/unknown)" defaultValue={step4.nationalInsurance?.hasFile || ""} />
        <input name="fileNumber" placeholder="File number" defaultValue={step4.nationalInsurance?.fileNumber || ""} />
        <input name="getsAllowance" placeholder="Gets allowance? (yes/no)" defaultValue={step4.nationalInsurance?.getsAllowance || ""} />
        <input name="allowanceType" placeholder="Allowance type" defaultValue={step4.nationalInsurance?.allowanceType || ""} />
        <input name="allowanceFileNumber" placeholder="Allowance file number" defaultValue={step4.nationalInsurance?.allowanceFileNumber || ""} />

        <div style={{ display: "flex", gap: 12 }}>
          <button formAction={saveDraft} type="submit">Save draft</button>
          <button type="submit">Save & Continue</button>
        </div>
      </form>
    </main>
  );
}
