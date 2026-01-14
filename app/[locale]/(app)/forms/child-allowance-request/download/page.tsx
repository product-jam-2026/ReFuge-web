"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";

function bytesToBlobUrl(pdfBytes: Uint8Array) {
  const safeBytes = new Uint8Array(pdfBytes); // copies
  const blob = new Blob([safeBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

function printPdf(pdfBytes: Uint8Array) {
  const url = bytesToBlobUrl(pdfBytes);

  // Open in a new tab and trigger print
  const w = window.open(url, "_blank");
  if (!w) {
    // popup blocked
    alert("הדפדפן חסם חלון קופץ. אפשר לאפשר popups לאתר ואז לנסות שוב.");
    URL.revokeObjectURL(url);
    return;
  }

  // Some browsers need a moment for the PDF viewer to load
  const tryPrint = () => {
    try {
      w.focus();
      w.print();
    } catch {
      // ignore
    }
  };

  w.addEventListener?.("load", tryPrint);
  setTimeout(tryPrint, 600);

  // best effort cleanup later
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Email option A: open mail client (no attachment)
function openMailto(to: string, subject: string, body: string) {
  const href =
    `mailto:${encodeURIComponent(to)}?` +
    `subject=${encodeURIComponent(subject)}&` +
    `body=${encodeURIComponent(body)}`;

  window.location.href = href;
}

function downloadPdf(filename: string, pdfBytes: Uint8Array) {
  //   const blob = new Blob([pdfBytes], { type: "application/pdf" });
  //   const safeBytes = new Uint8Array(pdfBytes); // copies
  //   const blob = new Blob([safeBytes], { type: "application/pdf" });
  //   const url = URL.createObjectURL(blob);

  const url = bytesToBlobUrl(pdfBytes);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function base64ToUint8(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function DownloadChildAllowancePdfPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();

  const key = useMemo(() => searchParams.get("key") || "", [searchParams]);
  const [fileName, setFileName] = useState<string>("");
  const [bytesBase64, setBytesBase64] = useState<string>("");
  const [emailTo, setEmailTo] = useState("");

  useEffect(() => {
    if (!key) return;

    const raw = sessionStorage.getItem(key);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        fileName: string;
        bytesBase64: string;
      };
      setFileName(parsed.fileName);
      setBytesBase64(parsed.bytesBase64);
    } catch {
      // ignore
    }
  }, [key]);

  const ready = !!fileName && !!bytesBase64;

  return (
    <main
      style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        הקובץ מוכן להורדה
      </h1>

      {!ready ? (
        <div style={{ opacity: 0.8 }}>
          לא נמצא PDF (אולי רעננת את העמוד או שה-session נמחק).
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12, opacity: 0.8 }}>
            שם קובץ: <span style={{ direction: "ltr" }}>{fileName}</span>
          </div>

          {/* Optional email input */}
          {/* <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
      <label style={{ display: "grid", gap: 6 }}>
        <span>שליחה באימייל (כתובת יעד)</span>
        <input
          value={emailTo}
          onChange={(e) => setEmailTo(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
            fontSize: 16,
            direction: "ltr",
          }}
          placeholder="someone@example.com"
          inputMode="email"
        />
      </label>
    </div> */}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* Download */}
            <button
              onClick={() => {
                const bytes = base64ToUint8(bytesBase64);
                downloadPdf(fileName, bytes);
                sessionStorage.removeItem(key);
              }}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "none",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Download PDF
            </button>

            {/* Print */}
            <button
              onClick={() => {
                const bytes = base64ToUint8(bytesBase64);
                printPdf(bytes);
              }}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #ccc",
                background: "transparent",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Print
            </button>

            {/* Email (mailto, no attachment) */}
            <button
              onClick={() => {
                const subject = `PDF: ${fileName}`;
                const body =
                  "מצורף הקובץ PDF.\n\n" +
                  "שימו לב: לא ניתן לצרף קובץ ל-mailto אוטומטית מהדפדפן.\n" +
                  "אפשר להוריד את ה-PDF ולצרף ידנית למייל.";
                openMailto(emailTo || "", subject, body);
              }}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #ccc",
                background: "transparent",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Send by Email
            </button>

            {/* Back */}

            <button
              type="button"
              onClick={() => router.push(`/${locale}/home`)}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #ccc",
                background: "transparent",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              חזרה לדף הבית
            </button>
          </div>
        </>
      )}
    </main>
  );
}
