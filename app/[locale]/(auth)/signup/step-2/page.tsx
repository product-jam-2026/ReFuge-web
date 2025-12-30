import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSignupStep } from "../actions";

export default async function Step2Page({ params, searchParams }: any) {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${params.locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("registration_completed, data")
    .eq("id", data.user.id)
    .single();

  if (profile?.registration_completed) redirect(`/${params.locale}/home`);

  const step2 = profile?.data?.intake?.step2 || {};

  async function saveDraft(formData: FormData) {
    "use server";
    const patch = {
      residenceCountry: String(formData.get("residenceCountry") || ""),
      residenceCity: String(formData.get("residenceCity") || ""),
      residenceAddress: String(formData.get("residenceAddress") || ""),
      visaType: String(formData.get("visaType") || ""),
      visaStartDate: String(formData.get("visaStartDate") || ""),
      visaEndDate: String(formData.get("visaEndDate") || ""),
      entryDate: String(formData.get("entryDate") || ""),
    };
    await saveSignupStep({ locale: params.locale, step: 2, patch, goNext: false });
  }

  async function saveAndNext(formData: FormData) {
    "use server";
    const patch = {
      residenceCountry: String(formData.get("residenceCountry") || ""),
      residenceCity: String(formData.get("residenceCity") || ""),
      residenceAddress: String(formData.get("residenceAddress") || ""),
      visaType: String(formData.get("visaType") || ""),
      visaStartDate: String(formData.get("visaStartDate") || ""),
      visaEndDate: String(formData.get("visaEndDate") || ""),
      entryDate: String(formData.get("entryDate") || ""),
    };
    await saveSignupStep({ locale: params.locale, step: 2, patch, goNext: true });
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign Up – Step 2</h1>
      {searchParams?.saved === "1" && <p>✅ Draft saved</p>}

      <form action={saveAndNext} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <h3>Residence</h3>
        <input name="residenceCountry" placeholder="Country" defaultValue={step2.residenceCountry || ""} />
        <input name="residenceCity" placeholder="City" defaultValue={step2.residenceCity || ""} />
        <input name="residenceAddress" placeholder="Address" defaultValue={step2.residenceAddress || ""} />

        <h3>Visa</h3>
        <input name="visaType" placeholder="Visa type" defaultValue={step2.visaType || ""} />
        <input name="visaStartDate" placeholder="Visa start date (YYYY-MM-DD)" defaultValue={step2.visaStartDate || ""} />
        <input name="visaEndDate" placeholder="Visa end date (YYYY-MM-DD)" defaultValue={step2.visaEndDate || ""} />
        <input name="entryDate" placeholder="Entry date (YYYY-MM-DD)" defaultValue={step2.entryDate || ""} />

        <div style={{ display: "flex", gap: 12 }}>
          <button formAction={saveDraft} type="submit">Save draft</button>
          <button type="submit">Save & Continue</button>
        </div>
      </form>
    </main>
  );
}
