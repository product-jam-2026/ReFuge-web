import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSignupStep } from "../actions";

export default async function Step3Page({ params, searchParams }: any) {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${params.locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("registration_completed, data")
    .eq("id", data.user.id)
    .single();

  if (profile?.registration_completed) redirect(`/${params.locale}/home`);
  const step3 = profile?.data?.intake?.step3 || {};

  async function saveDraft(formData: FormData) {
    "use server";
    const patch = {
      maritalStatus: String(formData.get("maritalStatus") || ""),
      statusDate: String(formData.get("statusDate") || ""),
      registeredAddress: {
        city: String(formData.get("regCity") || ""),
        street: String(formData.get("regStreet") || ""),
        houseNumber: String(formData.get("regHouseNumber") || ""),
        entry: String(formData.get("regEntry") || ""),
        apartment: String(formData.get("regApartment") || ""),
        zip: String(formData.get("regZip") || ""),
      },
      mailingDifferent: String(formData.get("mailingDifferent") || "") === "true",
      mailingAddress: {
        city: String(formData.get("mailCity") || ""),
        street: String(formData.get("mailStreet") || ""),
        houseNumber: String(formData.get("mailHouseNumber") || ""),
        entry: String(formData.get("mailEntry") || ""),
        apartment: String(formData.get("mailApartment") || ""),
        zip: String(formData.get("mailZip") || ""),
      },
      employmentStatus: String(formData.get("employmentStatus") || ""),
      notWorkingReason: String(formData.get("notWorkingReason") || ""),
      occupation: String(formData.get("occupation") || ""),
    };
    await saveSignupStep({ locale: params.locale, step: 3, patch, goNext: false });
  }

  async function saveAndNext(formData: FormData) {
    "use server";
    const patch = {
      maritalStatus: String(formData.get("maritalStatus") || ""),
      statusDate: String(formData.get("statusDate") || ""),
      registeredAddress: {
        city: String(formData.get("regCity") || ""),
        street: String(formData.get("regStreet") || ""),
        houseNumber: String(formData.get("regHouseNumber") || ""),
        entry: String(formData.get("regEntry") || ""),
        apartment: String(formData.get("regApartment") || ""),
        zip: String(formData.get("regZip") || ""),
      },
      mailingDifferent: String(formData.get("mailingDifferent") || "") === "true",
      mailingAddress: {
        city: String(formData.get("mailCity") || ""),
        street: String(formData.get("mailStreet") || ""),
        houseNumber: String(formData.get("mailHouseNumber") || ""),
        entry: String(formData.get("mailEntry") || ""),
        apartment: String(formData.get("mailApartment") || ""),
        zip: String(formData.get("mailZip") || ""),
      },
      employmentStatus: String(formData.get("employmentStatus") || ""),
      notWorkingReason: String(formData.get("notWorkingReason") || ""),
      occupation: String(formData.get("occupation") || ""),
    };
    await saveSignupStep({ locale: params.locale, step: 3, patch, goNext: true });
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign Up – Step 3</h1>
      {searchParams?.saved === "1" && <p>✅ Draft saved</p>}

      <form action={saveAndNext} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h3>Life Center</h3>
        <input name="maritalStatus" placeholder="Marital status" defaultValue={step3.maritalStatus || ""} />
        <input name="statusDate" placeholder="Status date (YYYY-MM-DD)" defaultValue={step3.statusDate || ""} />

        <h3>Registered Address</h3>
        <input name="regCity" placeholder="City" defaultValue={step3.registeredAddress?.city || ""} />
        <input name="regStreet" placeholder="Street" defaultValue={step3.registeredAddress?.street || ""} />
        <input name="regHouseNumber" placeholder="House number" defaultValue={step3.registeredAddress?.houseNumber || ""} />
        <input name="regEntry" placeholder="Entry" defaultValue={step3.registeredAddress?.entry || ""} />
        <input name="regApartment" placeholder="Apartment" defaultValue={step3.registeredAddress?.apartment || ""} />
        <input name="regZip" placeholder="Zip" defaultValue={step3.registeredAddress?.zip || ""} />

        <h3>Mailing Address</h3>
        <select name="mailingDifferent" defaultValue={String(step3.mailingDifferent ?? false)}>
          <option value="false">Same as registered</option>
          <option value="true">Different</option>
        </select>
        <input name="mailCity" placeholder="City" defaultValue={step3.mailingAddress?.city || ""} />
        <input name="mailStreet" placeholder="Street" defaultValue={step3.mailingAddress?.street || ""} />
        <input name="mailHouseNumber" placeholder="House number" defaultValue={step3.mailingAddress?.houseNumber || ""} />
        <input name="mailEntry" placeholder="Entry" defaultValue={step3.mailingAddress?.entry || ""} />
        <input name="mailApartment" placeholder="Apartment" defaultValue={step3.mailingAddress?.apartment || ""} />
        <input name="mailZip" placeholder="Zip" defaultValue={step3.mailingAddress?.zip || ""} />

        <h3>Employment</h3>
        <input name="employmentStatus" placeholder="Employment status" defaultValue={step3.employmentStatus || ""} />
        <input name="notWorkingReason" placeholder="Reason if not working" defaultValue={step3.notWorkingReason || ""} />
        <input name="occupation" placeholder="Occupation" defaultValue={step3.occupation || ""} />

        <div style={{ display: "flex", gap: 12 }}>
          <button formAction={saveDraft} type="submit">Save draft</button>
          <button type="submit">Save & Continue</button>
        </div>
      </form>
    </main>
  );
}
