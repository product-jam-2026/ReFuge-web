"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";
import Link from "next/link";

// type GeneratedPdfRow = {
//   id: string;
//   bucket: string;
//   path: string;
//   created_at: string;
// };

// type GeneratedPdfRow = {
//   id: string;
//   bucket: string;
//   path: string;
//   created_at: string;
//   form_instance_id: string | null;
//   form_instance: { title: string | null } | null;
//   // form_instances: { title: string | null }[]; // matches your current result
// };

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

function fmt(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function ChildRegistrationHomePage() {
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
  const isArabic = locale === "ar";
  const titleText = isArabic
    ? "طلب تسجيل طفل وُلد في إسرائيل لوالد مقيم في إسرائيل"
    : "בקשה לרישום ילד שנולד בישראל להורה תושב ישראלי";
  const subText = isArabic
    ? "تنظيم تسجيل الطفل في سجل السكان الإسرائيلي - الحصول على مكانة للطفل في إسرائيل. لاحقا سيتم إرسال ملحق لهوية الوالدين."
    : "הסדרת רישום הילד במרשם האוכלוסין הישראלי - קבלת מעמד בישראל לילד. בהמשך ישלח להורים ספח לתעודת זהות";
  const newFormLabel = isArabic ? "ملء نموذج جديد" : "מילוי טופס חדש";
  const myFormsLabel = isArabic ? "نماذجي" : "הטפסים שלי";
  const draftsLabel = isArabic ? "مسودات" : "טיוטות";
  const untitledBase = isArabic ? "طلب تسجيل طفل" : "בקשה לרישום ילד";
  const downloadAria = isArabic ? "تنزيل PDF" : "הורד PDF";
  const continueAria = isArabic ? "متابعة التعديل" : "המשך עריכה";
  const notLoggedInLabel = isArabic ? "غير مسجل الدخول" : "Not logged in";

  // final pdf loading logic
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
        setPdfErr(notLoggedInLabel);
        setPdfLoading(false);
        return;
      }

      //     const { data, error } = await supabase
      //       .from("generated_pdfs")
      //       .select(
      //         `
      //   id,
      //   bucket,
      //   path,
      //   created_at,
      //   form_instance_id,
      //   form_instance:form_instances ( title )
      // `,
      //       )
      //       .eq("user_id", userRes.user.id)
      //       .order("created_at", { ascending: false });
      //     if (error) {
      //       setPdfErr(error.message);
      //       setPdfLoading(false);
      //       return;
      //     }

      const { data, error } = await supabase
        .from("generated_pdfs")
        .select("id, bucket, path, created_at, form_instance_id, pdf_title")
        .eq("user_id", userRes.user.id)
        .order("created_at", { ascending: false });

      setPdfRows((data ?? []) as GeneratedPdfRow[]);
      // setPdfRows(data ?? []);
      setPdfLoading(false);
    })();
  }, []);

  // draft loading logic
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
        setErr(notLoggedInLabel);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("form_instances")
        .select("id, form_slug, title, status, updated_at, created_at, extras")
        .eq("user_id", userRes.user.id)
        .eq("form_slug", "child-registration-request")
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
        {/* <div className={styles.langSwitcher}>
          <LangSwitcher />
        </div> */}
        <div className={styles.arrowBox}>
          <img
            className={styles.backArrow}
            src="/images/backArrow.svg"
            alt="Back"
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/${locale}/forms/`)}
          />{" "}
        </div>

        <div className={styles.bigTitles}>{titleText}</div>
      </div>
      <div className={styles.subTextSection}>
        {subText}
      </div>

      <div className={styles.buttonRow}>
        {/* <div className={styles.buttonContainer}></div> */}
        <button
          type="button"
          onClick={() => router.push("child-registration-request/step-1")}
          className={styles.btnPrimary}
        >
          <div>{newFormLabel}</div>
          <img src="/images/forwardArrow.png"></img>
        </button>
      </div>

      <h2 className={styles.sectionTitle}>{myFormsLabel}</h2>
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
          {pdfRows.map((p, idx) => {
            const rawTitle =
              typeof p.pdf_title === "string" ? p.pdf_title.trim() : "";
            const title =
              (!rawTitle || rawTitle.includes("[object Object]"))
                ? `${untitledBase} ${idx + 1}`
                : rawTitle;

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
                aria-label={`${downloadAria}: ${title}`}
                title={title}
              >
                <div>{title}</div>
                <img src="/images/forwardArrowBlack.svg"></img>
              </button>
            );
          })}
        </div>
      )}

      <h2 className={styles.sectionTitle}>{draftsLabel}</h2>
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
          {rows.map((r, idx) => {
            const rawTitle =
              typeof r.title === "string" ? r.title.trim() : "";
            const title =
              (!rawTitle || rawTitle.includes("[object Object]"))
                ? `${untitledBase} ${idx + 1}`
                : rawTitle;

            return (
              <button
                key={r.id}
                type="button"
                className={styles.draftTile}
                onClick={() => {
                  const step = (r.extras as any)?.currentStep ?? 1;
                  router.push(
                    `/${locale}/forms/child-registration-request/step-${step}?instanceId=${r.id}`,
                  );
                }}
                aria-label={`${continueAria}: ${title}`}
                title={title}
              >
                <div>{title}</div>
                <img src="/images/forwardArrowBlack.svg"></img>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
