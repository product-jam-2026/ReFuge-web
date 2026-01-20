// intakeToPdfFields.ts
// Mapping from IntakeRecord (+ UI-only extras) -> flat PDF fields (keys match fieldMap.ts)

// export type PdfExtras = {
//   formDate?: string;
//   poBox?: string;
//   applicantSignature?: string; // dataURL
// };

export type IntakeRecord = {
  intake: {
    step1: {
      lastName: string;
      firstName: string;
      oldLastName: string;
      oldFirstName: string;
      gender: string;
      birthDate: string;
      nationality: string;
      israeliId: string;
      passportNumber: string;
      passportIssueDate: string;
      passportExpiryDate: string;
      passportIssueCountry: string;
      phone: string;
      email: string;
    };
    step2: {
      residenceCountry: string;
      residenceCity: string;
      residenceAddress: string;
      visaType: string;
      visaStartDate: string;
      visaEndDate: string;
      entryDate: string;
    };
    step3: {
      maritalStatus: string;
      statusDate: string;
      registeredAddress: {
        city: string;
        street: string;
        houseNumber: string;
        entry: string;
        apartment: string;
        zip: string;
      };
      mailingDifferent: boolean;
      mailingAddress: {
        city: string;
        street: string;
        houseNumber: string;
        entry: string;
        apartment: string;
        zip: string;
      };
      employmentStatus: string;
      notWorkingReason: string;
      occupation: string;
    };
    step4: {
      healthFund: string;
      bank: { bankName: string; branch: string; accountNumber: string };
      nationalInsurance: {
        hasFile: string;
        fileNumber: string;
        getsAllowance: string;
        allowanceType: string;
        allowanceFileNumber: string;
      };
    };
    step5: {
      person: {
        lastName: string;
        firstName: string;
        oldLastName: string;
        oldFirstName: string;
        gender: string;
        birthDate: string;
        nationality: string;
        israeliId: string;
        passportNumber: string;
      };
      maritalStatus: string;
      statusDate: string;
      phone: string;
      email: string;
    };
    step6: {
      children: Array<{
        lastName: string;
        firstName: string;
        gender: string;
        birthDate: string;
        nationality: string;
        israeliId: string;
        residenceCountry: string;
        entryDate: string;
      }>;
    };
  };
};

export type TripRow = { startDate: string; endDate: string; purpose: string };

export type ChildExtrasRow = {
  firstEntryDate: string;
  fileJoinDate: string;
};

export type ExtrasState = {
  // English name variants (PDF has both Hebrew+English fields)
  firstNameEnglish: string;
  lastNameEnglish: string;
  prevLastNameEnglish: string;

  // Birth details (not in DB template)
  birthCountry: string;
  birthCity: string;

  // Phone for the address block (PDF has it as part of address)
  addressPhoneNumber: string;

  // Parents (not in DB template)
  father: {
    firstNameHebrew: string;
    lastNameHebrew: string;
    firstNameEnglish: string;
    lastNameEnglish: string;
    idNumber: string;
    passportNumber: string;
  };
  mother: {
    firstNameHebrew: string;
    lastNameHebrew: string;
    firstNameEnglish: string;
    lastNameEnglish: string;
    idNumber: string;
    passportNumber: string;
  };

  // Partner English variants (partner Hebrew pulled from step5.person by default)
  partner: {
    firstNameEnglish: string;
    lastNameEnglish: string;
  };

  // “meta”
  numberChildrenUnder18: string; // PDF wants a number (string is fine)
  purposeOfStay: string; // PDF has purposeOfStay (default from step2.visaType)

  // Employment / income (not in DB template)
  employerName: string;
  employerAddress: string;
  selfEmploymentStartDate: string;
  unemployedWithIncomeStartDate: string;
  selfEmployedYearlyIncome: string;
  unemployedYearlyIncome: string;

  // Trips abroad (not in DB template)
  trips: TripRow[]; // expect 0..3 (we'll safely read up to 3)
  children: ChildExtrasRow[]; // aligns with step-3/page.tsx usage
  // --- Step4 / meta (DB-saved) ---
  formDate: string; // yyyy-mm-dd
  formTitle: string; // title used for lists + filenames
  poBox: string; // if your PDF has a PO Box field

  // --- UI-only (NOT saved to DB) ---
  applicantSignatureDataUrl: string; // data:image/png;base64,...
};

/**
 * Optional helper (same defaulting logic as your page.tsx useEffect):
 * - addressPhoneNumber defaults to step1.phone
 * - numberChildrenUnder18 defaults to children length
 * - purposeOfStay defaults to step2.visaType
 */
// export function deriveExtrasFromIntake(
//   draft: IntakeRecord,
//   current?: Partial<ExtrasState>
// ): Partial<ExtrasState> {
//   return {
//     ...current,
//     addressPhoneNumber:
//       current?.addressPhoneNumber ?? draft.intake.step1.phone ?? "",
//     numberChildrenUnder18:
//       current?.numberChildrenUnder18 ??
//       String(draft.intake.step6.children?.length ?? 0),
//     purposeOfStay: current?.purposeOfStay ?? draft.intake.step2.visaType ?? "",
//   };
// }

function tripAt(extras: Partial<ExtrasState> | undefined, i: number): TripRow {
  const t = extras?.trips?.[i];
  return {
    startDate: t?.startDate ?? "",
    endDate: t?.endDate ?? "",
    purpose: t?.purpose ?? "",
  };
}

function emptyChildExtras(): ChildExtrasRow {
  return { firstEntryDate: "", fileJoinDate: "" };
}

export function deriveExtrasFromIntake(
  draft: IntakeRecord,
  current?: Partial<ExtrasState>,
): ExtrasState {
  const base: ExtrasState = {
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

    partner: {
      firstNameEnglish: "",
      lastNameEnglish: "",
    },

    numberChildrenUnder18: "0",
    purposeOfStay: "",

    employerName: "",
    employerAddress: "",
    selfEmploymentStartDate: "",
    unemployedWithIncomeStartDate: "",
    selfEmployedYearlyIncome: "",
    unemployedYearlyIncome: "",

    trips: [],
    children: [],

    formDate: "",
    formTitle: "",
    poBox: "",

    applicantSignatureDataUrl: "",
  };

  // merge current over base (shallow + nested blocks)
  const merged: ExtrasState = {
    ...base,
    ...current,
    father: { ...base.father, ...(current?.father ?? {}) },
    mother: { ...base.mother, ...(current?.mother ?? {}) },
    partner: { ...base.partner, ...(current?.partner ?? {}) },
    trips: (current?.trips ?? base.trips).map((t) => ({
      startDate: t?.startDate ?? "",
      endDate: t?.endDate ?? "",
      purpose: t?.purpose ?? "",
    })),
    children: (current?.children ?? base.children).map((c) => ({
      firstEntryDate: c?.firstEntryDate ?? "",
      fileJoinDate: c?.fileJoinDate ?? "",
    })),
  };

  // apply your “default from draft” logic
  merged.addressPhoneNumber =
    merged.addressPhoneNumber || draft.intake.step1.phone || "";

  merged.numberChildrenUnder18 =
    merged.numberChildrenUnder18 ||
    String(draft.intake.step6.children?.length ?? 0);

  merged.purposeOfStay =
    merged.purposeOfStay || draft.intake.step2.visaType || "";

    // ✅ Ensure children extras array exists and is long enough
  const kidsLen = draft.intake.step6.children?.length ?? 0;
  const minRows = Math.max(3, kidsLen); // keep at least 3 if you want
  while (merged.children.length < minRows) merged.children.push(emptyChildExtras());

  return merged;
}

/**
 * Main mapper: builds the flat `fields` object where keys match fieldMap.ts.
 * This is literally the same mapping that is currently hardcoded in page.tsx,
 * just moved into a reusable function.
 */

// export function intakeToPdfFields(
//   draft: IntakeRecord,
//   extras?: Partial<ExtrasState>,
// ): Record<string, string> {

export function intakeToPdfFields(
  draft: IntakeRecord,
  extras?: Partial<ExtrasState>,
): Record<string, string> {
  const s1 = draft.intake.step1;
  const s2 = draft.intake.step2;
  const s3 = draft.intake.step3;
  const s4 = draft.intake.step4;
  const s5 = draft.intake.step5;

  const addr = s3.registeredAddress;

  const t1 = tripAt(extras, 0);
  const t2 = tripAt(extras, 1);
  const t3 = tripAt(extras, 2);

  return {
    // ===== Page 0 =====
    firstNameHebrew: s1.firstName ?? "",
    firstNameEnglish: extras?.firstNameEnglish ?? "",
    lastNameHebrew: s1.lastName ?? "",
    lastNameEnglish: extras?.lastNameEnglish ?? "",

    prevLastNameHebrew: s1.oldLastName ?? "",
    prevLastNameEnglish: extras?.prevLastNameEnglish ?? "",
    prevFirstNameHebrew: s1.oldFirstName ?? "",

    birthDate: s1.birthDate ?? "",
    birthCountry: extras?.birthCountry ?? "",
    birthCity: extras?.birthCity ?? "",
    citizenship: s1.nationality ?? "",

    passportNumber: s1.passportNumber ?? "",
    passportIssuanceCountry: s1.passportIssueCountry ?? "",
    passportIssueDate: s1.passportIssueDate ?? "",
    passportExpiryDate: s1.passportExpiryDate ?? "",

    visaStartDate: s2.visaStartDate ?? "",
    visaEndDate: s2.visaEndDate ?? "",
    visaDateOfArrival: s2.entryDate ?? "",

    "address.street": addr.street ?? "",
    "address.homeNumber": addr.houseNumber ?? "",
    "address.entrance": addr.entry ?? "",
    "address.apartmentNumber": addr.apartment ?? "",
    "address.city": addr.city ?? "",
    "address.zipcode": addr.zip ?? "",
    "address.phoneNumber": (extras?.addressPhoneNumber ?? "") || s1.phone || "",

    fatherLastNameHebrew: extras?.father?.lastNameHebrew ?? "",
    fatherLastNameEnglish: extras?.father?.lastNameEnglish ?? "",
    fatherFirstNameHebrew: extras?.father?.firstNameHebrew ?? "",
    fatherFirstNameEnglish: extras?.father?.firstNameEnglish ?? "",
    fatherIdNumber: extras?.father?.idNumber ?? "",
    fatherPassportNumber: extras?.father?.passportNumber ?? "",

    motherLastNameHebrew: extras?.mother?.lastNameHebrew ?? "",
    motherLastNameEnglish: extras?.mother?.lastNameEnglish ?? "",
    motherFirstNameHebrew: extras?.mother?.firstNameHebrew ?? "",
    motherFirstNameEnglish: extras?.mother?.firstNameEnglish ?? "",
    motherIdNumber: extras?.mother?.idNumber ?? "",
    motherPassportNumber: extras?.mother?.passportNumber ?? "",

    maritalStatusLastUpdateDate: s3.statusDate ?? "",
    numberChildrenUnder18:
      (extras?.numberChildrenUnder18 ?? "") ||
      String(draft.intake.step6.children?.length ?? 0),

    partnerLastNameHebrew: s5.person.lastName ?? "",
    partnerLastNameEnglish: extras?.partner?.lastNameEnglish ?? "",
    partnerFirstNameHebrew: s5.person.firstName ?? "",
    partnerFirstNameEnglish: extras?.partner?.firstNameEnglish ?? "",
    partnerIdNumber: s5.person.israeliId ?? "",
    partnerPassportNumber: s5.person.passportNumber ?? "",

    // ===== Page 1 =====
    purposeOfStay: (extras?.purposeOfStay ?? "") || s2.visaType || "",
    bankName: s4.bank.bankName ?? "",
    bankBranch: s4.bank.branch ?? "",
    bankAccountNumber: s4.bank.accountNumber ?? "",

    employerName: extras?.employerName ?? "",
    employerAddress: extras?.employerAddress ?? "",
    selfEmploymentStartDate: extras?.selfEmploymentStartDate ?? "",
    unemployedWithIncomeStartDate: extras?.unemployedWithIncomeStartDate ?? "",
    selfEmployedYearlyIncome: extras?.selfEmployedYearlyIncome ?? "",
    unemployedYearlyIncome: extras?.unemployedYearlyIncome ?? "",

    nationalInsuranceFileNumber: s4.nationalInsurance.fileNumber ?? "",

    tripAbroad1StartDate: t1.startDate,
    tripAbroad1EndDate: t1.endDate,
    tripAbroad1Purpose: t1.purpose,

    tripAbroad2StartDate: t2.startDate,
    tripAbroad2EndDate: t2.endDate,
    tripAbroad2Purpose: t2.purpose,

    tripAbroad3StartDate: t3.startDate,
    tripAbroad3EndDate: t3.endDate,
    tripAbroad3Purpose: t3.purpose,

    NationInsuranceTypeOfAllowance: s4.nationalInsurance.allowanceType ?? "",
    NationInsuranceFileNumber: s4.nationalInsurance.allowanceFileNumber ?? "",

    // ✅ Step4 fields (keys MUST match your fieldMap.ts)
    formDate: extras?.formDate ?? "",
    poBox: extras?.poBox ?? "",

    // If your PDF engine expects the signature as a field value (dataURL)
    applicantSignature: (extras as any)?.applicantSignature ?? "",
  };
}
