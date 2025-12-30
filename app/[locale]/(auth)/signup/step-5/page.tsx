import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSignupStep } from "../actions";

export default async function Step5Page({ params, searchParams }: any) {
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

  async function saveDraft(formData: FormData) {
    "use server";
    const patch = {
      person: {
        lastName: String(formData.get("lastName") || ""),
        firstName: String(formData.get("firstName") || ""),
        oldLastName: String(formData.get("oldLastName") || ""),
        oldFirstName: String(formData.get("oldFirstName") || ""),
        gender: String(formData.get("gender") || ""),
        birthDate: String(formData.get("birthDate") || ""),
        nationality: String(formData.get("nationality") || ""),
        israeliId: String(formData.get("israeliId") || ""),
        passportNumber: String(formData.get("passportNumber") || ""),
      },
      maritalStatus: String(formData.get("maritalStatus") || ""),
      statusDate: String(formData.get("statusDate") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
    };
    await saveSignupStep({ locale: params.locale, step: 5, patch, goNext: false });
  }

  async function saveAndNext(formData: FormData) {
    "use server";
    const patch = {
      person: {
        lastName: String(formData.get("lastName") || ""),
        firstName: String(formData.get("firstName") || ""),
        oldLastName: String(formData.get("oldLastName") || ""),
        oldFirstName: String(formData.get("oldFirstName") || ""),
        gender: String(formData.get("gender") || ""),
        birthDate: String(formData.get("birthDate") || ""),
        nationality: String(formData.get("nationality") || ""),
        israeliId: String(formData.get("israeliId") || ""),
        passportNumber: String(formData.get("passportNumber") || ""),
      },
      maritalStatus: String(formData.get("maritalStatus") || ""),
      statusDate: String(formData.get("statusDate") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
    };
    await saveSignupStep({ locale: params.locale, step: 5, patch, goNext: true });
  }

  const p = step5.person || {};

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign Up – Step 5</h1>
      {searchParams?.saved === "1" && <p>✅ Draft saved</p>}

      <form action={saveAndNext} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h3>Partner / Guardian</h3>
        <input name="lastName" placeholder="Last name" defaultValue={p.lastName || ""} />
        <input name="firstName" placeholder="First name" defaultValue={p.firstName || ""} />
        <input name="oldLastName" placeholder="Old last name" defaultValue={p.oldLastName || ""} />
        <input name="oldFirstName" placeholder="Old first name" defaultValue={p.oldFirstName || ""} />
        <input name="gender" placeholder="Gender" defaultValue={p.gender || ""} />
        <input name="birthDate" placeholder="Birth date (YYYY-MM-DD)" defaultValue={p.birthDate || ""} />
        <input name="nationality" placeholder="Nationality" defaultValue={p.nationality || ""} />
        <input name="israeliId" placeholder="Israeli ID" defaultValue={p.israeliId || ""} />
        <input name="passportNumber" placeholder="Passport number" defaultValue={p.passportNumber || ""} />

        <h3>Status</h3>
        <input name="maritalStatus" placeholder="Marital status" defaultValue={step5.maritalStatus || ""} />
        <input name="statusDate" placeholder="Status date (YYYY-MM-DD)" defaultValue={step5.statusDate || ""} />

        <h3>Contact</h3>
        <input name="phone" placeholder="Phone" defaultValue={step5.phone || ""} />
        <input name="email" placeholder="Email" defaultValue={step5.email || ""} />

        <div style={{ display: "flex", gap: 12 }}>
          <button formAction={saveDraft} type="submit">Save draft</button>
          <button type="submit">Save & Continue</button>
        </div>
      </form>
    </main>
  );
}
