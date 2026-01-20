// intakeToPdfFields.ts
// Mapping from IntakeRecord (+ UI-only extras) -> flat PDF fields (keys match fieldMap.ts)

export type PdfExtras = {
  formDate?: string;
  formTitle?: string;

  poBox?: string;
  applicantSignature?: string; // dataURL
};

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

export type ParentExtras = {
  firstNameHebrew: string;
  lastNameHebrew: string;
  firstNameEnglish: string;
  lastNameEnglish: string;
  idNumber: string;
  passportNumber: string;
};

export type ChildExtrasRow = {
  firstEntryDate: string;
  fileJoinDate: string;
};

export type Trip = { from: string; to: string; purpose: string };

export type PartnerExtras = {
  firstNameEnglish: string;
  lastNameEnglish: string;
};

export type ExtrasState = {
  // already have:
  firstNameEnglish: string;
  lastNameEnglish: string;
  prevLastNameEnglish: string;
  birthCountry: string;
  birthCity: string;
  purposeOfStay: string;
  addressPhoneNumber: string;
  father: ParentExtras;
  mother: ParentExtras;
  partner: PartnerExtras;
  numberChildrenUnder18: string;
  employerName: string;
  employerAddress: string;
  selfEmploymentStartDate: string;
  unemployedWithIncomeStartDate: string;
  selfEmployedYearlyIncome: string;
  unemployedYearlyIncome: string;
  trips: TripRow[];
  children: ChildExtrasRow[];

  // ✅ add (page 1)
  poBox: string;
  formDate: string;
  formTitle: string;

  maritalStatus: "" | "single" | "married" | "widowed" | "divorced" | "other";
  maritalStatusFromDate: string;

  spouse: {
    firstName: string;
    lastName: string;
    idNumber: string;
    passportNumber: string;
  };

  // ✅ add (page 2 - F/G/H)
  purposeInIsrael: string;

  assets: {
    apartment: boolean;
    business: boolean;
    other: boolean;
    otherText: string;
    ownershipCertificateAttached: boolean;
  };

  residence: {
    rentalApartment: boolean;
    rentalAgreementAttached: boolean;
    other: boolean;
    otherText: string;
  };

  healthFund: "" | "clalit" | "meuhedet" | "leumit" | "maccabi";

  occupationStatus:
    | ""
    | "employee"
    | "selfEmployed"
    | "unemployedWithIncome"
    | "unemployedNoIncome";

  niPaymentsStatus: "" | "paid" | "notPaid";
  niPaidAs: "" | "employee" | "selfEmployed" | "unemployed";
  niFileNumber: string;

  allowance: {
    receives: "" | "yes" | "no";
    type: string;
    fileNumber: string;
  };

  declaration: {
    date: string;
    name: string;
    signatureDataUrl: string; // for your canvas step
  };

  applicantSignatureDataUrl: string;
};

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
    maritalStatus: "",
    maritalStatusFromDate: "",
    spouse: {
      firstName: "",
      lastName: "",
      idNumber: "",
      passportNumber: "",
    },
    purposeInIsrael: "",
    assets: {
      apartment: false,
      business: false,
      other: false,
      otherText: "",
      ownershipCertificateAttached: false,
    },
    residence: {
      rentalApartment: false,
      rentalAgreementAttached: false,
      other: false,
      otherText: "",
    },
    healthFund: "",
    occupationStatus: "",
    niPaymentsStatus: "",
    niPaidAs: "",
    niFileNumber: "",
    allowance: {
      receives: "",
      type: "",
      fileNumber: "",
    },
    declaration: {
      date: "",
      name: "",
      signatureDataUrl: "",
    },
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
  while (merged.children.length < minRows)
    merged.children.push(emptyChildExtras());

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


    // --- Checkbox helpers ---
  const cb = (on: boolean) => (on ? "1" : ""); // adjust if your renderer expects "true"/"X"

  const norm = (v: string | undefined | null) => (v ?? "").trim();
  const normLower = (v: string | undefined | null) => norm(v).toLowerCase();

  // gender normalization (support a few common variants)
  const genderRaw = normLower(s1.gender);
  const gender =
    genderRaw === "male" || genderRaw === "m" || genderRaw === "זכר"
      ? "male"
      : genderRaw === "female" || genderRaw === "f" || genderRaw === "נקבה"
        ? "female"
        : genderRaw
            ? "other"
            : "";

  // visa type normalization (A/1 -> A1, "A1" -> A1, etc.)
  const visa = norm(s2.visaType).toUpperCase().replace(/[^A-Z0-9]/g, ""); // "A/1" -> "A1"

  // marital status normalization (prefer extras if you use it in UI)
  const msRaw = normLower((extras as any)?.maritalStatus ?? s3.maritalStatus);
  const maritalStatus =
    msRaw === "single"
      ? "single"
      : msRaw === "married"
        ? "married"
        : msRaw === "widowed" || msRaw === "widow"
          ? "widow"
          : msRaw === "divorced"
            ? "divorced"
            : msRaw === "other"
              ? "other"
              : "";

  // NI yes/no
  const hasFile = normLower(s4.nationalInsurance.hasFile); // "yes" / "no"
  const getsAllowance = normLower(s4.nationalInsurance.getsAllowance); // "yes" / "no"

  // allowance type
  const allowanceType = normLower(s4.nationalInsurance.allowanceType); // e.g. "childAllowance"

  // Occupation / NI paid-as: prefer extras.occupationStatus (covers 4 options)
  const occ = normLower((extras as any)?.occupationStatus ?? s3.employmentStatus);

  const niPaidAs =
    occ === "employee" || occ === "employed"
      ? "employed"
      : occ === "selfemployed" || occ === "self_employed" || occ === "self-employed" || occ === "selfemployed"
        ? "selfEmployed"
        : occ === "unemployedwithincome" || occ === "unemployed_with_income" || occ === "unemployed-with-income"
          ? "unemployedWithIncome"
          : occ === "unemployednoincome" || occ === "unemployed_no_income" || occ === "unemployed-without-income"
            ? "unemployedNoIncome"
            : "";

  // NI payments status: from extras
  const payStatusRaw = normLower((extras as any)?.niPaymentsStatus);
  const niPaymentsStatus =
    payStatusRaw === "paid" ? "paid" : payStatusRaw === "notpaid" || payStatusRaw === "not_paid" ? "notPaid" : "";



  return {

        // ===============================
    // ✅ Checkbox fields (fieldMap.ts keys)
    // ===============================

    // gender
    "israeliApplicant.gender.male": cb(gender === "male"),
    "israeliApplicant.gender.female": cb(gender === "female"),
    "israeliApplicant.gender.other": cb(gender === "other"),

    // visa type
    "israeliApplicant.visaType.A1": cb(visa === "A1"),
    "israeliApplicant.visaType.A2": cb(visa === "A2"),
    "israeliApplicant.visaType.A3": cb(visa === "A3"),
    "israeliApplicant.visaType.A4": cb(visa === "A4"),
    "israeliApplicant.visaType.A5": cb(visa === "A5"),
    "israeliApplicant.visaType.B1": cb(visa === "B1"),
    "israeliApplicant.visaType.B2": cb(visa === "B2"),
    "israeliApplicant.visaType.B3": cb(visa === "B3"),
    "israeliApplicant.visaType.B4": cb(visa === "B4"),

    // marital status
    "israeliApplicant.maritalStatus.single": cb(maritalStatus === "single"),
    "israeliApplicant.maritalStatus.married": cb(maritalStatus === "married"),
    "israeliApplicant.maritalStatus.widow": cb(maritalStatus === "widow"),
    "israeliApplicant.maritalStatus.divorced": cb(maritalStatus === "divorced"),
    "israeliApplicant.maritalStatus.other": cb(maritalStatus === "other"),

    // NI has file
    "israeliApplicant.nationalInsurance.hasFile.yes": cb(hasFile === "yes"),
    "israeliApplicant.nationalInsurance.hasFile.no": cb(hasFile === "no"),

    // gets allowance
    "israeliApplicant.nationalInsurance.getsAllowance.yes": cb(getsAllowance === "yes"),
    "israeliApplicant.nationalInsurance.getsAllowance.no": cb(getsAllowance === "no"),

    // allowance type
    "israeliApplicant.nationalInsurance.allowanceType.childAllowance": cb(
      allowanceType === "childallowance" || allowanceType === "child_allowance" || allowanceType.includes("child")
    ),

    // NI paid as
    "israeliApplicant.niPaidAs.employed": cb(niPaidAs === "employed"),
    "israeliApplicant.niPaidAs.selfEmployed": cb(niPaidAs === "selfEmployed"),
    "israeliApplicant.niPaidAs.unemployedWithIncome": cb(niPaidAs === "unemployedWithIncome"),
    "israeliApplicant.niPaidAs.unemployedNoIncome": cb(niPaidAs === "unemployedNoIncome"),

    // payments status
    "israeliApplicant.niPaymentsStatus.paid": cb(niPaymentsStatus === "paid"),
    "israeliApplicant.niPaymentsStatus.notPaid": cb(niPaymentsStatus === "notPaid"),



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
