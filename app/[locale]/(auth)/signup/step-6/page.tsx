import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  finishRegistrationStep6,
  saveDraftAndGoToStep,
  saveSignupStep,
} from "../actions";
import Step6FormClient from "./Step6FormClient";

import he from "@/messages/he.json";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

function getDict(locale: string) {
  if (locale === "he") return he as any;
  if (locale === "ar") return ar as any;
  return en as any;
}

// ✅ helper יציב ל-Server Actions
function buildChild(formData: FormData) {
  return {
    lastName: String(formData.get("childLastName") || ""),
    firstName: String(formData.get("childFirstName") || ""),
    gender: String(formData.get("childGender") || ""),
    birthDate: String(formData.get("childBirthDate") || ""),
    nationality: String(formData.get("childNationality") || ""),
    israeliId: String(formData.get("childIsraeliId") || ""),
    residenceCountry: String(formData.get("childResidenceCountry") || ""),
    entryDate: String(formData.get("childEntryDate") || ""),
    birthCity: String(formData.get("childBirthCity") || ""),
    residenceCity: String(formData.get("childResidenceCity") || ""),
    arrivalToIsraelDate: String(formData.get("childArrivalToIsraelDate") || ""),
    arrivalToIsraelReason: String(formData.get("childArrivalToIsraelReason") || ""),
  };
}

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

  const step6 = profile?.data?.intake?.step6 || {};
  const child0 = step6.children?.[0] || {};

  const dict = getDict(params.locale);
  const labels = dict?.SignupStep6;

  async function saveDraft(formData: FormData) {
    "use server";
    const child = buildChild(formData);

    // ✅ שמירת טיוטה רגילה (נשארים ב-step-6?saved=1)
    await saveSignupStep({
      locale: params.locale,
      step: 6,
      patch: { children: [child] },
      goNext: false,
    });
  }

  // ✅ חדש: שמור + חזור ל-Step 5
  async function saveDraftAndBack(formData: FormData) {
    "use server";
    const child = buildChild(formData);

    await saveDraftAndGoToStep({
      locale: params.locale,
      step: 6,
      patch: { children: [child] },
      goToStep: 5,
    });
  }

  async function finish(formData: FormData) {
    "use server";
    const child = buildChild(formData);

    // ✅ שומר step6 + מסמן completed + מפנה ל-home
    await finishRegistrationStep6({
      locale: params.locale,
      patch: { children: [child] },
    });
  }

  return (
    <main style={{ padding: 24 }}>
      {searchParams?.saved === "1" && <p>{labels?.draftSaved}</p>}

      <Step6FormClient
        labels={labels}
        defaults={{
          childLastName: child0.lastName || "",
          childFirstName: child0.firstName || "",
          childGender: child0.gender || "",
          childBirthDate: child0.birthDate || "",
          childNationality: child0.nationality || "",
          childIsraeliId: child0.israeliId || "",
          childResidenceCountry: child0.residenceCountry || "",
          childEntryDate: child0.entryDate || "",
          childBirthCity: child0.birthCity || "",
          childResidenceCity: child0.residenceCity || "",
          childArrivalToIsraelDate: child0.arrivalToIsraelDate || "",
          childArrivalToIsraelReason: child0.arrivalToIsraelReason || "",
        }}
        saveDraftAction={saveDraft}
        saveDraftAndBackAction={saveDraftAndBack}
        finishAction={finish}
      />
    </main>
  );
}
