"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fieldMap } from "./fieldMap"; // same folder as page.tsx (adjust if needed)
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import demo from "@/public/demo/intake.demo.json"; // <-- create src/demo/intake.demo.json
import { intakeToPdfFields } from "./intakeToPdfFields";

type MaritalStatus =
  | "married"
  | "divorced"
  | "widowed"
  | "single"
  | "bigamist"
  | "";

type IntakeRecord = {
  intake: {
    step1: {
      lastName: string;
      firstName: string;
      oldLastName: string;
      oldFirstName: string;
      gender: string;
      birthDate: string;
      nationality: string;
      israeliId: string;
      passportNumber: string;
      passportIssueDate: string;
      passportExpiryDate: string;
      passportIssueCountry: string;
      phone: string;
      email: string;
    };
    step2: {
      residenceCountry: string;
      residenceCity: string;
      residenceAddress: string;
      visaType: string;
      visaStartDate: string;
      visaEndDate: string;
      entryDate: string;
    };
    step3: {
      maritalStatus: string; // we'll store MaritalStatus but keep it string-compatible
      statusDate: string;
      registeredAddress: {
        city: string;
        street: string;
        houseNumber: string;
        entry: string;
        apartment: string;
        zip: string;
      };
      mailingDifferent: boolean;
      mailingAddress: {
        city: string;
        street: string;
        houseNumber: string;
        entry: string;
        apartment: string;
        zip: string;
      };
      employmentStatus: string;
      notWorkingReason: string;
      occupation: string;
    };
    step4: {
      healthFund: string;
      bank: { bankName: string; branch: string; accountNumber: string };
      nationalInsurance: {
        hasFile: string;
        fileNumber: string;
        getsAllowance: string;
        allowanceType: string;
        allowanceFileNumber: string;
      };
    };
    step5: {
      person: {
        lastName: string;
        firstName: string;
        oldLastName: string;
        oldFirstName: string;
        gender: string;
        birthDate: string;
        nationality: string;
        israeliId: string;
        passportNumber: string;
      };
      maritalStatus: string;
      statusDate: string;
      phone: string;
      email: string;
    };
    step6: {
      children: Array<{
        lastName: string;
        firstName: string;
        gender: string;
        birthDate: string; // YYYY-MM-DD
        nationality: string; // we'll use this as "placeOfBirth" for the PDF
        israeliId: string;
        residenceCountry: string;
        entryDate: string;
      }>;
    };
  };
};

type ExtrasState = {
  formDate: string; // for the PDF header field "formDate" (not in DB template)
  poBox: string; // PDF has poBox but DB template doesn't
  applicantSignatureName: string; // optional; your fieldMap snippet didn't include it
};

const initialExtras: ExtrasState = {
  formDate: "",
  poBox: "",
  applicantSignatureName: "",
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

function downloadPdf(filename: string, pdfBytes: Uint8Array) {
  // const blob = new Blob([pdfBytes], { type: "application/pdf" });
  // const url = URL.createObjectURL(blob);

  const copy = new Uint8Array(pdfBytes); // copies into a new ArrayBuffer
  const blob = new Blob([copy.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);



  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

// function safePart(s: string) {
//   return (
//     s
//       .trim()
//       .replace(/[^\p{L}\p{N}_-]+/gu, "_")
//       .slice(0, 40) || "unknown"
//   );
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


function isTruthyForCheckbox(value: string) {
  const v = (value ?? "").toString().trim().toLowerCase();
  return v !== "" && v !== "0" && v !== "false" && v !== "no";
}

export default function ChildRegistrationPage() {
  // DB-shaped draft (what you will later store in Supabase)
  const [draft, setDraft] = useState<IntakeRecord | null>(null);

  // UI-only extras (not in DB template)
  const [extras, setExtras] = useState<ExtrasState>(initialExtras);

  // Hydrate ON PAGE LOAD from demo JSON
  useEffect(() => {
    setDraft(structuredClone(demo) as IntakeRecord);

    // optional: initialize formDate to today for convenience
    setExtras((prev) => ({
      ...prev,
      formDate: prev.formDate || new Date().toISOString().slice(0, 10),
    }));
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
      next.intake.step6.children[index][key] = value as any;
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
  }

  const payload = useMemo(() => {
    if (!draft) return null;

    // Keep DB template clean: remove empty children rows (optional)
    const kids = (draft.intake.step6.children ?? []).filter(
      (c) =>
        (c.firstName ?? "").trim() ||
        (c.birthDate ?? "").trim() ||
        (c.nationality ?? "").trim() ||
        (c.lastName ?? "").trim()
    );

    const cleaned = structuredClone(draft);
    cleaned.intake.step6.children = kids;

    return cleaned; // this is what you'd store later
  }, [draft]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;

    // 1) Build flat "fields" matching fieldMap.ts via a single mapper
    const fields = intakeToPdfFields(draft, {
      formDate: extras.formDate || new Date().toISOString().slice(0, 10),
      poBox: extras.poBox || "",
    });

    // // 1) Build the flat "fields" object where keys match fieldMap.ts
    // const s1 = draft.intake.step1;
    // const s2 = draft.intake.step2;
    // const s3 = draft.intake.step3;
    // const s5 = draft.intake.step5;
    // const kids = (draft.intake.step6.children ?? []).filter(
    //   (c) =>
    //     (c.firstName ?? "").trim() ||
    //     (c.birthDate ?? "").trim() ||
    //     (c.nationality ?? "").trim()
    // );

    // const fields: Record<string, string> = {
    //   // PDF has a formDate field
    //   formDate: extras.formDate || new Date().toISOString().slice(0, 10),

    //   // Applicant -> from DB template
    //   "israeliApplicant.firstName": s1.firstName ?? "",
    //   "israeliApplicant.lastName": s1.lastName ?? "",
    //   "israeliApplicant.idNumber": s1.israeliId ?? "",
    //   "israeliApplicant.address": s2.residenceAddress ?? "",
    //   "israeliApplicant.phoneMobile": s1.phone ?? "",
    //   "israeliApplicant.poBox": extras.poBox ?? "",

    //   // Foreign parent -> from DB template step5.person
    //   "foreignParent.firstName": s5.person.firstName ?? "",
    //   "foreignParent.lastName": s5.person.lastName ?? "",
    //   "foreignParent.idOrPassportNumber":
    //     s5.person.passportNumber || s5.person.israeliId || "",
    // };

    // // children → PDF expects children.child1/2/3.*
    // for (let i = 0; i < Math.min(3, kids.length); i++) {
    //   const idx = i + 1;
    //   fields[`children.child${idx}.firstName`] = kids[i]!.firstName ?? "";
    //   fields[`children.child${idx}.dateOfBirth`] = kids[i]!.birthDate ?? "";

    //   // Your DB template doesn't have placeOfBirth; we use nationality as the value that appears in the PDF
    //   fields[`children.child${idx}.placeOfBirth`] = kids[i]!.nationality ?? "";
    // }

    // // marital status checkboxes
    // const status = (s3.maritalStatus ?? "") as MaritalStatus;
    // if (status) {
    //   // only one should be checked
    //   fields[`israeliApplicant.maritalStatus.${status}`] = "1";
    // }

    // 2) Fetch template PDF + font (from public/)
    const [tplRes, fontRes] = await Promise.all([
      fetch("/forms/child-registration-request.pdf"),
      fetch("/fonts/SimplerPro-Regular.otf"),
    ]);

    if (!tplRes.ok) throw new Error("Failed to load template PDF");
    if (!fontRes.ok) throw new Error("Failed to load font");

    const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
    const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

    // 3) Fill PDF with coordinates from fieldMap.ts
    const outBytes = await fillFieldsToNewPdfBytesClient(
      templateBytes,
      fields,
      fieldMap,
      {
        fontBytes,
        autoDetectRtl: true,
        defaultRtlAlignRight: true,
      }
    );

    // 4) Download the result
      const s1 = (draft as any).intake.step1;

    const fileName = `child_registration_${safePart(
      s1.israeliId || s1.passportNumber || s1.lastName || "unknown"
    )}_${new Date().toISOString().slice(0, 10)}.pdf`;

    downloadPdf(fileName, outBytes);
  }

  if (!draft || !payload) {
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
        טופס בקשה לרישום ילד שנולד בישראל
      </h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <SectionTitle>כללי</SectionTitle>

        <Field label="תאריך הטופס (PDF בלבד)">
          <input
            type="date"
            value={extras.formDate}
            onChange={(e) =>
              setExtras((p) => ({ ...p, formDate: e.target.value }))
            }
            style={inputStyle}
            required
          />
        </Field>

        <SectionTitle>פרטי המבקש הישראלי</SectionTitle>

        <Field label="שם פרטי">
          <input
            value={draft.intake.step1.firstName}
            onChange={(e) => update("intake.step1.firstName", e.target.value)}
            style={inputStyle}
            required
          />
        </Field>

        <Field label="שם משפחה">
          <input
            value={draft.intake.step1.lastName}
            onChange={(e) => update("intake.step1.lastName", e.target.value)}
            style={inputStyle}
            required
          />
        </Field>

        <Field label="מספר זהות">
          <input
            value={draft.intake.step1.israeliId}
            onChange={(e) => update("intake.step1.israeliId", e.target.value)}
            style={inputStyle}
            required
          />
        </Field>

        <Field label="כתובת מגורים (DB: step2.residenceAddress)">
          <input
            value={draft.intake.step2.residenceAddress}
            onChange={(e) =>
              update("intake.step2.residenceAddress", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <Field label="טלפון-פלאפון">
          <input
            value={draft.intake.step1.phone}
            onChange={(e) => update("intake.step1.phone", e.target.value)}
            style={inputStyle}
            inputMode="tel"
          />
        </Field>

        <Field label="תא דואר (PDF בלבד)">
          <input
            value={extras.poBox}
            onChange={(e) =>
              setExtras((p) => ({ ...p, poBox: e.target.value }))
            }
            style={inputStyle}
          />
        </Field>

        <Field label="מצב אישי (DB: step3.maritalStatus)">
          <select
            value={(draft.intake.step3.maritalStatus ?? "") as MaritalStatus}
            onChange={(e) =>
              update(
                "intake.step3.maritalStatus",
                e.target.value as MaritalStatus
              )
            }
            style={inputStyle}
          >
            <option value="">בחר</option>
            <option value="married">נשוי/אה</option>
            <option value="divorced">גרוש/ה</option>
            <option value="widowed">אלמן/נה</option>
            <option value="single">רווק/ה</option>
            <option value="bigamist">ביגמיסט/ית</option>
          </select>
        </Field>

        <SectionTitle>פרטי ההורה הזר (DB: step5.person)</SectionTitle>

        <Field label="שם פרטי">
          <input
            value={draft.intake.step5.person.firstName}
            onChange={(e) =>
              update("intake.step5.person.firstName", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <Field label="שם משפחה">
          <input
            value={draft.intake.step5.person.lastName}
            onChange={(e) =>
              update("intake.step5.person.lastName", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <Field label="מספר זהות / דרכון (DB: step5.person.passportNumber)">
          <input
            value={draft.intake.step5.person.passportNumber}
            onChange={(e) =>
              update("intake.step5.person.passportNumber", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <SectionTitle>פרטי הילדים (DB: step6.children)</SectionTitle>

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

            <Field label="שם פרטי">
              <input
                value={child.firstName}
                onChange={(e) => updateChild(i, "firstName", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="תאריך לידה">
              <input
                type="date"
                value={child.birthDate}
                onChange={(e) => updateChild(i, "birthDate", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label='מקום לידה (ל-PDF בלבד; נשמר ב-DB בשדה "nationality")'>
              <input
                value={child.nationality}
                onChange={(e) => updateChild(i, "nationality", e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>
        ))}

        <button
          type="button"
          onClick={addChildRow}
          style={secondaryButtonStyle}
        >
          + הוסף ילד/ה נוסף/ת
        </button>

        <SectionTitle>חתימה (אופציונלי)</SectionTitle>

        <Field label="שם חתימה (לא נשמר ב-DB template כרגע)">
          <input
            value={extras.applicantSignatureName}
            onChange={(e) =>
              setExtras((p) => ({
                ...p,
                applicantSignatureName: e.target.value,
              }))
            }
            style={inputStyle}
          />
        </Field>

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
