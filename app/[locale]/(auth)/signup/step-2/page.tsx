import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSignupStep } from "../actions";
import { getTranslations } from "next-intl/server";
import Step2FormClient from "./Step2FormClient";

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

function normalizeText(v: FormDataEntryValue | null, max = 80) {
  return String(v || "").trim().slice(0, max);
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

export default async function Step2Page({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { saved?: string };
}) {
  const locale = params.locale as Locale;
  const dir = isRTL(locale) ? "rtl" : "ltr";
  const t = await getTranslations({ locale, namespace: "SignupStep2" });

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
      // NOTE: לא משנים שמות שדות קיימים:
      // residenceCountry = Birth country
      // residenceCity    = Birth city
      // residenceAddress = Purpose of stay
      residenceCountry: normalizeText(formData.get("residenceCountry"), 60),
      residenceCity: normalizeText(formData.get("residenceCity"), 60),
      residenceAddress: normalizeText(formData.get("residenceAddress"), 120),

      visaType: normalizeText(formData.get("visaType"), 60),
      visaStartDate: buildISODateFromForm(formData, "visaStartDate"),
      visaEndDate: buildISODateFromForm(formData, "visaEndDate"),
      entryDate: buildISODateFromForm(formData, "entryDate"),
    };

    await saveSignupStep({ locale: params.locale, step: 2, patch, goNext: false });
  }

  async function saveAndNext(formData: FormData) {
    "use server";
    const patch = {
      residenceCountry: normalizeText(formData.get("residenceCountry"), 60),
      residenceCity: normalizeText(formData.get("residenceCity"), 60),
      residenceAddress: normalizeText(formData.get("residenceAddress"), 120),

      visaType: normalizeText(formData.get("visaType"), 60),
      visaStartDate: buildISODateFromForm(formData, "visaStartDate"),
      visaEndDate: buildISODateFromForm(formData, "visaEndDate"),
      entryDate: buildISODateFromForm(formData, "entryDate"),
    };

    await saveSignupStep({ locale: params.locale, step: 2, patch, goNext: true });
  }

  const defaults = {
    residenceCountry: step2.residenceCountry || "",
    residenceCity: step2.residenceCity || "",
    residenceAddress: step2.residenceAddress || "",
    visaType: step2.visaType || "",
    visaStartDate: parseISODateParts(step2.visaStartDate),
    visaEndDate: parseISODateParts(step2.visaEndDate),
    entryDate: parseISODateParts(step2.entryDate),
  };

  const labels = {
    title: t("title"),
    subtitle: t("subtitle"),
    draftSaved: t("draftSaved"),
    select: t("select"),
    selectCountry: t("selectCountry"),
    selectCity: t("selectCity"),
    selectPurpose: t("selectPurpose"),
    selectVisaType: t("selectVisaType"),
    sections: {
      immigration: t("sections.immigration"),
      visa: t("sections.visa"),
    },
    fields: {
      birthCountry: t("fields.birthCountry"),
      birthCity: t("fields.birthCity"),
      purposeOfStay: t("fields.purposeOfStay"),
      visaType: t("fields.visaType"),
      visaValidity: t("fields.visaValidity"),
      entryDate: t("fields.entryDate"),
    },
    date: {
      year: t("date.year"),
      month: t("date.month"),
      day: t("date.day"),
      from: t("date.from"),
      to: t("date.to"),
    },
    buttons: {
      saveDraft: t("buttons.saveDraft"),
      saveContinue: t("buttons.saveContinue"),
    },
    errors: {
      visaRange: t("errors.visaRange"),
    },
    // options
    purpose: {
      work: t("purpose.work"),
      study: t("purpose.study"),
      asylum: t("purpose.asylum"),
    },
    visa: {
      tourist: t("visa.tourist"),
      b1: t("visa.b1"),
      a5: t("visa.a5"),
      unknown: t("visa.unknown"),
    },
    countries: {
      israel: t("country.israel"),
      eritrea: t("country.eritrea"),
      sudan: t("country.sudan"),
      ukraine: t("country.ukraine"),
      russia: t("country.russia"),
    },
    cities: {
      // Sudan
      khartoum: t("city.khKhartoum"),
      omdurman: t("city.khOmdurman"),
      portSudan: t("city.sdPortSudan"),
      // Eritrea
      asmara: t("city.erAsmara"),
      keren: t("city.erKeren"),
      massawa: t("city.erMassawa"),
      // Israel
      telAviv: t("city.ilTelAviv"),
      jerusalem: t("city.ilJerusalem"),
      haifa: t("city.ilHaifa"),
    },
  };

  return (
    <main style={{ padding: 24 }} dir={dir}>
      {searchParams?.saved === "1" && <p>{labels.draftSaved}</p>}

      <Step2FormClient
        labels={labels}
        defaults={defaults}
        saveDraftAction={saveDraft}
        saveAndNextAction={saveAndNext}
      />
    </main>
  );
}
