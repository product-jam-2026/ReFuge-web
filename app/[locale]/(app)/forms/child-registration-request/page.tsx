"use client";

import React, { useMemo, useState } from "react";
import { fieldMap } from "./fieldMap"; // adjust path
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";


type MaritalStatus =
  | "married"
  | "divorced"
  | "widowed"
  | "single"
  | "bigamist"
  | "";

type ChildRow = {
  firstName: string;
  dateOfBirth: string; // YYYY-MM-DD
  placeOfBirth: string;
};

type FormState = {
  formDate: string;

  israeliApplicant: {
    firstName: string;
    lastName: string;
    idNumber: string;
    address: string;
    phoneMobile: string;
    poBox: string;
    maritalStatus: MaritalStatus;
  };

  foreignParent: {
    firstName: string;
    lastName: string;
    idOrPassportNumber: string;
  };

  children: ChildRow[];

  applicantSignatureName: string;
};

const emptyChild = (): ChildRow => ({
  firstName: "",
  dateOfBirth: "",
  placeOfBirth: "",
});

const initialState: FormState = {
  formDate: "",
  israeliApplicant: {
    firstName: "",
    lastName: "",
    idNumber: "",
    address: "",
    phoneMobile: "",
    poBox: "",
    maritalStatus: "",
  },
  foreignParent: {
    firstName: "",
    lastName: "",
    idOrPassportNumber: "",
  },
  children: [emptyChild(), emptyChild(), emptyChild()],
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
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function safePart(s: string) {
  return (
    s
      .trim()
      .replace(/[^\p{L}\p{N}_-]+/gu, "_")
      .slice(0, 40) || "unknown"
  );
}

export default function ChildRegistrationPage() {
  const [form, setForm] = useState<FormState>(initialState);

  function update(path: string, value: any) {
    setForm((prev) => {
      const next = structuredClone(prev);
      const parts = path.split(".");
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }

  function updateChild(index: number, key: keyof ChildRow, value: string) {
    setForm((prev) => {
      const next = structuredClone(prev);
      next.children[index][key] = value;
      return next;
    });
  }

  function addChildRow() {
    setForm((prev) => ({
      ...prev,
      children: [...prev.children, emptyChild()],
    }));
  }

  function childrenArrayToObject(children: ChildRow[]) {
    const out: Record<string, ChildRow> = {};
    children.forEach((child, idx) => {
      out[`child${idx + 1}`] = child;
    });
    return out;
  }

  const payload = useMemo(() => {
    const childrenClean = form.children.filter(
      (c) => c.firstName.trim() || c.dateOfBirth.trim() || c.placeOfBirth.trim()
    );

    return {
      childRegistrationRequest: {
        formDate: form.formDate,

        israeliApplicant: {
          firstName: form.israeliApplicant.firstName.trim(),
          lastName: form.israeliApplicant.lastName.trim(),
          idNumber: form.israeliApplicant.idNumber.trim(),
          address: form.israeliApplicant.address.trim(),
          phoneMobile: form.israeliApplicant.phoneMobile.trim(),
          poBox: form.israeliApplicant.poBox.trim(),
          maritalStatus: form.israeliApplicant.maritalStatus,
        },

        foreignParent: {
          firstName: form.foreignParent.firstName.trim(),
          lastName: form.foreignParent.lastName.trim(),
          idOrPassportNumber: form.foreignParent.idOrPassportNumber.trim(),
        },

        children: childrenArrayToObject(
          childrenClean.map((c) => ({
            firstName: c.firstName.trim(),
            dateOfBirth: c.dateOfBirth,
            placeOfBirth: c.placeOfBirth.trim(),
          }))
        ),
        applicantSignatureName: form.applicantSignatureName.trim(),
      },
    };
  }, [form]);


async function onSubmit(e: React.FormEvent) {
  e.preventDefault();

  // 1) Build the flat "fields" object where keys match fieldMap.ts
  const fields: Record<string, string> = {
    formDate: form.formDate,

    "israeliApplicant.firstName": form.israeliApplicant.firstName,
    "israeliApplicant.lastName": form.israeliApplicant.lastName,
    "israeliApplicant.idNumber": form.israeliApplicant.idNumber,
    "israeliApplicant.address": form.israeliApplicant.address,
    "israeliApplicant.phoneMobile": form.israeliApplicant.phoneMobile,
    "israeliApplicant.poBox": form.israeliApplicant.poBox,

    "foreignParent.firstName": form.foreignParent.firstName,
    "foreignParent.lastName": form.foreignParent.lastName,
    "foreignParent.idOrPassportNumber": form.foreignParent.idOrPassportNumber,
  };

  // children → fieldMap expects children.child1/2/3.*
  const kids = form.children.filter(
    (c) => c.firstName.trim() || c.dateOfBirth.trim() || c.placeOfBirth.trim()
  );

  for (let i = 0; i < Math.min(3, kids.length); i++) {
    const idx = i + 1;
    fields[`children.child${idx}.firstName`] = kids[i]!.firstName;
    fields[`children.child${idx}.dateOfBirth`] = kids[i]!.dateOfBirth;
    fields[`children.child${idx}.placeOfBirth`] = kids[i]!.placeOfBirth;
  }

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
  const fileName = `child_registration_${safePart(form.israeliApplicant.idNumber)}_${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  downloadPdf(fileName, outBytes);
}

  return (
    <main
      style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        טופס בקשה לרישום ילד שנולד בישראל
      </h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <Field label="תאריך">
          <input
            type="date"
            value={form.formDate}
            onChange={(e) => update("formDate", e.target.value)}
            style={inputStyle}
            required
          />
        </Field>

        <SectionTitle>פרטי המבקש הישראלי</SectionTitle>

        <Field label="שם פרטי">
          <input
            value={form.israeliApplicant.firstName}
            onChange={(e) =>
              update("israeliApplicant.firstName", e.target.value)
            }
            style={inputStyle}
            required
          />
        </Field>

        <Field label="שם משפחה">
          <input
            value={form.israeliApplicant.lastName}
            onChange={(e) =>
              update("israeliApplicant.lastName", e.target.value)
            }
            style={inputStyle}
            required
          />
        </Field>

        <Field label="מספר זהות">
          <input
            value={form.israeliApplicant.idNumber}
            onChange={(e) =>
              update("israeliApplicant.idNumber", e.target.value)
            }
            style={inputStyle}
            required
          />
        </Field>

        <Field label="כתובת מגורים">
          <input
            value={form.israeliApplicant.address}
            onChange={(e) => update("israeliApplicant.address", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="טלפון-פלאפון">
          <input
            value={form.israeliApplicant.phoneMobile}
            onChange={(e) =>
              update("israeliApplicant.phoneMobile", e.target.value)
            }
            style={inputStyle}
            inputMode="tel"
          />
        </Field>

        <Field label="תא דואר">
          <input
            value={form.israeliApplicant.poBox}
            onChange={(e) => update("israeliApplicant.poBox", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="מצב אישי של ההורה הישראלי">
          <select
            value={form.israeliApplicant.maritalStatus}
            onChange={(e) =>
              update(
                "israeliApplicant.maritalStatus",
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

        <SectionTitle>פרטי ההורה הזר</SectionTitle>

        <Field label="שם פרטי">
          <input
            value={form.foreignParent.firstName}
            onChange={(e) => update("foreignParent.firstName", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="שם משפחה">
          <input
            value={form.foreignParent.lastName}
            onChange={(e) => update("foreignParent.lastName", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="מספר זהות / דרכון">
          <input
            value={form.foreignParent.idOrPassportNumber}
            onChange={(e) =>
              update("foreignParent.idOrPassportNumber", e.target.value)
            }
            style={inputStyle}
          />
        </Field>

        <SectionTitle>שמות הילדים שרישומם מבוקש</SectionTitle>

        {form.children.map((child, i) => (
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
                value={child.dateOfBirth}
                onChange={(e) => updateChild(i, "dateOfBirth", e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="מקום הלידה">
              <input
                value={child.placeOfBirth}
                onChange={(e) => updateChild(i, "placeOfBirth", e.target.value)}
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

        <SectionTitle>חתימה</SectionTitle>

        <Field label="שם חתימה (במקום חתימה ידנית)">
          <input
            value={form.applicantSignatureName}
            onChange={(e) => update("applicantSignatureName", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <button type="submit" style={buttonStyle}>
          יצוא ל-JSON (הורדה)
        </button>

        <details style={{ marginTop: 8 }}>
          <summary>תצוגה מקדימה של ה-JSON</summary>
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
