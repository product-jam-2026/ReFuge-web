"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";
import { fieldMap } from "../fieldMap";
import { intakeToPdfFields } from "../intakeToPdfFields";
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.sectionTitle}>{children}</h2>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function safeFileName(title: string) {
  return (
    (title ?? "")
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 60) || "Untitled"
  );
}

export default function Step4() {
  const router = useRouter();
  const { draft, extras, setExtras, instanceId } = useWizard();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);

  // keep these matching CSS values (.canvas)
  const CANVAS_W = 520;
  const CANVAS_H = 170;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(CANVAS_W * dpr);
    canvas.height = Math.floor(CANVAS_H * dpr);

    // set CSS size (no inline styles needed)
    canvas.style.width = `${CANVAS_W}px`;
    canvas.style.height = `${CANVAS_H}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = "#111";

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
  }, []);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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

    const dataUrl = canvas.toDataURL("image/png");
    setExtras((p: any) => ({ ...p, applicantSignatureDataUrl: dataUrl }));
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    setExtras((p: any) => ({ ...p, applicantSignatureDataUrl: "" }));
  }

  if (!draft) {
    return <main className={styles.loadingPage}>Loading…</main>;
  }

  const sigPreview = (extras as any)?.applicantSignatureDataUrl as
    | string
    | undefined;

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

    // no timezone suffix: drop trailing Z from ISO
    const ts = new Date().toISOString().replace("Z", "").replace(/[:.]/g, "-");
    const base = safeFileName(pdfTitle);
    const fileName = `${base}_${ts}.pdf`;

    const path = `${user.id}/person-registration-request/${instanceId}/${fileName}`;

    const bytes = new Uint8Array(outBytes);
    const blob = new Blob([bytes.buffer], { type: "application/pdf" });

    const { data, error } = await supabase.storage
      .from("generated-pdfs")
      .upload(path, blob, { contentType: "application/pdf", upsert: false });

    if (error) throw error;

    const { error: insErr } = await supabase.from("generated_pdfs").insert({
      user_id: user.id,
      bucket: "generated-pdfs",
      path: data.path,
      form_instance_id: instanceId,
      pdf_title: pdfTitle,
    });

    if (insErr) throw insErr;
    return data.path;
  }

  async function saveDraft(existingInstanceId?: string) {
    const supabase = createClient();
    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userRes.user;
    if (!user) throw new Error("Not logged in");
    if (!draft) throw new Error("No draft to save");

    const title =
      (extras as any).formTitle?.trim() ||
      `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
      "Untitled";

    const { applicantSignatureDataUrl, ...extrasToSave } = extras;

    if (!existingInstanceId) {
      const { data, error } = await supabase
        .from("form_instances")
        .insert({
          user_id: user.id,
          form_slug: "person-registration-request",
          title,
          draft,
          extras: extrasToSave,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id;
    } else {
      const { error } = await supabase
        .from("form_instances")
        .update({ title, draft, extras: extrasToSave })
        .eq("id", existingInstanceId)
        .eq("user_id", user.id);

      if (error) throw error;
      return existingInstanceId;
    }
  }

  async function onGenerate() {
    if (!draft) {
      // still loading / wizard not ready
      return;
    }

    const pdfTitle =
      (extras as any).formTitle?.trim() ||
      `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
      "Untitled";

    // const fields = intakeToPdfFields(draft as any, {
    //   formDate: extras.formDate,
    //   poBox: extras.poBox,
    //   applicantSignatureDataUrl: extras.applicantSignatureDataUrl,
    // });

    const fields = intakeToPdfFields(draft as any, extras as any);

    const [tplRes, fontRes] = await Promise.all([
      fetch("/forms/person-registration.pdf"),
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

    const savedInstanceId = await saveDraft(instanceId ?? undefined);
    await uploadPdf(outBytes, savedInstanceId, pdfTitle);
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          استبيان تسجيل شخص
        </div>

        <div className={styles.headerText}>
          שאלון לרישום נפש
        </div>
      </div>

      {/* <SectionTitle>כללי</SectionTitle> */}
      <Field label="تاريخ   תאריך  ">
        <input
          type="date"
          value={(extras as any).formDate}
          onChange={(e) =>
            setExtras((p: any) => ({ ...p, formDate: e.target.value }))
          }
          className={styles.input}
        />
      </Field>

      <Field label="اسم النموذج   שם הטופס">
        <input
          value={(extras as any).formTitle}
          onChange={(e) =>
            setExtras((p: any) => ({ ...p, formTitle: e.target.value }))
          }
          className={styles.input}
          placeholder="שם לזיהוי ברשימות"
        />
      </Field>

      <SectionTitle>חתימה (כתב יד)</SectionTitle>

      <div className={styles.signatureWrap}>
        <div className={styles.canvasFrame}>
          <canvas
            ref={canvasRef}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerCancel={endDraw}
            className={styles.canvas}
          />
        </div>

      </div>

      <div className={styles.footerRow}>
        <button
          type="button"
          onClick={async () => {
            await onGenerate();
            router.push("./review");
          }}
          className={styles.primaryButton}
        >
          סיום
        </button>
      </div>
    </main>
  );
}
