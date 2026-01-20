"use client";

import { useRouter, useParams } from "next/navigation";
import { useWizard } from "../WizardProvider";
import { fieldMap } from "../fieldMap";
import { intakeToPdfFields } from "../intakeToPdfFields";
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

function safePart(s: string) {
  return (
    (s ?? "")
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 40) || "unknown"
  );
}

async function uploadPdf(outBytes: Uint8Array, fileName: string) {
  const supabase = createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userRes.user;
  if (!user) throw new Error("Not logged in");

  const path = `${user.id}/child-allowance-request/${fileName}`;

  const bytes = new Uint8Array(outBytes);
  const blob = new Blob([bytes.buffer], { type: "application/pdf" });

  const { data, error } = await supabase.storage
    .from("generated-pdfs")
    .upload(path, blob, { contentType: "application/pdf", upsert: true });

  if (error) throw error;

  const { error: insErr } = await supabase.from("generated_pdfs").insert({
    user_id: user.id,
    bucket: "generated-pdfs",
    path: data.path,
  });

  if (insErr) throw insErr;
  return data.path;
}

async function downloadLatestPdfForCurrentUser() {
  const supabase = createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) throw new Error("Not logged in");

  const { data: row, error: dbErr } = await supabase
    .from("generated_pdfs")
    .select("bucket, path, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dbErr) throw dbErr;
  if (!row) throw new Error("No PDFs found for this user");

  const { data: blob, error: dlErr } = await supabase.storage
    .from(row.bucket)
    .download(row.path);

  if (dlErr) throw dlErr;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = row.path.split("/").pop() || "document.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Review() {
  const router = useRouter();
  const { draft, extras } = useWizard();
  const params = useParams();

  const locale = params.locale as string;

  async function onGenerate() {
    const fields = intakeToPdfFields(draft as any, {
      formDate: extras.formDate,
      poBox: extras.poBox,
      applicantSignature: extras.applicantSignatureDataUrl,
    });

    const [tplRes, fontRes] = await Promise.all([
      fetch("/forms/child-allowance-request.pdf"),
      fetch("/fonts/SimplerPro-Regular.otf"),
    ]);

    const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
    const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

    const outBytes = await fillFieldsToNewPdfBytesClient(
      templateBytes,
      fields,
      fieldMap,
      { fontBytes, autoDetectRtl: true, defaultRtlAlignRight: true },
    );

    const s1 = (draft as any).intake.step1;
    const fileName = `child_registration_${safePart(
      s1.israeliId || s1.passportNumber || s1.lastName || "unknown",
    )}_${new Date().toISOString().slice(0, 10)}.pdf`;

    await uploadPdf(outBytes, fileName);
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>
        تم ملء نموذجك بنجاح! وهو موجود في منطقة قاعدة النماذج
      </h1>
      <h1 className={styles.title}>
        הטופס שלך מולא בהצלחה! ונמצא באיזור מאגר הטפסים
      </h1>

      {/* <pre className={styles.jsonBox}>
        {JSON.stringify({ draft, extras }, null, 2)}
      </pre> */}

      <div className={styles.buttonList}>
        {/* <button type="button" onClick={() => router.back()} className={styles.btn}>
          ← הקודם
        </button> */}

        {/* If you want to generate+upload then download, replace with: onClick={onGenerate} */}
        <button
          type="button"
          onClick={downloadLatestPdfForCurrentUser}
          className={styles.secondaryButton}
        >
          הפק PDF
        </button>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/home/`)}
          className={styles.primaryButton}
        >
         חזרה למסך הבית
        </button>
      </div>
    </main>
  );
}
