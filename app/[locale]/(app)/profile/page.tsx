import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { createClient } from "../../../../lib/supabase/server";

function pickFirst<T>(...vals: Array<T | null | undefined>): T | undefined {
  for (const v of vals) if (v !== null && v !== undefined && v !== "") return v;
  return undefined;
}

export default async function ProfilePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;

  const t = await getTranslations("ProfilePage");

  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // אם אין משתמש (כי אין sessions) – אפשר להפנות/להציג הודעה.
  // כרגע נשאיר UI נקי + קישור חזרה.
  if (!user) {
    return (
      <div className="appShell">
        <div className="appFrame">
          <main className="page">
            <div className="profileHeader">
              <Link href={`/${locale}`} className="pillBtn">
                {t("buttons.back")}
              </Link>
              <h1 className="profileTitle">{t("title")}</h1>
            </div>

            <p className="muted" style={{ textAlign: "center", marginTop: 24 }}>
              {t("notLoggedIn")}
            </p>
          </main>
        </div>
      </div>
    );
  }

  const { data: profileRow, error } = await supabase
    .from("profiles")
    .select("data")
    .eq("id", user.id)
    .maybeSingle();

  const data: any = profileRow?.data ?? {};
  const step1 = data?.intake?.step1 ?? {};

  const fullName = pickFirst(step1?.fullName, step1?.full_name);
  const firstName = pickFirst(step1?.firstName, step1?.first_name);
  const lastName = pickFirst(step1?.lastName, step1?.last_name);
  const phoneLink = pickFirst(step1?.whatsappLink, step1?.whatsapp_link);
  const email = pickFirst(step1?.email);
  const address = pickFirst(step1?.address);

  // נוח להציג טלפון בצורה “אנושית” גם אם שמרת link של wa.me
  // אם נשמר wa.me/972..., נחלץ רק את המספר לתצוגה.
  const phoneDisplay =
    typeof phoneLink === "string"
      ? phoneLink.replace("https://wa.me/", "").replace(/^0+/, "")
      : undefined;

  const contactMethods = data?.contactMethods ?? null;

  const showName =
    fullName ?? [firstName, lastName].filter(Boolean).join(" ") ?? "";

  return (
    <div className="appShell">
      <div className="appFrame">
        <main className="page">
          {/* Header כמו בעיצוב: כפתור שפה בצד אחד + כותרת */}
          <div className="profileHeader">
            <Link href={`/${locale}`} className="pillBtn">
              {t("buttons.language")}
            </Link>

            <h1 className="profileTitle">{t("title")}</h1>
          </div>

          {/* שדות */}
          <section className="profileForm">
            <div className="fieldGroup">
              <div className="fieldLabel">{t("fields.fullName")}</div>
              <div className="fieldPill">
                {showName || <span className="placeholder">{t("empty")}</span>}
              </div>
            </div>

            <div className="fieldGroup">
              <div className="fieldLabel">{t("fields.phone")}</div>
              <div className="fieldPill fieldRow">
                {/* אם בעתיד תרצי להציג קידומת + שדה – נבנה לפי הדאטה שלך.
                    כרגע מציגים ערך אחד. */}
                {phoneDisplay || (
                  <span className="placeholder">{t("empty")}</span>
                )}
              </div>
            </div>

            <div className="fieldGroup">
              <div className="fieldLabel">{t("fields.email")}</div>
              <div className="fieldPill">
                {email || <span className="placeholder">{t("empty")}</span>}
              </div>
            </div>

            <div className="fieldGroup">
              <div className="fieldLabel">{t("fields.address")}</div>
              <div className="fieldPill">
                {address || <span className="placeholder">{t("empty")}</span>}
              </div>
            </div>

            {/* אם תרצי להציג גם contactMethods בעתיד לפי העיצוב שלך */}
            {contactMethods ? (
              <div className="fieldGroup">
                <div className="fieldLabel">{t("fields.contactMethods")}</div>
                <div className="fieldPill">
                  <span style={{ direction: "ltr" }}>
                    {JSON.stringify(contactMethods)}
                  </span>
                </div>
              </div>
            ) : null}
          </section>

          {/* כפתורי פעולה לפי העיצוב */}
          <section className="profileActions">
            <Link href={`/${locale}/forms/saved`} className="bigOrangeBtn">
              {t("actions.savedForms")}
            </Link>

            <Link href={`/${locale}/intake`} className="bigOrangeBtn">
              {t("actions.editIntake")}
            </Link>
          </section>

          {process.env.NODE_ENV !== "production" && error ? (
            <p className="muted" style={{ marginTop: 16 }}>
              DB error: {error.message}
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}
