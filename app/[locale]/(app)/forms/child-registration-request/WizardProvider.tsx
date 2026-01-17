"use client";

import React, { createContext, useContext, useMemo, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import demo from "@/public/demo/intake.empty.json";
import { createClient } from "@/lib/supabase/client"; // <-- your browser supabase client

export type IntakeRecord = typeof demo;

export type ExtrasState = {
  formDate: string;
  poBox: string;
  applicantSignatureDataUrl: string;
};

const initialExtras: ExtrasState = {
  formDate: new Date().toISOString().slice(0, 10),
  poBox: "",
  applicantSignatureDataUrl: "",
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
};

const WizardCtx = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  const [draft, setDraft] = useState<IntakeRecord | null>(null);
  const [extras, setExtras] = useState<ExtrasState>(initialExtras);
  const [isHydrated, setIsHydrated] = useState(false);

  // useEffect(() => {
  //   let cancelled = false;

  //   async function hydrate() {
  //     setIsHydrated(false);

  //     // 1) If no instanceId -> start new from demo
  //     if (!instanceId) {
  //       if (cancelled) return;
  //       setDraft(structuredClone(demo) as any);
  //       setExtras(initialExtras);
  //       setIsHydrated(true);
  //       return;
  //     }

  //     // 2) Load from DB
  //     const supabase = createClient();

  //     const { data: row, error } = await supabase
  //       .from("form_instances")
  //       .select("draft, extras")
  //       .eq("id", instanceId)
  //       .single();

  //     if (cancelled) return;

  //     if (error || !row?.draft) {
  //       // fallback (or you can show an error UI)
  //       console.error("Failed to load instance", error);
  //       setDraft(structuredClone(demo) as any);
  //       setExtras(initialExtras);
  //       setIsHydrated(true);
  //       return;
  //     }

  //     setDraft(row.draft as IntakeRecord);

  //     // merge extras with defaults (so missing keys won't crash)
  //     setExtras({
  //       ...initialExtras,
  //       ...(row.extras ?? {}),
  //     });

  //     setIsHydrated(true);
  //   }

  //   hydrate();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [instanceId]);

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
          typeof profile.data === "string" ? JSON.parse(profile.data) : profile.data;
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

  const ctx = useMemo(
    () => ({
      draft,
      setDraft,
      extras,
      setExtras,
      update,
      instanceId,
      isHydrated,
    }),
    [draft, extras, instanceId, isHydrated]
  );

  return <WizardCtx.Provider value={ctx}>{children}</WizardCtx.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardCtx);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}

