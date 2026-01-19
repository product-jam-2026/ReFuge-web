import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { submitStep7 } from "../actions"; 
import Step7FormClient from "./Step7FormClient";

export default async function Step7Page({
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

  const intake = profile?.data?.intake || {};
  const step7 = intake.step7 || {};
  const docs = step7.documents || {};
  
  // שליפת רשימת הילדים משלב 6 כדי להעביר לקליינט
  const childrenList = intake.step6?.children || [];

  // הכנת ערכי ברירת המחדל (שמות הקבצים אם קיימים)
  const defaults = {
    passportCopy: docs.passportCopy?.path || "",
    familyStatusDoc: docs.familyStatusDoc?.path || "",
    secondParentStatusDoc: docs.secondParentStatusDoc?.path || "",
    rentalContract: docs.rentalContract?.path || "",
    propertyOwnership: docs.propertyOwnership?.path || "",
    childPassportPhoto: docs.childPassportPhoto?.path || "", // fallback
    otherDocs: docs.otherDocs?.map((f:any) => f.path).join(", ") || "",
    // נוסיף דינמית גם את מסמכי הילדים
    ...childrenList.reduce((acc: any, _: any, index: number) => {
        const key = `child_doc_${index}`;
        if (docs[key]) acc[key] = docs[key].path;
        return acc;
    }, {})
  };

  const saveDraftAction = submitStep7.bind(null, params.locale, "draft");
  const finishAction = submitStep7.bind(null, params.locale, "finish");
  const saveDraftAndBackAction = submitStep7.bind(null, params.locale, "back");

  return (
    <div className="appShell" dir="rtl">
      <div className="appFrame">
        <Step7FormClient
          locale={params.locale}
          saved={searchParams?.saved === "1"}
          defaults={defaults}
          childrenList={childrenList} // <--- העברנו את הילדים!
          saveDraftAction={saveDraftAction}
          finishAction={finishAction}
          saveDraftAndBackAction={saveDraftAndBackAction}
        />
      </div>
    </div>
  );
}