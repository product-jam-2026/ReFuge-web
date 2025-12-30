import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSignupStep } from "../actions";

export default async function Step1Page({
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

  const step1 = profile?.data?.intake?.step1 || {};

  async function saveDraft(formData: FormData) {
    "use server";
    const patch = {
      lastName: String(formData.get("lastName") || ""),
      firstName: String(formData.get("firstName") || ""),
      oldLastName: String(formData.get("oldLastName") || ""),
      oldFirstName: String(formData.get("oldFirstName") || ""),
      gender: String(formData.get("gender") || ""),
      birthDate: String(formData.get("birthDate") || ""),
      nationality: String(formData.get("nationality") || ""),
      israeliId: String(formData.get("israeliId") || ""),
      passportNumber: String(formData.get("passportNumber") || ""),
      passportIssueDate: String(formData.get("passportIssueDate") || ""),
      passportExpiryDate: String(formData.get("passportExpiryDate") || ""),
      passportIssueCountry: String(formData.get("passportIssueCountry") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
    };

    await saveSignupStep({
      locale: params.locale,
      step: 1,
      patch,
      goNext: false,
    });
  }

  async function saveAndNext(formData: FormData) {
    "use server";
    const patch = {
      lastName: String(formData.get("lastName") || ""),
      firstName: String(formData.get("firstName") || ""),
      oldLastName: String(formData.get("oldLastName") || ""),
      oldFirstName: String(formData.get("oldFirstName") || ""),
      gender: String(formData.get("gender") || ""),
      birthDate: String(formData.get("birthDate") || ""),
      nationality: String(formData.get("nationality") || ""),
      israeliId: String(formData.get("israeliId") || ""),
      passportNumber: String(formData.get("passportNumber") || ""),
      passportIssueDate: String(formData.get("passportIssueDate") || ""),
      passportExpiryDate: String(formData.get("passportExpiryDate") || ""),
      passportIssueCountry: String(formData.get("passportIssueCountry") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
    };

    await saveSignupStep({
      locale: params.locale,
      step: 1,
      patch,
      goNext: true,
    });
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign Up – Step 1</h1>
      {searchParams?.saved === "1" && <p>✅ Draft saved</p>}

      <form action={saveAndNext} style={{ display: "grid", gap: 12, maxWidth: 420 }}>
        <input name="lastName" placeholder="Last name" defaultValue={step1.lastName || ""} />
        <input name="firstName" placeholder="First name" defaultValue={step1.firstName || ""} />
        <input name="oldLastName" placeholder="Old last name" defaultValue={step1.oldLastName || ""} />
        <input name="oldFirstName" placeholder="Old first name" defaultValue={step1.oldFirstName || ""} />
        <input name="gender" placeholder="Gender" defaultValue={step1.gender || ""} />
        <input name="birthDate" placeholder="Birth date (YYYY-MM-DD)" defaultValue={step1.birthDate || ""} />
        <input name="nationality" placeholder="Nationality" defaultValue={step1.nationality || ""} />
        <input name="israeliId" placeholder="Israeli ID (if exists)" defaultValue={step1.israeliId || ""} />

        <h3>Passport</h3>
        <input name="passportNumber" placeholder="Passport number" defaultValue={step1.passportNumber || ""} />
        <input name="passportIssueDate" placeholder="Issue date (YYYY-MM-DD)" defaultValue={step1.passportIssueDate || ""} />
        <input name="passportExpiryDate" placeholder="Expiry date (YYYY-MM-DD)" defaultValue={step1.passportExpiryDate || ""} />
        <input name="passportIssueCountry" placeholder="Issue country" defaultValue={step1.passportIssueCountry || ""} />

        <h3>Contact</h3>
        <input name="phone" placeholder="Phone" defaultValue={step1.phone || ""} />
        <input name="email" placeholder="Email" defaultValue={step1.email || data.user.email || ""} />

        <div style={{ display: "flex", gap: 12 }}>
          <button formAction={saveDraft} type="submit">
            Save draft
          </button>
          <button type="submit">Save & Continue</button>
        </div>
      </form>
    </main>
  );
}
