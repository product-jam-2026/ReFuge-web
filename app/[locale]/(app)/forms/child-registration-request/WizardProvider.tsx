// "use client";

// import React, { createContext, useContext, useMemo, useState } from "react";
// import demo from "@/public/demo/intake.demo.json";

// export type IntakeRecord = typeof demo; // simplest if demo matches your schema

// export type ExtrasState = {
//   formDate: string;
//   poBox: string;
// //   applicantSignatureName: string;
//   applicantSignatureDataUrl: string; // ✅ new (handwritten PNG dataURL)
// };

// const initialExtras: ExtrasState = {
//   formDate: new Date().toISOString().slice(0, 10),
//   poBox: "",
// //   applicantSignatureName: "",
//   applicantSignatureDataUrl: "", // ✅ new
// };

// type Ctx = {
//   draft: IntakeRecord;
//   setDraft: React.Dispatch<React.SetStateAction<IntakeRecord>>;
//   extras: ExtrasState;
//   setExtras: React.Dispatch<React.SetStateAction<ExtrasState>>;
//   update: (path: string, value: any) => void;
// };

// const WizardCtx = createContext<Ctx | null>(null);

// export function WizardProvider({ children }: { children: React.ReactNode }) {
//   const [draft, setDraft] = useState<IntakeRecord>(
//     structuredClone(demo) as any
//   );
//   const [extras, setExtras] = useState<ExtrasState>(initialExtras);

//   function update(path: string, value: any) {
//     setDraft((prev) => {
//       const next: any = structuredClone(prev);
//       const parts = path.split(".");
//       let cur: any = next;
//       for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
//       cur[parts[parts.length - 1]] = value;
//       return next;
//     });
//   }

//   const ctx = useMemo(
//     () => ({ draft, setDraft, extras, setExtras, update }),
//     [draft, extras]
//   );

//   return <WizardCtx.Provider value={ctx}>{children}</WizardCtx.Provider>;
// }

// export function useWizard() {
//   const ctx = useContext(WizardCtx);
//   if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
//   return ctx;
// }


"use client";

import React, { createContext, useContext, useMemo, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import demo from "@/public/demo/intake.demo.json";
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

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setIsHydrated(false);

      // 1) If no instanceId -> start new from demo
      if (!instanceId) {
        if (cancelled) return;
        setDraft(structuredClone(demo) as any);
        setExtras(initialExtras);
        setIsHydrated(true);
        return;
      }

      // 2) Load from DB
      const supabase = createClient();

      const { data: row, error } = await supabase
        .from("form_instances")
        .select("draft, extras")
        .eq("id", instanceId)
        .single();

      if (cancelled) return;

      if (error || !row?.draft) {
        // fallback (or you can show an error UI)
        console.error("Failed to load instance", error);
        setDraft(structuredClone(demo) as any);
        setExtras(initialExtras);
        setIsHydrated(true);
        return;
      }

      setDraft(row.draft as IntakeRecord);

      // merge extras with defaults (so missing keys won't crash)
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

