"use client";
import React, { useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useWizard } from "../WizardProvider";
import styles from "./page.module.css";

export default function Step2() {
  const router = useRouter();
  const { draft, extras, setExtras, update, saveNow } = useWizard();
  useEffect(() => {
    setExtras((p) => ({ ...p, currentStep: 2 }));
  }, [setExtras]);

  const sp = useSearchParams();
  const instanceId = sp.get("instanceId");
  const params = useParams();
  const locale = params.locale as string;
  const isArabic = locale === "ar";
  const mainText = isArabic ? "نموذجك جاهز" : "הטופס שלך מוכן";
  const subText = isArabic
    ? "يرجى التأكد من أن جميع البيانات صحيحة قبل الموافقة، يمكنك في أي وقت التحديث وإجراء التغييرات"
    : "אנא וודא כי כל הפרטים נכונים לפני שאתה מאשר, תוכל בכל רגע לעדכן ולבצע שינויים";
  const nextLabel = isArabic ? "متابعة" : "המשך";
  const saveDraftLabel = isArabic ? "حفظ كمسودة" : "שמור כטיוטה";

  const nextUrl = instanceId ? `./step-3?instanceId=${instanceId}` : "./step-3";

  return (
    <main className={styles.page}>
      <div className={styles.imageContainer}>
        <img
          className={styles.imageRight}
          src="/images/child-registration-step2-right.svg"
          alt=""
        />
        <img
          className={styles.imageLeft}
          src="/images/child-registration-step2-left.svg"
          alt=""
        />
      </div>
      <div className={styles.textContainer}>
        <div className={styles.mainTextContainer}>
          <div className={styles.mainText}>{mainText}</div>
        </div>
        <div className={styles.subTextContainer}>
          <div className={styles.subText}>{subText}</div>
        </div>
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.primaryButton}
          // onClick={() => router.push("./step-3")}
          onClick={() => router.push(nextUrl)}
        >
          {nextLabel}
        </button>
        <button
          className={styles.secondaryButton}
          // disabled={saveStatus === "saving"}
          onClick={async () => {
            const id = await saveNow();
            if (id) router.push(`/${locale}/forms/child-registration-request`);
          }}
        >
          {saveDraftLabel}
        </button>{" "}
      </div>
    </main>
  );
}
