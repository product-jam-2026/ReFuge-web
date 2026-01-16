"use client";

import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";

type MaritalStatus =
  | "married"
  | "divorced"
  | "widowed"
  | "single"
  | "bigamist"
  | "";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
  display: "grid",
  gap: 10,
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

export default function Step3() {
  const router = useRouter();
  const { draft, extras, setExtras, update } = useWizard();

  // In case your WizardProvider loads draft async
  if (!draft) {
    return (
      <main style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
        Loading…
      </main>
    );
  }

  const kids = draft.intake.step6.children ?? [];

  function updateChild(i: number, key: string, value: string) {
    // uses the generic update() you already have
    update(`intake.step6.children.${i}.${key}`, value);
  }

  function addChildRow() {
    const nextChildren = [
      ...(draft.intake.step6.children ?? []),
      {
        lastName: "",
        firstName: "",
        gender: "",
        birthDate: "",
        nationality: "",
        israeliId: "",
        residenceCountry: "",
        entryDate: "",
      },
    ];
    update("intake.step6.children", nextChildren);
  }

  return (
    <main
      style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>
        שלב 2: פרטים כלליים + המבקש + הורה זר + ילדים
      </h1>

      {/* GENERAL */}
      {/* <SectionTitle>כללי</SectionTitle>

      <Field label="תאריך הטופס (PDF בלבד)">
        <input
          type="date"
          value={extras.formDate}
          onChange={(e) =>
            setExtras((p) => ({ ...p, formDate: e.target.value }))
          }
          style={inputStyle}
        />
      </Field> */}

      {/* APPLICANT */}
      <SectionTitle>פרטי המבקש הישראלי</SectionTitle>

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
          onChange={(e) => setExtras((p) => ({ ...p, poBox: e.target.value }))}
          style={inputStyle}
        />
      </Field>

      <Field label="מצב אישי (DB: step3.maritalStatus)">
        <select
          value={(draft.intake.step3.maritalStatus ?? "") as MaritalStatus}
          onChange={(e) =>
            update("intake.step3.maritalStatus", e.target.value as MaritalStatus)
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

      {/* FOREIGN PARENT */}
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

      {/* CHILDREN */}
      <SectionTitle>פרטי הילדים (DB: step6.children)</SectionTitle>

      {kids.map((child, i) => (
        <div key={i} style={cardStyle}>
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
        style={{
          marginTop: 8,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid #ccc",
          background: "transparent",
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        + הוסף ילד/ה נוסף/ת
      </button>

      {/* SIGNATURE */}
      {/* <SectionTitle>חתימה (אופציונלי)</SectionTitle>

      <Field label="שם חתימה (לא נשמר ב-DB template כרגע)">
        <input
          value={extras.applicantSignatureName}
          onChange={(e) =>
            setExtras((p) => ({ ...p, applicantSignatureName: e.target.value }))
          }
          style={inputStyle}
        />
      </Field> */}

      {/* NAV */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => router.back()}>
          ← הקודם
        </button>

        <button type="button" onClick={() => router.push("./step-4")}>
          הבא →
        </button>
      </div>
    </main>
  );
}
