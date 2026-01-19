"use client";

import { useRouter } from "next/navigation";
import { useWizard } from "../WizardProvider";
import styles from "./page.module.css";

export default function Step2() {
  const router = useRouter();
  const { draft, extras, setExtras, update } = useWizard();

  return (
    <main className={styles.page}>
      <div className={styles.imageContainer}>
        <img
          className={styles.imageRight}
          src="/images/child-registration-step2-right.svg"
        ></img>
        <img
          className={styles.imageLeft}
          src="/images/child-registration-step2-left.svg"
        ></img>
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
      </div>
    </main>
  );
}
