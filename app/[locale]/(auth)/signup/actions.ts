"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function normalizeText(v: FormDataEntryValue | null, max = 120) {
  return String(v || "").trim().slice(0, max);
}

function normalizeDigits(v: FormDataEntryValue | null, max = 20) {
  return String(v || "").trim().replace(/[^\d]/g, "").slice(0, max);
}

function mergeDeep(base: any, patch: any) {
  if (patch === null || patch === undefined) return base;
  if (Array.isArray(patch)) return patch;
  if (typeof patch !== "object") return patch;

  const out = { ...(base || {}) };
  for (const key of Object.keys(patch)) {
    out[key] = mergeDeep(base?.[key], patch[key]);
  }
  return out;
}

async function getAuthedSupabase() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return { supabase, user: data.user };
}

async function upsertProfileIfMissing(supabase: any, user: any) {
  await supabase.from("profiles").upsert(
    { id: user.id, email: user.email },
    { onConflict: "id" }
  );
}

// ----------------------------------------------------------------------
// Core Action: Save Step & Navigate
// ----------------------------------------------------------------------

export async function saveSignupStep(params: {
  locale: string;
  step: number;
  patch: any;
  goNext?: boolean;
}) {
  const { supabase, user } = await getAuthedSupabase();
  await upsertProfileIfMissing(supabase, user);

  const { data: profile } = await supabase
    .from("profiles")
    .select("data, registration_completed")
    .eq("id", user.id)
    .single();

  const existingData = profile?.data || {};
  const existingIntake = existingData.intake || {};

  // ✅ עדכון: מאפשר מעבר עד שלב 7
  const computedCurrentStep = params.goNext
    ? Math.min(params.step + 1, 7)
    : params.step;

  const nextIntake = mergeDeep(existingIntake, {
    currentStep: Math.max(existingIntake.currentStep || 1, computedCurrentStep),
    [`step${params.step}`]: params.patch,
  });

  const nextData = mergeDeep(existingData, { intake: nextIntake });

  await supabase.from("profiles").update({ data: nextData }).eq("id", user.id);

  if (params.goNext) {
    // ✅ עדכון: מעבר לשלב הבא (עד 7)
    const nextStep = Math.min(params.step + 1, 7);
    redirect(`/${params.locale}/signup/step-${nextStep}`);
  }

  // הישארות באותו עמוד (Save Draft)
  redirect(`/${params.locale}/signup/step-${params.step}?saved=1`);
}

export async function saveDraftAndGoToStep(params: {
  locale: string;
  step: number;
  patch: any;
  goToStep: number;
}) {
  const { supabase, user } = await getAuthedSupabase();
  const { data: profile } = await supabase.from("profiles").select("data").eq("id", user.id).single();
  
  const existingData = profile?.data || {};
  const existingIntake = existingData.intake || {};

  const nextIntake = mergeDeep(existingIntake, {
    [`step${params.step}`]: params.patch,
  });

  await supabase.from("profiles").update({ data: { ...existingData, intake: nextIntake } }).eq("id", user.id);
  redirect(`/${params.locale}/signup/step-${params.goToStep}`);
}

// פונקציה פנימית לסיום הרשמה (משמשת את שלב 7)
async function finishRegistration(params: {
  locale: string;
  step: number;
  patch: any;
}) {
  const { supabase, user } = await getAuthedSupabase();
  
  const { data: profile } = await supabase.from("profiles").select("data").eq("id", user.id).single();
  const existingData = profile?.data || {};
  const existingIntake = existingData.intake || {};

  const nextIntake = mergeDeep(existingIntake, {
    currentStep: params.step,
    [`step${params.step}`]: params.patch,
  });

  await supabase.from("profiles").update({ 
    data: { ...existingData, intake: nextIntake },
    registration_completed: true 
  }).eq("id", user.id);

  redirect(`/${params.locale}/home`);
}

// ----------------------------------------------------------------------
// Step 3
// ----------------------------------------------------------------------

function buildOccupationJSON(formData: FormData) {
  const rawAssets = formData.getAll("assets").map(String);
  const cleanedAssets = Array.from(new Set(rawAssets)).filter(Boolean);

  const payload = {
    assets: cleanedAssets,
    occupationText: normalizeText(formData.get("occupationText")),
    employerName: normalizeText(formData.get("employerName") || formData.get("businessName")),
    workAddress: normalizeText(formData.get("workAddress")),
    workStartDate: normalizeText(formData.get("workStartDate")),
  };

  return JSON.stringify(payload);
}

export async function submitStep3(
  locale: string,
  mode: "draft" | "next" | "back",
  formData: FormData
) {
  "use server"; 

  const mailingDiff = formData.get("mailingDifferent") === "true";
  
  const mailingAddr = {
    city: mailingDiff ? normalizeText(formData.get("mailCity")) : "",
    street: mailingDiff ? normalizeText(formData.get("mailStreet")) : "",
    houseNumber: mailingDiff ? normalizeDigits(formData.get("mailHouseNumber")) : "",
    entry: mailingDiff ? normalizeText(formData.get("mailEntry")) : "",
    apartment: mailingDiff ? normalizeDigits(formData.get("mailApartment")) : "",
    zip: mailingDiff ? normalizeDigits(formData.get("mailZip")) : "",
  };

  const patch = {
    maritalStatus: normalizeText(formData.get("maritalStatus")),
    statusDate: normalizeText(formData.get("statusDate")),
    
    registeredAddress: {
      city: normalizeText(formData.get("regCity")),
      street: normalizeText(formData.get("regStreet")),
      houseNumber: normalizeDigits(formData.get("regHouseNumber")),
      entry: normalizeText(formData.get("regEntry")),
      apartment: normalizeDigits(formData.get("regApartment")),
      zip: normalizeDigits(formData.get("regZip")),
    },
    
    housingType: normalizeText(formData.get("housingType")),
    mailingDifferent: mailingDiff,
    mailingAddress: mailingAddr,
    employmentStatus: normalizeText(formData.get("employmentStatus")),
    occupation: buildOccupationJSON(formData),
  };

  if (mode === "back") {
    await saveDraftAndGoToStep({ locale, step: 3, patch, goToStep: 2 });
  } else if (mode === "next") {
    await saveSignupStep({ locale, step: 3, patch, goNext: true });
  } else {
    await saveSignupStep({ locale, step: 3, patch, goNext: false });
  }
}

// ----------------------------------------------------------------------
// Step 4
// ----------------------------------------------------------------------

export async function submitStep4(
  locale: string,
  mode: "draft" | "next" | "back",
  formData: FormData
) {
  "use server";

  const patch = {
    healthFund: normalizeText(formData.get("healthFund"), 60),
    bank: {
      bankName: normalizeText(formData.get("bankName"), 60),
      branch: normalizeText(formData.get("branch"), 60),
      accountNumber: normalizeDigits(formData.get("accountNumber"), 20),
    },
    nationalInsurance: {
      hasFile: normalizeText(formData.get("hasFile"), 10),
      fileNumber: normalizeDigits(formData.get("fileNumber"), 20),
      getsAllowance: normalizeText(formData.get("getsAllowance"), 10),
      allowanceType: normalizeText(formData.get("allowanceType"), 60),
      allowanceFileNumber: normalizeDigits(formData.get("allowanceFileNumber"), 20),
    },
  };

  if (mode === "back") {
    await saveDraftAndGoToStep({ locale, step: 4, patch, goToStep: 3 });
  } else if (mode === "next") {
    await saveSignupStep({ locale, step: 4, patch, goNext: true });
  } else {
    await saveSignupStep({ locale, step: 4, patch, goNext: false });
  }
}

// ----------------------------------------------------------------------
// Step 5
// ----------------------------------------------------------------------

export async function submitStep5(
  locale: string,
  mode: "draft" | "next" | "back",
  formData: FormData
) {
  "use server";

  const patch = {
    person: {
      firstName: normalizeText(formData.get("firstName"), 60),
      lastName: normalizeText(formData.get("lastName"), 60),
      oldFirstName: normalizeText(formData.get("oldFirstName"), 60),
      oldLastName: normalizeText(formData.get("oldLastName"), 60),
      gender: normalizeText(formData.get("gender"), 10),
      birthDate: normalizeText(formData.get("birthDate"), 20),
      nationality: normalizeText(formData.get("nationality"), 60),
      israeliId: normalizeDigits(formData.get("israeliId"), 15),
      passportNumber: normalizeText(formData.get("passportNumber"), 20),
      passportIssueDate: normalizeText(formData.get("passportIssueDate"), 20),
      passportExpiryDate: normalizeText(formData.get("passportExpiryDate"), 20),
      passportIssueCountry: normalizeText(formData.get("passportIssueCountry"), 60),
    },
    maritalStatus: normalizeText(formData.get("maritalStatus"), 20),
    statusDate: normalizeText(formData.get("statusDate"), 20),
    phone: normalizeText(formData.get("phone"), 20),
    email: normalizeText(formData.get("email"), 80),
  };

  if (mode === "back") {
    await saveDraftAndGoToStep({ locale, step: 5, patch, goToStep: 4 });
  } else if (mode === "next") {
    await saveSignupStep({ locale, step: 5, patch, goNext: true });
  } else {
    await saveSignupStep({ locale, step: 5, patch, goNext: false });
  }
}

// ----------------------------------------------------------------------
// Step 6
// ----------------------------------------------------------------------

function buildChildObject(formData: FormData) {
  return {
    lastName: normalizeText(formData.get("childLastName"), 60),
    firstName: normalizeText(formData.get("childFirstName"), 60),
    gender: normalizeText(formData.get("childGender"), 10),
    birthDate: normalizeText(formData.get("childBirthDate"), 20),
    nationality: normalizeText(formData.get("childNationality"), 60),
    israeliId: normalizeDigits(formData.get("childIsraeliId"), 15),
    residenceCountry: normalizeText(formData.get("childResidenceCountry"), 60),
    entryDate: normalizeText(formData.get("childEntryDate"), 20),
    birthCity: normalizeText(formData.get("childBirthCity"), 60),
    arrivalToIsraelDate: normalizeText(formData.get("childArrivalToIsraelDate"), 20),
    arrivalToIsraelReason: normalizeText(formData.get("childArrivalToIsraelReason"), 100),
  };
}

export async function submitStep6(
  locale: string,
  mode: "draft" | "finish" | "back" | "add_another",
  formData: FormData
) {
  "use server";

  const child = buildChildObject(formData);
  // בגרסה פשוטה זו אנחנו שומרים מערך עם ילד אחד. במציאות: push למערך קיים.
  const patch = { children: [child] }; 

  if (mode === "back") {
    await saveDraftAndGoToStep({ locale, step: 6, patch, goToStep: 5 });
  } else if (mode === "finish") {
    // ✅ כאן השינוי: במקום לסיים הרשמה, אנחנו עוברים לשלב 7
    await saveSignupStep({ locale, step: 6, patch, goNext: true });
  } else if (mode === "add_another") {
    await saveSignupStep({ locale, step: 6, patch, goNext: false });
    redirect(`/${locale}/signup/step-6?saved=1`);
  } else {
    await saveSignupStep({ locale, step: 6, patch, goNext: false });
  }
}

// ----------------------------------------------------------------------
// Step 7 (Final)
// ----------------------------------------------------------------------

export async function submitStep7(
  locale: string,
  mode: "draft" | "finish" | "back",
  formData: FormData
) {
  "use server";

  // הערה: יש לשמור את הקבצים ב-Storage. כאן אנו שומרים רק את שמותיהם.
  const filesMap = {
    passportCopy: (formData.get("passportCopy") as File)?.name || "",
    rentalContract: (formData.get("rentalContract") as File)?.name || "",
    propertyOwnership: (formData.get("propertyOwnership") as File)?.name || "",
    childPassportPhoto: (formData.get("childPassportPhoto") as File)?.name || "",
    otherDocs: (formData.get("otherDocs") as File)?.name || "",
  };

  const patch = {
    documents: filesMap
  };

  if (mode === "back") {
    await saveDraftAndGoToStep({ locale, step: 7, patch, goToStep: 6 });
  } else if (mode === "finish") {
    // ✅ סיום הרשמה ומעבר ל-Home
    await finishRegistration({ locale, step: 7, patch });
  } else {
    await saveSignupStep({ locale, step: 7, patch, goNext: false });
  }
}