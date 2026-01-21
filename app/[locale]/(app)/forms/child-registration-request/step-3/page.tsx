"use client";
import React, { useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useWizard } from "../WizardProvider";
import styles from "./page.module.css";
import { countriesList } from "@/lib/geo/countries";

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
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function CountrySelect({
  label,
  value,
  onChange,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value) {
      const found = countriesList.find(
        (c: any) => c.iso2 === value || c.he === value || c.originalName === value
      );
      if (found) setQuery(`${found.ar} ${found.he}`);
      else setQuery(value);
    } else {
      setQuery("");
    }
  }, [value]);

  const filtered = useMemo(() => {
    if (!query) return countriesList;
    const lower = query.toLowerCase();
    return countriesList.filter(
      (c: any) =>
        c.he.includes(query) ||
        c.ar.includes(query) ||
        c.iso2.toLowerCase().includes(lower)
    );
  }, [query]);

  return (
    <Field label={label}>
      <div className={styles.comboboxWrap}>
        <input
          type="text"
          className={styles.input}
          placeholder="اختر دولة  בחר מדינה"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        {isOpen && filtered.length > 0 && (
          <ul className={styles.comboboxMenu}>
            {filtered.map((c: any, i: number) => (
              <li
                key={i}
                className={styles.comboboxItem}
                onMouseDown={() => {
                  setQuery(`${c.ar} ${c.he}`);
                  onChange(c.he || c.iso2);
                  setIsOpen(false);
                }}
              >
                <span>{c.ar}</span>
                <span>{c.he}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Field>
  );
}

function CustomSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  return (
    <Field label={label}>
      <div className={styles.comboboxWrap}>
        <div
          className={styles.input}
          onClick={() => setIsOpen((v) => !v)}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ color: value ? "#0B1B2B" : "#9CA3AF" }}>
            {value ? selectedLabel : placeholder}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{ transform: "rotate(270deg)", opacity: 0.5 }}
          >
            <path
              d="M4 2L0 6L4 10"
              stroke="currentColor"
              fill="none"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        {isOpen && (
          <ul className={styles.comboboxMenu}>
            <li
              className={styles.comboboxItem}
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              style={{ color: "#9CA3AF" }}
            >
              {placeholder}
            </li>
            {options.map((opt) => (
              <li
                key={opt.value}
                className={styles.comboboxItem}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
        {isOpen && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </Field>
  );
}

export default function Step3() {
  const router = useRouter();
  const sp = useSearchParams();
  const instanceId = sp.get("instanceId");
    const params = useParams();
    const locale = params.locale as string;


    
  

  const { draft, extras, setExtras, update, saveNow } = useWizard();

  

      useEffect(() => {
      setExtras((p) => ({ ...p, currentStep: 3 }));
    }, [setExtras]);
  

  if (!draft) {
    return <main className={styles.page}>Loading…</main>;
  }

//   const step5: any = draft.intake.step5 ?? {};
// const person = step5.person ?? step5.spouse ?? {};
// const personFirstName =
//   typeof person.firstName === "string"
//     ? person.firstName
//     : (person.firstName?.he ?? "");

// const personLastName =
//   typeof person.lastName === "string"
//     ? person.lastName
//     : (person.lastName?.he ?? "");

  const nextUrl = instanceId ? `./step-4?instanceId=${instanceId}` : "./step-4";
  const biInline = (ar: string, he: string) => `${ar}  ${he}`;
  const biBlock = (ar: string, he: string) => (
    <span className={styles.biText}>
      <span className={styles.biLine}>{ar}</span>
      <span className={styles.biLine}>{he}</span>
    </span>
  );
  const biPlaceholder = (ar: string, he: string) => `${ar} / ${he}`;
  const selectedChildren = draft.intake.step6.selectedChildren;
  const kids = selectedChildren ?? draft.intake.step6.children ?? [];
  const kidsPath = selectedChildren ? "intake.step6.selectedChildren" : "intake.step6.children";

  function updateChild(i: number, key: string, value: string) {
    update(`${kidsPath}.${i}.${key}`, value);
  }

  const regAddress = draft.intake.step3?.registeredAddress;
  const regStreetHe = regAddress?.street?.he || "";
  const regStreetAr = regAddress?.street?.ar || "";
  const regStreetValue = regStreetHe || regStreetAr;
  const regCityValue = regAddress?.city || "";
  const regHouseNumberValue = regAddress?.houseNumber || "";

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          {biBlock(
            "لتسجيل مولود ولد في اسرائيل لوالد/ة مواطن اسرائيلي",
            "בקשה לרישום ילד שנולד בישראל להורה תושב ישראלי"
          )}
        </div>
      </div>

      {/* <h1 className={styles.mainTitle}>
        שלב 2: פרטים כלליים + המבקש + הורה זר + ילדים
      </h1> */}

      <SectionTitle>{biInline("بيانات مقدم الطلب", "פרטי המבקש")}</SectionTitle>

      <Field label={biInline("الاسم الشخصي", "שם פרטי")}>
        <input
          className={styles.input}
          value={draft.intake.step1.firstName.he}
          onChange={(e) => update("intake.step1.firstName.he", e.target.value)}
        />
      </Field>

      <Field label={biInline("اسم العائلة", "שם משפחה")}>
        <input
          className={styles.input}
          value={draft.intake.step1.lastName.he}
          onChange={(e) => update("intake.step1.lastName.he", e.target.value)}
        />
      </Field>

      <Field label={biInline("رقم بطاقة الهوية الإسرائيلية", "מספר תעודת זהות")}>
        <input
          className={styles.input}
          value={draft.intake.step1.israeliId}
          onChange={(e) => update("intake.step1.israeliId", e.target.value)}
        />
      </Field>

      <Field label={biInline("الشارع", "רחוב")}>
        <input
          className={styles.input}
          value={regStreetValue}
          onChange={(e) =>
            update(
              "intake.step3.registeredAddress.street.he",
              e.target.value
            )
          }
        />
      </Field>

      <Field label={biInline("رقم المنزل", "מספר בית")}>
        <input
          className={styles.input}
          value={regHouseNumberValue}
          onChange={(e) => update("intake.step3.registeredAddress.houseNumber", e.target.value)}
        />
      </Field>

      <Field label={biInline("المدينة", "עיר")}>
        <input
          className={styles.input}
          value={regCityValue}
          onChange={(e) => update("intake.step3.registeredAddress.city", e.target.value)}
        />
      </Field>

      <Field label={biInline("هاتف", "טלפון")}>
        <input
          className={`${styles.input} ${styles.phoneInput}`}
          value={draft.intake.step1.phone}
          onChange={(e) => update("intake.step1.phone", e.target.value)}
          inputMode="tel"
        />
      </Field>

      <Field label={biInline("صندوق بريد", "תא דואר")}>
        <input
          className={styles.input}
          value={extras.poBox}
          onChange={(e) => setExtras((p) => ({ ...p, poBox: e.target.value }))}
        />
      </Field>

      <SectionTitle>
        {biInline("الحالة الشخصية للوالد الإسرائيلي", "מצב אישי של ההורה הישראלי")}
      </SectionTitle>

      <CustomSelect
        label={biInline("الحالة الشخصية", "מצב אישי")}
        placeholder={biPlaceholder("اختر", "בחר")}
        value={(draft.intake.step3.maritalStatus ?? "") as MaritalStatus}
        onChange={(val) => update("intake.step3.maritalStatus", val as MaritalStatus)}
        options={[
          { value: "married", label: biInline("متزوج/ة", "נשוי/אה") },
          { value: "divorced", label: biInline("مطلق/ة", "גרוש/ה") },
          { value: "widowed", label: biInline("أرمل/ة", "אלמן/נה") },
          { value: "single", label: biInline("أعزب/عزباء", "רווק/ה") },
          { value: "bigamist", label: biInline("متعدد/ة الزوجات", "ביגמיסט/ית") },
        ]}
      />

      <SectionTitle>{biInline("بيانات الوالد الأجنبي", "פרטי ההורה הזר")}</SectionTitle>

      <Field label={biInline("الاسم الشخصي", "שם פרטי")}>
        <input
          className={styles.input}
          value={draft.intake.step5.spouse.firstName.he}
          onChange={(e) =>
            update("intake.step5.spouse.firstName.he", e.target.value)
          }
        />
      </Field>

      <Field label={biInline("اسم العائلة", "שם משפחה")}>
        <input
          className={styles.input}
          value={draft.intake.step5.spouse.lastName.he}
          onChange={(e) =>
            update("intake.step5.spouse.lastName.he", e.target.value)
          }
        />
      </Field>

      <Field label={biInline("رقم الهوية", "מספר זהות")}>
        <input
          className={styles.input}
          value={draft.intake.step5.spouse.passportNumber}
          onChange={(e) =>
            update("intake.step5.spouse.passportNumber", e.target.value)
          }
        />
      </Field>

      <SectionTitle>
        {biInline("بيانات الأطفال المطلوب تسجيلهم", "פרטי הילדים שרישומם מבוקש")}
      </SectionTitle>

      <div className={styles.childrenGrid}>
        {kids.map((child, i) => (
          <div key={i} className={styles.childCard}>
            {/* <div className={styles.childHeader}>ילד/ה #{i + 1}</div> */}

            <Field label={biInline("الاسم الشخصي", "שם פרטי")}>
              <input
                className={styles.input}
                value={child.firstName}
                onChange={(e) => updateChild(i, "firstName", e.target.value)}
              />
            </Field>

            <Field label={biInline("تاريخ الميلاد", "תאריך לידה")}>
              <input
                className={styles.input}
                type="date"
                value={child.birthDate}
                onChange={(e) => updateChild(i, "birthDate", e.target.value)}
              />
            </Field>

            <CountrySelect
              label={biInline("بلد الميلاد", "ארץ לידה")}
              value={child.residenceCountry || child.nationality || ""}
              onChange={(val) => updateChild(i, "residenceCountry", val)}
            />
          </div>
        ))}
      </div>

      <div className={styles.footer}>
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
          {biInline("للتوقيع والموافقة", "לחתימה ואישור")}
        </button>
                <button
          className={styles.secondaryButton}
          // disabled={saveStatus === "saving"}
          onClick={async () => {
            const id = await saveNow();
            if (id) router.push(`/${locale}/forms/child-registration-request`);
          }}
        >
          {biInline("حفظ كمسودة", "שמור כטיוטה")}
        </button>{" "}

      </div>
    </main>
  );
}
