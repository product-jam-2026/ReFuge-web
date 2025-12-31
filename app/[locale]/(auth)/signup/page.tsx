import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SignupIndexPage({ params }: any) {
  const locale = params.locale;

  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("registration_completed, data")
    .eq("id", user.id)
    .single();

  if (profile?.registration_completed) redirect(`/${locale}/home`);

  // Decide which step to go to:
  const intake = profile?.data?.intake || {};
  const hasStep = (n: number) => intake?.[`step${n}`] && Object.keys(intake[`step${n}`]).length > 0;

  const nextStep =
    hasStep(1) ? (hasStep(2) ? (hasStep(3) ? (hasStep(4) ? (hasStep(5) ? 6 : 5) : 4) : 3) : 2) : 1;

  redirect(`/${locale}/signup/step-${nextStep}`);
}
