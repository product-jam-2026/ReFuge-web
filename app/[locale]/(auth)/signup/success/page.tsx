// app/[locale]/(auth)/signup/success/page.tsx

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import IntakeSuccessClient from "./IntakeSuccessClient";

export default async function IntakeSuccessPage({
  params,
}: {
  params: { locale: string };
}) {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${params.locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("data")
    .eq("id", data.user.id)
    .single();

  const step1 = profile?.data?.intake?.step1 || {};
  // שליפת אובייקט השם המלא { he: "...", ar: "..." }
  const nameObj = step1.firstName || {}; 

  return (
    <IntakeSuccessClient 
      locale={params.locale} 
      nameObj={nameObj} 
    />
  );
}