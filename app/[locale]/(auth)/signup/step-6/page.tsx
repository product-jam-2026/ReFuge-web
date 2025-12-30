import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { completeRegistration, saveSignupStep } from "../actions";

export default async function Step6Page({ params, searchParams }: any) {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${params.locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("registration_completed, data")
    .eq("id", data.user.id)
    .single();

  if (profile?.registration_completed) redirect(`/${params.locale}/home`);
  const step6 = profile?.data?.intake?.step6 || {};
  const child0 = step6.children?.[0] || {};

  async function saveDraft(formData: FormData) {
    "use server";
    const child = {
      lastName: String(formData.get("childLastName") || ""),
      firstName: String(formData.get("childFirstName") || ""),
      gender: String(formData.get("childGender") || ""),
      birthDate: String(formData.get("childBirthDate") || ""),
      nationality: String(formData.get("childNationality") || ""),
      israeliId: String(formData.get("childIsraeliId") || ""),
      residenceCountry: String(formData.get("childResidenceCountry") || ""),
      entryDate: String(formData.get("childEntryDate") || ""),
    };

    await saveSignupStep({
      locale: params.locale,
      step: 6,
      patch: { children: [child] },
      goNext: false,
    });
  }

  async function finish(formData: FormData) {
    "use server";
    const child = {
      lastName: String(formData.get("childLastName") || ""),
      firstName: String(formData.get("childFirstName") || ""),
      gender: String(formData.get("childGender") || ""),
      birthDate: String(formData.get("childBirthDate") || ""),
      nationality: String(formData.get("childNationality") || ""),
      israeliId: String(formData.get("childIsraeliId") || ""),
      residenceCountry: String(formData.get("childResidenceCountry") || ""),
      entryDate: String(formData.get("childEntryDate") || ""),
    };

    await saveSignupStep({
      locale: params.locale,
      step: 6,
      patch: { children: [child] },
      goNext: false,
    });

    await completeRegistration(params.locale);
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Sign Up – Step 6</h1>
      {searchParams?.saved === "1" && <p>✅ Draft saved</p>}

      <form action={finish} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <h3>Child (temporary: only one)</h3>
        <input name="childLastName" placeholder="Last name" defaultValue={child0.lastName || ""} />
        <input name="childFirstName" placeholder="First name" defaultValue={child0.firstName || ""} />
        <input name="childGender" placeholder="Gender" defaultValue={child0.gender || ""} />
        <input name="childBirthDate" placeholder="Birth date (YYYY-MM-DD)" defaultValue={child0.birthDate || ""} />
        <input name="childNationality" placeholder="Nationality" defaultValue={child0.nationality || ""} />
        <input name="childIsraeliId" placeholder="Israeli ID" defaultValue={child0.israeliId || ""} />
        <input name="childResidenceCountry" placeholder="Residence country" defaultValue={child0.residenceCountry || ""} />
        <input name="childEntryDate" placeholder="Entry date (YYYY-MM-DD)" defaultValue={child0.entryDate || ""} />

        <div style={{ display: "flex", gap: 12 }}>
          <button formAction={saveDraft} type="submit">Save draft</button>
          <button type="submit">Finish registration</button>
        </div>
      </form>
    </main>
  );
}
