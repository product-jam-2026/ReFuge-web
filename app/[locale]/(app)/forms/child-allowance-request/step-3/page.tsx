"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import demo from "@/public/demo/intake.demo.json";
import styles from "./page.module.css";

type IntakeRecord = typeof demo;

type ExtrasState = {
  father: {
    phoneHome: string;
    emailPrefix: string;
    emailPostfix: string;
  };
  allowanceRequester: {
    phoneHome: string;
    emailPrefix: string;
    emailPostfix: string;
  };
  bankAccount: {
    branchName: string;
    branchNumber: string;
    owner1: string;
    owner2: string;
  };
  children: Array<{
    firstEntryDate: string;
    fileJoinDate: string;
  }>;
};

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

function safePart(s: string) {
  return (
    (s ?? "")
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 40) || "unknown"
  );
}

function splitEmail(email: string) {
  const e = (email ?? "").trim();
  const at = e.indexOf("@");
  if (at === -1) return { prefix: e, postfix: "" };
  return { prefix: e.slice(0, at), postfix: e.slice(at + 1) };
}

function fullName(first: string, last: string) {
  return `${(first ?? "").trim()} ${(last ?? "").trim()}`.trim();
}

function emptyChildExtras(): ExtrasState["children"][number] {
  return { firstEntryDate: "", fileJoinDate: "" };
}

function deriveExtrasFromIntake(d: IntakeRecord): ExtrasState {
  const fatherEmail = splitEmail(d.intake.step5.email);
  const reqEmail = splitEmail(d.intake.step1.email);

  const owners = {
    owner1: fullName(d.intake.step1.firstName, d.intake.step1.lastName),
    owner2: fullName(
      d.intake.step5.person.firstName,
      d.intake.step5.person.lastName,
    ),
  };

  const kids = d.intake.step6.children ?? [];
  const kidsExtras = kids.map((k) => ({
    firstEntryDate: k.entryDate ?? "",
    fileJoinDate: "",
  }));

  while (kidsExtras.length < 3) kidsExtras.push(emptyChildExtras());

  return {
    father: {
      phoneHome: "",
      emailPrefix: fatherEmail.prefix,
      emailPostfix: fatherEmail.postfix,
    },
    allowanceRequester: {
      phoneHome: "",
      emailPrefix: reqEmail.prefix,
      emailPostfix: reqEmail.postfix,
    },
    bankAccount: {
      branchName: "",
      branchNumber: d.intake.step4.bank.branch ?? "",
      owner1: owners.owner1,
      owner2: owners.owner2,
    },
    children: kidsExtras,
  };
}

export default function ChildAllowanceStepLikeWizardPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const instanceId = sp.get("instanceId");

  const [draft, setDraft] = useState<IntakeRecord | null>(null);
  const [extras, setExtras] = useState<ExtrasState | null>(null);

  useEffect(() => {
    const d = structuredClone(demo) as IntakeRecord;
    setDraft(d);
    setExtras(deriveExtrasFromIntake(d));
  }, []);

  function update(path: string, value: any) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next: any = structuredClone(prev);
      const parts = path.split(".");
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }

  function updateChild(
    index: number,
    key: keyof IntakeRecord["intake"]["step6"]["children"][number],
    value: string,
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      if (!next.intake.step6.children[index]) return next;
      (next.intake.step6.children[index] as any)[key] = value;
      return next;
    });
  }

  function addChildRow() {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.intake.step6.children.push({
        lastName: "",
        firstName: "",
        gender: "",
        birthDate: "",
        nationality: "",
        israeliId: "",
        residenceCountry: "",
        entryDate: "",
      });
      return next;
    });

    setExtras((prev) => {
      if (!prev) return prev;
      return { ...prev, children: [...prev.children, emptyChildExtras()] };
    });
  }

  const payload = useMemo(() => {
    if (!draft) return null;
    const kids = (draft.intake.step6.children ?? []).filter(
      (c) =>
        (c.firstName ?? "").trim() ||
        (c.lastName ?? "").trim() ||
        (c.israeliId ?? "").trim() ||
        (c.birthDate ?? "").trim(),
    );
    const cleaned = structuredClone(draft);
    cleaned.intake.step6.children = kids;
    return cleaned;
  }, [draft]);

  if (!draft || !payload || !extras) {
    return <main className={styles.page}>Loading…</main>;
  }

  const kids = draft.intake.step6.children ?? [];
  const nextUrl = instanceId
    ? `./step-4?instanceId=${encodeURIComponent(instanceId)}`
    : "./step-4";

  return (
    <main className={styles.page}>
      {/* Header like your Step3 */}
      <div className={styles.header}>
        <div className={styles.headerText}>طلب مخصصات الأطفال</div>
        <div className={styles.headerText}>טופס בקשה לקצבת ילדים</div>
      </div>

      <SectionTitle>بيانات مقدم الطلب פרטי האב</SectionTitle>

      <Field label="الاسم الشخصي    שם פרטי">
        <input
          className={styles.input}
          value={draft.intake.step5.person.firstName}
          onChange={(e) =>
            update("intake.step5.person.firstName", e.target.value)
          }
        />
      </Field>

      <Field label="اسم العائلة   שם משפחה">
        <input
          className={styles.input}
          value={draft.intake.step5.person.lastName}
          onChange={(e) =>
            update("intake.step5.person.lastName", e.target.value)
          }
        />
      </Field>

      <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות">
        <input
          className={styles.input}
          value={draft.intake.step5.person.israeliId}
          onChange={(e) =>
            update("intake.step5.person.israeliId", e.target.value)
          }
          dir="ltr"
        />
      </Field>

      <Field label="تاريخ الميلاد   תאריך לידה">
        <input
          className={styles.input}
          type="date"
          value={draft.intake.step5.person.birthDate}
          onChange={(e) =>
            update("intake.step5.person.birthDate", e.target.value)
          }
        />
      </Field>

      {/* ✅ step5 does NOT have entryDate, so store it in extras */}
      <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">
        <input
          className={styles.input}
          type="date"
          value={(extras as any).requesterEntryDate ?? ""}
          onChange={(e) =>
            setExtras((p: any) => ({
              ...p,
              requesterEntryDate: e.target.value,
            }))
          }
        />
      </Field>

      <SectionTitle>عنوان السكن כתובת מגורים</SectionTitle>
      <SectionTitle>السجل في وزارة الداخلية הרשומה במשרד הפנים</SectionTitle>

      <Field label="شارع   רחוב">
        <input
          className={styles.input}
          value={draft.intake.step3.registeredAddress.street}
          onChange={(e) =>
            update("intake.step3.registeredAddress.street", e.target.value)
          }
        />
      </Field>

      <div className={styles.row2}>
        <Field label="منزل  בניין">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.houseNumber}
            onChange={(e) =>
              update(
                "intake.step3.registeredAddress.houseNumber",
                e.target.value,
              )
            }
            dir="ltr"
          />
        </Field>

        <Field label="دخول   כניסה">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.entry}
            onChange={(e) =>
              update("intake.step3.registeredAddress.entry", e.target.value)
            }
            dir="ltr"
          />
        </Field>

        <Field label="شقة   דירה">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.apartment}
            onChange={(e) =>
              update("intake.step3.registeredAddress.apartment", e.target.value)
            }
            dir="ltr"
          />
        </Field>

        <Field label="الرمز البريدي   מיקוד">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.zip}
            onChange={(e) =>
              update("intake.step3.registeredAddress.zip", e.target.value)
            }
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="مدينة   עיר">
        <input
          className={styles.input}
          value={draft.intake.step3.registeredAddress.city}
          onChange={(e) =>
            update("intake.step3.registeredAddress.city", e.target.value)
          }
        />
      </Field>

      <SectionTitle> وسائل الاتصال</SectionTitle>
      <SectionTitle> المسجَّلون في وزارة الداخلية </SectionTitle>
      <SectionTitle> דרכי תקשורת</SectionTitle>
      <SectionTitle> הרשומים במשרד הפנים</SectionTitle>

      <Field label="هاتف   טלפון">
        <input
          className={styles.input}
          value={draft.intake.step5.phone}
          onChange={(e) => update("intake.step5.phone", e.target.value)}
          inputMode="tel"
          dir="ltr"
        />
      </Field>
      <Field label="بريد إلكتروني   אימייל">
        <input
          className={styles.input}
          dir="ltr"
          inputMode="email"
          placeholder="name@example.com"
          value={
            extras.father.emailPostfix
              ? `${extras.father.emailPrefix}@${extras.father.emailPostfix}`
              : extras.father.emailPrefix
          }
          onChange={(e) => {
            const { prefix, postfix } = splitEmail(e.target.value);
            setExtras((p) =>
              p
                ? {
                    ...p,
                    father: {
                      ...p.father,
                      emailPrefix: prefix,
                      emailPostfix: postfix,
                    },
                  }
                : p,
            );
          }}
        />
      </Field>

      <SectionTitle>بيانات مستفيد المعاش </SectionTitle>
      <SectionTitle>פרטי מקבל הקצבה</SectionTitle>

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
          dir="ltr"
        />
      </Field>

      <Field label="تاريخ الميلاد   תאריך לידה  ">
        <input
          className={styles.input}
          type="date"
          value={draft.intake.step1.birthDate}
          onChange={(e) => update("intake.step1.birthDate", e.target.value)}
        />
      </Field>

      <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">
        <input
          className={styles.input}
          type="date"
          value={draft.intake.step2.entryDate}
          onChange={(e) => update("intake.step2.entryDate", e.target.value)}
        />
      </Field>

      <SectionTitle>عنوان السكن כתובת מגורים</SectionTitle>
      <SectionTitle>السجل في وزارة الداخلية הרשומה במשרד הפנים</SectionTitle>

      <Field label="شارع   רחוב">
        <input
          className={styles.input}
          value={draft.intake.step3.registeredAddress.street}
          onChange={(e) =>
            update("intake.step3.registeredAddress.street", e.target.value)
          }
        />
      </Field>

      <div className={styles.row2}>
        <Field label="منزل  בניין">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.houseNumber}
            onChange={(e) =>
              update(
                "intake.step3.registeredAddress.houseNumber",
                e.target.value,
              )
            }
            dir="ltr"
          />
        </Field>

        <Field label="دخول   כניסה">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.entry}
            onChange={(e) =>
              update("intake.step3.registeredAddress.entry", e.target.value)
            }
            dir="ltr"
          />
        </Field>

        <Field label="شقة   דירה">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.apartment}
            onChange={(e) =>
              update("intake.step3.registeredAddress.apartment", e.target.value)
            }
            dir="ltr"
          />
        </Field>

        <Field label="الرمز البريدي   מיקוד">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.zip}
            onChange={(e) =>
              update("intake.step3.registeredAddress.zip", e.target.value)
            }
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="مدينة   עיר">
        <input
          className={styles.input}
          value={draft.intake.step3.registeredAddress.city}
          onChange={(e) =>
            update("intake.step3.registeredAddress.city", e.target.value)
          }
        />
      </Field>

      <SectionTitle> وسائل الاتصال</SectionTitle>
      <SectionTitle> المسجَّلون في وزارة الداخلية </SectionTitle>
      <SectionTitle> דרכי תקשורת</SectionTitle>
      <SectionTitle> הרשומים במשרד הפנים</SectionTitle>

      <Field label="هاتف   טלפון">
        <input
          className={styles.input}
          value={draft.intake.step1.phone}
          onChange={(e) => update("intake.step1.phone", e.target.value)}
          inputMode="tel"
          dir="ltr"
        />
      </Field>

      <Field label="بريد إلكتروني   אימייל">
        <input
          className={styles.input}
          dir="ltr"
          inputMode="email"
          placeholder="name@example.com"
          value={
            extras?.allowanceRequester?.emailPostfix
              ? `${extras.allowanceRequester.emailPrefix}@${extras.allowanceRequester.emailPostfix}`
              : (extras?.allowanceRequester?.emailPrefix ?? "")
          }
          onChange={(e) => {
            const { prefix, postfix } = splitEmail(e.target.value);
            setExtras((p) => {
              if (!p) return p;
              return {
                ...p,
                allowanceRequester: {
                  ...p.allowanceRequester,
                  emailPrefix: prefix,
                  emailPostfix: postfix,
                },
              };
            });
          }}
        />
      </Field>

      <SectionTitle>تفاصيل حساب بنكي פרטי בנק</SectionTitle>

      <Field label="اسم صاحب الحساب    שם בעל החשבון">
        <input
          className={styles.input}
          value={extras.bankAccount.owner1}
          onChange={(e) =>
            setExtras((p) =>
              p
                ? {
                    ...p,
                    bankAccount: { ...p.bankAccount, owner1: e.target.value },
                  }
                : p,
            )
          }
        />
      </Field>

      {/* <Field label="בעל/ת חשבון 2 (PDF בלבד)">
        <input
          className={styles.input}
          value={extras.bankAccount.owner2}
          onChange={(e) =>
            setExtras((p) =>
              p
                ? {
                    ...p,
                    bankAccount: { ...p.bankAccount, owner2: e.target.value },
                  }
                : p,
            )
          }
        />
      </Field> */}

      <Field label="بنك   בנק">
        <input
          className={styles.input}
          value={draft.intake.step4.bank.bankName}
          onChange={(e) => update("intake.step4.bank.bankName", e.target.value)}
        />
      </Field>

      <div className={styles.row2}>
        <Field label="اسم البنك   שם הבנק">
          <input
            className={styles.input}
            value={extras.bankAccount.branchName}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      bankAccount: {
                        ...p.bankAccount,
                        branchName: e.target.value,
                      },
                    }
                  : p,
              )
            }
          />
        </Field>

        <Field label="رقم الفرع   מספר סניף  ">
          <input
            className={styles.input}
            value={extras.bankAccount.branchNumber}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      bankAccount: {
                        ...p.bankAccount,
                        branchNumber: e.target.value,
                      },
                    }
                  : p,
              )
            }
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="رقم الحساب  מספר חשבון">
        <input
          className={styles.input}
          value={draft.intake.step4.bank.accountNumber}
          onChange={(e) =>
            update("intake.step4.bank.accountNumber", e.target.value)
          }
          dir="ltr"
        />
      </Field>

      <SectionTitle>بيانات الأطفال المطلوب تسجيلهم</SectionTitle>
      <SectionTitle>
        بيانات الأطفال الذين لم يتمّوا 18 عامًا ولا يتلقّون مخصّصات الأطفال
      </SectionTitle>
      <SectionTitle>פרטי הילדים שרישמום מבוקש</SectionTitle>
      <SectionTitle>
        פרטי ילדים שטרם מלאו להם 18 שנה ואינם מקבלים קצבת ילדים
      </SectionTitle>

      <div className={styles.childrenGrid}>
        {kids.map((child, i) => (
          <div key={i} className={styles.childCard}>
            <Field label="رقم الهوية   מספר זהות">
              <input
                className={styles.input}
                value={child.israeliId}
                onChange={(e) => updateChild(i, "israeliId", e.target.value)}
                dir="ltr"
              />
            </Field>

            <Field label="اسم العائلة   שם משפחה   ">
              <input
                className={styles.input}
                value={child.lastName}
                onChange={(e) => updateChild(i, "lastName", e.target.value)}
              />
            </Field>

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

            <Field label="تاريخ الهجرة إلى البلاد   תאריך עלייה לארץ">
              <input
                className={styles.input}
                type="date"
                value={child.entryDate}
                onChange={(e) => updateChild(i, "entryDate", e.target.value)}
              />
            </Field>

            <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">
              <input
                className={styles.input}
                type="date"
                value={extras.children[i]?.firstEntryDate ?? ""}
                onChange={(e) =>
                  setExtras((p) => {
                    if (!p) return p;
                    const next = structuredClone(p);
                    if (!next.children[i])
                      next.children[i] = emptyChildExtras();
                    next.children[i]!.firstEntryDate = e.target.value;
                    return next;
                  })
                }
              />
            </Field>

            <Field
              label="تاريخ انضمام الطفل/الطفلة إلى ملف التأمين الوطني  תאריך הצטרפות הילד.ה לתיק ביטוח לאומי"
            >
              <input
                className={styles.input}
                type="date"
                value={extras.children[i]?.fileJoinDate ?? ""}
                onChange={(e) =>
                  setExtras((p) => {
                    if (!p) return p;
                    const next = structuredClone(p);
                    if (!next.children[i])
                      next.children[i] = emptyChildExtras();
                    next.children[i]!.fileJoinDate = e.target.value;
                    return next;
                  })
                }
              />
            </Field>

          </div>
        ))}
      </div>

      {/* <button
        type="button"
        onClick={addChildRow}
        className={styles.secondaryBtn}
      >
        + הוסף ילד/ה נוסף/ת
      </button> */}

      {/* Footer button like your Step3 */}
      <div className={styles.footerRow}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => router.push(nextUrl)}
        >
          לחתימה ואישור
        </button>
      </div>

      {/* Debug helper if you want */}
      {/* <pre>{JSON.stringify(payload, null, 2)}</pre> */}
    </main>
  );
}
