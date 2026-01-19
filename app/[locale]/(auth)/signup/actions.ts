"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache"; // חשוב עבור שלב 6
import { translateToHebrew, translateToArabic } from "@/app/actions/translate";

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function normalizeText(v: FormDataEntryValue | null, max = 120) {
  return String(v || "").trim().slice(0, max);
}

function normalizeDigits(v: FormDataEntryValue | null, max = 20) {
  return String(v || "").trim().replace(/[^\d]/g, "").slice(0, max);
}

function normalizeEmail(v: FormDataEntryValue | null) {
  return String(v || "").trim().toLowerCase();
}

function normalizePhone(v: FormDataEntryValue | null) {
  return String(v || "").trim().replace(/[^\d+]/g, "");
}

function buildISODateFromForm(formData: FormData, prefix: string) {
  const direct = String(formData.get(prefix) || "").trim();
  if (direct && direct.match(/^(\d{4})-(\d{2})-(\d{2})$/)) {
    return direct;
  }
  const y = String(formData.get(`${prefix}_y`) || "").trim();
  const m = String(formData.get(`${prefix}_m`) || "").trim();
  const d = String(formData.get(`${prefix}_d`) || "").trim();
  if (!y || !m || !d) return "";
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
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

function isHebrew(text: string) {
  return /[\u0590-\u05FF]/.test(text);
}

// ----------------------------------------------------------------------
// Step 1 Logic
// ----------------------------------------------------------------------

export async function translateStep1Data(formData: FormData) {
  "use server";
  const fields = ["firstName", "lastName", "oldFirstName", "oldLastName"];
  const results: Record<string, { original: string; translated: string; direction: "he-to-ar" | "ar-to-he" }> = {};

  await Promise.all(
    fields.map(async (key) => {
      const originalValue = String(formData.get(key) || "").trim();
      if (!originalValue) {
        results[key] = { original: "", translated: "", direction: "ar-to-he" };
        return;
      }
      const sourceIsHebrew = isHebrew(originalValue);
      let translatedValue = "";
      if (sourceIsHebrew) {
        translatedValue = await translateToArabic(originalValue);
        results[key] = { original: originalValue, translated: translatedValue, direction: "he-to-ar" };
      } else {
        translatedValue = await translateToHebrew(originalValue);
        results[key] = { original: originalValue, translated: translatedValue, direction: "ar-to-he" };
      }
    })
  );
  return results;
}

export async function submitStep1(locale: string, mode: "draft" | "next", formData: FormData) {
  "use server";
  const buildDualField = (baseName: string) => {
    const heVal = normalizeText(formData.get(`${baseName}He`));
    const arVal = normalizeText(formData.get(`${baseName}Ar`));
    const baseVal = normalizeText(formData.get(baseName));
    return { he: heVal || baseVal, ar: arVal || "" };
  };

  const patch = {
    lastName: buildDualField("lastName"),
    firstName: buildDualField("firstName"),
    oldLastName: buildDualField("oldLastName"),
    oldFirstName: buildDualField("oldFirstName"),
    gender: normalizeText(formData.get("gender"), 20),
    birthDate: buildISODateFromForm(formData, "birthDate"),
    nationality: normalizeText(formData.get("nationality"), 60),
    israeliId: normalizeDigits(formData.get("israeliId")),
    passportNumber: normalizeText(formData.get("passportNumber"), 40),
    passportIssueDate: buildISODateFromForm(formData, "passportIssueDate"),
    passportExpiryDate: buildISODateFromForm(formData, "passportExpiryDate"),
    passportIssueCountry: normalizeText(formData.get("passportIssueCountry"), 60),
    phone: normalizePhone(formData.get("phone")),
    email: normalizeEmail(formData.get("email")),
  };

  await saveSignupStep({ locale, step: 1, patch, goNext: mode === "next" });
}

// ----------------------------------------------------------------------
// Step 2 Logic
// ----------------------------------------------------------------------

export async function translateStep2Data(formData: FormData) {
  "use server";
  const fields = ["residenceCity", "residenceAddress"]; 
  const results: Record<string, { original: string; translated: string; direction: "he-to-ar" | "ar-to-he" }> = {};

  await Promise.all(
    fields.map(async (key) => {
      const originalValue = String(formData.get(key) || "").trim();
      if (!originalValue) {
        results[key] = { original: "", translated: "", direction: "ar-to-he" };
        return;
      }
      const sourceIsHebrew = isHebrew(originalValue);
      let translatedValue = "";
      if (sourceIsHebrew) {
        translatedValue = await translateToArabic(originalValue);
        results[key] = { original: originalValue, translated: translatedValue, direction: "he-to-ar" };
      } else {
        translatedValue = await translateToHebrew(originalValue);
        results[key] = { original: originalValue, translated: translatedValue, direction: "ar-to-he" };
      }
    })
  );
  return results;
}

export async function submitStep2(locale: string, mode: "draft" | "next", formData: FormData) {
  "use server";
  const buildDualField = (baseName: string) => {
    const heVal = normalizeText(formData.get(`${baseName}He`));
    const arVal = normalizeText(formData.get(`${baseName}Ar`));
    const baseVal = normalizeText(formData.get(baseName));
    return { he: heVal || baseVal, ar: arVal || "" };
  };

  const patch = {
    residenceCountry: normalizeText(formData.get("residenceCountry")),
    visaType: normalizeText(formData.get("visaType")),
    visaStartDate: buildISODateFromForm(formData, "visaStartDate"),
    visaEndDate: buildISODateFromForm(formData, "visaEndDate"),
    entryDate: buildISODateFromForm(formData, "entryDate"),
    residenceCity: buildDualField("residenceCity"),
    residenceAddress: buildDualField("residenceAddress"),
  };

  await saveSignupStep({ locale, step: 2, patch, goNext: mode === "next" });
}

// ----------------------------------------------------------------------
// Core Action: Save Helper
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
    .select("data")
    .eq("id", user.id)
    .single();

  const existingData = profile?.data || {};
  const existingIntake = existingData.intake || {};

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
    const nextStep = Math.min(params.step + 1, 7);
    redirect(`/${params.locale}/signup/step-${nextStep}`);
  } else {
    redirect(`/${params.locale}/signup/step-${params.step}?saved=1`);
  }
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
// Step 3 Logic
// ----------------------------------------------------------------------

export async function translateStep3Data(formData: FormData) {
  "use server";
  const fields = ["regStreet", "employerName", "businessName", "workAddress"];
  const results: Record<string, { original: string; translated: string; direction: "he-to-ar" | "ar-to-he" }> = {};

  await Promise.all(
    fields.map(async (key) => {
      const originalValue = String(formData.get(key) || "").trim();
      if (!originalValue) {
        results[key] = { original: "", translated: "", direction: "ar-to-he" };
        return;
      }
      const sourceIsHebrew = isHebrew(originalValue);
      let translatedValue = "";
      if (sourceIsHebrew) {
        translatedValue = await translateToArabic(originalValue);
        results[key] = { original: originalValue, translated: translatedValue, direction: "he-to-ar" };
      } else {
        translatedValue = await translateToHebrew(originalValue);
        results[key] = { original: originalValue, translated: translatedValue, direction: "ar-to-he" };
      }
    })
  );
  return results;
}

function buildOccupationJSON(formData: FormData, buildDualField: (name: string) => any) {
  const rawAssets = formData.getAll("assets").map(String);
  const cleanedAssets = Array.from(new Set(rawAssets)).filter(Boolean);
  
  const businessVal = formData.get("businessName");
  const employerVal = formData.get("employerName");
  
  let finalEmployerName = { he: "", ar: "" };
  if (businessVal) {
     finalEmployerName = buildDualField("businessName");
  } else if (employerVal) {
     finalEmployerName = buildDualField("employerName");
  }

  return JSON.stringify({
    assets: cleanedAssets,
    occupationText: normalizeText(formData.get("occupationText")),
    employerName: finalEmployerName,
    workAddress: buildDualField("workAddress"),
    workStartDate: normalizeText(formData.get("workStartDate")),
    notWorkingSub: normalizeText(formData.get("notWorkingSub")),
  });
}

export async function submitStep3(locale: string, mode: "draft" | "next" | "back", formData: FormData) {
  "use server"; 
  const buildDualField = (baseName: string) => {
    const heVal = normalizeText(formData.get(`${baseName}He`));
    const arVal = normalizeText(formData.get(`${baseName}Ar`));
    const baseVal = normalizeText(formData.get(baseName));
    return { he: heVal || baseVal, ar: arVal || "" };
  };

  const mailingDiff = formData.get("mailingDifferent") === "true";
  
  const patch = {
    maritalStatus: normalizeText(formData.get("maritalStatus")),
    statusDate: normalizeText(formData.get("statusDate")),
    registeredAddress: {
      city: normalizeText(formData.get("regCity")),
      street: buildDualField("regStreet"),
      houseNumber: normalizeDigits(formData.get("regHouseNumber")),
      entry: normalizeText(formData.get("regEntry")),
      apartment: normalizeDigits(formData.get("regApartment")),
      zip: normalizeDigits(formData.get("regZip")),
    },
    housingType: normalizeText(formData.get("housingType")),
    mailingDifferent: mailingDiff,
    mailingAddress: {
      city: mailingDiff ? normalizeText(formData.get("mailCity")) : "",
      street: mailingDiff ? normalizeText(formData.get("mailStreet")) : "",
      houseNumber: mailingDiff ? normalizeDigits(formData.get("mailHouseNumber")) : "",
      entry: mailingDiff ? normalizeText(formData.get("mailEntry")) : "",
      apartment: mailingDiff ? normalizeDigits(formData.get("mailApartment")) : "",
      zip: mailingDiff ? normalizeDigits(formData.get("mailZip")) : "",
    },
    employmentStatus: normalizeText(formData.get("employmentStatus")),
    occupation: buildOccupationJSON(formData, buildDualField),
  };
  
  if (mode === "back") {
    await saveDraftAndGoToStep({ locale, step: 3, patch, goToStep: 2 });
  } else {
    await saveSignupStep({ locale, step: 3, patch, goNext: mode === "next" });
  }
}

// ----------------------------------------------------------------------
// Step 4 Logic
// ----------------------------------------------------------------------

export async function translateStep4Data(formData: FormData) {
  "use server";
  return {}; 
}

export async function submitStep4(locale: string, mode: "draft" | "next" | "back", formData: FormData) {
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
  } else {
    await saveSignupStep({ locale, step: 4, patch, goNext: mode === "next" });
  }
}

// ----------------------------------------------------------------------
// Step 5 Logic
// ----------------------------------------------------------------------

export async function translateStep5Data(formData: FormData) {
  "use server";
  const fields = ["firstName", "lastName", "oldFirstName", "oldLastName"];
  const results: Record<string, { original: string; translated: string; direction: "he-to-ar" | "ar-to-he" }> = {};

  await Promise.all(
    fields.map(async (key) => {
      const originalValue = String(formData.get(key) || "").trim();
      if (!originalValue) {
        results[key] = { original: "", translated: "", direction: "ar-to-he" };
        return;
      }
      const sourceIsHebrew = isHebrew(originalValue);
      let translatedValue = "";
      if (sourceIsHebrew) {
        translatedValue = await translateToArabic(originalValue);
        results[key] = { original: originalValue, translated: translatedValue, direction: "he-to-ar" };
      } else {
        translatedValue = await translateToHebrew(originalValue);
        results[key] = { original: originalValue, translated: translatedValue, direction: "ar-to-he" };
      }
    })
  );
  return results;
}

export async function submitStep5(locale: string, mode: "draft" | "next" | "back", formData: FormData) {
  "use server";
  const buildDualField = (baseName: string) => {
    const heVal = normalizeText(formData.get(`${baseName}He`));
    const arVal = normalizeText(formData.get(`${baseName}Ar`));
    const baseVal = normalizeText(formData.get(baseName));
    return { he: heVal || baseVal, ar: arVal || "" };
  };

  const patch = {
    spouse: { 
      lastName: buildDualField("lastName"),
      firstName: buildDualField("firstName"),
      oldLastName: buildDualField("oldLastName"),
      oldFirstName: buildDualField("oldFirstName"),
      gender: normalizeText(formData.get("gender"), 20),
      birthDate: buildISODateFromForm(formData, "birthDate"),
      nationality: normalizeText(formData.get("nationality"), 60),
      israeliId: normalizeDigits(formData.get("israeliId")),
      passportNumber: normalizeText(formData.get("passportNumber"), 40),
      passportIssueDate: buildISODateFromForm(formData, "passportIssueDate"),
      passportExpiryDate: buildISODateFromForm(formData, "passportExpiryDate"),
      passportIssueCountry: normalizeText(formData.get("passportIssueCountry"), 60),
      phone: normalizePhone(formData.get("phone")),
      email: normalizeEmail(formData.get("email")),
    }
  };

  if (mode === "back") {
    await saveDraftAndGoToStep({ locale, step: 5, patch, goToStep: 4 });
  } else {
    await saveSignupStep({ locale, step: 5, patch, goNext: mode === "next" });
  }
}

// ----------------------------------------------------------------------
// Step 6 Logic (Children) - מעודכן עם revalidatePath
// ----------------------------------------------------------------------

export async function translateStep6Data(childrenList: any[]) {
  "use server";
  const translatedChildren = await Promise.all(
    childrenList.map(async (child) => {
      const fName = child.firstName || "";
      let fNameTrans = "";
      let fDir = "ar-to-he";
      if (fName) {
         if (isHebrew(fName)) {
            fNameTrans = await translateToArabic(fName);
            fDir = "he-to-ar";
         } else {
            fNameTrans = await translateToHebrew(fName);
            fDir = "ar-to-he";
         }
      }

      const lName = child.lastName || "";
      let lNameTrans = "";
      let lDir = "ar-to-he";
      if (lName) {
         if (isHebrew(lName)) {
            lNameTrans = await translateToArabic(lName);
            lDir = "he-to-ar";
         } else {
            lNameTrans = await translateToHebrew(lName);
            lDir = "ar-to-he";
         }
      }

      return {
        ...child,
        firstNameTranslation: { 
            original: fName, 
            translated: fNameTrans, 
            direction: fDir
        },
        lastNameTranslation: { 
            original: lName, 
            translated: lNameTrans, 
            direction: lDir
        }
      };
    })
  );

  return translatedChildren;
}

export async function submitStep6Child(locale: string, actionType: "add_another" | "finish_step" | "save_draft", formData: FormData) {
  "use server";
  
  const { supabase, user } = await getAuthedSupabase();

  // 1. שליפת נתונים קיימים
  const { data: profile } = await supabase.from("profiles").select("data").eq("id", user.id).single();
  const existingData = profile?.data || {};
  const existingIntake = existingData.intake || {};
  const step6 = existingIntake.step6 || {};
  const currentChildren = Array.isArray(step6.children) ? step6.children : [];

  // 2. בניית הילד הנוכחי מהטופס
  const firstName = normalizeText(formData.get("childFirstName"));
  const lastName = normalizeText(formData.get("childLastName"));
  
  let updatedChildren = [...currentChildren];

  // רק אם יש מידע (שם פרטי), נוסיף את הילד
  if (firstName) {
      const newChild = {
        firstName,
        lastName,
        gender: normalizeText(formData.get("childGender")),
        birthDate: buildISODateFromForm(formData, "childBirthDate"),
        nationality: normalizeText(formData.get("childNationality")),
        israeliId: normalizeDigits(formData.get("childIsraeliId")),
        residenceCountry: normalizeText(formData.get("childResidenceCountry")),
        entryDate: buildISODateFromForm(formData, "childEntryDate"),
        arrivalToIsraelDate: buildISODateFromForm(formData, "childArrivalToIsraelDate"),
      };
      updatedChildren.push(newChild);
  }

  // 3. שמירה
  const nextIntake = mergeDeep(existingIntake, {
    step6: { children: updatedChildren },
    currentStep: actionType === "finish_step" ? Math.max(existingIntake.currentStep || 1, 7) : existingIntake.currentStep
  });

  const { error } = await supabase.from("profiles").update({ data: { ...existingData, intake: nextIntake } }).eq("id", user.id);

  if (error) throw new Error("Failed to save child");

  // 4. טיפול בתגובה - ללא redirect במקרה של הוספת עוד ילד
  if (actionType === "add_another") {
    // מעדכנים את הקאש ומחזירים הצלחה כדי שהקליינט יאפס את הטופס
    revalidatePath(`/${locale}/signup/step-6`);
    return { success: true, savedChild: true };
  } 
  
  // במקרה של סיום, מחזירים את כל הילדים לסיכום
  return { success: true, updatedChildren };
}

export async function proceedToStep7(locale: string) {
    "use server";
    redirect(`/${locale}/signup/step-7`);
}

// ----------------------------------------------------------------------
// Step 7 Logic
// ----------------------------------------------------------------------

export async function submitStep7(locale: string, mode: "draft" | "finish" | "back", formData: FormData) {
  "use server";
  const patch = { documents: {} }; 
  if (mode === "back") {
    await saveDraftAndGoToStep({ locale, step: 7, patch, goToStep: 6 });
  } else if (mode === "finish") {
    await finishRegistration({ locale, step: 7, patch });
  } else {
    await saveSignupStep({ locale, step: 7, patch, goNext: false });
  }
}