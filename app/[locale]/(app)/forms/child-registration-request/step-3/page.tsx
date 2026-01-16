"use client";
import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";

export default function Step3() {
  const router = useRouter();
  const { draft, extras, setExtras, update } = useWizard();

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>שלב 2: הורה זר + מצב אישי</h1>

      <label>
        תא דואר (PDF בלבד)
        <input
          value={extras.poBox}
          onChange={(e) => setExtras((p) => ({ ...p, poBox: e.target.value }))}
        />
      </label>

      <label>
        מצב אישי (step3.maritalStatus)
        <select
          value={draft.intake.step3.maritalStatus ?? ""}
          onChange={(e) => update("intake.step3.maritalStatus", e.target.value)}
        >
          <option value="">בחר</option>
          <option value="married">נשוי/אה</option>
          <option value="divorced">גרוש/ה</option>
          <option value="widowed">אלמן/נה</option>
          <option value="single">רווק/ה</option>
          <option value="bigamist">ביגמיסט/ית</option>
        </select>
      </label>

      <label>
        הורה זר - שם פרטי
        <input
          value={draft.intake.step5.person.firstName}
          onChange={(e) => update("intake.step5.person.firstName", e.target.value)}
        />
      </label>

      <label>
        הורה זר - שם משפחה
        <input
          value={draft.intake.step5.person.lastName}
          onChange={(e) => update("intake.step5.person.lastName", e.target.value)}
        />
      </label>

      <label>
        הורה זר - דרכון
        <input
          value={draft.intake.step5.person.passportNumber}
          onChange={(e) => update("intake.step5.person.passportNumber", e.target.value)}
        />
      </label>

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
