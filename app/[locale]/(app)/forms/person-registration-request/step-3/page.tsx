"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import demo from "@/public/demo/intake.demo.json";

import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import { createClient } from "@/lib/supabase/client";

import { fieldMap } from "../fieldMap";
import { intakeToPdfFields } from "../intakeToPdfFields";
import styles from "./page.module.css";

type IntakeRecord = typeof demo;

type Trip = { startDate: string; endDate: string; purpose: string };

type ParentExtras = {
  firstNameHebrew: string;
  lastNameHebrew: string;
  firstNameEnglish: string;
  lastNameEnglish: string;
  idNumber: string;
  passportNumber: string;
};

type PartnerExtras = {
  firstNameEnglish: string;
  lastNameEnglish: string;
};

type ChildExtras = {
  firstEntryDate: string;
  fileJoinDate: string;
};

type ExtrasState = {
  // basic english names + previous name
  firstNameEnglish: string;
  lastNameEnglish: string;
  prevLastNameEnglish: string;

  // birth
  birthCountry: string;
  birthCity: string;

  // visa
  purposeOfStay: string;

  // address phone
  addressPhoneNumber: string;

  // parents
  father: ParentExtras;
  mother: ParentExtras;

  // partner + family
  partner: PartnerExtras;
  numberChildrenUnder18: string;

  // work/income
  employerName: string;
  employerAddress: string;
  selfEmploymentStartDate: string;
  unemployedWithIncomeStartDate: string;
  selfEmployedYearlyIncome: string;
  unemployedYearlyIncome: string;

  // trips
  trips: Trip[];

  // optional “extras-only” dates/fields you had in other pages
  requesterEntryDate?: string;

  // children extra dates (aligned with intake.step6.children)
  children: ChildExtras[];
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.sectionTitle}>{children}</h2>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}{" "}
        {required ? <span className={styles.requiredStar}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

function safePart(title: string) {
  return (
    (title ?? "")
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .slice(0, 60) || "Untitled"
  );
}

function downloadPdf(filename: string, pdfBytes: Uint8Array) {
  const bytes = new Uint8Array(pdfBytes);
  const blob = new Blob([bytes.buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function emptyTrip(): Trip {
  return { startDate: "", endDate: "", purpose: "" };
}

function emptyChildExtras(): ChildExtras {
  return { firstEntryDate: "", fileJoinDate: "" };
}

function deriveExtrasFromIntake(d: IntakeRecord): ExtrasState {
  const kids = d.intake.step6.children ?? [];
  const kidsExtras: ChildExtras[] = kids.map((k) => ({
    firstEntryDate: k.entryDate ?? "",
    fileJoinDate: "",
  }));

  return {
    firstNameEnglish: "",
    lastNameEnglish: "",
    prevLastNameEnglish: "",

    birthCountry: "",
    birthCity: "",

    purposeOfStay: d.intake.step2.visaType ?? "",

    addressPhoneNumber: d.intake.step1.phone ?? "",

    father: {
      firstNameHebrew: "",
      lastNameHebrew: "",
      firstNameEnglish: "",
      lastNameEnglish: "",
      idNumber: "",
      passportNumber: "",
    },

    mother: {
      firstNameHebrew: "",
      lastNameHebrew: "",
      firstNameEnglish: "",
      lastNameEnglish: "",
      idNumber: "",
      passportNumber: "",
    },

    partner: {
      firstNameEnglish: "",
      lastNameEnglish: "",
    },

    numberChildrenUnder18: String((kids.length ?? 0) || ""),

    employerName: "",
    employerAddress: "",
    selfEmploymentStartDate: "",
    unemployedWithIncomeStartDate: "",
    selfEmployedYearlyIncome: "",
    unemployedYearlyIncome: "",

    trips: [emptyTrip()],
    children: kidsExtras,
  };
}

export default function PersonRegistrationPage() {
  const router = useRouter();

  const sp = useSearchParams();
  const instanceId = sp.get("instanceId") ?? undefined;

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

  async function saveDraft(existingInstanceId?: string) {
    const supabase = createClient();

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userRes.user;
    if (!user) throw new Error("Not logged in");
    if (!draft || !extras) throw new Error("No data to save");

    const title =
      `${draft.intake?.step1?.firstName ?? ""} ${draft.intake?.step1?.lastName ?? ""}`.trim() ||
      draft.intake?.step1?.israeliId ||
      "Untitled";

    if (!existingInstanceId) {
      const { data, error } = await supabase
        .from("form_instances")
        .insert({
          user_id: user.id,
          form_slug: "person-registration-request",
          title,
          draft: payload ?? draft,
          extras,
        })
        .select("id")
        .single();

      if (error) throw error;
      return data.id as string;
    } else {
      const { error } = await supabase
        .from("form_instances")
        .update({
          title,
          draft: payload ?? draft,
          extras,
        })
        .eq("id", existingInstanceId)
        .eq("user_id", user.id);

      if (error) throw error;
      return existingInstanceId;
    }
  }

  async function onDownloadPdf(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !extras) return;

    await saveDraft(instanceId);

    const fields = intakeToPdfFields(draft as any, extras as any);

    const [tplRes, fontRes] = await Promise.all([
      fetch("/forms/person-registration.pdf"),
      fetch("/fonts/SimplerPro-Regular.otf"),
    ]);

    if (!tplRes.ok) {
      throw new Error(
        `Failed to load template PDF: ${tplRes.status} ${tplRes.statusText} url=${tplRes.url}`,
      );
    }
    if (!fontRes.ok) {
      throw new Error(
        `Failed to load font: ${fontRes.status} ${fontRes.statusText} url=${fontRes.url}`,
      );
    }

    const templateBytes = new Uint8Array(await tplRes.arrayBuffer());
    const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

    const outBytes = await fillFieldsToNewPdfBytesClient(
      templateBytes,
      fields,
      fieldMap,
      {
        fontBytes,
        autoDetectRtl: true,
        defaultRtlAlignRight: true,
      },
    );

    const s1 = draft.intake.step1;
    const fileName = `person_registration_${safePart(
      s1.israeliId || s1.passportNumber || s1.lastName || "unknown",
    )}_${new Date().toISOString().slice(0, 10)}.pdf`;

    downloadPdf(fileName, outBytes);
  }

  if (!draft || !payload || !extras) {
    return <main className={styles.page}>Loading…</main>;
  }

  const kids = draft.intake.step6.children ?? [];
  const nextUrl = instanceId
    ? `./step-4?instanceId=${encodeURIComponent(instanceId)}`
    : "./step-4";

  return (
    <main className={styles.page}>
      {/* Match your “wizard-style” header */}
      <div className={styles.header}>
        <div className={styles.headerText}>استبيان تسجيل شخص</div>
        <div className={styles.headerText}>שאלון לרישום נפש</div>
      </div>

      <form onSubmit={onDownloadPdf} className={styles.form}>
        <SectionTitle>البيانات الشخصية פרטים אישיים </SectionTitle>
        <SectionTitle>
          كما هو مدوّن في جواز السفر כפי שרשומים בדרכון{" "}
        </SectionTitle>

        <Field label="الاسم الشخصي    שם פרטי">
          <input
            value={draft.intake.step1.firstName}
            onChange={(e) => update("intake.step1.firstName", e.target.value)}
            className={styles.input}
          />
        </Field>

        {/* <Field label="שם פרטי (אנגלית) (PDF בלבד)">
          <input
            value={extras.firstNameEnglish}
            onChange={(e) =>
              setExtras((p) =>
                p ? { ...p, firstNameEnglish: e.target.value } : p,
              )
            }
            className={styles.input}
            dir="ltr"
          />
        </Field> */}

        <Field label="اسم العائلة   שם משפחה   ">
          <input
            value={draft.intake.step1.lastName}
            onChange={(e) => update("intake.step1.lastName", e.target.value)}
            className={styles.input}
          />
        </Field>

        {/* <Field label="שם משפחה (אנגלית) (PDF בלבד)">
          <input
            value={extras.lastNameEnglish}
            onChange={(e) =>
              setExtras((p) =>
                p ? { ...p, lastNameEnglish: e.target.value } : p,
              )
            }
            className={styles.input}
            dir="ltr"
          />
        </Field> */}

        {/* <SectionTitle>שמות קודמים</SectionTitle> */}

        {/* <Field label="שם פרטי קודם (עברית) (DB: step1.oldFirstName)">
          <input
            value={draft.intake.step1.oldFirstName}
            onChange={(e) =>
              update("intake.step1.oldFirstName", e.target.value)
            }
            className={styles.input}
          />
        </Field> */}

        {/* <Field label="שם משפחה קודם (עברית) (DB: step1.oldLastName)">
          <input
            value={draft.intake.step1.oldLastName}
            onChange={(e) => update("intake.step1.oldLastName", e.target.value)}
            className={styles.input}
          />
        </Field> */}

        {/* <Field label="שם משפחה קודם (אנגלית) (PDF בלבד)">
          <input
            value={extras.prevLastNameEnglish}
            onChange={(e) =>
              setExtras((p) =>
                p ? { ...p, prevLastNameEnglish: e.target.value } : p,
              )
            }
            className={styles.input}
            dir="ltr"
          />
        </Field> */}

        {/* <SectionTitle>לידה ואזרחות</SectionTitle> */}

        <Field label="تاريخ الميلاد   תאריך לידה  ">
          <input
            type="date"
            value={draft.intake.step1.birthDate}
            onChange={(e) => update("intake.step1.birthDate", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="بلد الميلاد   ארץ לידה">
          <input
            value={extras.birthCountry}
            onChange={(e) =>
              setExtras((p) => (p ? { ...p, birthCountry: e.target.value } : p))
            }
            className={styles.input}
          />
        </Field>

        <Field label="مدينة الميلاد   עיר לידה">
          <input
            value={extras.birthCity}
            onChange={(e) =>
              setExtras((p) => (p ? { ...p, birthCity: e.target.value } : p))
            }
            className={styles.input}
          />
        </Field>

        <Field label="الجنسية   אזרחות">
          <input
            value={draft.intake.step1.nationality}
            onChange={(e) => update("intake.step1.nationality", e.target.value)}
            className={styles.input}
          />
        </Field>

        {/* <SectionTitle>דרכון</SectionTitle> */}

        <Field label=" رقم جواز السفر מספר דרכון">
          <input
            value={draft.intake.step1.passportNumber}
            onChange={(e) =>
              update("intake.step1.passportNumber", e.target.value)
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>

        <Field label=" بلد إصدار جواز السفر   ארץ הוצאת דרכון  ">
          <input
            value={draft.intake.step1.passportIssueCountry}
            onChange={(e) =>
              update("intake.step1.passportIssueCountry", e.target.value)
            }
            className={styles.input}
          />
        </Field>

        <div className={styles.row2}>
          <Field label=" تاريخ إصدار جواز السفر   תאריך הוצאת דרכון  ">
            <input
              type="date"
              value={draft.intake.step1.passportIssueDate}
              onChange={(e) =>
                update("intake.step1.passportIssueDate", e.target.value)
              }
              className={styles.input}
            />
          </Field>

          <Field label=" تاريخ انتهاء جواز السفر   תאריך פקיעת דרכון  ">
            <input
              type="date"
              value={draft.intake.step1.passportExpiryDate}
              onChange={(e) =>
                update("intake.step1.passportExpiryDate", e.target.value)
              }
              className={styles.input}
            />
          </Field>
        </div>

        <SectionTitle>التأشيرة אשרה</SectionTitle>

        <div className={styles.row2}>
          <Field label=" بداية التأشيرة תחילת אשרה">
            <input
              type="date"
              value={draft.intake.step2.visaStartDate}
              onChange={(e) =>
                update("intake.step2.visaStartDate", e.target.value)
              }
              className={styles.input}
            />
          </Field>

          <Field label=" انتهاء التأشيرة סיום אשרה">
            <input
              type="date"
              value={draft.intake.step2.visaEndDate}
              onChange={(e) =>
                update("intake.step2.visaEndDate", e.target.value)
              }
              className={styles.input}
            />
          </Field>
        </div>

        <Field label="تاريخ الدخول إلى البلاد   תאריך כניסה לארץ">
          <input
            type="date"
            value={draft.intake.step2.entryDate}
            onChange={(e) => update("intake.step2.entryDate", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="نوع التأشيرة   סוג אשרה">
          <input
            value={extras.purposeOfStay}
            onChange={(e) =>
              setExtras((p) =>
                p ? { ...p, purposeOfStay: e.target.value } : p,
              )
            }
            className={styles.input}
          />
        </Field>

        <SectionTitle> عنوان כתובת</SectionTitle>

        <Field label="شارع רחוב">
          <input
            value={draft.intake.step3.registeredAddress.street}
            onChange={(e) =>
              update("intake.step3.registeredAddress.street", e.target.value)
            }
            className={styles.input}
          />
        </Field>

        <div className={styles.row2}>
          <Field label="رقم المنزل מספר בית">
            <input
              value={draft.intake.step3.registeredAddress.houseNumber}
              onChange={(e) =>
                update(
                  "intake.step3.registeredAddress.houseNumber",
                  e.target.value,
                )
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label=" دخول כניסה">
            <input
              value={draft.intake.step3.registeredAddress.entry}
              onChange={(e) =>
                update("intake.step3.registeredAddress.entry", e.target.value)
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="شقة דירה ">
            <input
              value={draft.intake.step3.registeredAddress.apartment}
              onChange={(e) =>
                update(
                  "intake.step3.registeredAddress.apartment",
                  e.target.value,
                )
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="  الرمز البريدي מיקוד">
            <input
              value={draft.intake.step3.registeredAddress.zip}
              onChange={(e) =>
                update("intake.step3.registeredAddress.zip", e.target.value)
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>
        </div>

        <Field label="مدينة עיר ">
          <input
            value={draft.intake.step3.registeredAddress.city}
            onChange={(e) =>
              update("intake.step3.registeredAddress.city", e.target.value)
            }
            className={styles.input}
          />
        </Field>

        <Field label="هاتف   טלפון ">
          <input
            value={extras.addressPhoneNumber}
            onChange={(e) =>
              setExtras((p) =>
                p ? { ...p, addressPhoneNumber: e.target.value } : p,
              )
            }
            className={styles.input}
            inputMode="tel"
            dir="ltr"
          />
        </Field>

        <SectionTitle> آباء הורים</SectionTitle>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>אב</div>

          <Field label="الاسم الشخصي    שם פרטי">
            <input
              value={extras.father.firstNameHebrew}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        father: {
                          ...p.father,
                          firstNameHebrew: e.target.value,
                        },
                      }
                    : p,
                )
              }
              className={styles.input}
            />
          </Field>

          <Field label="اسم العائلة   שם משפחה">
            <input
              value={extras.father.lastNameHebrew}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        father: { ...p.father, lastNameHebrew: e.target.value },
                      }
                    : p,
                )
              }
              className={styles.input}
            />
          </Field>

          {/* <Field label="שם פרטי (אנגלית)">
            <input
              value={extras.father.firstNameEnglish}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        father: {
                          ...p.father,
                          firstNameEnglish: e.target.value,
                        },
                      }
                    : p,
                )
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="שם משפחה (אנגלית)">
            <input
              value={extras.father.lastNameEnglish}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        father: {
                          ...p.father,
                          lastNameEnglish: e.target.value,
                        },
                      }
                    : p,
                )
              }
              className={styles.input}
              dir="ltr"
            />
          </Field> */}

          <div className={styles.row2}>
            <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות   ">
              <input
                value={extras.father.idNumber}
                onChange={(e) =>
                  setExtras((p) =>
                    p
                      ? {
                          ...p,
                          father: { ...p.father, idNumber: e.target.value },
                        }
                      : p,
                  )
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>

            <Field label="رقم جواز السفر מספר דרכון">
              <input
                value={extras.father.passportNumber}
                onChange={(e) =>
                  setExtras((p) =>
                    p
                      ? {
                          ...p,
                          father: {
                            ...p.father,
                            passportNumber: e.target.value,
                          },
                        }
                      : p,
                  )
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>אם</div>

          <Field label="الاسم الشخصي    שם פרטי">
            <input
              value={extras.mother.firstNameHebrew}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        mother: {
                          ...p.mother,
                          firstNameHebrew: e.target.value,
                        },
                      }
                    : p,
                )
              }
              className={styles.input}
            />
          </Field>

          <Field label="اسم العائلة   שם משפחה">
            <input
              value={extras.mother.lastNameHebrew}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        mother: { ...p.mother, lastNameHebrew: e.target.value },
                      }
                    : p,
                )
              }
              className={styles.input}
            />
          </Field>

          {/* <Field label="שם פרטי (אנגלית)">
            <input
              value={extras.mother.firstNameEnglish}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        mother: {
                          ...p.mother,
                          firstNameEnglish: e.target.value,
                        },
                      }
                    : p,
                )
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="שם משפחה (אנגלית)">
            <input
              value={extras.mother.lastNameEnglish}
              onChange={(e) =>
                setExtras((p) =>
                  p
                    ? {
                        ...p,
                        mother: {
                          ...p.mother,
                          lastNameEnglish: e.target.value,
                        },
                      }
                    : p,
                )
              }
              className={styles.input}
              dir="ltr"
            />
          </Field> */}

          <div className={styles.row2}>
            <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות   ">
              <input
                value={extras.mother.idNumber}
                onChange={(e) =>
                  setExtras((p) =>
                    p
                      ? {
                          ...p,
                          mother: { ...p.mother, idNumber: e.target.value },
                        }
                      : p,
                  )
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>

            <Field label=" رقم جواز السفر מספר דרכון">
              <input
                value={extras.mother.passportNumber}
                onChange={(e) =>
                  setExtras((p) =>
                    p
                      ? {
                          ...p,
                          mother: {
                            ...p.mother,
                            passportNumber: e.target.value,
                          },
                        }
                      : p,
                  )
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>
          </div>
        </div>

        <SectionTitle>أطفال ילדים</SectionTitle>

        <div className={styles.childrenGrid}>
          {kids.map((child, i) => (
            <div key={i} className={styles.childCard}>
              <Field label="رقم بطاقة الهوية الإسرائيلية    מספר תעודת זהות   ">
                <input
                  className={styles.input}
                  value={child.israeliId}
                  onChange={(e) => updateChild(i, "israeliId", e.target.value)}
                  dir="ltr"
                />
              </Field>

              <Field label="اسم العائلة   שם משפחה">
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

              <Field label="تاريخ الميلاد   תאריך לידה">
                <input
                  className={styles.input}
                  type="date"
                  value={child.birthDate}
                  onChange={(e) => updateChild(i, "birthDate", e.target.value)}
                />
              </Field>

              <Field label="تاريخ الدخول إلى البلاد תאריך כניסה לארץ">
                <input
                  className={styles.input}
                  type="date"
                  value={child.entryDate}
                  onChange={(e) => updateChild(i, "entryDate", e.target.value)}
                />
              </Field>

              <Field label=" تاريخ الدخول الأول תאריך כניסה ראשון  ">
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

              <Field label=" تاريخ الانضمام للملف תאריך הצטרפות לתיק">
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

        <div className={styles.footerRow}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => router.push(nextUrl)}
          >
            לחתימה ואישור
          </button>
        </div>

        {/* <div className={styles.actionsRow}> */}
        {/* <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() =>
              downloadJson(
                `intake_${safePart(
                  draft.intake.step1.email ||
                    draft.intake.step1.israeliId ||
                    "demo",
                )}.json`,
                payload,
              )
            }
          >
            הורד JSON (DB record)
          </button> */}

        {/* <button type="submit" className={styles.buttonPrimary}>
            הורד PDF
          </button> */}
        {/* </div> */}

        {/* <details className={styles.details}>
          <summary>תצוגה מקדימה של ה-JSON (DB record)</summary>
          <pre className={styles.previewBox}>
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details> */}
      </form>
    </main>
  );
}
