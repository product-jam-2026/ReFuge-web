"use client";

import React, { useEffect, useRef, useState } from "react";

import { useRouter, useSearchParams, useParams } from "next/navigation";
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
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === "ar";
  const t = (ar: string, he: string) => (isArabic ? ar : he);
  const { draft, extras, setExtras, instanceId, saveNow, saveStatus } =
    useWizard();

  useEffect(() => {
    setExtras((p) => ({ ...p, currentStep: 4 }));
  }, [setExtras]);

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
    pdfTitle: string,
    instanceId?: string,
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

    const path = `${user.id}/child-registration-request/${instanceId}/${fileName}`;

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

    const baseTitle = "בקשה לרישום ילד";
    const rawTitle =
      typeof (extras as any).formTitle === "string"
        ? (extras as any).formTitle.trim()
        : "";
    const normalizedTitle =
      rawTitle && !rawTitle.includes("[object Object]") ? rawTitle : "";
    let title = normalizedTitle;

    if (!title) {
      const { data, error } = await supabase
        .from("form_instances")
        .select("title")
        .eq("user_id", user.id)
        .eq("form_slug", "child-registration-request");

      if (error) throw error;

      let maxNum = 0;
      const titleRegex = new RegExp(`^${baseTitle}\\s+(\\d+)$`);

      (data ?? []).forEach((row: any) => {
        const rowTitle = typeof row?.title === "string" ? row.title.trim() : "";
        if (!rowTitle) return;
        if (rowTitle === baseTitle) {
          maxNum = Math.max(maxNum, 1);
          return;
        }
        const match = rowTitle.match(titleRegex);
        if (match) {
          const n = Number(match[1]);
          if (!Number.isNaN(n)) maxNum = Math.max(maxNum, n);
        }
      });

      title = `${baseTitle} ${maxNum + 1}`;
    }

    const { applicantSignatureDataUrl, ...extrasRest } = extras;
    const extrasToSave = { ...extrasRest, formTitle: normalizedTitle };

    if (!existingInstanceId) {
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

    const baseTitle = "בקשה לרישום ילד";
    const rawTitle =
      typeof (extras as any).formTitle === "string"
        ? (extras as any).formTitle.trim()
        : "";
    const normalizedTitle =
      rawTitle && !rawTitle.includes("[object Object]") ? rawTitle : "";
    const pdfTitle =
      normalizedTitle ||
      `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
      baseTitle;

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

    // const savedInstanceId = await saveDraft(instanceId ?? undefined);
    await uploadPdf(outBytes, pdfTitle);
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          {t(
            "لتسجيل مولود ولد في اسرائيل لوالد/ة مواطن اسرائيلي",
            "בקשה לרישום ילד שנולד בישראל להורה תושב ישראלי"
          )}
        </div>
      </div>

      {/* <SectionTitle>כללי</SectionTitle> */}
      <Field label={t("تاريخ", "תאריך")}>
        <input
          type="date"
          value={(extras as any).formDate}
          onChange={(e) =>
            setExtras((p: any) => ({ ...p, formDate: e.target.value }))
          }
          className={styles.input}
        />
      </Field>

      <Field label={t("اسم النموذج", "שם הטופס")}>
        <input
          value={
            typeof (extras as any).formTitle === "string"
              ? (extras as any).formTitle
              : ""
          }
          onChange={(e) =>
            setExtras((p: any) => ({ ...p, formTitle: e.target.value }))
          }
          className={styles.input}
          placeholder={t("اسم للتعريف في القوائم", "שם לזיהוי ברשימות")}
        />
      </Field>

      <SectionTitle>{t("توقيع (بخط اليد)", "חתימה (כתב יד)")}</SectionTitle>

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

      <span className={styles.deleteSignature}
        role="button"
        tabIndex={0}
        onClick={clearSignature}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") clearSignature();
        }}
        style={{
          cursor: (extras as any)?.applicantSignatureDataUrl
            ? "pointer"
            : "default",
          // textDecoration: "underline",
          // opacity: (extras as any)?.applicantSignatureDataUrl ? 1 : 0.5,
          userSelect: "none",
        }}
        aria-disabled={!(extras as any)?.applicantSignatureDataUrl}
        title={t("مسح التوقيع", "מחק חתימה")}
      >
        {t("إعادة ضبط التوقيع", "איפוס חתימה")}
      </span>
      <div className={styles.footer}>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={async () => {
            await onGenerate();
            router.push("./review");
          }}
        >
          {t("إنهاء", "סיום")}
        </button>
        <button
          className={styles.secondaryButton}
          // disabled={saveStatus === "saving"}
          onClick={async () => {
            const id = await saveNow();
            if (id) router.push(`/${locale}/forms/child-registration-request`);
          }}
        >
          {t("حفظ كمسودة", "שמור כטיוטה")}
        </button>{" "}
      </div>
    </main>
  );
}
