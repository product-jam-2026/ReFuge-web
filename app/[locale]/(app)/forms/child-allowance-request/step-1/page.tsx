"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";
import styles from "./page.module.css";

export default function Step1() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  

  // assuming WizardProvider exposes these (like your other examples)
  const { draft, update, extras, setExtras, saveNow, saveStatus } = useWizard();


    // ✅ store which step we are on (so drafts resume correctly)
    useEffect(() => {
      setExtras((p: any) => ({ ...p, currentStep: 3 }));
    }, [setExtras]);
  
  const kids = draft?.intake?.step6?.children ?? [];

  // restore selection from extras (if exists), otherwise default = select all
  const restored = Array.isArray((extras as any)?.step1SelectedChildren)
    ? new Set<number>((extras as any).step1SelectedChildren)
    : null;

  const [selected, setSelected] = useState<Set<number>>(restored ?? new Set());

  // mark current step for draft resume
  useEffect(() => {
    setExtras((p: any) => ({ ...p, currentStep: 1 }));
  }, [setExtras]);

  // when kids list changes and we don't have restored selection, keep none selected by default
  useEffect(() => {
    if (restored) return;
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kids.length]);

  const options = useMemo(() => {
    return kids.map((c, i) => {
      const first = (c.firstName ?? "").trim();
      const last = (c.lastName ?? "").trim();
      const label = `${first} ${last}`.trim() || `Child #${i + 1}`;
      return { i, label };
    });
  }, [kids]);

  function persistSelection(next: Set<number>) {
    setExtras((p: any) => ({
      ...p,
      step1SelectedChildren: Array.from(next),
    }));
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);

      persistSelection(next);
      return next;
    });
  }

  function onNext() {
    const filtered = kids.filter((_, i) => selected.has(i));
    update("intake.step6.children", filtered);
    router.push("./step-2");
  }

  async function onSaveAndExit() {
    const id = await saveNow?.();
    if (id) {
      router.push(`/${locale}/forms/child-allowance-request`);
    }
  }

  const disableNext = options.length > 0 && selected.size === 0;

  if (!draft) {
    return <main className={styles.page}>Loading…</main>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>תביעה לקצבת ילדים</div>
      </div>

      <h2 className={styles.title}>בחר עבור מי מילדך הינך ממלא את הטופס</h2>

      <div className={styles.container}>
        {options.length === 0 ? (
          <div className={styles.emptyText}>
            לא נמצאו ילדים ב- intake.step6.children
          </div>
        ) : (
          <fieldset className={styles.fieldset}>
            <div className={styles.optionsList}>
              {options.map(({ i, label }) => {
                const isSelected = selected.has(i);

                return (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.optionBtn} ${
                      isSelected ? styles.optionBtnActive : ""
                    }`}
                    onClick={() => toggle(i)}
                    aria-pressed={isSelected}
                    title={isSelected ? "נבחר" : "לא נבחר"}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className={styles.footer}>
          <button
            type="button"
            onClick={onNext}
            className={styles.primaryButton}
            disabled={disableNext}
            title={disableNext ? "בחר לפחות ילד אחד" : undefined}
          >
            המשך
          </button>

          <button
            type="button"
            onClick={onSaveAndExit}
            className={styles.secondaryButton}
            disabled={saveStatus === "saving"}
          >
            שמור כטיוטה
          </button>
        </div>
      </div>
    </main>
  );
}
