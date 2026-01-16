// intakeToPdfFields.ts
export type MaritalStatus =
  | "married"
  | "divorced"
  | "widowed"
  | "single"
  | "bigamist"
  | "";

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
        nationality: string; // used as placeOfBirth in this PDF
        israeliId: string;
        residenceCountry: string;
        entryDate: string;
      }>;
    };
  };
};

export type PdfExtras = {
  /** Not in intake template, but exists in fieldMap */
  formDate?: string;
  /** Not in intake template, but exists in fieldMap */
  poBox?: string;
  applicantSignature?: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function intakeToPdfFields(
  draft: IntakeRecord,
  extras?: PdfExtras
): Record<string, string> {
  const s1 = draft.intake.step1;
  const s2 = draft.intake.step2;
  const s3 = draft.intake.step3;
  const s5 = draft.intake.step5;

  const kidsAll = draft.intake.step6.children ?? [];
  const kids = kidsAll.filter(
    (c) =>
      (c.firstName ?? "").trim() ||
      (c.birthDate ?? "").trim() ||
      (c.nationality ?? "").trim()
  );

  const fields: Record<string, string> = {
    // PDF-only extras
    formDate: extras?.formDate || todayISO(),
    applicantSignature: extras?.applicantSignature ?? "",

    // israeliApplicant
    "israeliApplicant.firstName": s1.firstName ?? "",
    "israeliApplicant.lastName": s1.lastName ?? "",
    "israeliApplicant.idNumber": s1.israeliId ?? "",
    "israeliApplicant.address": s2.residenceAddress ?? "",
    "israeliApplicant.phoneMobile": s1.phone ?? "",
    "israeliApplicant.poBox": extras?.poBox ?? "",

    // foreignParent from step5.person
    "foreignParent.firstName": s5.person.firstName ?? "",
    "foreignParent.lastName": s5.person.lastName ?? "",
    "foreignParent.idOrPassportNumber":
      s5.person.passportNumber || s5.person.israeliId || "",
  };

  // children.child1/2/3.*
  for (let i = 0; i < Math.min(3, kids.length); i++) {
    const idx = i + 1;
    fields[`children.child${idx}.firstName`] = kids[i]!.firstName ?? "";
    fields[`children.child${idx}.dateOfBirth`] = kids[i]!.birthDate ?? "";
    // DB doesn't have placeOfBirth; we map nationality -> placeOfBirth (per your comment)
    fields[`children.child${idx}.placeOfBirth`] = kids[i]!.nationality ?? "";
  }

  // marital status checkbox: only set the selected one
  const status = ((s3.maritalStatus ?? "").trim() as MaritalStatus) || "";
  if (status) {
    fields[`israeliApplicant.maritalStatus.${status}`] = "1";
  }

  return fields;
}
