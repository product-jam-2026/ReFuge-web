"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";

import { useWizard } from "../WizardProvider";
import styles from "./page.module.css";

export default function Step1() {
  const router = useRouter();
  const { draft, update, setExtras, saveNow } = useWizard();
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === "ar";
  const titleText = isArabic
    ? "طلب تسجيل طفل وُلد في إسرائيل لوالد مقيم في إسرائيل"
    : "בקשה לרישום ילד שנולד בישראל להורה תושב ישראלי";
  const subtitleText = isArabic
    ? "اختر أي طفل/أطفال تقوم بتعبئة النموذج لهم"
    : "בחר עבור מי מילדך הינך ממלא את הטופס";
  const noKidsText = isArabic
    ? "لا يوجد لديك أطفال في النظام حاليًا. الرجاء العودة إلى استبيان التسجيل، إضافة الأطفال ثم تعبئة النموذج."
    : "אין לך ילדים כעת במערכת. אנא חזור לשאלון הפתיחה, הוסף ילדים ואז מלא את הטופס.";
  const selectedTitle = isArabic ? "تم الاختيار" : "נבחר";
  const notSelectedTitle = isArabic ? "غير محدد" : "לא נבחר";
  const nextLabel = isArabic ? "متابعة" : "המשך";
  const chooseOneLabel = isArabic ? "اختر طفلًا واحدًا على الأقل" : "בחר לפחות ילד אחד";
  const saveDraftLabel = isArabic ? "حفظ كمسودة" : "שמור כטיוטה";

  const kids = draft?.intake?.step6?.children ?? [];
  const sp = useSearchParams();
  const instanceId = sp.get("instanceId");
  const nextUrl = instanceId ? `./step-2?instanceId=${instanceId}` : "./step-2";

  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    setExtras((p) => ({ ...p, currentStep: 1 }));
  }, [setExtras]);

  useEffect(() => {
    setSelected(new Set());
  }, [kids.length]);

  const options = useMemo(() => {
    return kids.map((c, i) => {
      const first = (c.firstName ?? "").trim();
      const last = (c.lastName ?? "").trim();
      const fallback = isArabic ? `طفل رقم ${i + 1}` : `ילד/ה #${i + 1}`;
      const label = `${first} ${last}`.trim() || fallback;
      return { i, label };
    });
  }, [kids, isArabic]);

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
    update("intake.step6.selectedChildren", filtered);
    router.push(nextUrl);
  }

  const disableNext = options.length > 0 && selected.size === 0;

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          {titleText}
        </div>
      </div>

      <h2 className={styles.title}>{subtitleText}</h2>

      <div className={styles.container}>
        {options.length === 0 ? (
          <div className={styles.emptyText}>
            {noKidsText}
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
                    className={`${styles.optionBtn} ${isSelected ? styles.optionBtnActive : ""}`}
                    onClick={() => toggle(i)}
                    aria-pressed={isSelected}
                    title={isSelected ? selectedTitle : notSelectedTitle}
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
            title={disableNext ? chooseOneLabel : undefined}
          >
            {nextLabel}
          </button>

        </div>
      </div>
    </main>
  );
}
