"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";
import styles from "./page.module.css";

export default function Step2() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { setExtras, saveNow, saveStatus } = useWizard();

  // ✅ mark this step for resume
  useEffect(() => {
    setExtras((p: any) => ({ ...p, currentStep: 2 }));
  }, [setExtras]);

  async function onSaveAndExit() {
    const id = await saveNow?.();
    if (id) router.push(`/${locale}/forms/child-allowance-request`);
  }

  return (
    <main className={styles.page}>
      <div className={styles.imageContainer}>
        {/* <img
          className={styles.imageRight}
          src="/images/child-registration-step2-right.svg"
          alt=""
        />
        <img
          className={styles.imageLeft}
          src="/images/child-registration-step2-left.svg"
          alt=""
        /> */}

        <img src="/images/Kitsbaot.svg"></img>

      </div>


      <div className={styles.textContainer}>
        <div className={styles.mainTextContainer}>
          <div className={styles.mainText}>نموذجك جاهز</div>
          <div className={styles.mainText}>הטופס שלך מוכן</div>
        </div>

        <div className={styles.subTextContainer}>
          <div className={styles.subText}>
            يرجى التأكد من أن جميع البيانات صحيحة قبل الموافقة،يمكنك في أي وقت
            التحديث وإجراء التغييرات
          </div>
          <div className={styles.subText}>
            אנא וודא כי כל הפרטים נכונים לפני שאתה מאשר, תוכל בכל רגע לעדכן
            ולבצע שינויים
          </div>
        </div>
      </div>

      <div className={styles.footerRow}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => router.push("./step-3")}
        >
          המשך
        </button>

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onSaveAndExit}
          disabled={saveStatus === "saving"}
        >
          שמור כטיוטה
        </button>
      </div>
    </main>
  );
}
