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
  const fatherEmail = splitEmail(d.intake.step1.email);
  const reqEmail = splitEmail(d.intake.step5.email);

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
    ? `./step-5?instanceId=${encodeURIComponent(instanceId)}`
    : "./step-5";

  return (
    <main className={styles.page}>
      {/* Header like your Step3 */}
      <div className={styles.header}>
        <div className={styles.headerText}>طلب مخصصات الأطفال</div>
        <div className={styles.headerText}>טופס בקשה לקצבת ילדים</div>
      </div>

      {/* <SectionTitle>פרטי האב</SectionTitle>

      <Field label="שם פרטי">
        <input
          className={styles.input}
          value={draft.intake.step1.firstName}
          onChange={(e) => update("intake.step1.firstName", e.target.value)}
        />
      </Field>

      <Field label="שם משפחה">
        <input
          className={styles.input}
          value={draft.intake.step1.lastName}
          onChange={(e) => update("intake.step1.lastName", e.target.value)}
        />
      </Field>

      <Field label="מספר זהות">
        <input
          className={styles.input}
          value={draft.intake.step1.israeliId}
          onChange={(e) => update("intake.step1.israeliId", e.target.value)}
          dir="ltr"
        />
      </Field>

      <Field label="תאריך לידה">
        <input
          className={styles.input}
          type="date"
          value={draft.intake.step1.birthDate}
          onChange={(e) => update("intake.step1.birthDate", e.target.value)}
        />
      </Field>

      <Field label="תאריך כניסה לישראל (step2.entryDate)">
        <input
          className={styles.input}
          type="date"
          value={draft.intake.step2.entryDate}
          onChange={(e) => update("intake.step2.entryDate", e.target.value)}
        />
      </Field>

      <SectionTitle>כתובת האב</SectionTitle>

      <Field label="רחוב">
        <input
          className={styles.input}
          value={draft.intake.step3.registeredAddress.street}
          onChange={(e) =>
            update("intake.step3.registeredAddress.street", e.target.value)
          }
        />
      </Field>

      <div className={styles.row2}>
        <Field label="מספר בית">
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

        <Field label="כניסה">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.entry}
            onChange={(e) =>
              update("intake.step3.registeredAddress.entry", e.target.value)
            }
            dir="ltr"
          />
        </Field>

        <Field label="דירה">
          <input
            className={styles.input}
            value={draft.intake.step3.registeredAddress.apartment}
            onChange={(e) =>
              update("intake.step3.registeredAddress.apartment", e.target.value)
            }
            dir="ltr"
          />
        </Field>

        <Field label="מיקוד">
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

      <Field label="עיר">
        <input
          className={styles.input}
          value={draft.intake.step3.registeredAddress.city}
          onChange={(e) =>
            update("intake.step3.registeredAddress.city", e.target.value)
          }
        />
      </Field>

      <SectionTitle>טלפון / אימייל האב</SectionTitle>

      <Field label="טלפון נייד (step1.phone)">
        <input
          className={styles.input}
          value={draft.intake.step1.phone}
          onChange={(e) => update("intake.step1.phone", e.target.value)}
          inputMode="tel"
          dir="ltr"
        />
      </Field>

      <Field label="טלפון בבית (PDF בלבד)">
        <input
          className={styles.input}
          value={extras.father.phoneHome}
          onChange={(e) =>
            setExtras((p) =>
              p
                ? { ...p, father: { ...p.father, phoneHome: e.target.value } }
                : p,
            )
          }
          inputMode="tel"
          dir="ltr"
        />
      </Field>

      <div className={styles.row2}>
        <Field label="אימייל (לפני @) (PDF בלבד)">
          <input
            className={styles.input}
            value={extras.father.emailPrefix}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? { ...p, father: { ...p.father, emailPrefix: e.target.value } }
                  : p,
              )
            }
            dir="ltr"
          />
        </Field>

        <Field label="אימייל (אחרי @) (PDF בלבד)">
          <input
            className={styles.input}
            value={extras.father.emailPostfix}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      father: { ...p.father, emailPostfix: e.target.value },
                    }
                  : p,
              )
            }
            dir="ltr"
          />
        </Field>
      </div>

      <SectionTitle>פרטי מבקש הקצבה</SectionTitle>

      <Field label="שם פרטי (step5.person.firstName)">
        <input
          className={styles.input}
          value={draft.intake.step5.person.firstName}
          onChange={(e) =>
            update("intake.step5.person.firstName", e.target.value)
          }
        />
      </Field>

      <Field label="שם משפחה (step5.person.lastName)">
        <input
          className={styles.input}
          value={draft.intake.step5.person.lastName}
          onChange={(e) =>
            update("intake.step5.person.lastName", e.target.value)
          }
        />
      </Field>

      <Field label="מספר זהות (step5.person.israeliId)">
        <input
          className={styles.input}
          value={draft.intake.step5.person.israeliId}
          onChange={(e) =>
            update("intake.step5.person.israeliId", e.target.value)
          }
          dir="ltr"
        />
      </Field>

      <Field label="טלפון נייד (step5.phone)">
        <input
          className={styles.input}
          value={draft.intake.step5.phone}
          onChange={(e) => update("intake.step5.phone", e.target.value)}
          inputMode="tel"
          dir="ltr"
        />
      </Field>

      <Field label="טלפון בבית (PDF בלבד)">
        <input
          className={styles.input}
          value={extras.allowanceRequester.phoneHome}
          onChange={(e) =>
            setExtras((p) =>
              p
                ? {
                    ...p,
                    allowanceRequester: {
                      ...p.allowanceRequester,
                      phoneHome: e.target.value,
                    },
                  }
                : p,
            )
          }
          inputMode="tel"
          dir="ltr"
        />
      </Field>

      <div className={styles.row2}>
        <Field label="אימייל (לפני @) (PDF בלבד)">
          <input
            className={styles.input}
            value={extras.allowanceRequester.emailPrefix}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      allowanceRequester: {
                        ...p.allowanceRequester,
                        emailPrefix: e.target.value,
                      },
                    }
                  : p,
              )
            }
            dir="ltr"
          />
        </Field>

        <Field label="אימייל (אחרי @) (PDF בלבד)">
          <input
            className={styles.input}
            value={extras.allowanceRequester.emailPostfix}
            onChange={(e) =>
              setExtras((p) =>
                p
                  ? {
                      ...p,
                      allowanceRequester: {
                        ...p.allowanceRequester,
                        emailPostfix: e.target.value,
                      },
                    }
                  : p,
              )
            }
            dir="ltr"
          />
        </Field>
      </div>

      <SectionTitle>חשבון בנק</SectionTitle>

      <Field label="בעל/ת חשבון 1 (PDF בלבד)">
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

      <Field label="בעל/ת חשבון 2 (PDF בלבד)">
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
      </Field>

      <Field label="שם הבנק (step4.bank.bankName)">
        <input
          className={styles.input}
          value={draft.intake.step4.bank.bankName}
          onChange={(e) =>
            update("intake.step4.bank.bankName", e.target.value)
          }
        />
      </Field>

      <div className={styles.row2}>
        <Field label="שם סניף (PDF בלבד)">
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

        <Field label="מספר סניף (step4.bank.branch)">
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

      <Field label="מספר חשבון (step4.bank.accountNumber)">
        <input
          className={styles.input}
          value={draft.intake.step4.bank.accountNumber}
          onChange={(e) =>
            update("intake.step4.bank.accountNumber", e.target.value)
          }
          dir="ltr"
        />
      </Field>

      <SectionTitle>פרטי הילדים (עד 3 ב-PDF)</SectionTitle>

      <div className={styles.childrenGrid}>
        {kids.map((child, i) => (
          <div key={i} className={styles.childCard}>
            <Field label="מספר זהות">
              <input
                className={styles.input}
                value={child.israeliId}
                onChange={(e) => updateChild(i, "israeliId", e.target.value)}
                dir="ltr"
              />
            </Field>

            <Field label="שם משפחה">
              <input
                className={styles.input}
                value={child.lastName}
                onChange={(e) => updateChild(i, "lastName", e.target.value)}
              />
            </Field>

            <Field label="שם פרטי">
              <input
                className={styles.input}
                value={child.firstName}
                onChange={(e) => updateChild(i, "firstName", e.target.value)}
              />
            </Field>

            <Field label="תאריך לידה">
              <input
                className={styles.input}
                type="date"
                value={child.birthDate}
                onChange={(e) => updateChild(i, "birthDate", e.target.value)}
              />
            </Field>

            <Field label="תאריך כניסה">
              <input
                className={styles.input}
                type="date"
                value={child.entryDate}
                onChange={(e) => updateChild(i, "entryDate", e.target.value)}
              />
            </Field>

            <Field label="תאריך כניסה ראשון (PDF בלבד)">
              <input
                className={styles.input}
                type="date"
                value={extras.children[i]?.firstEntryDate ?? ""}
                onChange={(e) =>
                  setExtras((p) => {
                    if (!p) return p;
                    const next = structuredClone(p);
                    if (!next.children[i]) next.children[i] = emptyChildExtras();
                    next.children[i]!.firstEntryDate = e.target.value;
                    return next;
                  })
                }
              />
            </Field>

            <Field label="תאריך פתיחת תיק/הצטרפות (PDF בלבד)">
              <input
                className={styles.input}
                type="date"
                value={extras.children[i]?.fileJoinDate ?? ""}
                onChange={(e) =>
                  setExtras((p) => {
                    if (!p) return p;
                    const next = structuredClone(p);
                    if (!next.children[i]) next.children[i] = emptyChildExtras();
                    next.children[i]!.fileJoinDate = e.target.value;
                    return next;
                  })
                }
              />
            </Field> */}

            {/* {i >= 2 ? (
              <div className={styles.note}>
                שים לב: ה-PDF תומך עד 3 ילדים. ילדים נוספים לא ייכנסו ל-PDF.
              </div>
            ) : null} */}
          {/* </div> */}
        {/* ))} */}
      {/* </div> */}

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
          אישור
        </button>
      </div>

      {/* Debug helper if you want */}
      {/* <pre>{JSON.stringify(payload, null, 2)}</pre> */}
    </main>
  );
}
