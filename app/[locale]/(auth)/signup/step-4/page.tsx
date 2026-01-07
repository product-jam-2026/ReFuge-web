import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { saveDraftAndGoToStep, saveSignupStep } from "../actions";
import { getTranslations } from "next-intl/server";
import Step4FormClient from "./Step4FormClient";

type Locale = string;

function isRTL(locale: Locale) {
  return locale === "he" || locale === "ar";
}

function normalizeText(v: FormDataEntryValue | null, max = 80) {
  return String(v || "").trim().slice(0, max);
}

function normalizeDigits(v: FormDataEntryValue | null, max = 20) {
  return String(v || "")
    .trim()
    .replace(/[^\d]/g, "")
    .slice(0, max);
}

/**
 * ✅ חשוב: מוגדר ברמת הקובץ (מחוץ ל-Component) כדי למנוע "not defined"
 * בסרבר-אקשנס.
 */
function buildPatch(formData: FormData) {
  return {
    healthFund: normalizeText(formData.get("healthFund"), 60),
    bank: {
      bankName: normalizeText(formData.get("bankName"), 60),
      branch: normalizeText(formData.get("branch"), 60),
      // "accountNumber" אצלך הוא גם מספר חשבון, נשמור digits only
      accountNumber: normalizeDigits(formData.get("accountNumber"), 20),
    },
    nationalInsurance: {
      hasFile: normalizeText(formData.get("hasFile"), 10),
      fileNumber: normalizeDigits(formData.get("fileNumber"), 20),
      getsAllowance: normalizeText(formData.get("getsAllowance"), 10),
      allowanceType: normalizeText(formData.get("allowanceType"), 60),
      allowanceFileNumber: normalizeDigits(
        formData.get("allowanceFileNumber"),
        20
      ),
    },
  };
}

export default async function Step4Page({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { saved?: string };
}) {
  const locale = params.locale as Locale;
  const dir = isRTL(locale) ? "rtl" : "ltr";
  const t = await getTranslations({ locale, namespace: "SignupStep4" });

  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${params.locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("registration_completed, data")
    .eq("id", data.user.id)
    .single();

  if (profile?.registration_completed) redirect(`/${params.locale}/home`);

  const step4 = profile?.data?.intake?.step4 || {};
  const bank = step4.bank || {};
  const ni = step4.nationalInsurance || {};

  async function saveDraft(formData: FormData) {
    "use server";
    const patch = buildPatch(formData);
    await saveSignupStep({
      locale: params.locale,
      step: 4,
      patch,
      goNext: false,
    });
  }

  async function saveDraftAndBack(formData: FormData) {
    "use server";
    const patch = buildPatch(formData);
    await saveDraftAndGoToStep({
      locale: params.locale,
      step: 4,
      patch,
      goToStep: 3,
    });
  }

  async function saveAndNext(formData: FormData) {
    "use server";
    const patch = buildPatch(formData);
    await saveSignupStep({
      locale: params.locale,
      step: 4,
      patch,
      goNext: true,
    });
  }

  const labels = {
    title: t("title"),
    subtitle: t("subtitle"),
    draftSaved: t("draftSaved"),
    select: t("select"),
    sections: {
      health: t("sections.health"),
      bank: t("sections.bank"),
      ni: t("sections.ni"),
    },
    fields: {
      healthFund: t("fields.healthFund"),
      bankName: t("fields.bankName"),
      branch: t("fields.branch"),
      branchNumber: t("fields.branchNumber"),
      accountNumber: t("fields.accountNumber"),
      hasFile: t("fields.hasFile"),
      fileNumber: t("fields.fileNumber"),
      getsAllowance: t("fields.getsAllowance"),
      allowanceType: t("fields.allowanceType"),
      allowanceFileNumber: t("fields.allowanceFileNumber"),
    },
    niOptions: {
      yes: t("niOptions.yes"),
      no: t("niOptions.no"),
    },
    allowanceOptions: {
      yes: t("allowanceOptions.yes"),
      no: t("allowanceOptions.no"),
    },
    buttons: {
      saveDraft: t("buttons.saveDraft"),
      saveContinue: t("buttons.saveContinue"),
      saveDraftBack: t("buttons.saveDraftBack"),
    },
  };

  const defaults: {
    healthFund: string;
    bankName: string;
    branch: string;
    branchNumber: string; // מסך בלבד
    accountNumber: string;
    hasFile: "yes" | "no" | "";
    fileNumber: string;
    getsAllowance: "yes" | "no" | "";
    allowanceType: string;
    allowanceFileNumber: string;
  } = {
    healthFund: String(step4.healthFund || ""),
    bankName: String(bank.bankName || ""),
    branch: String(bank.branch || ""),
    branchNumber: "",
    accountNumber: String(bank.accountNumber || ""),
    hasFile: (ni.hasFile === "yes" || ni.hasFile === "no"
      ? ni.hasFile
      : "") as "yes" | "no" | "",
    fileNumber: String(ni.fileNumber || ""),
    getsAllowance: (ni.getsAllowance === "yes" || ni.getsAllowance === "no"
      ? ni.getsAllowance
      : "") as "yes" | "no" | "",
    allowanceType: String(ni.allowanceType || ""),
    allowanceFileNumber: String(ni.allowanceFileNumber || ""),
  };

  return (
    <main style={{ padding: 24 }} dir={dir}>
      {searchParams?.saved === "1" && <p>{labels.draftSaved}</p>}
      <Step4FormClient
        labels={labels}
        defaults={defaults}
        saveDraftAction={saveDraft}
        saveDraftAndBackAction={saveDraftAndBack}
        saveAndNextAction={saveAndNext}
      />
    </main>
  );
}
