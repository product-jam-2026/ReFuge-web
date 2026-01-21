// "use client";

// import { useRouter } from "next/navigation";
// import { useWizard } from "../WizardProvider";
// import styles from "./page.module.css";

// export default function Step2() {
//   const router = useRouter();
//   const { draft, extras, setExtras, update } = useWizard();

//   return (
//     <main className={styles.page}>
//       <div className={styles.imageContainer}>
//         <img
//           className={styles.imageRight}
//           src="/images/child-registration-step2-right.svg"
//         ></img>
//         <img
//           className={styles.imageLeft}
//           src="/images/child-registration-step2-left.svg"
//         ></img>
//       </div>
//       <div className={styles.textContainer}>
//         <div className={styles.mainTextContainer}>
//           <div className={styles.mainText}>نموذجك جاهز</div>
//           <div className={styles.mainText}>הטופס שלך מוכן</div>
//         </div>
//         <div className={styles.subTextContainer}>
//           <div className={styles.subText}>
//             يرجى التأكد من أن جميع البيانات صحيحة قبل الموافقة،يمكنك في أي وقت
//             التحديث وإجراء التغييرات
//           </div>
//           <div className={styles.subText}>
//             אנא וודא כי כל הפרטים נכונים לפני שאתה מאשר, תוכל בכל רגע לעדכן
//             ולבצע שינויים
//           </div>
//         </div>
//       </div>

//       <div className={styles.footerRow}>
//         <button
//           type="button"
//           className={styles.primaryButton}
//           onClick={() => router.push("./step-3")}
//         >
//           המשך
//         </button>
//       </div>
//     </main>
//   );
// }


"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";
import styles from "./page.module.css";

export default function Step2() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const {
    draft,
    update,
    extras,
    setExtras,
    saveNow,
    saveStatus,
    instanceId,
  } = useWizard() as any; // remove "as any" if your types already include these

  const kids = draft?.intake?.step6?.children ?? [];

  const [selected, setSelected] = useState<Set<number>>(new Set());

  // mark current step for reopening drafts
  useEffect(() => {
    setExtras((p: any) => ({ ...p, currentStep: 1 }));
  }, [setExtras]);

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

  const disableNext = options.length > 0 && selected.size === 0;

  async function onNext() {
    const filtered = kids.filter((_, i) => selected.has(i));
    update("intake.step6.children", filtered);

    // next step for draft resume
    setExtras((p: any) => ({ ...p, currentStep: 2 }));

    // save so we have an instanceId to carry forward
    const id = (await saveNow?.()) ?? instanceId;

    const qs = id ? `?instanceId=${encodeURIComponent(id)}` : "";
    router.push(`./step-3${qs}`);
  }

  async function onSaveDraftAndExit() {
    setExtras((p: any) => ({ ...p, currentStep: 1 }));
    const id = (await saveNow?.()) ?? instanceId;

    // go back to the form homepage (same pattern as your other home pages)
    if (id) router.push(`/${locale}/forms/person-registration-request`);
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>תביעה לקצבת ילדים</div>
      </div>

      <h2 className={styles.title}>בחר עבור מי מילדך הינך ממלא את הטופס</h2>

      <div className={styles.container}>
        {options.length === 0 ? (
          <div className={styles.emptyText}>לא נמצאו ילדים ב- intake.step6.children</div>
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

        <div className={styles.footerRow}>
          <button
            type="button"
            onClick={onNext}
            className={styles.primaryButton}
            disabled={disableNext || saveStatus === "saving"}
            title={disableNext ? "בחר לפחות ילד אחד" : undefined}
          >
            המשך
          </button>

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onSaveDraftAndExit}
            disabled={saveStatus === "saving" || !draft}
          >
            שמור כטיוטה
          </button>
        </div>
      </div>
    </main>
  );
}
