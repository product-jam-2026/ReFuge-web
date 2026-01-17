"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
        setPdfErr("Not logged in");
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
        setErr("Not logged in");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("form_instances")
        .select("id, form_slug, title, status, updated_at, created_at")
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
    <main
      style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
    >
      <hr style={{ margin: "24px 0" }} />

      <h2 style={{ fontSize: 20, fontWeight: 800 }}>מסמכים שהופקו (PDF)</h2>

      {pdfLoading ? (
        <p style={{ marginTop: 12 }}>טוען…</p>
      ) : pdfErr ? (
        <p style={{ marginTop: 12, color: "crimson" }}>{pdfErr}</p>
      ) : pdfRows.length === 0 ? (
        <p style={{ marginTop: 12 }}>אין PDFים עדיין.</p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <div style={tileGrid}>
            {pdfRows.map((p) => {
              // const title =
              //   (p.form_instances?.[0]?.title ?? "").trim() ||
              //   fileNameFromPath(p.path);

              // const title =
              //   (p.form_instance?.title ?? "").trim() ||
              //   fileNameFromPath(p.path);
              const title =
                (p.pdf_title ?? "").trim() || fileNameFromPath(p.path);
              return (
                <button
                  key={p.id}
                  type="button"
                  style={tile}
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
                  {title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 800 }}>
        טיוטות — בקשה לרישום ילד
      </h1>

      <div
        style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}
      >
        <button
          type="button"
          onClick={() => router.push("child-registration-request/step-1")}
          style={btnPrimary}
        >
          + טופס חדש
        </button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          style={btnSecondary}
        >
          רענן
        </button>
      </div>

      {loading ? (
        <p style={{ marginTop: 16 }}>טוען…</p>
      ) : err ? (
        <p style={{ marginTop: 16, color: "crimson" }}>{err}</p>
      ) : rows.length === 0 ? (
        <p style={{ marginTop: 16 }}>אין טיוטות עדיין.</p>
      ) : (
        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <div style={tileGrid}>
            {rows.map((r) => {
              const title = (r.title ?? "").trim() || "טיוטה ללא שם";

              return (
                <button
                  key={r.id}
                  type="button"
                  style={tile}
                  onClick={() => {
                    // choose what clicking a draft should do:
                    router.push(
                      `child-registration-request/step-3?instanceId=${r.id}`,
                    );
                  }}
                  aria-label={`המשך עריכה: ${title}`}
                  title={title}
                >
                  {title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}

const card: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ccc",
  background: "transparent",
  cursor: "pointer",
};

const tile: React.CSSProperties = {
  width: "100%",
  textAlign: "right",
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 14,
  background: "#fff",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 16,
};

const tileGrid: React.CSSProperties = {
  display: "grid",
  gap: 10,
  marginTop: 12,
};
