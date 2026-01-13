"use client";

import React, { useEffect, useMemo, useState } from "react";
import demo from "@/public/demo/intake.demo.json";
import { fieldMap } from "./fieldMap";
import { intakeToPdfFields } from "./intakeToPdfFields";
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import { useRouter } from "next/navigation";

type IntakeRecord = typeof demo;

type ExtrasState = {
  father: {
    phoneHome: string;
    emailPrefix: string;
    emailPostfix: string;
  };
  allowanceRequester: {
    phoneHome: string;
    emailPrefix: string;
    emailPostfix: string;
  };
  bankAccount: {
    branchName: string;
    branchNumber: string;
    owner1: string;
    owner2: string;
  };
  children: Array<{
    firstEntryDate: string;
    fileJoinDate: string;
  }>;
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

// function downloadPdf(filename: string, pdfBytes: Uint8Array) {
//   const blob = new Blob([pdfBytes], { type: "application/pdf" });
//   const url = URL.createObjectURL(blob);

//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();

//   URL.revokeObjectURL(url);
// }

function safePart(s: string) {
  return (
    (s ?? "")
      .toString()
      .trim()
      // .replace(/[^\p{L}\p{N}_-]+/gu, "_")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 40) || "unknown"
  );
}

function splitEmail(email: string) {
  const e = (email ?? "").trim();
  const at = e.indexOf("@");
  if (at === -1) return { prefix: e, postfix: "" };
  return { prefix: e.slice(0, at), postfix: e.slice(at + 1) };
}

function fullName(first: string, last: string) {
  return `${(first ?? "").trim()} ${(last ?? "").trim()}`.trim();
}

function emptyChildExtras(): ExtrasState["children"][number] {
  return { firstEntryDate: "", fileJoinDate: "" };
}

export default function ChildAllowanceRequestPage() {
  const [draft, setDraft] = useState<IntakeRecord | null>(null);
  const [extras, setExtras] = useState<ExtrasState | null>(null);
  const router = useRouter();

  // Hydrate ON PAGE LOAD from demo JSON
  useEffect(() => {
    const d = structuredClone(demo) as IntakeRecord;
    setDraft(d);

    const fatherEmail = splitEmail(d.intake.step1.email);
    const reqEmail = splitEmail(d.intake.step5.email);

    const owners = {
      owner1: fullName(d.intake.step1.firstName, d.intake.step1.lastName),
      owner2: fullName(
        d.intake.step5.person.firstName,
        d.intake.step5.person.lastName
      ),
    };

    const kids = d.intake.step6.children ?? [];
    const kidsExtras = kids.map((k) => ({
      firstEntryDate: k.entryDate ?? "",
      fileJoinDate: "",
    }));

    // Ensure at least 3 extras rows for convenience (PDF supports 3 kids)
    while (kidsExtras.length < 3) kidsExtras.push(emptyChildExtras());

    setExtras({
      father: {
        phoneHome: "",
        emailPrefix: fatherEmail.prefix,
        emailPostfix: fatherEmail.postfix,
      },
      allowanceRequester: {
        phoneHome: "",
        emailPrefix: reqEmail.prefix,
        emailPostfix: reqEmail.postfix,
      },
      bankAccount: {
        branchName: "",
        branchNumber: d.intake.step4.bank.branch ?? "",
        owner1: owners.owner1,
        owner2: owners.owner2,
      },
      children: kidsExtras,
    });
  }, []);

  function update(path: string, value: any) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = structuredClone(prev);
      const parts = path.split(".");
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }

  function updateChild(
    index: number,
    key: keyof IntakeRecord["intake"]["step6"]["children"][number],
    value: string
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      if (!next.intake.step6.children[index]) return next;
      (next.intake.step6.children[index] as any)[key] = value;
      return next;
    });
  }

  function addChildRow() {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.intake.step6.children.push({
        lastName: "",
        firstName: "",
        gender: "",
        birthDate: "",
        nationality: "",
        israeliId: "",
        residenceCountry: "",
        entryDate: "",
      });
      return next;
    });

    setExtras((prev) => {
      if (!prev) return prev;
      return { ...prev, children: [...prev.children, emptyChildExtras()] };
    });
  }

  const payload = useMemo(() => {
    if (!draft) return null;

    // keep DB clean: remove empty children rows (optional)
    const kids = (draft.intake.step6.children ?? []).filter(
      (c) =>
        (c.firstName ?? "").trim() ||
        (c.lastName ?? "").trim() ||
        (c.israeliId ?? "").trim() ||
        (c.birthDate ?? "").trim()
    );

    const cleaned = structuredClone(draft);
    cleaned.intake.step6.children = kids;
    return cleaned;
  }, [draft]);

  function uint8ToBase64(u8: Uint8Array) {
    // chunked to avoid call stack / memory issues
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < u8.length; i += chunkSize) {
      binary += String.fromCharCode(
        ...Array.from(u8.subarray(i, i + chunkSize))
      );
    }
    return btoa(binary);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payload || !extras) return;

    // Base mapping from DB intake -> PDF fields
    const baseFields = intakeToPdfFields(payload as any);

    // Overlay "extras" (PDF-only fields / split email / missing DB fields)
    const mergedFields: Record<string, string> = {
      ...baseFields,

      "father.phoneHome": extras.father.phoneHome ?? "",
      "father.emailPrefix": extras.father.emailPrefix ?? "",
      "father.emailPostfix": extras.father.emailPostfix ?? "",

      "allowanceRequester.phoneHome": extras.allowanceRequester.phoneHome ?? "",
      "allowanceRequester.emailPrefix":
        extras.allowanceRequester.emailPrefix ?? "",
      "allowanceRequester.emailPostfix":
        extras.allowanceRequester.emailPostfix ?? "",

      "bankAccount.owner1": extras.bankAccount.owner1 ?? "",
      "bankAccount.owner2": extras.bankAccount.owner2 ?? "",
      "bankAccount.branchName": extras.bankAccount.branchName ?? "",
      "bankAccount.branchNumber": extras.bankAccount.branchNumber ?? "",
    };

    // children extras (PDF supports up to 3)
    for (let i = 0; i < 3; i++) {
      const idx = i + 1;
      mergedFields[`child${idx}.firstEntryDate`] =
        extras.children[i]?.firstEntryDate ?? "";
      mergedFields[`child${idx}.fileJoinDate`] =
        extras.children[i]?.fileJoinDate ?? "";
    }

    // Fetch template PDF + font
    const [tplRes, fontRes] = await Promise.all([
      fetch("/forms/child-allowance-request.pdf"),
      fetch("/fonts/SimplerPro-Regular.otf"),
    ]);

    if (!tplRes.ok) throw new Error("Failed to load template PDF");
    if (!fontRes.ok) throw new Error("Failed to load font");

    const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
    const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

    const outBytes = await fillFieldsToNewPdfBytesClient(
      templateBytes,
      mergedFields,
      fieldMap,
      {
        fontBytes,
        autoDetectRtl: true,
        defaultRtlAlignRight: true,
      }
    );

    const s1 = payload.intake.step1;
    const fileName = `child_allowance_${safePart(
      s1.israeliId || s1.passportNumber || s1.lastName || "unknown"
    )}_${new Date().toISOString().slice(0, 10)}.pdf`;

    // downloadPdf(fileName, outBytes);

    // ✅ Store + redirect (instead of downloading here)
    const key = `pdf_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(
      key,
      JSON.stringify({
        fileName,
        bytesBase64: uint8ToBase64(outBytes),
      })
    );

    router.push(
      `/forms/child-allowance-request/download?key=${encodeURIComponent(key)}`
    );
  }

  if (!draft || !payload || !extras) {
    return (
      <main style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
        Loading…
      </main>
    );
  }

  const kids = draft.intake.step6.children ?? [];

  return (
    <main
      style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        טופס בקשה לקצבת ילדים
      </h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <SectionTitle>פרטי האב (DB: step1/step2/step3)</SectionTitle>

        <Field label="שם פרטי">
          <input
            value={draft.intake.step1.firstName}
            onChange={(e) => update("intake.step1.firstName", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="שם משפחה">
          <input
            value={draft.intake.step1.lastName}
            onChange={(e) => update("intake.step1.lastName", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="מספר זהות">
          <input
            value={draft.intake.step1.israeliId}
            onChange={(e) => update("intake.step1.israeliId", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="תאריך לידה">
          <input
            type="date"
            value={draft.intake.step1.birthDate}
            onChange={(e) => update("intake.step1.birthDate", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="תאריך כניסה לישראל (DB: step2.entryDate)">
          <input
            type="date"
            value={draft.intake.step2.entryDate}
            onChange={(e) => update("intake.step2.entryDate", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <SectionTitle>כתובת האב (DB: step3.registeredAddress)</SectionTitle>

        <Field label="רחוב">
          <input
            value={draft.intake.step3.registeredAddress.street}
            onChange={(e) =>
              update("intake.step3.registeredAddress.street", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <Field label="מספר בית">
            <input
              value={draft.intake.step3.registeredAddress.houseNumber}
              onChange={(e) =>
                update(
                  "intake.step3.registeredAddress.houseNumber",
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </Field>

          <Field label="כניסה">
            <input
              value={draft.intake.step3.registeredAddress.entry}
              onChange={(e) =>
                update("intake.step3.registeredAddress.entry", e.target.value)
              }
              style={inputStyle}
            />
          </Field>

          <Field label="דירה">
            <input
              value={draft.intake.step3.registeredAddress.apartment}
              onChange={(e) =>
                update(
                  "intake.step3.registeredAddress.apartment",
                  e.target.value
                )
              }
              style={inputStyle}
            />
          </Field>

          <Field label="מיקוד">
            <input
              value={draft.intake.step3.registeredAddress.zip}
              onChange={(e) =>
                update("intake.step3.registeredAddress.zip", e.target.value)
              }
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="עיר">
          <input
            value={draft.intake.step3.registeredAddress.city}
            onChange={(e) =>
              update("intake.step3.registeredAddress.city", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <SectionTitle>טלפון / אימייל האב</SectionTitle>

        <Field label="טלפון נייד (DB: step1.phone)">
          <input
            value={draft.intake.step1.phone}
            onChange={(e) => update("intake.step1.phone", e.target.value)}
            style={inputStyle}
            inputMode="tel"
          />
        </Field>

        <Field label="טלפון בבית (PDF בלבד)">
          <input
            value={extras.father.phoneHome}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? { ...p, father: { ...p.father, phoneHome: e.target.value } }
                  : p
              )
            }
            style={inputStyle}
            inputMode="tel"
          />
        </Field>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <Field label="אימייל (לפני @) (PDF בלבד)">
            <input
              value={extras.father.emailPrefix}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        father: { ...p.father, emailPrefix: e.target.value },
                      }
                    : p
                )
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="אימייל (אחרי @) (PDF בלבד)">
            <input
              value={extras.father.emailPostfix}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        father: { ...p.father, emailPostfix: e.target.value },
                      }
                    : p
                )
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>
        </div>

        <SectionTitle>
          פרטי מבקש הקצבה (DB: step5 + step3 mailing/registered)
        </SectionTitle>

        <Field label="שם פרטי (DB: step5.person.firstName)">
          <input
            value={draft.intake.step5.person.firstName}
            onChange={(e) =>
              update("intake.step5.person.firstName", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <Field label="שם משפחה (DB: step5.person.lastName)">
          <input
            value={draft.intake.step5.person.lastName}
            onChange={(e) =>
              update("intake.step5.person.lastName", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <Field label="מספר זהות (DB: step5.person.israeliId)">
          <input
            value={draft.intake.step5.person.israeliId}
            onChange={(e) =>
              update("intake.step5.person.israeliId", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <Field label="טלפון נייד (DB: step5.phone)">
          <input
            value={draft.intake.step5.phone}
            onChange={(e) => update("intake.step5.phone", e.target.value)}
            style={inputStyle}
            inputMode="tel"
          />
        </Field>

        <Field label="טלפון בבית (PDF בלבד)">
          <input
            value={extras.allowanceRequester.phoneHome}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      allowanceRequester: {
                        ...p.allowanceRequester,
                        phoneHome: e.target.value,
                      },
                    }
                  : p
              )
            }
            style={inputStyle}
            inputMode="tel"
          />
        </Field>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <Field label="אימייל (לפני @) (PDF בלבד)">
            <input
              value={extras.allowanceRequester.emailPrefix}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        allowanceRequester: {
                          ...p.allowanceRequester,
                          emailPrefix: e.target.value,
                        },
                      }
                    : p
                )
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="אימייל (אחרי @) (PDF בלבד)">
            <input
              value={extras.allowanceRequester.emailPostfix}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        allowanceRequester: {
                          ...p.allowanceRequester,
                          emailPostfix: e.target.value,
                        },
                      }
                    : p
                )
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>
        </div>

        <SectionTitle>חשבון בנק (DB: step4.bank + PDF extras)</SectionTitle>

        <Field label="בעל/ת חשבון 1 (PDF בלבד)">
          <input
            value={extras.bankAccount.owner1}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      bankAccount: { ...p.bankAccount, owner1: e.target.value },
                    }
                  : p
              )
            }
            style={inputStyle}
          />
        </Field>

        <Field label="בעל/ת חשבון 2 (PDF בלבד)">
          <input
            value={extras.bankAccount.owner2}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      bankAccount: { ...p.bankAccount, owner2: e.target.value },
                    }
                  : p
              )
            }
            style={inputStyle}
          />
        </Field>

        <Field label="שם הבנק (DB: step4.bank.bankName)">
          <input
            value={draft.intake.step4.bank.bankName}
            onChange={(e) =>
              update("intake.step4.bank.bankName", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <Field label="שם סניף (PDF בלבד)">
            <input
              value={extras.bankAccount.branchName}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        bankAccount: {
                          ...p.bankAccount,
                          branchName: e.target.value,
                        },
                      }
                    : p
                )
              }
              style={inputStyle}
            />
          </Field>

          <Field label="מספר סניף (DB: step4.bank.branch)">
            <input
              value={extras.bankAccount.branchNumber}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        bankAccount: {
                          ...p.bankAccount,
                          branchNumber: e.target.value,
                        },
                      }
                    : p
                )
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>
        </div>

        <Field label="מספר חשבון (DB: step4.bank.accountNumber)">
          <input
            value={draft.intake.step4.bank.accountNumber}
            onChange={(e) =>
              update("intake.step4.bank.accountNumber", e.target.value)
            }
            style={inputStyle}
            dir="ltr"
          />
        </Field>

        <SectionTitle>
          פרטי הילדים (DB: step6.children) — ה-PDF תומך עד 3
        </SectionTitle>

        {kids.map((child, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 700 }}>ילד/ה #{i + 1}</div>

            <Field label="מספר זהות (DB: child.israeliId)">
              <input
                value={child.israeliId}
                onChange={(e) => updateChild(i, "israeliId", e.target.value)}
                style={inputStyle}
                dir="ltr"
              />
            </Field>

            <Field label="שם משפחה (DB: child.lastName)">
              <input
                value={child.lastName}
                onChange={(e) => updateChild(i, "lastName", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="שם פרטי (DB: child.firstName)">
              <input
                value={child.firstName}
                onChange={(e) => updateChild(i, "firstName", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="תאריך לידה (DB: child.birthDate)">
              <input
                type="date"
                value={child.birthDate}
                onChange={(e) => updateChild(i, "birthDate", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="תאריך כניסה (DB: child.entryDate)">
              <input
                type="date"
                value={child.entryDate}
                onChange={(e) => updateChild(i, "entryDate", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="תאריך כניסה ראשון (PDF בלבד)">
              <input
                type="date"
                value={extras.children[i]?.firstEntryDate ?? ""}
                onChange={(e) =>
                  setExtras((p) => {
                    if (!p) return p;
                    const next = structuredClone(p);
                    if (!next.children[i])
                      next.children[i] = emptyChildExtras();
                    next.children[i]!.firstEntryDate = e.target.value;
                    return next;
                  })
                }
                style={inputStyle}
              />
            </Field>

            <Field label="תאריך פתיחת תיק/הצטרפות (PDF בלבד)">
              <input
                type="date"
                value={extras.children[i]?.fileJoinDate ?? ""}
                onChange={(e) =>
                  setExtras((p) => {
                    if (!p) return p;
                    const next = structuredClone(p);
                    if (!next.children[i])
                      next.children[i] = emptyChildExtras();
                    next.children[i]!.fileJoinDate = e.target.value;
                    return next;
                  })
                }
                style={inputStyle}
              />
            </Field>

            {i >= 2 ? (
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                שים לב: ה-PDF תומך עד 3 ילדים. ילדים נוספים יוצגו כאן ב-UI, אבל
                לא ייכנסו ל-PDF.
              </div>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          onClick={addChildRow}
          style={secondaryButtonStyle}
        >
          + הוסף ילד/ה נוסף/ת
        </button>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() =>
              downloadJson(
                `intake_${safePart(
                  draft.intake.step1.email ||
                    draft.intake.step1.israeliId ||
                    "demo"
                )}.json`,
                payload
              )
            }
          >
            הורד JSON (DB record)
          </button>

          <button type="submit" style={buttonStyle}>
            הורד PDF
          </button>
        </div>

        <details style={{ marginTop: 8 }}>
          <summary>תצוגה מקדימה של ה-JSON (DB record)</summary>
          <pre
            style={{
              background: "#111",
              color: "#eee",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      </form>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{children}</h2>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span>
        {label} {required ? <span style={{ color: "crimson" }}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "12px 14px",
  borderRadius: 12,
  border: "none",
  fontSize: 16,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ccc",
  background: "transparent",
  fontSize: 15,
  cursor: "pointer",
};
