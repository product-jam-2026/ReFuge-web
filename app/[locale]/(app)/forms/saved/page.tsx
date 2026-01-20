import { redirect } from "next/navigation";

export default function SavedFormsRedirect({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/documents`);
}
