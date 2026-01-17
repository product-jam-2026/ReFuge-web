"use client";
import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";
import { fieldMap } from "../fieldMap";
import { intakeToPdfFields } from "../intakeToPdfFields";
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";

import { createClient } from "@/lib/supabase/client";
// function safePart(s: string) {
//   return (s.trim().replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "unknown");
// }

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

  const path = `${user.id}/child-registration-request/${fileName}`;

  // safest Blob creation for TS
  const bytes = new Uint8Array(outBytes); // copy
  const blob = new Blob([bytes.buffer], { type: "application/pdf" });

  const { data, error } = await supabase.storage
    .from("generated-pdfs")
    .upload(path, blob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) throw error;

  const user_id = userRes.user!.id;

const { error: insErr } = await supabase
  .from("generated_pdfs")
  .insert({
    user_id,
    bucket: "generated-pdfs",
    path: data.path,
  });

if (insErr) throw insErr;
  return data.path;
}

function downloadPdf(filename: string, pdfBytes: Uint8Array) {
  const copy = new Uint8Array(pdfBytes); // copies into a new ArrayBuffer
  const blob = new Blob([copy.buffer], { type: "application/pdf" });
  //   const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// async function downloadPdfFromStorage(path: string, fileName: string) {
//   const supabase = createClient();

//   const { data, error } = await supabase.storage
//     .from("generated-pdfs")
//     .download(path);

//   if (error) throw error;

//   const url = URL.createObjectURL(data);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = fileName; // your desired filename
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   URL.revokeObjectURL(url);
// }

async function downloadLatestPdfForCurrentUser() {
  // 1) Get current user
  const supabase = createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) throw new Error("Not logged in");

  // 2) Get latest DB row for that user
  const { data: row, error: dbErr } = await supabase
    .from("generated_pdfs")
    .select("bucket, path, created_at")
    .eq("user_id", uid)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dbErr) throw dbErr;
  if (!row) throw new Error("No PDFs found for this user");

  // 3) Download from storage
  const { data: blob, error: dlErr } = await supabase.storage
    .from(row.bucket)
    .download(row.path);

  if (dlErr) throw dlErr;

  // 4) Save locally
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

  async function onGenerate() {
    const fields = intakeToPdfFields(draft as any, {
      formDate: extras.formDate,
      poBox: extras.poBox,
      applicantSignature: extras.applicantSignatureDataUrl,
    });

    const [tplRes, fontRes] = await Promise.all([
      fetch("/forms/child-registration-request.pdf"),
      fetch("/fonts/SimplerPro-Regular.otf"),
    ]);

    const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
    const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

    const outBytes = await fillFieldsToNewPdfBytesClient(
      templateBytes,
      fields,
      fieldMap,
      { fontBytes, autoDetectRtl: true, defaultRtlAlignRight: true }
    );

    const s1 = (draft as any).intake.step1;
    const fileName = `child_registration_${safePart(
      s1.israeliId || s1.passportNumber || s1.lastName || "unknown"
    )}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // downloadPdf(fileName, outBytes);

    const storagePath = await uploadPdf(outBytes, fileName);

    // console.log("uploaded:", storagePath);
    downloadLatestPdfForCurrentUser();
  }

  return (
    <main
      style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>סיכום והפקת PDF</h1>

      <pre
        style={{
          background: "#111",
          color: "#eee",
          padding: 12,
          borderRadius: 8,
        }}
      >
        {JSON.stringify({ draft, extras }, null, 2)}
      </pre>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => router.back()}>
          ← הקודם
        </button>
        <button type="button" onClick={onGenerate}>
          הפק PDF
        </button>
      </div>
    </main>
  );
}
