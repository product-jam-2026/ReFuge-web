"use client";
import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";

export default function Step2() {
  const router = useRouter();
  const { draft, extras, setExtras, update } = useWizard();

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}>
      {/* <h1 style={{ fontSize: 22, fontWeight: 800 }}>שלב 1: פרטים כלליים + המבקש</h1>

      <label>
        תאריך הטופס (PDF בלבד)
        <input
          type="date"
          value={extras.formDate}
          onChange={(e) => setExtras((p) => ({ ...p, formDate: e.target.value }))}
        />
      </label>

      <label>
        שם פרטי
        <input
          value={draft.intake.step1.firstName}
          onChange={(e) => update("intake.step1.firstName", e.target.value)}
        />
      </label>

      <label>
        שם משפחה
        <input
          value={draft.intake.step1.lastName}
          onChange={(e) => update("intake.step1.lastName", e.target.value)}
        />
      </label>

      <label>
        מספר זהות
        <input
          value={draft.intake.step1.israeliId}
          onChange={(e) => update("intake.step1.israeliId", e.target.value)}
        />
      </label> */}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={() => router.push("./step-3")}>
          הבא →
        </button>
      </div>
    </main>
  );
}
