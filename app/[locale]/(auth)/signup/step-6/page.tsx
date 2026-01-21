import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Step6FormClient from "./Step6FormClient";
import { submitStep6Child } from "../actions";

export default async function Step6Page({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { saved?: string };
}) {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${params.locale}/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("registration_completed, data")
    .eq("id", data.user.id)
    .single();

  // שליפת נתונים
  const step6 = profile?.data?.intake?.step6 || {};
  const existingChildren = Array.isArray(step6.children) ? step6.children : [];
  const saveDraftAction = submitStep6Child.bind(null, params.locale, "save_draft");

  return (
    <div className="appShell" dir="rtl">
      <div className="appFrame">
        <Step6FormClient
          locale={params.locale}
          saved={searchParams?.saved === "1"}
          existingChildren={existingChildren}
          saveDraftAction={saveDraftAction}
        />
      </div>
    </div>
  );
}
