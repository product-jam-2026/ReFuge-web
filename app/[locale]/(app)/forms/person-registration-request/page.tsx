"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fieldMap } from "./fieldMap";
import { fillFieldsToNewPdfBytesClient } from "@/lib/pdf/fillPdfClient";
import demo from "@/public/demo/intake.demo.json";
import {
  intakeToPdfFields,
  deriveExtrasFromIntake,
  type IntakeRecord,
  type ExtrasState,
} from "./intakeToPdfFields";

// type IntakeRecord = {
//   intake: {
//     step1: {
//       lastName: string;
//       firstName: string;
//       oldLastName: string;
//       oldFirstName: string;
//       gender: string;
//       birthDate: string;
//       nationality: string;
//       israeliId: string;
//       passportNumber: string;
//       passportIssueDate: string;
//       passportExpiryDate: string;
//       passportIssueCountry: string;
//       phone: string;
//       email: string;
//     };
//     step2: {
//       residenceCountry: string;
//       residenceCity: string;
//       residenceAddress: string;
//       visaType: string;
//       visaStartDate: string;
//       visaEndDate: string;
//       entryDate: string;
//     };
//     step3: {
//       maritalStatus: string;
//       statusDate: string;
//       registeredAddress: {
//         city: string;
//         street: string;
//         houseNumber: string;
//         entry: string;
//         apartment: string;
//         zip: string;
//       };
//       mailingDifferent: boolean;
//       mailingAddress: {
//         city: string;
//         street: string;
//         houseNumber: string;
//         entry: string;
//         apartment: string;
//         zip: string;
//       };
//       employmentStatus: string;
//       notWorkingReason: string;
//       occupation: string;
//     };
//     step4: {
//       healthFund: string;
//       bank: { bankName: string; branch: string; accountNumber: string };
//       nationalInsurance: {
//         hasFile: string;
//         fileNumber: string;
//         getsAllowance: string;
//         allowanceType: string;
//         allowanceFileNumber: string;
//       };
//     };
//     step5: {
//       person: {
//         lastName: string;
//         firstName: string;
//         oldLastName: string;
//         oldFirstName: string;
//         gender: string;
//         birthDate: string;
//         nationality: string;
//         israeliId: string;
//         passportNumber: string;
//       };
//       maritalStatus: string;
//       statusDate: string;
//       phone: string;
//       email: string;
//     };
//     step6: {
//       children: Array<{
//         lastName: string;
//         firstName: string;
//         gender: string;
//         birthDate: string;
//         nationality: string;
//         israeliId: string;
//         residenceCountry: string;
//         entryDate: string;
//       }>;
//     };
//   };
// };

type TripRow = { startDate: string; endDate: string; purpose: string };

// type ExtrasState = {
//   // English name variants (PDF has both Hebrew+English fields)
//   firstNameEnglish: string;
//   lastNameEnglish: string;
//   prevLastNameEnglish: string;

//   // Birth details (not in DB template)
//   birthCountry: string;
//   birthCity: string;

//   // Phone for the address block (PDF has it as part of address)
//   addressPhoneNumber: string;

//   // Parents (not in DB template)
//   father: {
//     firstNameHebrew: string;
//     lastNameHebrew: string;
//     firstNameEnglish: string;
//     lastNameEnglish: string;
//     idNumber: string;
//     passportNumber: string;
//   };
//   mother: {
//     firstNameHebrew: string;
//     lastNameHebrew: string;
//     firstNameEnglish: string;
//     lastNameEnglish: string;
//     idNumber: string;
//     passportNumber: string;
//   };

//   // Partner English variants (partner Hebrew pulled from step5.person by default)
//   partner: {
//     firstNameEnglish: string;
//     lastNameEnglish: string;
//   };

//   // “meta”
//   numberChildrenUnder18: string; // PDF wants a number (string is fine)
//   purposeOfStay: string; // PDF has purposeOfStay (we default from step2.visaType)

//   // Employment / income (not in DB template)
//   employerName: string;
//   employerAddress: string;
//   selfEmploymentStartDate: string;
//   unemployedWithIncomeStartDate: string;
//   selfEmployedYearlyIncome: string;
//   unemployedYearlyIncome: string;

//   // Trips abroad (not in DB template)
//   trips: TripRow[];
// };

const emptyTrip = (): TripRow => ({ startDate: "", endDate: "", purpose: "" });

const initialExtras: ExtrasState = {
  firstNameEnglish: "",
  lastNameEnglish: "",
  prevLastNameEnglish: "",
  birthCountry: "",
  birthCity: "",
  addressPhoneNumber: "",

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

  partner: { firstNameEnglish: "", lastNameEnglish: "" },

  numberChildrenUnder18: "",
  purposeOfStay: "",

  employerName: "",
  employerAddress: "",
  selfEmploymentStartDate: "",
  unemployedWithIncomeStartDate: "",
  selfEmployedYearlyIncome: "",
  unemployedYearlyIncome: "",

  trips: [emptyTrip(), emptyTrip(), emptyTrip()],
};

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

function downloadPdf(filename: string, pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safePart(s: string) {
  return (
    (s ?? "")
      .toString()
      .trim()
      .replace(/[^\p{L}\p{N}_-]+/gu, "_")
      .slice(0, 40) || "unknown"
  );
}

export default function PersonRegistrationPage() {
  const [draft, setDraft] = useState<IntakeRecord | null>(null);
  const [extras, setExtras] = useState<ExtrasState>(initialExtras);

  // Hydrate ON PAGE LOAD from demo JSON
  // useEffect(() => {
  //   const d = structuredClone(demo) as IntakeRecord;
  //   setDraft(d);

  //   setExtras((prev) => ({
  //     ...prev,
  //     // default these so PDF can be produced immediately
  //     addressPhoneNumber: d.intake.step1.phone ?? "",
  //     numberChildrenUnder18: String(d.intake.step6.children?.length ?? 0),
  //     purposeOfStay: d.intake.step2.visaType ?? "",
  //   }));
  // }, []);

  // fix
  useEffect(() => {
  const d = structuredClone(demo) as IntakeRecord;
  setDraft(d);

  setExtras((prev) => ({
    ...prev,
    ...deriveExtrasFromIntake(d, prev),
  }) as ExtrasState);
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

  const payload = useMemo(() => {
    if (!draft) return null;

    // Keep DB clean (optional): remove empty children rows
    const kids = (draft.intake.step6.children ?? []).filter(
      (c) =>
        (c.firstName ?? "").trim() ||
        (c.lastName ?? "").trim() ||
        (c.israeliId ?? "").trim() ||
        (c.birthDate ?? "").trim()
    );

    const cleaned = structuredClone(draft);
    cleaned.intake.step6.children = kids;
    return cleaned;
  }, [draft]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;

      const fields = intakeToPdfFields(draft, extras);

    // const s1 = draft.intake.step1;
    // const s2 = draft.intake.step2;
    // const s3 = draft.intake.step3;
    // const s4 = draft.intake.step4;
    // const s5 = draft.intake.step5;

    // const addr = s3.registeredAddress;

    // const fields: Record<string, string> = {
    //   // ===== Page 0 =====
    //   firstNameHebrew: s1.firstName ?? "",
    //   firstNameEnglish: extras.firstNameEnglish ?? "",
    //   lastNameHebrew: s1.lastName ?? "",
    //   lastNameEnglish: extras.lastNameEnglish ?? "",

    //   prevLastNameHebrew: s1.oldLastName ?? "",
    //   prevLastNameEnglish: extras.prevLastNameEnglish ?? "",
    //   prevFirstNameHebrew: s1.oldFirstName ?? "",

    //   birthDate: s1.birthDate ?? "",
    //   birthCountry: extras.birthCountry ?? "",
    //   birthCity: extras.birthCity ?? "",
    //   citizenship: s1.nationality ?? "",

    //   passportNumber: s1.passportNumber ?? "",
    //   passportIssuanceCountry: s1.passportIssueCountry ?? "",
    //   passportIssueDate: s1.passportIssueDate ?? "",
    //   passportExpiryDate: s1.passportExpiryDate ?? "",

    //   visaStartDate: s2.visaStartDate ?? "",
    //   visaEndDate: s2.visaEndDate ?? "",
    //   visaDateOfArrival: s2.entryDate ?? "",

    //   "address.street": addr.street ?? "",
    //   "address.homeNumber": addr.houseNumber ?? "",
    //   "address.entrance": addr.entry ?? "",
    //   "address.apartmentNumber": addr.apartment ?? "",
    //   "address.city": addr.city ?? "",
    //   "address.zipcode": addr.zip ?? "",
    //   "address.phoneNumber": extras.addressPhoneNumber || s1.phone || "",

    //   fatherLastNameHebrew: extras.father.lastNameHebrew ?? "",
    //   fatherLastNameEnglish: extras.father.lastNameEnglish ?? "",
    //   fatherFirstNameHebrew: extras.father.firstNameHebrew ?? "",
    //   fatherFirstNameEnglish: extras.father.firstNameEnglish ?? "",
    //   fatherIdNumber: extras.father.idNumber ?? "",
    //   fatherPassportNumber: extras.father.passportNumber ?? "",

    //   motherLastNameHebrew: extras.mother.lastNameHebrew ?? "",
    //   motherLastNameEnglish: extras.mother.lastNameEnglish ?? "",
    //   motherFirstNameHebrew: extras.mother.firstNameHebrew ?? "",
    //   motherFirstNameEnglish: extras.mother.firstNameEnglish ?? "",
    //   motherIdNumber: extras.mother.idNumber ?? "",
    //   motherPassportNumber: extras.mother.passportNumber ?? "",

    //   maritalStatusLastUpdateDate: s3.statusDate ?? "",
    //   numberChildrenUnder18:
    //     extras.numberChildrenUnder18 || String(draft.intake.step6.children?.length ?? 0),

    //   partnerLastNameHebrew: s5.person.lastName ?? "",
    //   partnerLastNameEnglish: extras.partner.lastNameEnglish ?? "",
    //   partnerFirstNameHebrew: s5.person.firstName ?? "",
    //   partnerFirstNameEnglish: extras.partner.firstNameEnglish ?? "",
    //   partnerIdNumber: s5.person.israeliId ?? "",
    //   partnerPassportNumber: s5.person.passportNumber ?? "",

    //   // ===== Page 1 =====
    //   purposeOfStay: extras.purposeOfStay || s2.visaType || "",
    //   bankName: s4.bank.bankName ?? "",
    //   bankBranch: s4.bank.branch ?? "",
    //   bankAccountNumber: s4.bank.accountNumber ?? "",

    //   employerName: extras.employerName ?? "",
    //   employerAddress: extras.employerAddress ?? "",
    //   selfEmploymentStartDate: extras.selfEmploymentStartDate ?? "",
    //   unemployedWithIncomeStartDate: extras.unemployedWithIncomeStartDate ?? "",
    //   selfEmployedYearlyIncome: extras.selfEmployedYearlyIncome ?? "",
    //   unemployedYearlyIncome: extras.unemployedYearlyIncome ?? "",

    //   nationalInsuranceFileNumber: s4.nationalInsurance.fileNumber ?? "",

    //   tripAbroad1StartDate: extras.trips[0]?.startDate ?? "",
    //   tripAbroad1EndDate: extras.trips[0]?.endDate ?? "",
    //   tripAbroad1Purpose: extras.trips[0]?.purpose ?? "",
    //   tripAbroad2StartDate: extras.trips[1]?.startDate ?? "",
    //   tripAbroad2EndDate: extras.trips[1]?.endDate ?? "",
    //   tripAbroad2Purpose: extras.trips[1]?.purpose ?? "",
    //   tripAbroad3StartDate: extras.trips[2]?.startDate ?? "",
    //   tripAbroad3EndDate: extras.trips[2]?.endDate ?? "",
    //   tripAbroad3Purpose: extras.trips[2]?.purpose ?? "",

    //   NationInsuranceTypeOfAllowance: s4.nationalInsurance.allowanceType ?? "",
    //   NationInsuranceFileNumber: s4.nationalInsurance.allowanceFileNumber ?? "",
    // };

    const [tplRes, fontRes] = await Promise.all([
      fetch("/forms/person-registration.pdf"),
      fetch("/fonts/SimplerPro-Regular.otf"),
    ]);

    if (!tplRes.ok) {
      throw new Error(
        `Failed to load template PDF: ${tplRes.status} ${tplRes.statusText} url=${tplRes.url}`
      );
    }
    if (!fontRes.ok) {
      throw new Error(
        `Failed to load font: ${fontRes.status} ${fontRes.statusText} url=${fontRes.url}`
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
        // dateFormat is DMY by default in your fillPdfClient (per your request)
      }
    );

    const fileName = `person_registration_${safePart(
      s1.israeliId || s1.passportNumber || s1.lastName || "unknown"
    )}_${new Date().toISOString().slice(0, 10)}.pdf`;

    downloadPdf(fileName, outBytes);
  }

  if (!draft || !payload) {
    return (
      <main style={{ maxWidth: 820, margin: "0 auto", padding: 24 }}>
        Loading…
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 820, margin: "0 auto", padding: 24, direction: "rtl" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
        טופס רישום אדם (Person Registration)
      </h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <SectionTitle>פרטי המבקש/ת</SectionTitle>

        <Field label="שם פרטי (עברית) (DB: step1.firstName)">
          <input
            value={draft.intake.step1.firstName}
            onChange={(e) => update("intake.step1.firstName", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="שם פרטי (אנגלית) (PDF בלבד)">
          <input
            value={extras.firstNameEnglish}
            onChange={(e) => setExtras((p) => ({ ...p, firstNameEnglish: e.target.value }))}
            style={inputStyle}
            dir="ltr"
          />
        </Field>

        <Field label="שם משפחה (עברית) (DB: step1.lastName)">
          <input
            value={draft.intake.step1.lastName}
            onChange={(e) => update("intake.step1.lastName", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="שם משפחה (אנגלית) (PDF בלבד)">
          <input
            value={extras.lastNameEnglish}
            onChange={(e) => setExtras((p) => ({ ...p, lastNameEnglish: e.target.value }))}
            style={inputStyle}
            dir="ltr"
          />
        </Field>

        <SectionTitle>שמות קודמים</SectionTitle>

        <Field label="שם פרטי קודם (עברית) (DB: step1.oldFirstName)">
          <input
            value={draft.intake.step1.oldFirstName}
            onChange={(e) => update("intake.step1.oldFirstName", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="שם משפחה קודם (עברית) (DB: step1.oldLastName)">
          <input
            value={draft.intake.step1.oldLastName}
            onChange={(e) => update("intake.step1.oldLastName", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="שם משפחה קודם (אנגלית) (PDF בלבד)">
          <input
            value={extras.prevLastNameEnglish}
            onChange={(e) => setExtras((p) => ({ ...p, prevLastNameEnglish: e.target.value }))}
            style={inputStyle}
            dir="ltr"
          />
        </Field>

        <SectionTitle>לידה ואזרחות</SectionTitle>

        <Field label="תאריך לידה (DB: step1.birthDate)">
          <input
            type="date"
            value={draft.intake.step1.birthDate}
            onChange={(e) => update("intake.step1.birthDate", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="ארץ לידה (PDF בלבד)">
          <input
            value={extras.birthCountry}
            onChange={(e) => setExtras((p) => ({ ...p, birthCountry: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        <Field label="עיר לידה (PDF בלבד)">
          <input
            value={extras.birthCity}
            onChange={(e) => setExtras((p) => ({ ...p, birthCity: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        <Field label="אזרחות (DB: step1.nationality)">
          <input
            value={draft.intake.step1.nationality}
            onChange={(e) => update("intake.step1.nationality", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <SectionTitle>דרכון</SectionTitle>

        <Field label="מספר דרכון (DB: step1.passportNumber)">
          <input
            value={draft.intake.step1.passportNumber}
            onChange={(e) => update("intake.step1.passportNumber", e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </Field>

        <Field label="מדינת הנפקה (DB: step1.passportIssueCountry)">
          <input
            value={draft.intake.step1.passportIssueCountry}
            onChange={(e) => update("intake.step1.passportIssueCountry", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="תאריך הנפקה (DB: step1.passportIssueDate)">
            <input
              type="date"
              value={draft.intake.step1.passportIssueDate}
              onChange={(e) => update("intake.step1.passportIssueDate", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="תוקף עד (DB: step1.passportExpiryDate)">
            <input
              type="date"
              value={draft.intake.step1.passportExpiryDate}
              onChange={(e) => update("intake.step1.passportExpiryDate", e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <SectionTitle>אשרה / כניסה</SectionTitle>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="תחילת אשרה (DB: step2.visaStartDate)">
            <input
              type="date"
              value={draft.intake.step2.visaStartDate}
              onChange={(e) => update("intake.step2.visaStartDate", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="סיום אשרה (DB: step2.visaEndDate)">
            <input
              type="date"
              value={draft.intake.step2.visaEndDate}
              onChange={(e) => update("intake.step2.visaEndDate", e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="תאריך הגעה/כניסה (DB: step2.entryDate)">
          <input
            type="date"
            value={draft.intake.step2.entryDate}
            onChange={(e) => update("intake.step2.entryDate", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="מטרת שהייה (PDF; ברירת מחדל מ-DB: step2.visaType)">
          <input
            value={extras.purposeOfStay}
            onChange={(e) => setExtras((p) => ({ ...p, purposeOfStay: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        <SectionTitle>כתובת</SectionTitle>

        <Field label="רחוב (DB: step3.registeredAddress.street)">
          <input
            value={draft.intake.step3.registeredAddress.street}
            onChange={(e) => update("intake.step3.registeredAddress.street", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="מספר בית (DB: houseNumber)">
            <input
              value={draft.intake.step3.registeredAddress.houseNumber}
              onChange={(e) =>
                update("intake.step3.registeredAddress.houseNumber", e.target.value)
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="כניסה (DB: entry)">
            <input
              value={draft.intake.step3.registeredAddress.entry}
              onChange={(e) => update("intake.step3.registeredAddress.entry", e.target.value)}
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="דירה (DB: apartment)">
            <input
              value={draft.intake.step3.registeredAddress.apartment}
              onChange={(e) =>
                update("intake.step3.registeredAddress.apartment", e.target.value)
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="מיקוד (DB: zip)">
            <input
              value={draft.intake.step3.registeredAddress.zip}
              onChange={(e) => update("intake.step3.registeredAddress.zip", e.target.value)}
              style={inputStyle}
              dir="ltr"
            />
          </Field>
        </div>

        <Field label="עיר (DB: city)">
          <input
            value={draft.intake.step3.registeredAddress.city}
            onChange={(e) => update("intake.step3.registeredAddress.city", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="טלפון לכתובת (PDF; ברירת מחדל מ-DB: step1.phone)">
          <input
            value={extras.addressPhoneNumber}
            onChange={(e) => setExtras((p) => ({ ...p, addressPhoneNumber: e.target.value }))}
            style={inputStyle}
            inputMode="tel"
            dir="ltr"
          />
        </Field>

        <SectionTitle>הורים (PDF בלבד)</SectionTitle>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>אב</div>

          <Field label="שם פרטי (עברית)">
            <input
              value={extras.father.firstNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({ ...p, father: { ...p.father, firstNameHebrew: e.target.value } }))
              }
              style={inputStyle}
            />
          </Field>

          <Field label="שם משפחה (עברית)">
            <input
              value={extras.father.lastNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({ ...p, father: { ...p.father, lastNameHebrew: e.target.value } }))
              }
              style={inputStyle}
            />
          </Field>

          <Field label="שם פרטי (אנגלית)">
            <input
              value={extras.father.firstNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({ ...p, father: { ...p.father, firstNameEnglish: e.target.value } }))
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="שם משפחה (אנגלית)">
            <input
              value={extras.father.lastNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({ ...p, father: { ...p.father, lastNameEnglish: e.target.value } }))
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="מספר זהות">
              <input
                value={extras.father.idNumber}
                onChange={(e) =>
                  setExtras((p) => ({ ...p, father: { ...p.father, idNumber: e.target.value } }))
                }
                style={inputStyle}
                dir="ltr"
              />
            </Field>

            <Field label="מספר דרכון">
              <input
                value={extras.father.passportNumber}
                onChange={(e) =>
                  setExtras((p) => ({ ...p, father: { ...p.father, passportNumber: e.target.value } }))
                }
                style={inputStyle}
                dir="ltr"
              />
            </Field>
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>אם</div>

          <Field label="שם פרטי (עברית)">
            <input
              value={extras.mother.firstNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({ ...p, mother: { ...p.mother, firstNameHebrew: e.target.value } }))
              }
              style={inputStyle}
            />
          </Field>

          <Field label="שם משפחה (עברית)">
            <input
              value={extras.mother.lastNameHebrew}
              onChange={(e) =>
                setExtras((p) => ({ ...p, mother: { ...p.mother, lastNameHebrew: e.target.value } }))
              }
              style={inputStyle}
            />
          </Field>

          <Field label="שם פרטי (אנגלית)">
            <input
              value={extras.mother.firstNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({ ...p, mother: { ...p.mother, firstNameEnglish: e.target.value } }))
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="שם משפחה (אנגלית)">
            <input
              value={extras.mother.lastNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({ ...p, mother: { ...p.mother, lastNameEnglish: e.target.value } }))
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="מספר זהות">
              <input
                value={extras.mother.idNumber}
                onChange={(e) =>
                  setExtras((p) => ({ ...p, mother: { ...p.mother, idNumber: e.target.value } }))
                }
                style={inputStyle}
                dir="ltr"
              />
            </Field>

            <Field label="מספר דרכון">
              <input
                value={extras.mother.passportNumber}
                onChange={(e) =>
                  setExtras((p) => ({ ...p, mother: { ...p.mother, passportNumber: e.target.value } }))
                }
                style={inputStyle}
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
            style={inputStyle}
          />
        </Field>

        <Field label="מספר ילדים מתחת לגיל 18 (PDF; ברירת מחדל = מספר ילדים ב-DB)">
          <input
            value={extras.numberChildrenUnder18}
            onChange={(e) => setExtras((p) => ({ ...p, numberChildrenUnder18: e.target.value }))}
            style={inputStyle}
            dir="ltr"
            inputMode="numeric"
          />
        </Field>

        <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 800 }}>בן/בת זוג (ברירת מחדל מ-DB: step5.person)</div>

          <Field label="שם פרטי (עברית) (DB: step5.person.firstName)">
            <input
              value={draft.intake.step5.person.firstName}
              onChange={(e) => update("intake.step5.person.firstName", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="שם משפחה (עברית) (DB: step5.person.lastName)">
            <input
              value={draft.intake.step5.person.lastName}
              onChange={(e) => update("intake.step5.person.lastName", e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="שם פרטי (אנגלית) (PDF בלבד)">
            <input
              value={extras.partner.firstNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({ ...p, partner: { ...p.partner, firstNameEnglish: e.target.value } }))
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="שם משפחה (אנגלית) (PDF בלבד)">
            <input
              value={extras.partner.lastNameEnglish}
              onChange={(e) =>
                setExtras((p) => ({ ...p, partner: { ...p.partner, lastNameEnglish: e.target.value } }))
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="מספר זהות (DB: step5.person.israeliId)">
              <input
                value={draft.intake.step5.person.israeliId}
                onChange={(e) => update("intake.step5.person.israeliId", e.target.value)}
                style={inputStyle}
                dir="ltr"
              />
            </Field>

            <Field label="מספר דרכון (DB: step5.person.passportNumber)">
              <input
                value={draft.intake.step5.person.passportNumber}
                onChange={(e) => update("intake.step5.person.passportNumber", e.target.value)}
                style={inputStyle}
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
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="סניף (DB: step4.bank.branch)">
            <input
              value={draft.intake.step4.bank.branch}
              onChange={(e) => update("intake.step4.bank.branch", e.target.value)}
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="מספר חשבון (DB: step4.bank.accountNumber)">
            <input
              value={draft.intake.step4.bank.accountNumber}
              onChange={(e) => update("intake.step4.bank.accountNumber", e.target.value)}
              style={inputStyle}
              dir="ltr"
            />
          </Field>
        </div>

        <SectionTitle>תעסוקה / הכנסות (PDF בלבד)</SectionTitle>

        <Field label="שם מעסיק">
          <input
            value={extras.employerName}
            onChange={(e) => setExtras((p) => ({ ...p, employerName: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        <Field label="כתובת מעסיק">
          <input
            value={extras.employerAddress}
            onChange={(e) => setExtras((p) => ({ ...p, employerAddress: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="תאריך תחילת עצמאי/ת">
            <input
              type="date"
              value={extras.selfEmploymentStartDate}
              onChange={(e) => setExtras((p) => ({ ...p, selfEmploymentStartDate: e.target.value }))}
              style={inputStyle}
            />
          </Field>

          <Field label="תאריך תחילת לא-מועסק/ת עם הכנסה">
            <input
              type="date"
              value={extras.unemployedWithIncomeStartDate}
              onChange={(e) =>
                setExtras((p) => ({ ...p, unemployedWithIncomeStartDate: e.target.value }))
              }
              style={inputStyle}
            />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="הכנסה שנתית (עצמאי/ת)">
            <input
              value={extras.selfEmployedYearlyIncome}
              onChange={(e) =>
                setExtras((p) => ({ ...p, selfEmployedYearlyIncome: e.target.value }))
              }
              style={inputStyle}
              dir="ltr"
            />
          </Field>

          <Field label="הכנסה שנתית (לא-מועסק/ת עם הכנסה)">
            <input
              value={extras.unemployedYearlyIncome}
              onChange={(e) => setExtras((p) => ({ ...p, unemployedYearlyIncome: e.target.value }))}
              style={inputStyle}
              dir="ltr"
            />
          </Field>
        </div>

        <SectionTitle>ביטוח לאומי</SectionTitle>

        <Field label="מספר תיק ביטוח לאומי (DB: step4.nationalInsurance.fileNumber)">
          <input
            value={draft.intake.step4.nationalInsurance.fileNumber}
            onChange={(e) => update("intake.step4.nationalInsurance.fileNumber", e.target.value)}
            style={inputStyle}
            dir="ltr"
          />
        </Field>

        <Field label="סוג קצבה (DB: step4.nationalInsurance.allowanceType)">
          <input
            value={draft.intake.step4.nationalInsurance.allowanceType}
            onChange={(e) => update("intake.step4.nationalInsurance.allowanceType", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="מספר תיק קצבה (DB: step4.nationalInsurance.allowanceFileNumber)">
          <input
            value={draft.intake.step4.nationalInsurance.allowanceFileNumber}
            onChange={(e) =>
              update("intake.step4.nationalInsurance.allowanceFileNumber", e.target.value)
            }
            style={inputStyle}
            dir="ltr"
          />
        </Field>

        <SectionTitle>נסיעות לחו&quot;ל (PDF בלבד)</SectionTitle>

        {extras.trips.map((t, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 12,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 800 }}>נסיעה #{i + 1}</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
                  style={inputStyle}
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
                  style={inputStyle}
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
                style={inputStyle}
              />
            </Field>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() =>
              downloadJson(
                `intake_${safePart(draft.intake.step1.email || draft.intake.step1.israeliId || "demo")}.json`,
                payload
              )
            }
          >
            הורד JSON (DB record)
          </button>

          <button type="submit" style={buttonStyle}>
            הורד PDF
          </button>
        </div>

        <details style={{ marginTop: 8 }}>
          <summary>תצוגה מקדימה של ה-JSON (DB record)</summary>
          <pre
            style={{
              background: "#111",
              color: "#eee",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
      </form>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 800, marginTop: 10 }}>{children}</h2>;
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
    <label style={{ display: "grid", gap: 6 }}>
      <span>
        {label} {required ? <span style={{ color: "crimson" }}>*</span> : null}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ccc",
  fontSize: 16,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 8,
  padding: "12px 14px",
  borderRadius: 12,
  border: "none",
  fontSize: 16,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ccc",
  background: "transparent",
  fontSize: 15,
  cursor: "pointer",
};
