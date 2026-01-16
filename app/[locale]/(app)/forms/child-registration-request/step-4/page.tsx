// "use client";

// import { useRouter } from "next/navigation";
// import { useWizard } from "../WizardProvider";

// type MaritalStatus =
//   | "married"
//   | "divorced"
//   | "widowed"
//   | "single"
//   | "bigamist"
//   | "";

// const inputStyle: React.CSSProperties = {
//   width: "100%",
//   padding: "10px 12px",
//   borderRadius: 10,
//   border: "1px solid #ccc",
//   fontSize: 16,
// };

// const cardStyle: React.CSSProperties = {
//   border: "1px solid #ddd",
//   borderRadius: 12,
//   padding: 12,
//   display: "grid",
//   gap: 10,
// };

// function SectionTitle({ children }: { children: React.ReactNode }) {
//   return (
//     <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{children}</h2>
//   );
// }

// function Field({
//   label,
//   children,
// }: {
//   label: string;
//   children: React.ReactNode;
// }) {
//   return (
//     <label style={{ display: "grid", gap: 6 }}>
//       <span>{label}</span>
//       {children}
//     </label>
//   );
// }

// export default function Step4() {
//   const router = useRouter();
//   const { draft, extras, setExtras, update } = useWizard();

//   // In case your WizardProvider loads draft async
//   if (!draft) {
//     return (
//       <main style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
//         Loading…
//       </main>
//     );
//   }

//   const kids = draft.intake.step6.children ?? [];

//   function updateChild(i: number, key: string, value: string) {
//     // uses the generic update() you already have
//     update(`intake.step6.children.${i}.${key}`, value);
//   }

//   function addChildRow() {
//     const nextChildren = [
//       ...(draft.intake.step6.children ?? []),
//       {
//         lastName: "",
//         firstName: "",
//         gender: "",
//         birthDate: "",
//         nationality: "",
//         israeliId: "",
//         residenceCountry: "",
//         entryDate: "",
//       },
//     ];
//     update("intake.step6.children", nextChildren);
//   }

//   return (
//     <main
//       style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
//     >
//       <h1 style={{ fontSize: 22, fontWeight: 800 }}>
//         שלב 2: פרטים כלליים + המבקש + הורה זר + ילדים
//       </h1>

//       {/* GENERAL */}
//       <SectionTitle>כללי</SectionTitle>

//       <Field label="תאריך הטופס (PDF בלבד)">
//         <input
//           type="date"
//           value={extras.formDate}
//           onChange={(e) =>
//             setExtras((p) => ({ ...p, formDate: e.target.value }))
//           }
//           style={inputStyle}
//         />
//       </Field>


//       {/* SIGNATURE */}
//       <SectionTitle>חתימה (אופציונלי)</SectionTitle>

//       <Field label="שם חתימה (לא נשמר ב-DB template כרגע)">
//         <input
//           value={extras.applicantSignatureName}
//           onChange={(e) =>
//             setExtras((p) => ({ ...p, applicantSignatureName: e.target.value }))
//           }
//           style={inputStyle}
//         />
//       </Field>

//       {/* NAV */}
//       <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
//         <button type="button" onClick={() => router.back()}>
//           ← הקודם
//         </button>

//         <button type="button" onClick={() => router.push("./review")}>
//           הבא →
//         </button>
//       </div>
//     </main>
//   );
// }




"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";

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
  const { draft, extras, setExtras } = useWizard();

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
    const sig = (extras as any)?.applicantSignatureDataUrl as string | undefined;
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

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>שלב 4: חתימה</h1>

      <SectionTitle>כללי</SectionTitle>
      <Field label="תאריך הטופס (PDF בלבד)">
        <input
          type="date"
          value={(extras as any).formDate}
          onChange={(e) => setExtras((p: any) => ({ ...p, formDate: e.target.value }))}
          style={inputStyle}
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
                style={{ maxWidth: 320, border: "1px solid #ddd", borderRadius: 10 }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <SectionTitle>חתימה בטקסט (אופציונלי)</SectionTitle>
      <Field label="שם חתימה">
        <input
          value={(extras as any).applicantSignatureName}
          onChange={(e) =>
            setExtras((p: any) => ({ ...p, applicantSignatureName: e.target.value }))
          }
          style={inputStyle}
        />
      </Field>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => router.back()}>
          ← הקודם
        </button>
        <button type="button" onClick={() => router.push("./review")}>
          הבא →
        </button>
      </div>
    </main>
  );
}

