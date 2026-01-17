import { useTranslations } from "next-intl";
import Link from "next/link";
import LangSwitcher from "@/lib/components/LangSwitcher";
import styles from "./page.module.css";

export default function FormsPage() {
  const t = useTranslations("FormsPage");

  return (
    <main className={styles.page}>
      <div className={styles.topBar}>
        {/* <div className={styles.langSwitcher}>
          <LangSwitcher />
        </div> */}
        <div className={styles.arrowBox}>
          <img className={styles.backArrow} src="/images/backArrow.svg"></img>
        </div>

        <div className={styles.bigTitles}>מאגר טפסים</div>
        <img className={styles.readButton} src="/images/readButton.svg"></img>
      </div>
      <div className={styles.subTextSection}>
        מכן נתן לגשת לאזור של כל אחד מהטפסים הקיימים במאגר. בכל אזור קיימים
        הטפסים המלאים, טיוטות, ומלוי חדש של הטופס
      </div>
      <div className={styles.imageContainer}>
        <img
          src="/images/forms-landing-page-logo.svg/"
          alt=""
          className={styles.logoImage}
        />
      </div>

      <div className={styles.formsList}>
        <Link href="/forms/child-allowance-request" className={styles.formCard}>
          <h2 className={styles.formTitle}>
            {t("forms.childAllowanceRequest.title")}
          </h2>
          <h3 className={styles.formSubtitle}>
            {t("forms.childAllowanceRequest.subtitle")}
          </h3>
        </Link>

        <Link
          href="/forms/child-registration-request"
          className={styles.formCard}
        >
          <h2 className={styles.formTitle}>
            {t("forms.childRegistrationRequest.title")}
          </h2>
          <h3 className={styles.formSubtitle}>
            {t("forms.childRegistrationRequest.title")}
          </h3>
        </Link>

        <Link
          href="/forms/person-registration-request"
          className={styles.formCard}
        >
          <h2 className={styles.formTitle}>
            {t("forms.personRegistrationRequest.title")}
          </h2>
          <h3 className={styles.formSubtitle}>
            {t("forms.personRegistrationRequest.subtitle")}
          </h3>
        </Link>
      </div>
    </main>
  );
}
