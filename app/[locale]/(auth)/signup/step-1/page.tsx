import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveSignupStep } from "../actions";
import { getTranslations } from "next-intl/server";

type Locale = string;

function isRTL(locale: Locale) {
  return locale === "he" || locale === "ar";
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function parseISODateParts(iso?: string) {
  // expects YYYY-MM-DD
  if (!iso || typeof iso !== "string") return { y: "", m: "", d: "" };
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { y: "", m: "", d: "" };
  return { y: match[1], m: match[2], d: match[3] };
}

function normalizeText(v: FormDataEntryValue | null, max = 80) {
  return String(v || "").trim().slice(0, max);
}

function normalizeEmail(v: FormDataEntryValue | null) {
  return String(v || "").trim().toLowerCase();
}

function normalizePhone(v: FormDataEntryValue | null) {
  // keep digits and +
  return String(v || "").trim().replace(/[^\d+]/g, "");
}

function normalizeDigits(v: FormDataEntryValue | null) {
  return String(v || "").trim().replace(/[^\d]/g, "");
}

function normalizeGenderValue(existing?: string) {
  const s = String(existing || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "male" || s === "m" || s.includes("זכר") || s.includes("ذكر")) return "male";
  if (s === "female" || s === "f" || s.includes("נקב") || s.includes("أنث")) return "female";
  return "";
}

function buildISODateFromForm(formData: FormData, prefix: string) {
  // expects fields: `${prefix}_y`, `${prefix}_m`, `${prefix}_d`
  const y = String(formData.get(`${prefix}_y`) || "").trim();
  const m = String(formData.get(`${prefix}_m`) || "").trim();
  const d = String(formData.get(`${prefix}_d`) || "").trim();

  // אם הכל ריק -> ריק (טיוטה)
  if (!y && !m && !d) return "";

  // אם חלקי -> נחשיב כלא-תקין (נשמור ריק כדי לא לייצר תאריך שבור)
  if (!y || !m || !d) return "";

  const iso = `${y}-${m}-${d}`;

  // validate real date (למנוע 2025-02-31 וכו')
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
  const locale = params.locale as Locale;
  const dir = isRTL(locale) ? "rtl" : "ltr";
  const t = await getTranslations({ locale, namespace: "SignupStep1" });

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

  // Defaults for rolling date selects
  const birth = parseISODateParts(step1.birthDate);
  const passIssue = parseISODateParts(step1.passportIssueDate);
  const passExp = parseISODateParts(step1.passportExpiryDate);
  const genderDefault = normalizeGenderValue(step1.gender);

  // Select options
  const nowYear = new Date().getFullYear();
  const birthYears = Array.from({ length: 100 }, (_, i) => String(nowYear - i)); // last 100 years
  const issueYears = Array.from({ length: 30 }, (_, i) => String(nowYear - i)); // last 30 years
  const expiryYears = Array.from({ length: 40 }, (_, i) => String(nowYear - 10 + i)); // from past to future
  const months = Array.from({ length: 12 }, (_, i) => pad2(i + 1));
  const days = Array.from({ length: 31 }, (_, i) => pad2(i + 1));

  // Nationalities (3 for now, easy to expand)
  const nationalityOptions = [
    { value: "", label: t("select") },
    { value: "Israeli", label: t("nationality.israeli") },
    { value: "Eritrean", label: t("nationality.eritrean") },
    { value: "Sudanese", label: t("nationality.sudanese") },
  ];

  // Passport issue countries (starter list)
  const passportCountries = [
    { value: "", label: t("selectCountry") },
    { value: "Israel", label: t("country.israel") },
    { value: "Eritrea", label: t("country.eritrea") },
    { value: "Sudan", label: t("country.sudan") },
    { value: "Ukraine", label: t("country.ukraine") },
    { value: "Russia", label: t("country.russia") },
  ];

  async function saveDraft(formData: FormData) {
    "use server";
    const patch = {
      lastName: normalizeText(formData.get("lastName"), 60),
      firstName: normalizeText(formData.get("firstName"), 60),
      oldLastName: normalizeText(formData.get("oldLastName"), 60),
      oldFirstName: normalizeText(formData.get("oldFirstName"), 60),
      gender: normalizeText(formData.get("gender"), 20), // male/female/""
      birthDate: buildISODateFromForm(formData, "birthDate"),
      nationality: normalizeText(formData.get("nationality"), 40),
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

  async function saveAndNext(formData: FormData) {
    "use server";
    const patch = {
      lastName: normalizeText(formData.get("lastName"), 60),
      firstName: normalizeText(formData.get("firstName"), 60),
      oldLastName: normalizeText(formData.get("oldLastName"), 60),
      oldFirstName: normalizeText(formData.get("oldFirstName"), 60),
      gender: normalizeText(formData.get("gender"), 20),
      birthDate: buildISODateFromForm(formData, "birthDate"),
      nationality: normalizeText(formData.get("nationality"), 40),
      israeliId: normalizeDigits(formData.get("israeliId")),
      passportNumber: normalizeText(formData.get("passportNumber"), 40),
      passportIssueDate: buildISODateFromForm(formData, "passportIssueDate"),
      passportExpiryDate: buildISODateFromForm(formData, "passportExpiryDate"),
      passportIssueCountry: normalizeText(formData.get("passportIssueCountry"), 60),
      phone: normalizePhone(formData.get("phone")),
      email: normalizeEmail(formData.get("email")),
    };

    // כרגע לא "חוסמים" המשך כדי לא לשבור את הזרימה.
    // אם תרצי: נוסיף ולידציה קשיחה ושגיאות.
    await saveSignupStep({ locale: params.locale, step: 1, patch, goNext: true });
  }

  return (
    <main style={{ padding: 24 }} dir={dir}>
      <h1 style={{ marginBottom: 4 }}>{t("title")}</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{t("subtitle")}</p>

      {searchParams?.saved === "1" && <p>{t("draftSaved")}</p>}

      <form action={saveAndNext} style={{ display: "grid", gap: 12, maxWidth: 460 }}>
        <label>
          {t("fields.lastName")}
          <input
            name="lastName"
            autoComplete="family-name"
            defaultValue={step1.lastName || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <label>
          {t("fields.firstName")}
          <input
            name="firstName"
            autoComplete="given-name"
            defaultValue={step1.firstName || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <label>
          {t("fields.oldLastName")}
          <input
            name="oldLastName"
            defaultValue={step1.oldLastName || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <label>
          {t("fields.oldFirstName")}
          <input
            name="oldFirstName"
            defaultValue={step1.oldFirstName || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <label>
          {t("fields.gender")}
          <select
            name="gender"
            defaultValue={genderDefault || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            <option value="">{t("select")}</option>
            <option value="male">{t("gender.male")}</option>
            <option value="female">{t("gender.female")}</option>
          </select>
        </label>

        {/* Birth date rolling selects */}
        <fieldset style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <legend style={{ padding: "0 6px" }}>{t("fields.birthDate")}</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {t("date.year")}
              <select name="birthDate_y" defaultValue={birth.y} style={{ width: "100%", marginTop: 6 }}>
                <option value="">{t("select")}</option>
                {birthYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {t("date.month")}
              <select name="birthDate_m" defaultValue={birth.m} style={{ width: "100%", marginTop: 6 }}>
                <option value="">{t("select")}</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {t("date.day")}
              <select name="birthDate_d" defaultValue={birth.d} style={{ width: "100%", marginTop: 6 }}>
                <option value="">{t("select")}</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <label>
          {t("fields.nationality")}
          <select
            name="nationality"
            defaultValue={step1.nationality || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            {nationalityOptions.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("fields.israeliId")}
          <input
            name="israeliId"
            inputMode="numeric"
            pattern="\d*"
            defaultValue={step1.israeliId || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <h3 style={{ marginTop: 10 }}>{t("sections.passport")}</h3>

        <label>
          {t("fields.passportNumber")}
          <input
            name="passportNumber"
            defaultValue={step1.passportNumber || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        {/* Passport issue date */}
        <fieldset style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <legend style={{ padding: "0 6px" }}>{t("fields.passportIssueDate")}</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {t("date.year")}
              <select
                name="passportIssueDate_y"
                defaultValue={passIssue.y}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{t("select")}</option>
                {issueYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {t("date.month")}
              <select
                name="passportIssueDate_m"
                defaultValue={passIssue.m}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{t("select")}</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {t("date.day")}
              <select
                name="passportIssueDate_d"
                defaultValue={passIssue.d}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{t("select")}</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        {/* Passport expiry date */}
        <fieldset style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
          <legend style={{ padding: "0 6px" }}>{t("fields.passportExpiryDate")}</legend>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {t("date.year")}
              <select
                name="passportExpiryDate_y"
                defaultValue={passExp.y}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{t("select")}</option>
                {expiryYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {t("date.month")}
              <select
                name="passportExpiryDate_m"
                defaultValue={passExp.m}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{t("select")}</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: 12, opacity: 0.85 }}>
              {t("date.day")}
              <select
                name="passportExpiryDate_d"
                defaultValue={passExp.d}
                style={{ width: "100%", marginTop: 6 }}
              >
                <option value="">{t("select")}</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <label>
          {t("fields.passportIssueCountry")}
          <select
            name="passportIssueCountry"
            defaultValue={step1.passportIssueCountry || ""}
            style={{ width: "100%", marginTop: 6 }}
          >
            {passportCountries.map((c) => (
              <option key={c.value || "empty"} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <h3 style={{ marginTop: 10 }}>{t("sections.contact")}</h3>

        <label>
          {t("fields.phone")}
          <input
            type="tel"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={step1.phone || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <label>
          {t("fields.email")}
          <input
            type="email"
            name="email"
            autoComplete="email"
            defaultValue={step1.email || data.user.email || ""}
            style={{ width: "100%", marginTop: 6 }}
          />
        </label>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          <button formAction={saveDraft} type="submit">
            {t("buttons.saveDraft")}
          </button>
          <button type="submit">{t("buttons.saveContinue")}</button>
        </div>
      </form>
    </main>
  );
}
