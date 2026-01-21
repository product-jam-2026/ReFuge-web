"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useEffect,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import demo from "@/public/demo/intake.empty.json";
import { createClient } from "@/lib/supabase/client"; // <-- your browser supabase client

export type IntakeRecord = typeof demo;

export type ExtrasState = {
  formDate: string;
  poBox: string;
  applicantSignatureDataUrl: string;
  formTitle: string; // ✅ new
  currentStep: number; // or string like "step4"
};

const initialExtras: ExtrasState = {
  formDate: new Date().toISOString().slice(0, 10),
  poBox: "",
  applicantSignatureDataUrl: "",
  formTitle: "", // ✅ new
  currentStep: 1, // ✅ start step
};

type Ctx = {
  draft: IntakeRecord | null;
  setDraft: React.Dispatch<React.SetStateAction<IntakeRecord | null>>;
  extras: ExtrasState;
  setExtras: React.Dispatch<React.SetStateAction<ExtrasState>>;
  update: (path: string, value: any) => void;

  // optional: helpful elsewhere
  instanceId: string | null;
  isHydrated: boolean;

  // ✅ add
  saveNow: () => Promise<string | null>;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError?: string;
};

const WizardCtx = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  const [draft, setDraft] = useState<IntakeRecord | null>(null);
  const [extras, setExtras] = useState<ExtrasState>(initialExtras);
  const [isHydrated, setIsHydrated] = useState(false);
  const [liveInstanceId, setLiveInstanceId] = useState<string | null>(
    instanceId,
  );
  useEffect(() => setLiveInstanceId(instanceId), [instanceId]);

  const router = useRouter();

  const [saveStatus, setSaveStatus] = useState<Ctx["saveStatus"]>("idle");
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  

  async function saveNow() {
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

      // decide what you actually want to persist
      const { applicantSignatureDataUrl, ...extrasToSave } = extras;

      if (!liveInstanceId) {
        const { data, error } = await supabase
          .from("form_instances")
          .insert({
            user_id: user.id,
            form_slug: "child-registration-request", // or paramize per form
            title,
            draft,
            extras: extrasToSave,
          })
          .select("id")
          .single();

        if (error) throw error;
        setLiveInstanceId(data.id);
        setSaveStatus("saved");
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


  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setIsHydrated(false);

      const supabase = createClient();

      // Always require a logged-in user to read profile + instances
      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (cancelled) return;

      if (userErr || !userRes.user) {
        console.error("Not logged in / failed to get user", userErr);
        setDraft(null);
        setExtras(initialExtras);
        setIsHydrated(true);
        return;
      }

      const user = userRes.user;

      // 1) If no instanceId -> start new from profiles.data
      if (!instanceId) {
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("data")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        if (profErr || !profile?.data) {
          console.error("Failed to load profile data", profErr);
          setDraft(null); // or fallback to demo if you want
          setExtras(initialExtras);
          setIsHydrated(true);
          return;
        }

        // profile.data can be jsonb OR stringified json.
        let intakeObj: any;
        try {
          intakeObj =
            typeof profile.data === "string"
              ? JSON.parse(profile.data)
              : profile.data;
        } catch (e) {
          console.error("profiles.data is not valid JSON", e);
          setDraft(null);
          setExtras(initialExtras);
          setIsHydrated(true);
          return;
        }

        // Ensure it matches your IntakeRecord shape
        setDraft(intakeObj as IntakeRecord);
        setExtras(initialExtras);
        setIsHydrated(true);
        return;
      }

      // 2) If instanceId -> load from form_instances (continue editing)
      const { data: row, error } = await supabase
        .from("form_instances")
        .select("draft, extras")
        .eq("id", instanceId)
        .single();

      if (cancelled) return;

      if (error || !row?.draft) {
        console.error("Failed to load instance", error);
        setDraft(null); // or fallback to profile.data here if you prefer
        setExtras(initialExtras);
        setIsHydrated(true);
        return;
      }

      setDraft(row.draft as IntakeRecord);
      setExtras({
        ...initialExtras,
        ...(row.extras ?? {}),
      });
      setIsHydrated(true);
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [instanceId]);

  function update(path: string, value: any) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = structuredClone(prev);
      const parts = path.split(".");
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }

  // const ctx = useMemo(
  //   () => ({
  //     draft,
  //     setDraft,
  //     extras,
  //     setExtras,
  //     update,
  //     instanceId,
  //     isHydrated,
  //   }),
  //   [draft, extras, instanceId, isHydrated],
  // );

  const ctx = useMemo(
    () => ({
      draft,
      setDraft,
      extras,
      setExtras,
      update,
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
