"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

type GeneratedPdfRow = {
  id: string;
  bucket: string;
  path: string;
  created_at: string;
  form_instance_id: string | null;
  pdf_title: string | null;
};

function fileNameFromPath(path: string) {
  return path.split("/").pop() || "document.pdf";
}

async function downloadPdfFromStorage(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
) {
  const { data: blob, error } = await supabase.storage
    .from(bucket)
    .download(path);
  if (error) throw error;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileNameFromPath(path);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type FormInstanceRow = {
  id: string;
  form_slug: string;
  title: string | null;
  status: string | null;
  updated_at: string;
  created_at: string;
  extras: { currentStep?: number } | null; // jsonb
};

export default function ChildAllowanceHomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [rows, setRows] = useState<FormInstanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");

  const [pdfRows, setPdfRows] = useState<GeneratedPdfRow[]>([]);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfErr, setPdfErr] = useState<string>("");

  const params = useParams();
  const locale = params.locale as string;

  // ✅ PDF list (filtered to this form by path prefix)
  useEffect(() => {
    (async () => {
      setPdfLoading(true);
      setPdfErr("");

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        setPdfErr(userErr.message);
        setPdfLoading(false);
        return;
      }
      if (!userRes.user) {
        setPdfErr("Not logged in");
        setPdfLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("generated_pdfs")
        .select("id, bucket, path, created_at, form_instance_id, pdf_title")
        .eq("user_id", userRes.user.id)
        // IMPORTANT: filter only PDFs generated for this form slug
        .ilike("path", `%/child-allowance-request/%`)
        .order("created_at", { ascending: false });

      if (error) {
        setPdfErr(error.message);
        setPdfLoading(false);
        return;
      }

      setPdfRows((data ?? []) as GeneratedPdfRow[]);
      setPdfLoading(false);
    })();
  }, []);

  // ✅ Draft list (filtered by form_slug)
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");

      const { data: userRes, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        setErr(userErr.message);
        setLoading(false);
        return;
      }
      if (!userRes.user) {
        setErr("Not logged in");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("form_instances")
        .select("id, form_slug, title, status, updated_at, created_at, extras")
        .eq("user_id", userRes.user.id)
        .eq("form_slug", "child-allowance-request")
        .order("updated_at", { ascending: false });

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      setRows((data ?? []) as FormInstanceRow[]);
      setLoading(false);
    })();
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.topBar}>
        <div className={styles.arrowBox}>
          <img
            className={styles.backArrow}
            src="/images/backArrow.svg"
            alt="Back"
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/${locale}/forms/`)}
          />
        </div>

        {/* TODO: Replace titles with your child-allowance copy */}
        <div className={styles.bigTitles}>תביעה לקצבת ילדים</div>
      </div>

      {/* TODO: Replace description copy */}
      <div className={styles.subTextSection}>
        בקשה לתשלום חודשי לסיוע בהוצאות גידול ילדים עד גיל 18. הטופס מיועד
        למבוטחים שאינם מקבלים קצבת ילדים וכן במקרים בהם ילד/ים עוברים מהורה
        להורה או מהורה לאפוטרופוס/ ממונה.
      </div>

      <div className={styles.buttonRow}>
        <button
          type="button"
          onClick={() => router.push("child-allowance-request/step-1")}
          className={styles.btnPrimary}
        >
          <div>מילוי טופס חדש</div>
          <img src="/images/forwardArrow.png" />
        </button>
      </div>

      <h2 className={styles.sectionTitle}>הטפסים שלי</h2>
      <div className={styles.dividerContainer}>
        <hr className={styles.divider} />
      </div>

      {pdfLoading ? (
        <p className={styles.statusText}></p>
      ) : pdfErr ? (
        <p className={`${styles.statusText} ${styles.errorText}`}>{pdfErr}</p>
      ) : pdfRows.length === 0 ? (
        <p className={styles.statusText}></p>
      ) : (
        <div className={styles.tileGrid}>
          {pdfRows.map((p) => {
            const title =
              (p.pdf_title ?? "").trim() || fileNameFromPath(p.path);

            return (
              <button
                key={p.id}
                type="button"
                className={styles.pdfTile}
                onClick={async () => {
                  try {
                    await downloadPdfFromStorage(supabase, p.bucket, p.path);
                  } catch (e: any) {
                    alert(e?.message ?? "Download failed");
                  }
                }}
                aria-label={`הורד PDF: ${title}`}
                title={title}
              >
                <div>{title}</div>
                <img src="/images/forwardArrowBlack.svg" />
              </button>
            );
          })}
        </div>
      )}

      <h2 className={styles.sectionTitle}>טיוטות</h2>
      <div className={styles.dividerContainer}>
        <hr className={styles.divider} />
      </div>

      {loading ? (
        <p className={styles.statusTextLarge}></p>
      ) : err ? (
        <p className={`${styles.statusTextLarge} ${styles.errorText}`}>{err}</p>
      ) : rows.length === 0 ? (
        <p className={styles.statusTextLarge}></p>
      ) : (
        <div className={styles.tileGrid}>
          {rows.map((r) => {
            const title = (r.title ?? "").trim() || "טיוטה ללא שם";
            const step = r.extras?.currentStep ?? 1;

            return (
              <button
                key={r.id}
                type="button"
                className={styles.draftTile}
                onClick={() => {
                  router.push(
                    `/${locale}/forms/child-allowance-request/step-${step}?instanceId=${r.id}`,
                  );
                }}
                aria-label={`המשך עריכה: ${title}`}
                title={title}
              >
                <div>{title}</div>
                <img src="/images/forwardArrowBlack.svg" />
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
