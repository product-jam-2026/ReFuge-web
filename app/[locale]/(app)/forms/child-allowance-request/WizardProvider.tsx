// app/[locale]/(app)/forms/child-allowance-request/WizardProvider.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import emptyIntakeTemplate from "@/public/demo/intake.empty.json";
import { createClient } from "@/lib/supabase/client";

export type IntakeRecord = typeof emptyIntakeTemplate;

export type ExtrasState = {
  formDate: string;
  formTitle: string;
  poBox: string;
  applicantSignatureDataUrl: string;

  // ✅ NEW: not in step5, but needed by your UI
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
};

const WizardCtx = createContext<Ctx | null>(null);

// ---------------- helpers (same logic as your page.tsx) ----------------

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

function deriveExtrasFromIntake(d: IntakeRecord): ExtrasState {
  const fatherEmail = splitEmail(d.intake.step5.email);
  const reqEmail = splitEmail(d.intake.step1.email);




  const owners = {
    owner1: fullName(d.intake.step1.firstName, d.intake.step1.lastName),
    owner2: fullName(
      d.intake.step5.person.firstName,
      d.intake.step5.person.lastName,
    ),
  };

  const kids = d.intake.step6.children ?? [];
  const kidsExtras = kids.map((k) => ({
    firstEntryDate: k.entryDate ?? "",
    fileJoinDate: "",
  }));

  // PDF supports up to 3 kids; keep at least 3 rows for convenience
  while (kidsExtras.length < 3) kidsExtras.push(emptyChildExtras());

  return {
    // ✅ NEW defaults
    formDate: "",
    formTitle: "",
    poBox: "",
    applicantSignatureDataUrl: "",

    // ✅ NEW
    requesterEntryDate: "",

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

function mergeExtras(defaults: ExtrasState, stored: any): ExtrasState {
  const out: ExtrasState = structuredClone(defaults);

  if (stored && typeof stored === "object") {
    // ✅ NEW: merge top-level fields
    if ("formDate" in stored) out.formDate = stored.formDate ?? out.formDate;
    if ("formTitle" in stored)
      out.formTitle = stored.formTitle ?? out.formTitle;
    if ("poBox" in stored) out.poBox = stored.poBox ?? out.poBox;

    if ("requesterEntryDate" in stored)
      out.requesterEntryDate =
        stored.requesterEntryDate ?? out.requesterEntryDate;

    // NOTE: signature is intentionally not saved, but if it ever exists, keep it
    if ("applicantSignatureDataUrl" in stored)
      out.applicantSignatureDataUrl =
        stored.applicantSignatureDataUrl ?? out.applicantSignatureDataUrl;

    // shallow merge the 3 nested objects
    out.father = { ...out.father, ...(stored.father ?? {}) };
    out.allowanceRequester = {
      ...out.allowanceRequester,
      ...(stored.allowanceRequester ?? {}),
    };
    out.bankAccount = { ...out.bankAccount, ...(stored.bankAccount ?? {}) };

    // children: overlay per index
    if (Array.isArray(stored.children)) {
      const maxLen = Math.max(out.children.length, stored.children.length);
      while (out.children.length < maxLen)
        out.children.push(emptyChildExtras());

      for (let i = 0; i < stored.children.length; i++) {
        const s = stored.children[i];
        if (s && typeof s === "object") {
          out.children[i] = { ...out.children[i], ...(s as any) };
        }
      }
    }
  }

  // keep at least 3 rows no matter what
  while (out.children.length < 3) out.children.push(emptyChildExtras());
  return out;
}

// simple deep setter (safe for missing objects)
function setDeep(obj: any, path: string, value: any) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

// ---------------- provider ----------------

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  const defaultDraft = useMemo(
    () => structuredClone(emptyIntakeTemplate) as IntakeRecord,
    [],
  );
  const defaultExtras = useMemo(
    () => deriveExtrasFromIntake(defaultDraft),
    [defaultDraft],
  );

  const [draft, setDraft] = useState<IntakeRecord | null>(null);
  const [extras, setExtras] = useState<ExtrasState>(defaultExtras);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setIsHydrated(false);

      const supabase = createClient();

      // Require logged-in user (same as your example)
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userErr || !userRes.user) {
        console.error("Not logged in / failed to get user", userErr);
        setDraft(null);
        setExtras(defaultExtras);
        setIsHydrated(true);
        return;
      }

      const user = userRes.user;

      // 1) New instance: hydrate from profiles.data
      if (!instanceId) {
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("data")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        if (profErr || !profile?.data) {
          console.error("Failed to load profile data", profErr);
          // fallback to empty template (or keep draft null if you prefer)
          setDraft(structuredClone(defaultDraft) as IntakeRecord);
          setExtras(deriveExtrasFromIntake(defaultDraft));
          setIsHydrated(true);
          return;
        }

        // profiles.data can be jsonb OR stringified json
        let intakeObj: any;
        try {
          intakeObj =
            typeof profile.data === "string"
              ? JSON.parse(profile.data)
              : profile.data;
        } catch (e) {
          console.error("profiles.data is not valid JSON", e);
          setDraft(structuredClone(defaultDraft) as IntakeRecord);
          setExtras(deriveExtrasFromIntake(defaultDraft));
          setIsHydrated(true);
          return;
        }

        const nextDraft = (intakeObj ??
          structuredClone(defaultDraft)) as IntakeRecord;

        // make sure required arrays exist
        if (!nextDraft.intake?.step6?.children) {
          // if shape is incomplete, patch lightly
          const patched = structuredClone(defaultDraft) as any;
          Object.assign(patched, nextDraft);
          setDraft(patched as IntakeRecord);
          setExtras(deriveExtrasFromIntake(patched as IntakeRecord));
        } else {
          setDraft(nextDraft);
          setExtras(deriveExtrasFromIntake(nextDraft));
        }

        setIsHydrated(true);
        return;
      }

      // 2) Existing instance: hydrate from form_instances
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
      const nextDefaults = deriveExtrasFromIntake(nextDraft);
      const nextExtras = mergeExtras(nextDefaults, row.extras);

      setDraft(nextDraft);
      setExtras(nextExtras);
      setIsHydrated(true);
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [instanceId, defaultDraft, defaultExtras]);

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

      // ensure array exists
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
      // keep at least 3
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
      instanceId,
      isHydrated,
    }),
    [draft, extras, instanceId, isHydrated],
  );

  return <WizardCtx.Provider value={ctx}>{children}</WizardCtx.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardCtx);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}
