import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { createClient } from "../../../../lib/supabase/server";
import styles from "./ProfilePage.module.css";

function pickFirst<T>(...vals: Array<T | null | undefined>): T | undefined {
  for (const v of vals) if (v !== null && v !== undefined && v !== "") return v;
  return undefined;
}

function getLocalizedText(
  value: string | { he?: string; ar?: string } | null | undefined,
  locale: string
): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return locale === "ar" ? value.ar || value.he : value.he || value.ar;
}

export default async function ProfilePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getTranslations("ProfilePage");
  const isArabic = locale === "ar";

  const guardEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH_GUARD === "true";

  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ✅ אם ה-guard פעיל ואין משתמש — מציגים הודעה (בפרודקשן/כשאת מפעילה true)
  if (!user && guardEnabled) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.profileHeader}>
          <h1 className={styles.profileTitle}>{t("title")}</h1>
          <Link
            href={`/${locale}/home`}
            className={styles.profileBackBtn}
            aria-label={isArabic ? "رجوع" : "חזרה"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="22" viewBox="0 0 11 22" fill="none" aria-hidden="true">
              <g clipPath="url(#clip0_1820_2548)">
                <path d="M3.19922 4.25879L9.19922 10.2588L3.19922 16.2588" stroke="#011429" strokeWidth="1.5" />
              </g>
              <defs>
                <clipPath id="clip0_1820_2548">
                  <rect width="22" height="11" fill="white" transform="translate(0 22) rotate(-90)" />
                </clipPath>
              </defs>
            </svg>
          </Link>
        </div>

        <p className="muted" style={{ textAlign: "center", marginTop: 24 }}>
          {t("notLoggedIn")}
        </p>

        {/* אם יש לך דף התחברות קיים ואת רוצה כפתור כאן, תגידי ואוסיף */}
        <p className="muted" style={{ textAlign: "center", marginTop: 8 }}>
          <Link href={`/${locale}/login`} style={{ textDecoration: "underline" }}>
            {t("goToLogin")}
          </Link>
        </p>
      </div>
    );
  }

  // ✅ אם אין user אבל guard כבוי (פיתוח) — לא מציגים הודעה, פשוט placeholders
  let data: any = {};
  let dbError: string | null = null;

  if (user) {
    const { data: profileRow, error } = await supabase
      .from("profiles")
      .select("data")
      .eq("id", user.id)
      .maybeSingle();

    if (error) dbError = error.message;
    data = profileRow?.data ?? {};
  }

  const step1 = data?.intake?.step1 ?? {};
  const step2 = data?.intake?.step2 ?? {};

  const fullName = pickFirst(step1?.fullName, step1?.full_name);
  const firstName = getLocalizedText(pickFirst(step1?.firstName, step1?.first_name), locale);
  const lastName = getLocalizedText(pickFirst(step1?.lastName, step1?.last_name), locale);
  const phoneDisplay = pickFirst(step1?.phone, step1?.phoneNumber, step1?.phone_number);
  const email = pickFirst(step1?.email);
  const address = getLocalizedText(step2?.residenceAddress, locale);

  const contactMethods = data?.contactMethods ?? null;

  const showName =
    fullName ?? [firstName, lastName].filter(Boolean).join(" ") ?? "";

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileHeader}>
        <h1 className={styles.profileTitle}>{t("title")}</h1>
        <Link
          href={`/${locale}/home`}
          className={styles.profileBackBtn}
          aria-label={isArabic ? "رجوع" : "חזרה"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="22" viewBox="0 0 11 22" fill="none" aria-hidden="true">
            <g clipPath="url(#clip0_1820_2548)">
              <path d="M3.19922 4.25879L9.19922 10.2588L3.19922 16.2588" stroke="#011429" strokeWidth="1.5" />
            </g>
            <defs>
              <clipPath id="clip0_1820_2548">
                <rect width="22" height="11" fill="white" transform="translate(0 22) rotate(-90)" />
              </clipPath>
            </defs>
          </svg>
        </Link>
      </div>

      <section className={styles.profileForm}>
        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>{t("fields.fullName")}</div>
          <div className={styles.fieldPill}>
            {showName || <span className={styles.placeholder}>{t("empty")}</span>}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>{t("fields.phone")}</div>
          <div className={`${styles.fieldPill} ${styles.fieldRow}`}>
            {phoneDisplay || <span className={styles.placeholder}>{t("empty")}</span>}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>{t("fields.email")}</div>
          <div className={styles.fieldPill}>
            {email || <span className={styles.placeholder}>{t("empty")}</span>}
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.fieldLabel}>{t("fields.address")}</div>
          <div className={styles.fieldPill}>
            {address || <span className={styles.placeholder}>{t("empty")}</span>}
          </div>
        </div>

        {contactMethods ? (
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabel}>{t("fields.contactMethods")}</div>
            <div className={styles.fieldPill}>
              <span style={{ direction: "ltr" }}>
                {JSON.stringify(contactMethods)}
              </span>
            </div>
          </div>
        ) : null}
      </section>

      <section className={styles.profileActions}>
        <Link href={`/${locale}/forms/saved`} className={styles.bigOrangeBtn}>
          {t("actions.savedForms")}
        </Link>

        <Link href={`/${locale}/signup/step-1`} className={styles.bigOrangeBtn}>
          {t("actions.editIntake")}
        </Link>
      </section>

      {process.env.NODE_ENV !== "production" && dbError ? (
        <p className="muted" style={{ marginTop: 16 }}>
          DB error: {dbError}
        </p>
      ) : null}
    </div>
  );
}
