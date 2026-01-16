"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";

export default function Step1() {
  const router = useRouter();
  const { draft, update } = useWizard();

  const kids = draft?.intake?.step6?.children ?? [];

  // keep selection as a Set of indexes
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Default: select all children when the page loads / kids change
  useEffect(() => {
    setSelected(new Set(kids.map((_, i) => i)));
  }, [kids.length]);

  const options = useMemo(() => {
    return kids.map((c, i) => {
      const first = (c.firstName ?? "").trim();
      const last = (c.lastName ?? "").trim();
      const label = `${first} ${last}`.trim() || `Child #${i + 1}`;
      return { i, label };
    });
  }, [kids]);

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function onNext() {
    // Filter children based on selection
    const filtered = kids.filter((_, i) => selected.has(i));

    // Persist into wizard draft so step-1 sees only chosen kids
    update("intake.step6.children", filtered);

    // Go to sibling step-2 (relative navigation keeps locale segment)
    router.push("./step-2");
  }

  return (
    <main
      style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
        שלב 0: בחירת ילדים
      </h1>

      <div style={{ display: "grid", gap: 10 }}>
        {options.length === 0 ? (
          <div>לא נמצאו ילדים ב- intake.step6.children</div>
        ) : (
          <fieldset
            style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}
          >
            <legend style={{ padding: "0 8px", fontWeight: 700 }}>
              בחר ילדים להמשך התהליך
            </legend>

            <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
              {options.map(({ i, label }) => (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    border: "1px solid #eee",
                    borderRadius: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setSelected(new Set(kids.map((_, i) => i)))}
                style={secondaryButtonStyle}
              >
                בחר הכל
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                style={secondaryButtonStyle}
              >
                נקה בחירה
              </button>
            </div>
          </fieldset>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={onNext}
            style={buttonStyle}
            disabled={options.length > 0 && selected.size === 0}
            title={selected.size === 0 ? "בחר לפחות ילד אחד" : undefined}
          >
            הבא →
          </button>
        </div>

      </div>
    </main>
  );
}

const buttonStyle: React.CSSProperties = {
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
