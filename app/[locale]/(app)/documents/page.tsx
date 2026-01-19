import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

import { createClient } from "../../../../lib/supabase/server";
import styles from "./DocumentsPage.module.css";

type DocRecord = {
  path: string;
  name?: string;
  uploadedAt?: string;
};

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

function normalizeDoc(doc: any): DocRecord | null {
  if (!doc || typeof doc !== "object") return null;
  if (!doc.path) return null;
  return doc as DocRecord;
}

export default async function DocumentsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getTranslations("DocumentsPage");
  const isArabic = locale === "ar";
  const guardEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH_GUARD === "true";

  const supabase = createClient(cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && guardEnabled) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>{t("title")}</h1>
          <p className={styles.headerSubtitle}>{t("subtitle")}</p>
        </div>
        <div className={styles.card}>
          <div className={styles.empty}>{t("notLoggedIn")}</div>
          <Link href={`/${locale}/login`} className={styles.docBtn}>
            {t("goToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  let data: any = {};
  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("data")
      .eq("id", user.id)
      .maybeSingle();
    data = profileRow?.data ?? {};
  }

  const documents = data?.intake?.step7?.documents ?? {};
  const children = Array.isArray(data?.intake?.step6?.children)
    ? data.intake.step6.children
    : [];

  const entries: Array<{ id: string; label: string; doc: DocRecord }> = [];
  const bucketName = "intake_docs";

  const addEntry = (id: string, label: string, doc: DocRecord | null) => {
    if (!doc?.path) return;
    entries.push({ id, label, doc });
  };

  addEntry(
    "passportCopy",
    t("fields.passportCopy"),
    normalizeDoc(documents.passportCopy)
  );
  addEntry(
    "familyStatusDoc",
    t("fields.familyStatusDoc"),
    normalizeDoc(documents.familyStatusDoc)
  );
  addEntry(
    "secondParentStatusDoc",
    t("fields.secondParentStatusDoc"),
    normalizeDoc(documents.secondParentStatusDoc)
  );
  addEntry(
    "rentalContract",
    t("fields.rentalContract"),
    normalizeDoc(documents.rentalContract)
  );
  addEntry(
    "propertyOwnership",
    t("fields.propertyOwnership"),
    normalizeDoc(documents.propertyOwnership)
  );

  if (children.length > 0) {
    children.forEach((child: any, index: number) => {
      const doc = normalizeDoc(documents[`child_doc_${index}`]);
      if (!doc) return;
      const childName =
        getLocalizedText(child?.firstName, locale) ||
        pickFirst(child?.firstName) ||
        pickFirst(child?.first_name) ||
        "";
      const label = childName
        ? `${childName} - ${t("fields.childPassportPhoto")}`
        : t("fields.childPassportPhoto");
      addEntry(`child_doc_${index}`, label, doc);
    });
  } else {
    addEntry(
      "childPassportPhoto",
      t("fields.childPassportPhoto"),
      normalizeDoc(documents.childPassportPhoto)
    );
  }

  const otherDocsRaw = documents.otherDocs;
  const otherDocs = Array.isArray(otherDocsRaw)
    ? otherDocsRaw
    : otherDocsRaw
    ? [otherDocsRaw]
    : [];
  otherDocs.forEach((doc: any, index: number) => {
    addEntry(
      `otherDocs_${index}`,
      t("fields.otherDocs"),
      normalizeDoc(doc)
    );
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Link
          href={`/${locale}/profile`}
          className={styles.backBtn}
          aria-label={isArabic ? "رجوع" : "חזרה"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="11"
            height="22"
            viewBox="0 0 11 22"
            fill="none"
            aria-hidden="true"
          >
            <g clipPath="url(#clip0_1820_2548)">
              <path
                d="M3.19922 4.25879L9.19922 10.2588L3.19922 16.2588"
                stroke="#011429"
                strokeWidth="1.5"
              />
            </g>
            <defs>
              <clipPath id="clip0_1820_2548">
                <rect
                  width="22"
                  height="11"
                  fill="white"
                  transform="translate(0 22) rotate(-90)"
                />
              </clipPath>
            </defs>
          </svg>
        </Link>
        <h1 className={styles.headerTitle}>{t("title")}</h1>
        <p className={styles.headerSubtitle}>{t("subtitle")}</p>
      </div>

      <div className={styles.card}>
        {entries.length === 0 ? (
          <div className={styles.empty}>{t("empty")}</div>
        ) : (
          entries.map(({ id, label, doc }) => {
            const publicUrl = supabase.storage
              .from(bucketName)
              .getPublicUrl(doc.path).data.publicUrl;
            return (
              <div key={id} className={styles.docRow}>
                <div className={styles.docMeta}>
                  <span className={styles.docLabel}>{label}</span>
                  <span className={styles.docName}>{doc.name || doc.path}</span>
                </div>
                <div className={styles.docActions}>
                  <a
                    className={styles.docBtn}
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("actions.view")}
                  </a>
                  <a className={styles.docBtn} href={publicUrl} download>
                    {t("actions.download")}
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
