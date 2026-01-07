import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveDraftAndGoToStep, saveSignupStep } from "../actions";
import { getTranslations } from "next-intl/server";
import Step3FormClient from "./Step3FormClient";

type Locale = string;

function isRTL(locale: Locale) {
  return locale === "he" || locale === "ar";
}

function parseISODateParts(iso?: string) {
  if (!iso || typeof iso !== "string") return { y: "", m: "", d: "" };
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { y: "", m: "", d: "" };
  return { y: m[1], m: m[2], d: m[3] };
}

function normalizeText(v: FormDataEntryValue | null, max = 120) {
  return String(v || "").trim().slice(0, max);
}

function normalizeDigits(v: FormDataEntryValue | null, max = 20) {
  return String(v || "")
    .trim()
    .replace(/[^\d]/g, "")
    .slice(0, max);
}

function buildISODateFromForm(formData: FormData, prefix: string) {
  const y = String(formData.get(`${prefix}_y`) || "").trim();
  const m = String(formData.get(`${prefix}_m`) || "").trim();
  const d = String(formData.get(`${prefix}_d`) || "").trim();

  if (!y && !m && !d) return "";
  if (!y || !m || !d) return "";

  const iso = `${y}-${m}-${d}`;
  const dt = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(dt.getTime())) return "";

  const [yy, mm, dd] = iso.split("-").map((x) => Number(x));
  if (
    dt.getUTCFullYear() !== yy ||
    dt.getUTCMonth() + 1 !== mm ||
    dt.getUTCDate() !== dd
  ) {
    return "";
  }
  return iso;
}

function buildOccupationJSON(formData: FormData, existingOccupation: any) {
  const rawAssets = formData.getAll("assets").map(String); // ["apartment","business",...]
  const cleanedAssets = Array.from(new Set(rawAssets)).filter(Boolean);

  // occupationText: מה שהיה פעם טקסט, אם קיים
  const existingText =
    typeof existingOccupation === "string"
      ? existingOccupation
      : (existingOccupation?.occupationText ?? "");

  const occupationText =
    normalizeText(formData.get("occupationText"), 120) || existingText || "";

  const payload = {
    assets: cleanedAssets,
    occupationText,
  };

  return JSON.stringify(payload);
}

export default async function Step3Page({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { saved?: string };
}) {
  const locale = params.locale as Locale;
  const dir = isRTL(locale) ? "rtl" : "ltr";
  const t = await getTranslations({ locale, namespace: "SignupStep3" });

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

  // defaults
  const wedding = parseISODateParts(step3.statusDate);
  const reg = step3.registeredAddress || {};

  // parse occupation JSON if exists
  let occupationDefaults: { assets: string[]; occupationText: string } = {
    assets: [],
    occupationText: "",
  };
  try {
    if (
      typeof step3.occupation === "string" &&
      step3.occupation.trim().startsWith("{")
    ) {
      const parsed = JSON.parse(step3.occupation);
      occupationDefaults = {
        assets: Array.isArray(parsed.assets) ? parsed.assets : [],
        occupationText:
          typeof parsed.occupationText === "string" ? parsed.occupationText : "",
      };
    } else if (typeof step3.occupation === "string") {
      occupationDefaults = { assets: [], occupationText: step3.occupation };
    }
  } catch {
    // ignore parsing errors
    if (typeof step3.occupation === "string") {
      occupationDefaults = { assets: [], occupationText: step3.occupation };
    }
  }

  async function saveDraft(formData: FormData) {
    "use server";

    const patch = {
      maritalStatus: normalizeText(formData.get("maritalStatus"), 40),
      statusDate: buildISODateFromForm(formData, "statusDate"),

      registeredAddress: {
        city: normalizeText(formData.get("regCity"), 60),
        street: normalizeText(formData.get("regStreet"), 80),
        houseNumber: normalizeDigits(formData.get("regHouseNumber"), 10),
        entry: normalizeText(formData.get("regEntry"), 10),
        apartment: normalizeDigits(formData.get("regApartment"), 10),
        zip: normalizeDigits(formData.get("regZip"), 10),
      },

      // NOTE: משתמשים בזה כרגע כדי לשמור "דירה שכורה/אחר" בלי לשבור סכימה
      mailingDifferent: String(formData.get("housingType") || "") === "other",

      // לא משתמשים ב-mailingAddress במסך הזה, אבל נשמור אותו כמו שהוא כדי לא למחוק
      mailingAddress: step3.mailingAddress || {
        city: "",
        street: "",
        houseNumber: "",
        entry: "",
        apartment: "",
        zip: "",
      },

      employmentStatus: normalizeText(formData.get("employmentStatus"), 40),
      notWorkingReason: normalizeText(formData.get("notWorkingReason"), 80),

      // assets multi select -> נשמר כ-json string בתוך occupation כדי לא לשבור
      occupation: buildOccupationJSON(formData, step3.occupation),
    };

    await saveSignupStep({ locale: params.locale, step: 3, patch, goNext: false });
  }

  // ✅ חדש: שמירה + חזרה ל-step-2
  async function saveDraftAndBack(formData: FormData) {
    "use server";

    const patch = {
      maritalStatus: normalizeText(formData.get("maritalStatus"), 40),
      statusDate: buildISODateFromForm(formData, "statusDate"),

      registeredAddress: {
        city: normalizeText(formData.get("regCity"), 60),
        street: normalizeText(formData.get("regStreet"), 80),
        houseNumber: normalizeDigits(formData.get("regHouseNumber"), 10),
        entry: normalizeText(formData.get("regEntry"), 10),
        apartment: normalizeDigits(formData.get("regApartment"), 10),
        zip: normalizeDigits(formData.get("regZip"), 10),
      },

      mailingDifferent: String(formData.get("housingType") || "") === "other",

      mailingAddress: step3.mailingAddress || {
        city: "",
        street: "",
        houseNumber: "",
        entry: "",
        apartment: "",
        zip: "",
      },

      employmentStatus: normalizeText(formData.get("employmentStatus"), 40),
      notWorkingReason: normalizeText(formData.get("notWorkingReason"), 80),

      occupation: buildOccupationJSON(formData, step3.occupation),
    };

    await saveDraftAndGoToStep({
      locale: params.locale,
      step: 3,
      patch,
      goToStep: 2,
    });
  }

  async function saveAndNext(formData: FormData) {
    "use server";

    const patch = {
      maritalStatus: normalizeText(formData.get("maritalStatus"), 40),
      statusDate: buildISODateFromForm(formData, "statusDate"),

      registeredAddress: {
        city: normalizeText(formData.get("regCity"), 60),
        street: normalizeText(formData.get("regStreet"), 80),
        houseNumber: normalizeDigits(formData.get("regHouseNumber"), 10),
        entry: normalizeText(formData.get("regEntry"), 10),
        apartment: normalizeDigits(formData.get("regApartment"), 10),
        zip: normalizeDigits(formData.get("regZip"), 10),
      },

      mailingDifferent: String(formData.get("housingType") || "") === "other",

      mailingAddress: step3.mailingAddress || {
        city: "",
        street: "",
        houseNumber: "",
        entry: "",
        apartment: "",
        zip: "",
      },

      employmentStatus: normalizeText(formData.get("employmentStatus"), 40),
      notWorkingReason: normalizeText(formData.get("notWorkingReason"), 80),

      occupation: buildOccupationJSON(formData, step3.occupation),
    };

    await saveSignupStep({ locale: params.locale, step: 3, patch, goNext: true });
  }

  // ✅ לא להשתמש ב ?? כי next-intl יכול להחזיר "שם מפתח"
  let saveDraftBackLabel = "Save Draft & Back";
  try {
    saveDraftBackLabel = t("buttons.saveDraftBack");
  } catch {}

  const labels = {
    title: t("title"),
    subtitle: t("subtitle"),
    draftSaved: t("draftSaved"),
    select: t("select"),
    selectCity: t("selectCity"),
    selectStreet: t("selectStreet"),

    sections: {
      lifeCenter: t("sections.lifeCenter"),
      address: t("sections.address"),
      housing: t("sections.housing"),
      employment: t("sections.employment"),
      assets: t("sections.assets"),
    },

    fields: {
      maritalStatus: t("fields.maritalStatus"),
      weddingDate: t("fields.weddingDate"),
      city: t("fields.city"),
      street: t("fields.street"),
      houseNumber: t("fields.houseNumber"),
      entry: t("fields.entry"),
      apartment: t("fields.apartment"),
      zip: t("fields.zip"),
      housingType: t("fields.housingType"),
      employmentStatus: t("fields.employmentStatus"),
      notWorkingReason: t("fields.notWorkingReason"),
      assets: t("fields.assets"),
    },

    date: {
      year: t("date.year"),
      month: t("date.month"),
      day: t("date.day"),
    },

    marital: {
      single: t("marital.single"),
      married: t("marital.married"),
      divorced: t("marital.divorced"),
      widowed: t("marital.widowed"),
    },

    housing: {
      rented: t("housing.rented"),
      other: t("housing.other"),
    },

    employment: {
      selfEmployed: t("employment.selfEmployed"),
      employee: t("employment.employee"),
      notWorking: t("employment.notWorking"),
    },

    assetsOptions: {
      apartment: t("assets.apartment"),
      business: t("assets.business"),
      other: t("assets.other"),
    },

    buttons: {
      saveDraft: t("buttons.saveDraft"),
      saveContinue: t("buttons.saveContinue"),
      saveDraftBack: saveDraftBackLabel,
    },
  };

  type DateParts = { y: string; m: string; d: string };
  type HousingType = "rented" | "other";

  const defaults: {
    maritalStatus: string;
    weddingDate: DateParts;
    regCity: string;
    regStreet: string;
    regHouseNumber: string;
    regEntry: string;
    regApartment: string;
    regZip: string;
    housingType: HousingType;
    employmentStatus: string;
    notWorkingReason: string;
    assets: string[];
    occupationText: string;
  } = {
    maritalStatus: String(step3.maritalStatus || ""),
    weddingDate: wedding,
    regCity: String(reg.city || ""),
    regStreet: String(reg.street || ""),
    regHouseNumber: String(reg.houseNumber || ""),
    regEntry: String(reg.entry || ""),
    regApartment: String(reg.apartment || ""),
    regZip: String(reg.zip || ""),
    housingType: (step3.mailingDifferent ? "other" : "rented") as HousingType,
    employmentStatus: String(step3.employmentStatus || ""),
    notWorkingReason: String(step3.notWorkingReason || ""),
    assets: Array.isArray(occupationDefaults.assets) ? occupationDefaults.assets : [],
    occupationText: String(occupationDefaults.occupationText || ""),
  };

  return (
    <main style={{ padding: 24 }} dir={dir}>
      {searchParams?.saved === "1" && <p>{labels.draftSaved}</p>}
      <Step3FormClient
        labels={labels}
        defaults={defaults}
        saveDraftAction={saveDraft}
        saveDraftAndBackAction={saveDraftAndBack}
        saveAndNextAction={saveAndNext}
      />
    </main>
  );
}
