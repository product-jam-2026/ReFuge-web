// "use client";

// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";
// import { useSearchParams } from "next/navigation";
// import { createClient } from "@/lib/supabase/client";
// import emptyIntakeTemplate from "@/public/demo/intake.empty.json";

// import {
//   type IntakeRecord,
//   type ExtrasState,
//   deriveExtrasFromIntake,
// } from "./intakeToPdfFields";

// // type Ctx = {
// //   draft: IntakeRecord | null;
// //   setDraft: React.Dispatch<React.SetStateAction<IntakeRecord | null>>;

// //   extras: ExtrasState;
// //   setExtras: React.Dispatch<React.SetStateAction<ExtrasState>>;

// //   update: (path: string, value: any) => void;

// //   instanceId: string | null;
// //   isHydrated: boolean;
// // };

// type Ctx = {
//   draft: IntakeRecord | null;
//   setDraft: React.Dispatch<React.SetStateAction<IntakeRecord | null>>;

//   extras: ExtrasState;
//   setExtras: React.Dispatch<React.SetStateAction<ExtrasState>>;

//   update: (path: string, value: any) => void;

//   // ✅ add these
//   updateChild: (
//     index: number,
//     key: keyof IntakeRecord["intake"]["step6"]["children"][number],
//     value: string,
//   ) => void;
//   addChildRow: () => void;

//   instanceId: string | null;
//   isHydrated: boolean;
// };


// const WizardCtx = createContext<Ctx | null>(null);

// // ---------- helpers ----------

// function setDeep(obj: any, path: string, value: any) {
//   const parts = path.split(".");
//   let cur = obj;
//   for (let i = 0; i < parts.length - 1; i++) {
//     if (cur[parts[i]] == null) cur[parts[i]] = {};
//     cur = cur[parts[i]];
//   }
//   cur[parts[parts.length - 1]] = value;
// }

// function mergeExtras(defaults: ExtrasState, stored: any): ExtrasState {
//   // best-effort deep-ish merge (keeps defaults for missing keys)
//   const out = structuredClone(defaults) as ExtrasState;

//   if (!stored || typeof stored !== "object") return out;

//   // top-level shallow merge
//   for (const k of Object.keys(stored)) {
//     const v = (stored as any)[k];
//     if (v == null) continue;

//     // arrays (like trips) - replace item-by-item if possible
//     if (Array.isArray(v) && Array.isArray((out as any)[k])) {
//       const nextArr = structuredClone((out as any)[k]);
//       const max = Math.max(nextArr.length, v.length);
//       while (nextArr.length < max) nextArr.push({});
//       for (let i = 0; i < v.length; i++) {
//         if (v[i] && typeof v[i] === "object") nextArr[i] = { ...nextArr[i], ...v[i] };
//         else if (v[i] != null) nextArr[i] = v[i];
//       }
//       (out as any)[k] = nextArr;
//       continue;
//     }

//     // nested objects - shallow merge
//     if (typeof v === "object" && !Array.isArray(v) && typeof (out as any)[k] === "object") {
//       (out as any)[k] = { ...(out as any)[k], ...v };
//       continue;
//     }

//     // primitive
//     (out as any)[k] = v;
//   }

//   return out;
// }

// // ---------- provider ----------

// export function WizardProvider({ children }: { children: React.ReactNode }) {
//   const searchParams = useSearchParams();
//   const instanceId = searchParams.get("instanceId");

//   const defaultDraft = useMemo(
//     () => structuredClone(emptyIntakeTemplate) as IntakeRecord,
//     [],
//   );

//   // deriveExtrasFromIntake exists in your intakeToPdfFields module
//   const defaultExtras = useMemo(() => {
//     // Some implementations accept (draft, prevExtras). If yours accepts only (draft),
//     // the second param will be ignored by TS if typed loosely there.
//     return (deriveExtrasFromIntake as any)(defaultDraft, undefined) as ExtrasState;
//   }, [defaultDraft]);

//   const [draft, setDraft] = useState<IntakeRecord | null>(null);
//   const [extras, setExtras] = useState<ExtrasState>(defaultExtras);
//   const [isHydrated, setIsHydrated] = useState(false);

//   useEffect(() => {
//     let cancelled = false;

//     async function hydrate() {
//       setIsHydrated(false);
//       const supabase = createClient();

//       const { data: userRes, error: userErr } = await supabase.auth.getUser();
//       if (cancelled) return;

//       if (userErr || !userRes.user) {
//         console.error("Not logged in / failed to get user", userErr);
//         setDraft(null);
//         setExtras(defaultExtras);
//         setIsHydrated(true);
//         return;
//       }

//       const user = userRes.user;

//       // NEW instance -> hydrate from profiles.data
//       if (!instanceId) {
//         const { data: profile, error: profErr } = await supabase
//           .from("profiles")
//           .select("data")
//           .eq("id", user.id)
//           .single();

//         if (cancelled) return;

//         if (profErr || !profile?.data) {
//           console.error("Failed to load profile data", profErr);
//           setDraft(structuredClone(defaultDraft) as IntakeRecord);
//           setExtras((deriveExtrasFromIntake as any)(defaultDraft, undefined));
//           setIsHydrated(true);
//           return;
//         }

//         let intakeObj: any;
//         try {
//           intakeObj =
//             typeof profile.data === "string" ? JSON.parse(profile.data) : profile.data;
//         } catch (e) {
//           console.error("profiles.data is not valid JSON", e);
//           setDraft(structuredClone(defaultDraft) as IntakeRecord);
//           setExtras((deriveExtrasFromIntake as any)(defaultDraft, undefined));
//           setIsHydrated(true);
//           return;
//         }

//         const nextDraft = (intakeObj ?? structuredClone(defaultDraft)) as IntakeRecord;

//         // derive defaults for extras from this draft
//         const nextDefaults = (deriveExtrasFromIntake as any)(nextDraft, undefined) as ExtrasState;

//         setDraft(nextDraft);
//         setExtras(nextDefaults);
//         setIsHydrated(true);
//         return;
//       }

//       // EXISTING instance -> hydrate from form_instances
//       const { data: row, error } = await supabase
//         .from("form_instances")
//         .select("draft, extras")
//         .eq("id", instanceId)
//         .single();

//       if (cancelled) return;

//       if (error || !row?.draft) {
//         console.error("Failed to load instance", error);
//         setDraft(structuredClone(defaultDraft) as IntakeRecord);
//         setExtras((deriveExtrasFromIntake as any)(defaultDraft, undefined));
//         setIsHydrated(true);
//         return;
//       }

//       const nextDraft = row.draft as IntakeRecord;
//       const nextDefaults = (deriveExtrasFromIntake as any)(nextDraft, undefined) as ExtrasState;
//       const nextExtras = mergeExtras(nextDefaults, row.extras);

//       setDraft(nextDraft);
//       setExtras(nextExtras);
//       setIsHydrated(true);
//     }

//     hydrate();
//   //   return () => {
//   //     cancelled = true;
//   //   };
//   // }, [instanceId, defaultDraft, defaultExtras]);


//       return () => {
//       cancelled = true;
//     };
//   }, [instanceId, defaultDraft]);

//   function update(path: string, value: any) {
//     setDraft((prev) => {
//       if (!prev) return prev;
//       const next: any = structuredClone(prev);
//       setDeep(next, path, value);
//       return next as IntakeRecord;
//     });
//   }

//   function ensureChildrenArray(next: any) {
//   if (!next.intake) next.intake = {};
//   if (!next.intake.step6) next.intake.step6 = {};
//   if (!Array.isArray(next.intake.step6.children)) next.intake.step6.children = [];
// }

// function updateChild(
//   index: number,
//   key: keyof IntakeRecord["intake"]["step6"]["children"][number],
//   value: string,
// ) {
//   setDraft((prev) => {
//     if (!prev) return prev;
//     const next: any = structuredClone(prev);
//     ensureChildrenArray(next);

//     if (!next.intake.step6.children[index]) return next;

//     next.intake.step6.children[index][key] = value;
//     return next as IntakeRecord;
//   });
// }

// function addChildRow() {
//   setDraft((prev) => {
//     if (!prev) return prev;
//     const next: any = structuredClone(prev);
//     ensureChildrenArray(next);

//     next.intake.step6.children.push({
//       lastName: "",
//       firstName: "",
//       gender: "",
//       birthDate: "",
//       nationality: "",
//       israeliId: "",
//       residenceCountry: "",
//       entryDate: "",
//     });

//     return next as IntakeRecord;
//   });

//   // If your extras has children-extras aligned with step6.children,
//   // keep it in sync (optional, but helpful)
//   setExtras((prev) => {
//     const next: any = structuredClone(prev);
//     if (!Array.isArray(next.children)) next.children = [];
//     next.children.push({ firstEntryDate: "", fileJoinDate: "" });
//     return next as ExtrasState;
//   });
// }

  

//   // const ctx = useMemo<Ctx>(
//   //   () => ({
//   //     draft,
//   //     setDraft,
//   //     extras,
//   //     setExtras,
//   //     update,
//   //     instanceId,
//   //     isHydrated,
//   //   }),
//   //   [draft, extras, instanceId, isHydrated],
//   // );

//   const ctx = useMemo<Ctx>(
//   () => ({
//     draft,
//     setDraft,
//     extras,
//     setExtras,
//     update,
//     updateChild,   // ✅
//     addChildRow,   // ✅
//     instanceId,
//     isHydrated,
//   }),
//   [draft, extras, instanceId, isHydrated],
// );


//   return <WizardCtx.Provider value={ctx}>{children}</WizardCtx.Provider>;
// }

// export function useWizard() {
//   const ctx = useContext(WizardCtx);
//   if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
//   return ctx;
// }




"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import emptyIntakeTemplate from "@/public/demo/intake.empty.json";

import {
  type IntakeRecord,
  type ExtrasState,
  deriveExtrasFromIntake,
} from "./intakeToPdfFields";

const FORM_SLUG = "person-registration-request"; // 🔁 change if needed

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

  // ✅ match the other WizardProvider format
  saveNow: () => Promise<string | null>;
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveError?: string;
};

const WizardCtx = createContext<Ctx | null>(null);

// ---------- helpers ----------

function setDeep(obj: any, path: string, value: any) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cur[parts[i]] == null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function mergeExtras(defaults: ExtrasState, stored: any): ExtrasState {
  const out = structuredClone(defaults) as ExtrasState;
  if (!stored || typeof stored !== "object") return out;

  for (const k of Object.keys(stored)) {
    const v = (stored as any)[k];
    if (v == null) continue;

    if (Array.isArray(v) && Array.isArray((out as any)[k])) {
      const nextArr = structuredClone((out as any)[k]);
      const max = Math.max(nextArr.length, v.length);
      while (nextArr.length < max) nextArr.push({});
      for (let i = 0; i < v.length; i++) {
        if (v[i] && typeof v[i] === "object") nextArr[i] = { ...nextArr[i], ...v[i] };
        else if (v[i] != null) nextArr[i] = v[i];
      }
      (out as any)[k] = nextArr;
      continue;
    }

    if (
      typeof v === "object" &&
      !Array.isArray(v) &&
      typeof (out as any)[k] === "object" &&
      (out as any)[k] !== null
    ) {
      (out as any)[k] = { ...(out as any)[k], ...v };
      continue;
    }

    (out as any)[k] = v;
  }

  return out;
}

function ensureChildrenArray(next: any) {
  if (!next.intake) next.intake = {};
  if (!next.intake.step6) next.intake.step6 = {};
  if (!Array.isArray(next.intake.step6.children)) next.intake.step6.children = [];
}

// ---------- provider ----------

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  const defaultDraft = useMemo(
    () => structuredClone(emptyIntakeTemplate) as IntakeRecord,
    [],
  );

  const defaultExtras = useMemo(() => {
    return (deriveExtrasFromIntake as any)(defaultDraft, undefined) as ExtrasState;
  }, [defaultDraft]);

  const [draft, setDraft] = useState<IntakeRecord | null>(null);
  const [extras, setExtras] = useState<ExtrasState>(defaultExtras);
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ like the example: keep a "live" instance id that can be created by saveNow()
  const [liveInstanceId, setLiveInstanceId] = useState<string | null>(instanceId);
  useEffect(() => setLiveInstanceId(instanceId), [instanceId]);

  const [saveStatus, setSaveStatus] = useState<Ctx["saveStatus"]>("idle");
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  // ✅ saveNow (same behavior as your other WizardProvider)
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

      // Title: prefer extras.formTitle if your ExtrasState has it, else fallback
      const title =
        ((extras as any).formTitle?.trim?.() as string) ||
        `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
        "Untitled";

      // Don’t persist signature blobs if present (same pattern as before)
      const { applicantSignatureDataUrl, ...extrasToSave } = (extras as any) ?? {};

      if (!liveInstanceId) {
        const { data, error } = await supabase
          .from("form_instances")
          .insert({
            user_id: user.id,
            form_slug: FORM_SLUG,
            title,
            draft,
            extras: extrasToSave,
          })
          .select("id")
          .single();

        if (error) throw error;

        setLiveInstanceId(data.id);
        setSaveStatus("saved");

        // put instanceId in the URL so refresh / nav continues correctly
        router.replace(`?instanceId=${encodeURIComponent(data.id)}`);
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

  // ✅ hydrate logic (same as the example)
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
        setExtras(defaultExtras);
        setIsHydrated(true);
        return;
      }

      const user = userRes.user;

      // 1) New instance: start from profiles.data
      if (!instanceId) {
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("data")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        if (profErr || !profile?.data) {
          console.error("Failed to load profile data", profErr);
          setDraft(structuredClone(defaultDraft) as IntakeRecord);
          setExtras((deriveExtrasFromIntake as any)(defaultDraft, undefined));
          setIsHydrated(true);
          return;
        }

        let intakeObj: any;
        try {
          intakeObj = typeof profile.data === "string" ? JSON.parse(profile.data) : profile.data;
        } catch (e) {
          console.error("profiles.data is not valid JSON", e);
          setDraft(structuredClone(defaultDraft) as IntakeRecord);
          setExtras((deriveExtrasFromIntake as any)(defaultDraft, undefined));
          setIsHydrated(true);
          return;
        }

        const nextDraft = (intakeObj ?? structuredClone(defaultDraft)) as IntakeRecord;
        const nextDefaults = (deriveExtrasFromIntake as any)(nextDraft, undefined) as ExtrasState;

        setDraft(nextDraft);
        setExtras(nextDefaults);
        setIsHydrated(true);
        return;
      }

      // 2) Existing instance: load from form_instances
      const { data: row, error } = await supabase
        .from("form_instances")
        .select("draft, extras")
        .eq("id", instanceId)
        .single();

      if (cancelled) return;

      if (error || !row?.draft) {
        console.error("Failed to load instance", error);
        setDraft(structuredClone(defaultDraft) as IntakeRecord);
        setExtras((deriveExtrasFromIntake as any)(defaultDraft, undefined));
        setIsHydrated(true);
        return;
      }

      const nextDraft = row.draft as IntakeRecord;
      const nextDefaults = (deriveExtrasFromIntake as any)(nextDraft, undefined) as ExtrasState;
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
      const next: any = structuredClone(prev);
      ensureChildrenArray(next);

      if (!next.intake.step6.children[index]) return next as IntakeRecord;

      next.intake.step6.children[index][key] = value;
      return next as IntakeRecord;
    });
  }

  function addChildRow() {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = structuredClone(prev);
      ensureChildrenArray(next);

      next.intake.step6.children.push({
        lastName: "",
        firstName: "",
        gender: "",
        birthDate: "",
        nationality: "",
        israeliId: "",
        residenceCountry: "",
        entryDate: "",
      });

      return next as IntakeRecord;
    });

    // keep extras children aligned if your ExtrasState has `children`
    setExtras((prev) => {
      const next: any = structuredClone(prev);
      if (!Array.isArray(next.children)) next.children = [];
      next.children.push({ firstEntryDate: "", fileJoinDate: "" });
      return next as ExtrasState;
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
      instanceId: liveInstanceId, // ✅ return live id
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
