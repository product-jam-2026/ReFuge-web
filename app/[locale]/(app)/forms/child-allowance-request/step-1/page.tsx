"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";
import styles from "./page.module.css";

export default function Step1() {
  const router = useRouter();
  const { draft, update } = useWizard();

  const kids = draft?.intake?.step6?.children ?? [];

  const [selected, setSelected] = useState<Set<number>>(new Set());

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
    const filtered = kids.filter((_, i) => selected.has(i));
    update("intake.step6.children", filtered);
    router.push("./step-2");
  }

  const disableNext = options.length > 0 && selected.size === 0;

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          תביעה לקצבת ילדים
        </div>
      </div>

      <h2 className={styles.title}>בחר עבור מי מילדך הינך ממלא את הטופס</h2>

      <div className={styles.container}>
        {options.length === 0 ? (
          <div className={styles.emptyText}>
            לא נמצאו ילדים ב- intake.step6.children
          </div>
        ) : (
          <fieldset className={styles.fieldset}>
            {/* <legend className={styles.legend}>בחר ילדים להמשך התהליך</legend> */}

            {/* <div className={styles.optionsList}>
              {options.map(({ i, label }) => (
                <label key={i} className={styles.optionRow}>
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggle(i)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div> */}

            <div className={styles.optionsList}>
              {options.map(({ i, label }) => {
                const isSelected = selected.has(i);

                return (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.optionBtn} ${isSelected ? styles.optionBtnActive : ""}`}
                    onClick={() => toggle(i)}
                    aria-pressed={isSelected}
                    title={isSelected ? "נבחר" : "לא נבחר"}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* <div className={styles.actionsRow}>
              <button
                type="button"
                onClick={() => setSelected(new Set(kids.map((_, i) => i)))}
                className={styles.secondaryButton}
              >
                בחר הכל
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className={styles.secondaryButton}
              >
                נקה בחירה
              </button>
            </div> */}
          </fieldset>
        )}

        <div className={styles.footerRow}>
          <button
            type="button"
            onClick={onNext}
            className={styles.primaryButton}
            disabled={disableNext}
            title={disableNext ? "בחר לפחות ילד אחד" : undefined}
          >
            המשך
          </button>
        </div>
      </div>
    </main>
  );
}
