import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSignupStep } from "../actions";
import Step1FormClient from "./Step1FormClient";

function normalizeText(v: FormDataEntryValue | null, max = 80) {
  return String(v || "").trim().slice(0, max);
}
function normalizeEmail(v: FormDataEntryValue | null) {
  return String(v || "").trim().toLowerCase();
}
function normalizePhone(v: FormDataEntryValue | null) {
  return String(v || "").trim().replace(/[^\d+]/g, "");
}
function normalizeDigits(v: FormDataEntryValue | null) {
  return String(v || "").trim().replace(/[^\d]/g, "");
}
function normalizeGenderValue(existing?: string) {
  const s = String(existing || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "male" || s === "m" || s.includes("זכר") || s.includes("ذكر"))
    return "male";
  if (s === "female" || s === "f" || s.includes("נקב") || s.includes("أنث"))
    return "female";
  return "";
}

// ✅ Supports BOTH:
// 1) direct <input type="date" name="birthDate">  => YYYY-MM-DD
// 2) legacy rolling selects: birthDate_y / birthDate_m / birthDate_d
function buildISODateFromForm(formData: FormData, prefix: string) {
  const direct = String(formData.get(prefix) || "").trim();
  if (direct) {
    const match = direct.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return "";
    const dt = new Date(`${direct}T00:00:00Z`);
    if (Number.isNaN(dt.getTime())) return "";
    const [yy, mm, dd] = direct.split("-").map((x) => Number(x));
    if (
      dt.getUTCFullYear() !== yy ||
      dt.getUTCMonth() + 1 !== mm ||
      dt.getUTCDate() !== dd
    ) {
      return "";
    }
    return direct;
  }

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
  function isoToParts(iso: string) {
  if (!iso) return { y: "", m: "", d: "" };
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { y: "", m: "", d: "" };
  return { y: m[1], m: m[2], d: m[3] };
}

  const birth = isoToParts(step1.birthDate || "");
  const passIssue = isoToParts(step1.passportIssueDate || "");
  const passExp = isoToParts(step1.passportExpiryDate || "");

  const genderDefault = normalizeGenderValue(step1.gender);

  async function saveDraftAction(formData: FormData) {
    "use server";
    const patch = {
      lastName: normalizeText(formData.get("lastName"), 60),
      firstName: normalizeText(formData.get("firstName"), 60),
      oldLastName: normalizeText(formData.get("oldLastName"), 60),
      oldFirstName: normalizeText(formData.get("oldFirstName"), 60),
      gender: normalizeText(formData.get("gender"), 20),

      // ✅ direct date fields
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

    await saveSignupStep({ locale: params.locale, step: 1, patch, goNext: false });
  }

  async function saveAndNextAction(formData: FormData) {
    "use server";
    const patch = {
      lastName: normalizeText(formData.get("lastName"), 60),
      firstName: normalizeText(formData.get("firstName"), 60),
      oldLastName: normalizeText(formData.get("oldLastName"), 60),
      oldFirstName: normalizeText(formData.get("oldFirstName"), 60),
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

    await saveSignupStep({ locale: params.locale, step: 1, patch, goNext: true });
  }

  return (
  <div className="appShell" dir="rtl">
    <div className="appFrame">
      <Step1FormClient
        locale={params.locale}
        saved={searchParams?.saved === "1"}
        defaults={{
        lastName: step1.lastName || "",
        firstName: step1.firstName || "",
        oldLastName: step1.oldLastName || "",
        oldFirstName: step1.oldFirstName || "",
        gender: genderDefault || "",

        // ✅ matches Props in Step1FormClient.tsx
        birth,
        passIssue,
        passExp,

        nationality: step1.nationality || "",
        israeliId: step1.israeliId || "",
        passportNumber: step1.passportNumber || "",
        passportIssueCountry: step1.passportIssueCountry || "",
        phone: step1.phone || "",
        email: step1.email || data.user.email || "",
      }}

        saveDraftAction={saveDraftAction}
        saveAndNextAction={saveAndNextAction}
      />
    </div>
  </div>
);

}
