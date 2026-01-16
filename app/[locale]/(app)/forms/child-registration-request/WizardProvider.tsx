"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import demo from "@/public/demo/intake.demo.json";

export type IntakeRecord = typeof demo; // simplest if demo matches your schema

export type ExtrasState = {
  formDate: string;
  poBox: string;
  applicantSignatureName: string;
};

const initialExtras: ExtrasState = {
  formDate: new Date().toISOString().slice(0, 10),
  poBox: "",
  applicantSignatureName: "",
};

type Ctx = {
  draft: IntakeRecord;
  setDraft: React.Dispatch<React.SetStateAction<IntakeRecord>>;
  extras: ExtrasState;
  setExtras: React.Dispatch<React.SetStateAction<ExtrasState>>;
  update: (path: string, value: any) => void;
};

const WizardCtx = createContext<Ctx | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<IntakeRecord>(structuredClone(demo) as any);
  const [extras, setExtras] = useState<ExtrasState>(initialExtras);

  function update(path: string, value: any) {
    setDraft((prev) => {
      const next: any = structuredClone(prev);
      const parts = path.split(".");
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }

  const ctx = useMemo(
    () => ({ draft, setDraft, extras, setExtras, update }),
    [draft, extras]
  );

  return <WizardCtx.Provider value={ctx}>{children}</WizardCtx.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardCtx);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}
