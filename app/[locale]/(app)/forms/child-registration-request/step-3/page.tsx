"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWizard } from "../WizardProvider";
import styles from "./page.module.css";

type MaritalStatus =
  | "married"
  | "divorced"
  | "widowed"
  | "single"
  | "bigamist"
  | "";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.sectionTitle}>{children}</h2>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

export default function Step3() {
  const router = useRouter();
  const sp = useSearchParams();
  const instanceId = sp.get("instanceId");

  const { draft, extras, setExtras, update } = useWizard();

  if (!draft) {
    return <main className={styles.page}>Loading…</main>;
  }

  const nextUrl = instanceId ? `./step-4?instanceId=${instanceId}` : "./step-4";
  const kids = draft.intake.step6.children ?? [];

  function updateChild(i: number, key: string, value: string) {
    update(`intake.step6.children.${i}.${key}`, value);
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          لتسجيل مولود ولد في اسرائيل لوالد/ة مواطن اسرائيلي
        </div>

        <div className={styles.headerText}>
          בקשה לרישום ילד שנולד בישראל להורה תושב ישראלי
        </div>
      </div>

      {/* <h1 className={styles.mainTitle}>
        שלב 2: פרטים כלליים + המבקש + הורה זר + ילדים
      </h1> */}

      <SectionTitle>بيانات مقدم الطلب פרטי המבקש</SectionTitle>

      <Field label="الاسم الشخصي    שם פרטי">
        <input
          className={styles.input}
          value={draft.intake.step1.firstName}
          onChange={(e) => update("intake.step1.firstName", e.target.value)}
        />
      </Field>

      <Field label="اسم العائلة   שם משפחה">
        <input
          className={styles.input}
          value={draft.intake.step1.lastName}
          onChange={(e) => update("intake.step1.lastName", e.target.value)}
        />
      </Field>

      <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות   ">
        <input
          className={styles.input}
          value={draft.intake.step1.israeliId}
          onChange={(e) => update("intake.step1.israeliId", e.target.value)}
        />
      </Field>

      <Field label="الاسم الشخصي    כתובת מגורים ">
        <input
          className={styles.input}
          value={draft.intake.step2.residenceAddress}
          onChange={(e) =>
            update("intake.step2.residenceAddress", e.target.value)
          }
        />
      </Field>

      <Field label="هاتف   טלפון">
        <input
          className={styles.input}
          value={draft.intake.step1.phone}
          onChange={(e) => update("intake.step1.phone", e.target.value)}
          inputMode="tel"
        />
      </Field>

      <Field label="صندوق بريد   תא דואר">
        <input
          className={styles.input}
          value={extras.poBox}
          onChange={(e) => setExtras((p) => ({ ...p, poBox: e.target.value }))}
        />
      </Field>

      <SectionTitle>
        الحالة الشخصية للوالد الإسرائيلي<br></br> מצב אישי של ההורה הישראלי
      </SectionTitle>

      <Field
        label="الحالة الشخصية 
מצב אישי "
      >
        <select
          className={styles.input}
          value={(draft.intake.step3.maritalStatus ?? "") as MaritalStatus}
          onChange={(e) =>
            update(
              "intake.step3.maritalStatus",
              e.target.value as MaritalStatus,
            )
          }
        >
          <option value="">בחר</option>
          <option value="married">נשוי/אה</option>
          <option value="divorced">גרוש/ה</option>
          <option value="widowed">אלמן/נה</option>
          <option value="single">רווק/ה</option>
          <option value="bigamist">ביגמיסט/ית</option>
        </select>
      </Field>

      <SectionTitle> بيانات الوالد الأجنبي   פרטי ההורה הזר</SectionTitle>

      <Field label="الاسم الشخصي    שם פרטי">
        <input
          className={styles.input}
          value={draft.intake.step5.person.firstName}
          onChange={(e) =>
            update("intake.step5.person.firstName", e.target.value)
          }
        />
      </Field>

      <Field label="اسم العائلة   שם משפחה   ">
        <input
          className={styles.input}
          value={draft.intake.step5.person.lastName}
          onChange={(e) =>
            update("intake.step5.person.lastName", e.target.value)
          }
        />
      </Field>

      <Field label="رقم الهوية   מספר זהות ">
        <input
          className={styles.input}
          value={draft.intake.step5.person.passportNumber}
          onChange={(e) =>
            update("intake.step5.person.passportNumber", e.target.value)
          }
        />
      </Field>

      <SectionTitle>بيانات الوالد الأجنبي פרטי הילדים שרישומם מבוקש</SectionTitle>

      <div className={styles.childrenGrid}>
        {kids.map((child, i) => (
          <div key={i} className={styles.childCard}>
            {/* <div className={styles.childHeader}>ילד/ה #{i + 1}</div> */}

            <Field label="الاسم الشخصي    שם פרטי">
              <input
                className={styles.input}
                value={child.firstName}
                onChange={(e) => updateChild(i, "firstName", e.target.value)}
              />
            </Field>

            <Field label="تاريخ الميلاد   תאריך לידה  ">
              <input
                className={styles.input}
                type="date"
                value={child.birthDate}
                onChange={(e) => updateChild(i, "birthDate", e.target.value)}
              />
            </Field>

            <Field label='بلد الميلاد   ארץ לידה '>
              <input
                className={styles.input}
                value={child.nationality}
                onChange={(e) => updateChild(i, "nationality", e.target.value)}
              />
            </Field>
          </div>
        ))}
      </div>

      <div className={styles.footerRow}>
        {/* <button
          type="button"
          className={styles.navBtn}
          onClick={() => router.back()}
        >
          ← הקודם
        </button> */}
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => router.push(nextUrl)}
        >
          לחתימה ואישור 
        </button>
      </div>
    </main>
  );
}
