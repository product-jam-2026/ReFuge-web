"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import emptyIntakeTemplate from "@/public/demo/intake.empty.json";
import { createClient } from "@/lib/supabase/client";

// export type IntakeRecord = typeof emptyIntakeTemplate;

export type IntakeRecord = {
  intake: {
    step1: {
      email: string;
      phone: string;
      gender: string;

      lastName: { ar: string; he: string };
      firstName: { ar: string; he: string };
      oldLastName: { ar: string; he: string };
      oldFirstName: { ar: string; he: string };

      birthDate: string;
      israeliId: string;
      nationality: string;

      passportNumber: string;
      passportIssueDate: string;
      passportExpiryDate: string;
      passportIssueCountry: string;
    };

    step2: {
      visaType: string;
      entryDate: string;
      visaEndDate: string;

      residenceCity: { ar: string; he: string };
      residenceAddress: { ar: string; he: string };
      residenceCountry: string;

      visaStartDate: string;
    };

    step3: {
      occupation: {
        assets: string[];
        workAddress: { ar: string; he: string };
        employerName: { ar: string; he: string };
        notWorkingSub: string;
        workStartDate: string;
        occupationText: string;
      };

      statusDate: string;
      housingType: string;
      maritalStatus: string;

      mailingAddress: {
        zip: string;
        city: string;
        entry: string;
        street: string;
        apartment: string;
        houseNumber: string;
      };

      employmentStatus: string;
      mailingDifferent: boolean;

      registeredAddress: {
        zip: string;
        city: string;
        entry: string;
        street: { ar: string; he: string };
        apartment: string;
        houseNumber: string;
      };
    };

    step4: {
      bank: {
        branch: string;
        bankName: string;
        accountNumber: string;
      };
      healthFund: string;
      nationalInsurance: {
        hasFile: string;
        fileNumber: string;
        allowanceType: string;
        getsAllowance: string;
        allowanceFileNumber: string;
      };
    };

    step5: {
      spouse: {
        email: string;
        phone: string;
        gender: string;

        lastName: { ar: string; he: string };
        firstName: { ar: string; he: string };
        oldLastName: { ar: string; he: string };
        oldFirstName: { ar: string; he: string };

        birthDate: string;
        israeliId: string;
        nationality: string;

        passportNumber: string;
        passportIssueDate: string;
        passportExpiryDate: string;
        passportIssueCountry: string;
      };
    };

    step6: {
      children: Array<{
        gender: string;
        lastName: string;
        birthDate: string;
        entryDate: string;
        firstName: string;
        israeliId: string;
        nationality: string;
        residenceCountry: string;
        arrivalToIsraelDate: string;
      }>;
    };

    step7: {
      documents: Record<string, unknown>;
    };

    currentStep: number;
  };
};


export type ExtrasState = {
  formDate: string;
  formTitle: string;
  poBox: string;
  applicantSignatureDataUrl: string;

  currentStep: number; // ✅ important for resume

  // UI-only but needed
  requesterEntryDate: string;

  father: {
    phoneHome: string;
    emailPrefix: string;
    emailPostfix: string;
  };

  allowanceRequester: {
    phoneHome: string;
    emailPrefix: string;
    emailPostfix: string;
  };

  bankAccount: {
    branchName: string;
    branchNumber: string;
    owner1: string;
    owner2: string;
  };

  children: Array<{
    firstEntryDate: string;
    fileJoinDate: string;
  }>;
};

type Ctx = {
  draft: IntakeRecord | null;
  setDraft: React.Dispatch<React.SetStateAction<IntakeRecord | null>>;

  extras: ExtrasState;
  setExtras: React.Dispatch<React.SetStateAction<ExtrasState>>;

  update: (path: string, value: any) => void;

  updateChild: (
    index: number,
    key: keyof IntakeRecord["intake"]["step6"]["children"][number],
    value: string,
  ) => void;

  addChildRow: () => void;

  instanceId: string | null;
  isHydrated: boolean;

  // ✅ save API (same pattern as child-registration)
  saveNow: () => Promise<string | null>;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError?: string;
};

const WizardCtx = createContext<Ctx | null>(null);

/* ---------------- helpers ---------------- */

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function splitEmail(email: string) {
  const e = (email ?? "").trim();
  const at = e.indexOf("@");
  if (at === -1) return { prefix: e, postfix: "" };
  return { prefix: e.slice(0, at), postfix: e.slice(at + 1) };
}

function fullName(first: string, last: string) {
  return `${(first ?? "").trim()} ${(last ?? "").trim()}`.trim();
}

function emptyChildExtras(): ExtrasState["children"][number] {
  return { firstEntryDate: "", fileJoinDate: "" };
}

function makeInitialExtras(): Pick<
  ExtrasState,
  | "formDate"
  | "formTitle"
  | "poBox"
  | "applicantSignatureDataUrl"
  | "requesterEntryDate"
  | "currentStep"
> {
  return {
    formDate: todayIsoDate(),
    formTitle: "",
    poBox: "",
    applicantSignatureDataUrl: "",
    requesterEntryDate: "",
    currentStep: 1,
  };
}

function deriveExtrasFromIntake(d: IntakeRecord): ExtrasState {
  const initial = makeInitialExtras();

  // These field choices match your original code.
  const fatherEmail = splitEmail(d.intake.step5.spouse.email);
  const reqEmail = splitEmail(d.intake.step1.email);

  const owners = {
    owner1: fullName(d.intake.step1.firstName.he, d.intake.step1.lastName.he),
    owner2: fullName(
      d.intake.step5.spouse.firstName.he,
      d.intake.step5.spouse.lastName.he,
    ),
  };

  const kids = d.intake.step6.children ?? [];
  const kidsExtras = kids.map((k) => ({
    firstEntryDate: (k as any)?.entryDate ?? "",
    fileJoinDate: "",
  }));

  // Keep at least 3 rows (PDF/UI convenience)
  while (kidsExtras.length < 3) kidsExtras.push(emptyChildExtras());

  return {
    ...initial,

    father: {
      phoneHome: "",
      emailPrefix: fatherEmail.prefix,
      emailPostfix: fatherEmail.postfix,
    },

    allowanceRequester: {
      phoneHome: "",
      emailPrefix: reqEmail.prefix,
      emailPostfix: reqEmail.postfix,
    },

    bankAccount: {
      branchName: "",
      branchNumber: d.intake.step4.bank.branch ?? "",
      owner1: owners.owner1,
      owner2: owners.owner2,
    },

    children: kidsExtras,
  };
}

/**
 * Merge stored extras into defaults safely (does NOT blow away nested objects / arrays).
 * Also guarantees at least 3 children rows.
 */
function mergeExtras(defaults: ExtrasState, stored: any): ExtrasState {
  const out: ExtrasState = structuredClone(defaults);

  if (stored && typeof stored === "object") {
    // top-level
    if ("formDate" in stored) out.formDate = stored.formDate ?? out.formDate;
    if ("formTitle" in stored) out.formTitle = stored.formTitle ?? out.formTitle;
    if ("poBox" in stored) out.poBox = stored.poBox ?? out.poBox;
    if ("requesterEntryDate" in stored)
      out.requesterEntryDate = stored.requesterEntryDate ?? out.requesterEntryDate;

    if ("currentStep" in stored) {
      const n = Number(stored.currentStep);
      out.currentStep = Number.isFinite(n) && n > 0 ? n : out.currentStep;
    }

    // signature: you usually DON'T store it, but if it exists, keep it
    if ("applicantSignatureDataUrl" in stored)
      out.applicantSignatureDataUrl =
        stored.applicantSignatureDataUrl ?? out.applicantSignatureDataUrl;

    // nested objects
    out.father = { ...out.father, ...(stored.father ?? {}) };
    out.allowanceRequester = {
      ...out.allowanceRequester,
      ...(stored.allowanceRequester ?? {}),
    };
    out.bankAccount = { ...out.bankAccount, ...(stored.bankAccount ?? {}) };

    // children: overlay per index
    if (Array.isArray(stored.children)) {
      const maxLen = Math.max(out.children.length, stored.children.length);
      while (out.children.length < maxLen) out.children.push(emptyChildExtras());

      for (let i = 0; i < stored.children.length; i++) {
        const s = stored.children[i];
        if (s && typeof s === "object") {
          out.children[i] = { ...out.children[i], ...(s as any) };
        }
      }
    }
  }

  while (out.children.length < 3) out.children.push(emptyChildExtras());
  return out;
}

// deep setter for `update("a.b.c", value)`
function setDeep(obj: any, path: string, value: any) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

/* ---------------- provider ---------------- */

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  const router = useRouter();

  const defaultDraft = useMemo(
    () => structuredClone(emptyIntakeTemplate) as IntakeRecord,
    [],
  );

  const [draft, setDraft] = useState<IntakeRecord | null>(null);
  const [extras, setExtras] = useState<ExtrasState>(
    deriveExtrasFromIntake(defaultDraft),
  );
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ liveInstanceId matches your working pattern
  const [liveInstanceId, setLiveInstanceId] = useState<string | null>(instanceId);
  useEffect(() => setLiveInstanceId(instanceId), [instanceId]);

  const [saveStatus, setSaveStatus] = useState<Ctx["saveStatus"]>("idle");
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  async function saveNow(): Promise<string | null> {
    if (!draft) return null;

    setSaveStatus("saving");
    setSaveError(undefined);

    try {
      const supabase = createClient();
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userRes.user;
      if (!user) throw new Error("Not logged in");

      const title =
        extras.formTitle?.trim() ||
        `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
        "Untitled";

      // ✅ do NOT persist signature image (huge + changes a lot)
      const { applicantSignatureDataUrl, ...extrasToSave } = extras;

      if (!liveInstanceId) {
        const { data, error } = await supabase
          .from("form_instances")
          .insert({
            user_id: user.id,
            form_slug: "child-allowance-request",
            title,
            draft,
            extras: extrasToSave,
          })
          .select("id")
          .single();

        if (error) throw error;

        setLiveInstanceId(data.id);
        setSaveStatus("saved");

        // keep URL in sync so refresh keeps editing same draft
        router.replace(`?instanceId=${data.id}`);
        return data.id;
      } else {
        const { error } = await supabase
          .from("form_instances")
          .update({ title, draft, extras: extrasToSave })
          .eq("id", liveInstanceId)
          .eq("user_id", user.id);

        if (error) throw error;

        setSaveStatus("saved");
        return liveInstanceId;
      }
    } catch (e: any) {
      setSaveStatus("error");
      setSaveError(e?.message ?? String(e));
      return null;
    }
  }

  // ✅ hydrate (same structure as your working provider)
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setIsHydrated(false);

      const supabase = createClient();
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userErr || !userRes.user) {
        console.error("Not logged in / failed to get user", userErr);
        setDraft(null);
        setExtras(deriveExtrasFromIntake(defaultDraft));
        setIsHydrated(true);
        return;
      }

      const user = userRes.user;

      // 1) new form: load profile.data
      if (!instanceId) {
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("data")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        let intakeObj: any = null;
        if (!profErr && profile?.data) {
          try {
            intakeObj =
              typeof profile.data === "string"
                ? JSON.parse(profile.data)
                : profile.data;
          } catch (e) {
            console.error("profiles.data is not valid JSON", e);
          }
        }

        const nextDraft = (intakeObj ??
          structuredClone(defaultDraft)) as IntakeRecord;

        setDraft(nextDraft);
        setExtras(deriveExtrasFromIntake(nextDraft));
        setIsHydrated(true);
        return;
      }

      // 2) existing form: load form_instances
      const { data: row, error } = await supabase
        .from("form_instances")
        .select("draft, extras")
        .eq("id", instanceId)
        .single();

      if (cancelled) return;

      if (error || !row?.draft) {
        console.error("Failed to load instance", error);
        setDraft(structuredClone(defaultDraft) as IntakeRecord);
        setExtras(deriveExtrasFromIntake(defaultDraft));
        setIsHydrated(true);
        return;
      }

      const nextDraft = row.draft as IntakeRecord;
      const defaults = deriveExtrasFromIntake(nextDraft);
      const nextExtras = mergeExtras(defaults, row.extras);

      setDraft(nextDraft);
      setExtras(nextExtras);
      setIsHydrated(true);
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [instanceId, defaultDraft]);

  function update(path: string, value: any) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = structuredClone(prev);
      setDeep(next, path, value);
      return next as IntakeRecord;
    });
  }

  function updateChild(
    index: number,
    key: keyof IntakeRecord["intake"]["step6"]["children"][number],
    value: string,
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);

      if (!next.intake.step6.children) next.intake.step6.children = [];
      if (!next.intake.step6.children[index]) return next;

      (next.intake.step6.children[index] as any)[key] = value;
      return next;
    });
  }

  function addChildRow() {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);

      if (!next.intake.step6.children) next.intake.step6.children = [];
      next.intake.step6.children.push({
        lastName: "",
        firstName: "",
        gender: "",
        birthDate: "",
        nationality: "",
        israeliId: "",
        residenceCountry: "",
        entryDate: "",
      } as any);

      return next;
    });

    setExtras((prev) => {
      const next = structuredClone(prev);
      next.children.push(emptyChildExtras());
      while (next.children.length < 3) next.children.push(emptyChildExtras());
      return next;
    });
  }

  const ctx = useMemo<Ctx>(
    () => ({
      draft,
      setDraft,
      extras,
      setExtras,
      update,
      updateChild,
      addChildRow,
      instanceId: liveInstanceId,
      isHydrated,
      saveNow,
      saveStatus,
      saveError,
    }),
    [draft, extras, liveInstanceId, isHydrated, saveStatus, saveError],
  );

  return <WizardCtx.Provider value={ctx}>{children}</WizardCtx.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardCtx);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}
