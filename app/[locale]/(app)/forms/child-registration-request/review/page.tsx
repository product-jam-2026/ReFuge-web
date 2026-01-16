"use client";
import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";
import { fieldMap } from "../fieldMap";
import { intakeToPdfFields } from "../intakeToPdfFields";
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";

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

export default function Review() {
  const router = useRouter();
  const { draft, extras } = useWizard();

  async function onGenerate() {
    const fields = intakeToPdfFields(draft as any, {
      formDate: extras.formDate,
      poBox: extras.poBox,
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

    downloadPdf(fileName, outBytes);
  }

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>סיכום והפקת PDF</h1>

      <pre style={{ background: "#111", color: "#eee", padding: 12, borderRadius: 8 }}>
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
