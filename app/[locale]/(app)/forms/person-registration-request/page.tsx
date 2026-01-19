"use client";

import React, { useMemo } from "react";
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import { fieldMap } from "./fieldMap";
import { intakeToPdfFields } from "./intakeToPdfFields";
import { createClient } from "@/lib/supabase/client";
import { useWizard } from "./WizardProvider";
import styles from "./page.module.css";

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

export default function PersonRegistrationPage() {
  const { draft, extras, setExtras, update, isHydrated, instanceId } = useWizard();

  const payload = useMemo(() => {
    if (!draft) return null;

    // optional cleanup: remove empty children rows
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
    if (!draft) throw new Error("No draft to save");

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
    if (!draft) return;

    // optional but matches your pattern: save before generate
    await saveDraft(instanceId ?? undefined);

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

  if (!isHydrated || !draft || !payload) {
    return <main className={styles.loadingPage}>Loading…</main>;
  }
  

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>טופס רישום אדם (Person Registration)</h1>

      <form onSubmit={onDownloadPdf} className={styles.form}>
        <SectionTitle>פרטי המבקש/ת</SectionTitle>

        <Field label="שם פרטי (עברית) (DB: step1.firstName)">
          <input
            value={draft.intake.step1.firstName}
            onChange={(e) => update("intake.step1.firstName", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="שם פרטי (אנגלית) (PDF בלבד)">
          <input
            value={extras.firstNameEnglish}
            onChange={(e) =>
              setExtras((p) => ({ ...p, firstNameEnglish: e.target.value }))
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>

        <Field label="שם משפחה (עברית) (DB: step1.lastName)">
          <input
            value={draft.intake.step1.lastName}
            onChange={(e) => update("intake.step1.lastName", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="שם משפחה (אנגלית) (PDF בלבד)">
          <input
            value={extras.lastNameEnglish}
            onChange={(e) =>
              setExtras((p) => ({ ...p, lastNameEnglish: e.target.value }))
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>

        <SectionTitle>שמות קודמים</SectionTitle>

        <Field label="שם פרטי קודם (עברית) (DB: step1.oldFirstName)">
          <input
            value={draft.intake.step1.oldFirstName}
            onChange={(e) => update("intake.step1.oldFirstName", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="שם משפחה קודם (עברית) (DB: step1.oldLastName)">
          <input
            value={draft.intake.step1.oldLastName}
            onChange={(e) => update("intake.step1.oldLastName", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="שם משפחה קודם (אנגלית) (PDF בלבד)">
          <input
            value={extras.prevLastNameEnglish}
            onChange={(e) =>
              setExtras((p) => ({ ...p, prevLastNameEnglish: e.target.value }))
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>

        <SectionTitle>לידה ואזרחות</SectionTitle>

        <Field label="תאריך לידה (DB: step1.birthDate)">
          <input
            type="date"
            value={draft.intake.step1.birthDate}
            onChange={(e) => update("intake.step1.birthDate", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="ארץ לידה (PDF בלבד)">
          <input
            value={extras.birthCountry}
            onChange={(e) => setExtras((p) => ({ ...p, birthCountry: e.target.value }))}
            className={styles.input}
          />
        </Field>

        <Field label="עיר לידה (PDF בלבד)">
          <input
            value={extras.birthCity}
            onChange={(e) => setExtras((p) => ({ ...p, birthCity: e.target.value }))}
            className={styles.input}
          />
        </Field>

        <Field label="אזרחות (DB: step1.nationality)">
          <input
            value={draft.intake.step1.nationality}
            onChange={(e) => update("intake.step1.nationality", e.target.value)}
            className={styles.input}
          />
        </Field>

        <SectionTitle>דרכון</SectionTitle>

        <Field label="מספר דרכון (DB: step1.passportNumber)">
          <input
            value={draft.intake.step1.passportNumber}
            onChange={(e) => update("intake.step1.passportNumber", e.target.value)}
            className={styles.input}
            dir="ltr"
          />
        </Field>

        <Field label="מדינת הנפקה (DB: step1.passportIssueCountry)">
          <input
            value={draft.intake.step1.passportIssueCountry}
            onChange={(e) => update("intake.step1.passportIssueCountry", e.target.value)}
            className={styles.input}
          />
        </Field>

        <div className={styles.twoCols}>
          <Field label="תאריך הנפקה (DB: step1.passportIssueDate)">
            <input
              type="date"
              value={draft.intake.step1.passportIssueDate}
              onChange={(e) => update("intake.step1.passportIssueDate", e.target.value)}
              className={styles.input}
            />
          </Field>

          <Field label="תוקף עד (DB: step1.passportExpiryDate)">
            <input
              type="date"
              value={draft.intake.step1.passportExpiryDate}
              onChange={(e) => update("intake.step1.passportExpiryDate", e.target.value)}
              className={styles.input}
            />
          </Field>
        </div>

        <SectionTitle>אשרה / כניסה</SectionTitle>

        <div className={styles.twoCols}>
          <Field label="תחילת אשרה (DB: step2.visaStartDate)">
            <input
              type="date"
              value={draft.intake.step2.visaStartDate}
              onChange={(e) => update("intake.step2.visaStartDate", e.target.value)}
              className={styles.input}
            />
          </Field>

          <Field label="סיום אשרה (DB: step2.visaEndDate)">
            <input
              type="date"
              value={draft.intake.step2.visaEndDate}
              onChange={(e) => update("intake.step2.visaEndDate", e.target.value)}
              className={styles.input}
            />
          </Field>
        </div>

        <Field label="תאריך הגעה/כניסה (DB: step2.entryDate)">
          <input
            type="date"
            value={draft.intake.step2.entryDate}
            onChange={(e) => update("intake.step2.entryDate", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="מטרת שהייה (PDF; ברירת מחדל מ-DB: step2.visaType)">
          <input
            value={extras.purposeOfStay}
            onChange={(e) => setExtras((p) => ({ ...p, purposeOfStay: e.target.value }))}
            className={styles.input}
          />
        </Field>

        <SectionTitle>כתובת</SectionTitle>

        <Field label="רחוב (DB: step3.registeredAddress.street)">
          <input
            value={draft.intake.step3.registeredAddress.street}
            onChange={(e) => update("intake.step3.registeredAddress.street", e.target.value)}
            className={styles.input}
          />
        </Field>

        <div className={styles.twoCols}>
          <Field label="מספר בית (DB: houseNumber)">
            <input
              value={draft.intake.step3.registeredAddress.houseNumber}
              onChange={(e) =>
                update("intake.step3.registeredAddress.houseNumber", e.target.value)
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="כניסה (DB: entry)">
            <input
              value={draft.intake.step3.registeredAddress.entry}
              onChange={(e) => update("intake.step3.registeredAddress.entry", e.target.value)}
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="דירה (DB: apartment)">
            <input
              value={draft.intake.step3.registeredAddress.apartment}
              onChange={(e) =>
                update("intake.step3.registeredAddress.apartment", e.target.value)
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="מיקוד (DB: zip)">
            <input
              value={draft.intake.step3.registeredAddress.zip}
              onChange={(e) => update("intake.step3.registeredAddress.zip", e.target.value)}
              className={styles.input}
              dir="ltr"
            />
          </Field>
        </div>

        <Field label="עיר (DB: city)">
          <input
            value={draft.intake.step3.registeredAddress.city}
            onChange={(e) => update("intake.step3.registeredAddress.city", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="טלפון לכתובת (PDF; ברירת מחדל מ-DB: step1.phone)">
          <input
            value={extras.addressPhoneNumber}
            onChange={(e) =>
              setExtras((p) => ({ ...p, addressPhoneNumber: e.target.value }))
            }
            className={styles.input}
            inputMode="tel"
            dir="ltr"
          />
        </Field>

        <SectionTitle>הורים (PDF בלבד)</SectionTitle>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>אב</div>

          <Field label="שם פרטי (עברית)">
            <input
              value={extras.father.firstNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  father: { ...p.father, firstNameHebrew: e.target.value },
                }))
              }
              className={styles.input}
            />
          </Field>

          <Field label="שם משפחה (עברית)">
            <input
              value={extras.father.lastNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  father: { ...p.father, lastNameHebrew: e.target.value },
                }))
              }
              className={styles.input}
            />
          </Field>

          <Field label="שם פרטי (אנגלית)">
            <input
              value={extras.father.firstNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  father: { ...p.father, firstNameEnglish: e.target.value },
                }))
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="שם משפחה (אנגלית)">
            <input
              value={extras.father.lastNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  father: { ...p.father, lastNameEnglish: e.target.value },
                }))
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <div className={styles.twoCols}>
            <Field label="מספר זהות">
              <input
                value={extras.father.idNumber}
                onChange={(e) =>
                  setExtras((p) => ({
                    ...p,
                    father: { ...p.father, idNumber: e.target.value },
                  }))
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>

            <Field label="מספר דרכון">
              <input
                value={extras.father.passportNumber}
                onChange={(e) =>
                  setExtras((p) => ({
                    ...p,
                    father: { ...p.father, passportNumber: e.target.value },
                  }))
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>אם</div>

          <Field label="שם פרטי (עברית)">
            <input
              value={extras.mother.firstNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  mother: { ...p.mother, firstNameHebrew: e.target.value },
                }))
              }
              className={styles.input}
            />
          </Field>

          <Field label="שם משפחה (עברית)">
            <input
              value={extras.mother.lastNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  mother: { ...p.mother, lastNameHebrew: e.target.value },
                }))
              }
              className={styles.input}
            />
          </Field>

          <Field label="שם פרטי (אנגלית)">
            <input
              value={extras.mother.firstNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  mother: { ...p.mother, firstNameEnglish: e.target.value },
                }))
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="שם משפחה (אנגלית)">
            <input
              value={extras.mother.lastNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  mother: { ...p.mother, lastNameEnglish: e.target.value },
                }))
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <div className={styles.twoCols}>
            <Field label="מספר זהות">
              <input
                value={extras.mother.idNumber}
                onChange={(e) =>
                  setExtras((p) => ({
                    ...p,
                    mother: { ...p.mother, idNumber: e.target.value },
                  }))
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>

            <Field label="מספר דרכון">
              <input
                value={extras.mother.passportNumber}
                onChange={(e) =>
                  setExtras((p) => ({
                    ...p,
                    mother: { ...p.mother, passportNumber: e.target.value },
                  }))
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>
          </div>
        </div>

        <SectionTitle>מצב אישי + בן/בת זוג</SectionTitle>

        <Field label="תאריך עדכון מצב אישי (DB: step3.statusDate)">
          <input
            type="date"
            value={draft.intake.step3.statusDate}
            onChange={(e) => update("intake.step3.statusDate", e.target.value)}
            className={styles.input}
          />
        </Field>

        <Field label="מספר ילדים מתחת לגיל 18 (PDF; ברירת מחדל = מספר ילדים ב-DB)">
          <input
            value={extras.numberChildrenUnder18}
            onChange={(e) =>
              setExtras((p) => ({ ...p, numberChildrenUnder18: e.target.value }))
            }
            className={styles.input}
            dir="ltr"
            inputMode="numeric"
          />
        </Field>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            בן/בת זוג (ברירת מחדל מ-DB: step5.person)
          </div>

          <Field label="שם פרטי (עברית) (DB: step5.person.firstName)">
            <input
              value={draft.intake.step5.person.firstName}
              onChange={(e) => update("intake.step5.person.firstName", e.target.value)}
              className={styles.input}
            />
          </Field>

          <Field label="שם משפחה (עברית) (DB: step5.person.lastName)">
            <input
              value={draft.intake.step5.person.lastName}
              onChange={(e) => update("intake.step5.person.lastName", e.target.value)}
              className={styles.input}
            />
          </Field>

          <Field label="שם פרטי (אנגלית) (PDF בלבד)">
            <input
              value={extras.partner.firstNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  partner: { ...p.partner, firstNameEnglish: e.target.value },
                }))
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="שם משפחה (אנגלית) (PDF בלבד)">
            <input
              value={extras.partner.lastNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  partner: { ...p.partner, lastNameEnglish: e.target.value },
                }))
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <div className={styles.twoCols}>
            <Field label="מספר זהות (DB: step5.person.israeliId)">
              <input
                value={draft.intake.step5.person.israeliId}
                onChange={(e) => update("intake.step5.person.israeliId", e.target.value)}
                className={styles.input}
                dir="ltr"
              />
            </Field>

            <Field label="מספר דרכון (DB: step5.person.passportNumber)">
              <input
                value={draft.intake.step5.person.passportNumber}
                onChange={(e) =>
                  update("intake.step5.person.passportNumber", e.target.value)
                }
                className={styles.input}
                dir="ltr"
              />
            </Field>
          </div>
        </div>

        <SectionTitle>בנק</SectionTitle>

        <Field label="שם הבנק (DB: step4.bank.bankName)">
          <input
            value={draft.intake.step4.bank.bankName}
            onChange={(e) => update("intake.step4.bank.bankName", e.target.value)}
            className={styles.input}
          />
        </Field>

        <div className={styles.twoCols}>
          <Field label="סניף (DB: step4.bank.branch)">
            <input
              value={draft.intake.step4.bank.branch}
              onChange={(e) => update("intake.step4.bank.branch", e.target.value)}
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="מספר חשבון (DB: step4.bank.accountNumber)">
            <input
              value={draft.intake.step4.bank.accountNumber}
              onChange={(e) => update("intake.step4.bank.accountNumber", e.target.value)}
              className={styles.input}
              dir="ltr"
            />
          </Field>
        </div>

        <SectionTitle>תעסוקה / הכנסות (PDF בלבד)</SectionTitle>

        <Field label="שם מעסיק">
          <input
            value={extras.employerName}
            onChange={(e) => setExtras((p) => ({ ...p, employerName: e.target.value }))}
            className={styles.input}
          />
        </Field>

        <Field label="כתובת מעסיק">
          <input
            value={extras.employerAddress}
            onChange={(e) =>
              setExtras((p) => ({ ...p, employerAddress: e.target.value }))
            }
            className={styles.input}
          />
        </Field>

        <div className={styles.twoCols}>
          <Field label="תאריך תחילת עצמאי/ת">
            <input
              type="date"
              value={extras.selfEmploymentStartDate}
              onChange={(e) =>
                setExtras((p) => ({ ...p, selfEmploymentStartDate: e.target.value }))
              }
              className={styles.input}
            />
          </Field>

          <Field label="תאריך תחילת לא-מועסק/ת עם הכנסה">
            <input
              type="date"
              value={extras.unemployedWithIncomeStartDate}
              onChange={(e) =>
                setExtras((p) => ({
                  ...p,
                  unemployedWithIncomeStartDate: e.target.value,
                }))
              }
              className={styles.input}
            />
          </Field>
        </div>

        <div className={styles.twoCols}>
          <Field label="הכנסה שנתית (עצמאי/ת)">
            <input
              value={extras.selfEmployedYearlyIncome}
              onChange={(e) =>
                setExtras((p) => ({ ...p, selfEmployedYearlyIncome: e.target.value }))
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>

          <Field label="הכנסה שנתית (לא-מועסק/ת עם הכנסה)">
            <input
              value={extras.unemployedYearlyIncome}
              onChange={(e) =>
                setExtras((p) => ({ ...p, unemployedYearlyIncome: e.target.value }))
              }
              className={styles.input}
              dir="ltr"
            />
          </Field>
        </div>

        <SectionTitle>ביטוח לאומי</SectionTitle>

        <Field label="מספר תיק ביטוח לאומי (DB: step4.nationalInsurance.fileNumber)">
          <input
            value={draft.intake.step4.nationalInsurance.fileNumber}
            onChange={(e) =>
              update("intake.step4.nationalInsurance.fileNumber", e.target.value)
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>

        <Field label="סוג קצבה (DB: step4.nationalInsurance.allowanceType)">
          <input
            value={draft.intake.step4.nationalInsurance.allowanceType}
            onChange={(e) =>
              update("intake.step4.nationalInsurance.allowanceType", e.target.value)
            }
            className={styles.input}
          />
        </Field>

        <Field label="מספר תיק קצבה (DB: step4.nationalInsurance.allowanceFileNumber)">
          <input
            value={draft.intake.step4.nationalInsurance.allowanceFileNumber}
            onChange={(e) =>
              update("intake.step4.nationalInsurance.allowanceFileNumber", e.target.value)
            }
            className={styles.input}
            dir="ltr"
          />
        </Field>

        <SectionTitle>נסיעות לחו&quot;ל (PDF בלבד)</SectionTitle>

        {extras.trips.map((t, i) => (
          <div key={i} className={styles.panel}>
            <div className={styles.panelTitle}>נסיעה #{i + 1}</div>

            <div className={styles.twoCols}>
              <Field label="מתאריך">
                <input
                  type="date"
                  value={t.startDate}
                  onChange={(e) =>
                    setExtras((p) => {
                      const next = structuredClone(p);
                      next.trips[i] = { ...next.trips[i], startDate: e.target.value };
                      return next;
                    })
                  }
                  className={styles.input}
                />
              </Field>

              <Field label="עד תאריך">
                <input
                  type="date"
                  value={t.endDate}
                  onChange={(e) =>
                    setExtras((p) => {
                      const next = structuredClone(p);
                      next.trips[i] = { ...next.trips[i], endDate: e.target.value };
                      return next;
                    })
                  }
                  className={styles.input}
                />
              </Field>
            </div>

            <Field label="מטרה">
              <input
                value={t.purpose}
                onChange={(e) =>
                  setExtras((p) => {
                    const next = structuredClone(p);
                    next.trips[i] = { ...next.trips[i], purpose: e.target.value };
                    return next;
                  })
                }
                className={styles.input}
              />
            </Field>
          </div>
        ))}

        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() =>
              downloadJson(
                `intake_${safePart(
                  draft.intake.step1.email || draft.intake.step1.israeliId || "demo",
                )}.json`,
                payload,
              )
            }
          >
            הורד JSON (DB record)
          </button>

          <button type="submit" className={styles.buttonPrimary}>
            הורד PDF
          </button>
        </div>

        <details className={styles.details}>
          <summary>תצוגה מקדימה של ה-JSON (DB record)</summary>
          <pre className={styles.previewBox}>{JSON.stringify(payload, null, 2)}</pre>
        </details>
      </form>
    </main>
  );
}

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
    <label className={styles.fieldLabel}>
      <span>
        {label} {required ? <span className={styles.requiredStar}>*</span> : null}
      </span>
      {children}
    </label>
  );
}





