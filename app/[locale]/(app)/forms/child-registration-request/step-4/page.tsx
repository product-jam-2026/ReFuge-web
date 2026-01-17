"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";
import { fieldMap } from "../fieldMap";
import { intakeToPdfFields } from "../intakeToPdfFields";
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import { createClient } from "@/lib/supabase/client";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{children}</h2>
  );
}
function safePart(s: string) {
  return (
    (s ?? "")
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 40) || "unknown"
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function Step4() {
  const router = useRouter();
  const { draft, extras, setExtras, instanceId } = useWizard();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);

  // tweak these to match your UI
  const CANVAS_W = 520;
  const CANVAS_H = 170;

  // Initialize canvas style once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Crisp lines on high DPI screens
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(CANVAS_W * dpr);
    canvas.height = Math.floor(CANVAS_H * dpr);
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#111";

    // If you already have a saved signature in extras, render it
    const sig = (extras as any)?.applicantSignatureDataUrl as
      | string
      | undefined;
    if (sig?.startsWith("data:image/")) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
      };
      img.src = sig;
    } else {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    lastPt.current = getPos(e);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const p = getPos(e);
    const prev = lastPt.current;
    if (!prev) {
      lastPt.current = p;
      return;
    }

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    lastPt.current = p;
  }

  function endDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(false);
    lastPt.current = null;

    // Save to wizard extras as a PNG data URL
    const dataUrl = canvas.toDataURL("image/png");

    setExtras((p: any) => ({
      ...p,
      applicantSignatureDataUrl: dataUrl,
    }));
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    setExtras((p: any) => ({
      ...p,
      applicantSignatureDataUrl: "",
    }));
  }

  if (!draft) {
    return (
      <main style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
        Loading…
      </main>
    );
  }

  const sigPreview = (extras as any)?.applicantSignatureDataUrl as
    | string
    | undefined;

  // async function uploadPdf(
  //   outBytes: Uint8Array,
  //   fileName: string,
  //   instanceId: string,
  // ) {
  //   const supabase = createClient();

  //   const { data: userRes, error: userErr } = await supabase.auth.getUser();
  //   if (userErr) throw userErr;
  //   const user = userRes.user;
  //   if (!user) throw new Error("Not logged in");

  //   const path = `${user.id}/child-registration-request/${fileName}`;

  //   // safest Blob creation for TS
  //   const bytes = new Uint8Array(outBytes); // copy
  //   const blob = new Blob([bytes.buffer], { type: "application/pdf" });

  //   const { data, error } = await supabase.storage
  //     .from("generated-pdfs")
  //     .upload(path, blob, {
  //       contentType: "application/pdf",
  //       upsert: true,
  //     });

  //   if (error) throw error;

  //   const user_id = userRes.user!.id;

  //   const { error: insErr } = await supabase.from("generated_pdfs").insert({
  //     user_id,
  //     bucket: "generated-pdfs",
  //     path: data.path,
  //     form_instance_id: instanceId, // ✅ link
  //     title,
  //   });

  //   if (insErr) throw insErr;

  //   return data.path;
  // }


  function safeFileName(title: string) {
  // keep it filesystem-safe
  return (title ?? "")
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .slice(0, 60) || "Untitled";
}

async function uploadPdf(
  outBytes: Uint8Array,
  instanceId: string,
  pdfTitle: string,
) {
  const supabase = createClient();

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userRes.user;
  if (!user) throw new Error("Not logged in");

  // const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const ts = new Date().toISOString().replace("Z", "").replace(/[:.]/g, "-");
  
  const base = safeFileName(pdfTitle);
  const fileName = `${base}_${ts}.pdf`;

  // Put PDFs under the instance folder (nice organization)
  const path = `${user.id}/child-registration-request/${instanceId}/${fileName}`;

  const bytes = new Uint8Array(outBytes);
  const blob = new Blob([bytes.buffer], { type: "application/pdf" });

  const { data, error } = await supabase.storage
    .from("generated-pdfs")
    .upload(path, blob, {
      contentType: "application/pdf",
      upsert: false, // IMPORTANT: don't overwrite old pdf
    });

  if (error) throw error;

  const { error: insErr } = await supabase.from("generated_pdfs").insert({
    user_id: user.id,
    bucket: "generated-pdfs",
    path: data.path,
    form_instance_id: instanceId,
    pdf_title: pdfTitle, // snapshot title
  });

  if (insErr) throw insErr;

  return data.path;
}

  async function saveDraft(instanceId?: string) {
    const supabase = createClient();

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userRes.user;
    if (!user) throw new Error("Not logged in");
    if (!draft) throw new Error("No draft to save");

    // const title =
    //   `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
    //   "Untitled";

    const title =
      (extras as any).formTitle?.trim() ||
      `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
      "Untitled";

    const { applicantSignatureDataUrl, ...extrasToSave } = extras;

    if (!instanceId) {
      // CREATE

      const { data, error } = await supabase
        .from("form_instances")
        .insert({
          user_id: user.id,
          form_slug: "child-registration-request",
          title,
          draft,
          extras: extrasToSave,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    } else {
      // UPDATE
      const { error } = await supabase
        .from("form_instances")
        .update({ title, draft, extras: extrasToSave })
        .eq("id", instanceId)
        .eq("user_id", user.id); // extra safety with RLS

      if (error) throw error;
      return instanceId;
    }
  }

  // async function onGenerate() {
  //   const fields = intakeToPdfFields(draft as any, {
  //     formDate: extras.formDate,
  //     poBox: extras.poBox,
  //     applicantSignature: extras.applicantSignatureDataUrl,
  //   });

  //   const [tplRes, fontRes] = await Promise.all([
  //     fetch("/forms/child-registration-request.pdf"),
  //     fetch("/fonts/SimplerPro-Regular.otf"),
  //   ]);

  //   const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
  //   const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

  //   const outBytes = await fillFieldsToNewPdfBytesClient(
  //     templateBytes,
  //     fields,
  //     fieldMap,
  //     { fontBytes, autoDetectRtl: true, defaultRtlAlignRight: true },
  //   );

  //   const s1 = (draft as any).intake.step1;
  //   const fileName = `child_registration_${safePart(
  //     s1.israeliId || s1.passportNumber || s1.lastName || "unknown",
  //   )}_${new Date().toISOString().slice(0, 10)}.pdf`;

  //   // downloadPdf(fileName, outBytes);

  //   // const { instanceId } = useWizard();

  //   const savedInstanceId = await saveDraft(instanceId ?? undefined);
  //   await uploadPdf(outBytes, fileName, savedInstanceId, extras.formTitle);

  //   // const instanceId = await saveDraft(); // ✅ await + capture id

  //   // const storagePath = await uploadPdf(outBytes, fileName, instanceId);
  // }

  // async function onGenerate() {
  //   const pdfTitle =
  //     (extras as any).formTitle?.trim() ||
  //     `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
  //     "Untitled";

  //   const fields = intakeToPdfFields(draft as any, {
  //     formDate: extras.formDate,
  //     poBox: extras.poBox,
  //     applicantSignature: extras.applicantSignatureDataUrl,
  //   });

  //   const [tplRes, fontRes] = await Promise.all([
  //     fetch("/forms/child-registration-request.pdf"),
  //     fetch("/fonts/SimplerPro-Regular.otf"),
  //   ]);

  //   const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
  //   const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

  //   const outBytes = await fillFieldsToNewPdfBytesClient(
  //     templateBytes,
  //     fields,
  //     fieldMap,
  //     { fontBytes, autoDetectRtl: true, defaultRtlAlignRight: true },
  //   );

  //   // ensure instance exists + has the current title
  //   const savedInstanceId = await saveDraft(instanceId ?? undefined);

  //   // create a NEW pdf row + NEW storage object (title-based)
  //   await uploadPdf(outBytes, savedInstanceId, pdfTitle);
  // }

  async function onGenerate() {
  const pdfTitle =
    (extras as any).formTitle?.trim() ||
    `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
    "Untitled";

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
    { fontBytes, autoDetectRtl: true, defaultRtlAlignRight: true },
  );

  // ensure instance exists + has the current title
  const savedInstanceId = await saveDraft(instanceId ?? undefined);

  // create a NEW pdf row + NEW storage object (title-based)
  await uploadPdf(outBytes, savedInstanceId, pdfTitle);
}


  return (
    <main
      style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>שלב 4: חתימה</h1>

      <SectionTitle>כללי</SectionTitle>
      <Field label="תאריך הטופס (PDF בלבד)">
        <input
          type="date"
          value={(extras as any).formDate}
          onChange={(e) =>
            setExtras((p: any) => ({ ...p, formDate: e.target.value }))
          }
          style={inputStyle}
        />
      </Field>

      <SectionTitle>פרטי הטופס</SectionTitle>

      <Field label="שם הטופס (למשל: 'דנה כהן' / 'Person A')">
        <input
          value={(extras as any).formTitle}
          onChange={(e) =>
            setExtras((p: any) => ({ ...p, formTitle: e.target.value }))
          }
          style={inputStyle}
          placeholder="שם לזיהוי ברשימות"
        />
      </Field>

      <SectionTitle>חתימה (כתב יד)</SectionTitle>

      <div style={{ display: "grid", gap: 8 }}>
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: 12,
            padding: 10,
            background: "#fff",
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              touchAction: "none", // IMPORTANT: enables drawing on mobile
              display: "block",
              background: "#fff",
              borderRadius: 10,
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={clearSignature}>
            נקה חתימה
          </button>
        </div>

        {sigPreview?.startsWith("data:image/") ? (
          <div style={{ fontSize: 13, opacity: 0.85 }}>
            נשמרה חתימה (תצוגה מקדימה):
            <div style={{ marginTop: 6 }}>
              <img
                src={sigPreview}
                alt="signature preview"
                style={{
                  maxWidth: 320,
                  border: "1px solid #ddd",
                  borderRadius: 10,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* <SectionTitle>חתימה בטקסט (אופציונלי)</SectionTitle>
      <Field label="שם חתימה">
        <input
          value={(extras as any).applicantSignatureName}
          onChange={(e) =>
            setExtras((p: any) => ({ ...p, applicantSignatureName: e.target.value }))
          }
          style={inputStyle}
        />
      </Field> */}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => router.back()}>
          ← הקודם
        </button>
        <button
          type="button"
          onClick={async () => {
            await onGenerate(); // run your PDF generation/upload/etc
            router.push("./review"); // keep the same navigation behavior
          }}
        >
          סיים
        </button>{" "}
      </div>
    </main>
  );
}
