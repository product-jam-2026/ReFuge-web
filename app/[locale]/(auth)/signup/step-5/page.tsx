import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSignupStep } from "../actions";
import Step5FormClient from "./Step5FormClient";

// אם אצלכם יש helper קבוע להבאת messages לפי locale – השתמשי בו במקום זה.
// כאן אני מניח שיש messages JSON תחת /messages
import he from "@/messages/he.json";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

function getDict(locale: string) {
  if (locale === "he") return he as any;
  if (locale === "ar") return ar as any;
  return en as any;
}

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

  const dict = getDict(params.locale);
  const labels = dict?.SignupStep5;

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
        // שימי לב: ב-STEP5 המקורי לא שמרת תאריכי דרכון/מדינה.
        // אבל במסך זה כן מופיע, אז אנחנו מוסיפים אותם ל-step5.person (לא שוברים שום שם קיים).
        passportIssueDate: String(formData.get("passportIssueDate") || ""),
        passportExpiryDate: String(formData.get("passportExpiryDate") || ""),
        passportIssueCountry: String(formData.get("passportIssueCountry") || ""),
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
        passportIssueDate: String(formData.get("passportIssueDate") || ""),
        passportExpiryDate: String(formData.get("passportExpiryDate") || ""),
        passportIssueCountry: String(formData.get("passportIssueCountry") || ""),
      },
      maritalStatus: String(formData.get("maritalStatus") || ""),
      statusDate: String(formData.get("statusDate") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
    };

    await saveSignupStep({ locale: params.locale, step: 5, patch, goNext: true });
  }

  return (
    <main style={{ padding: 24 }}>
      {searchParams?.saved === "1" && <p>✅ {labels?.draftSaved}</p>}

      <Step5FormClient
        labels={labels}
        defaults={{
          lastName: p.lastName || "",
          firstName: p.firstName || "",
          oldLastName: p.oldLastName || "",
          oldFirstName: p.oldFirstName || "",
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
          email: step5.email || data.user.email || "",
        }}
        saveDraftAction={saveDraft}
        saveAndNextAction={saveAndNext}
      />
    </main>
  );
}
