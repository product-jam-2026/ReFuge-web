"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function mergeDeep(base: any, patch: any) {
  if (patch === null || patch === undefined) return base;
  if (Array.isArray(patch)) return patch; // אצלנו arrays מוחלפים
  if (typeof patch !== "object") return patch;

  const out = { ...(base || {}) };
  for (const key of Object.keys(patch)) {
    out[key] = mergeDeep(base?.[key], patch[key]);
  }
  return out;
}

async function getAuthedSupabase() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return { supabase, user: data.user };
}

async function upsertProfileIfMissing(supabase: any, user: any) {
  // יוצר/מעדכן בסיס: id+email אם אין
  await supabase.from("profiles").upsert(
    { id: user.id, email: user.email },
    { onConflict: "id" }
  );
}

export async function saveSignupStep(params: {
  locale: string;
  step: number; // 1..6
  patch: any;   // מה ששומרים לתוך intake.stepX
  goNext?: boolean; // אם true -> redirect לשלב הבא
}) {
  const { supabase, user } = await getAuthedSupabase();
  await upsertProfileIfMissing(supabase, user);

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("data, registration_completed")
    .eq("id", user.id)
    .single();

  if (profErr) throw profErr;

  if (profile?.registration_completed) {
    redirect(`/${params.locale}/home`);
  }

  const existingData = profile?.data || {};
  const existingIntake = existingData.intake || {};

  const computedCurrentStep = params.goNext
  ? Math.min(params.step + 1, 6)
  : params.step;
const nextIntake = mergeDeep(existingIntake, {
  currentStep: Math.max(existingIntake.currentStep || 1, computedCurrentStep),
  [`step${params.step}`]: params.patch,
});

  const nextData = mergeDeep(existingData, { intake: nextIntake });

  const { error: updErr } = await supabase
    .from("profiles")
    .update({ data: nextData })
    .eq("id", user.id);

  if (updErr) throw updErr;

  if (params.goNext) {
    const nextStep = Math.min(params.step + 1, 6);
    redirect(`/${params.locale}/signup/step-${nextStep}`);
  }

  // נשארים באותו דף
  redirect(`/${params.locale}/signup/step-${params.step}?saved=1`);
}

export async function completeRegistration(locale: string) {
  const { supabase, user } = await getAuthedSupabase();
  await upsertProfileIfMissing(supabase, user);

  const { error } = await supabase
    .from("profiles")
    .update({ registration_completed: true })
    .eq("id", user.id);

  if (error) throw error;

  redirect(`/${locale}/home`);
}
