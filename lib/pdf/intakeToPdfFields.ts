type Intake = {
  intake: {
    step1: {
      firstName: string;
      lastName: string;
      israeliId: string;
      phone: string;
      // ...rest
    };
    step2: {
      residenceAddress: string;
      // ...rest
    };
    step3: {
      maritalStatus: string; // "married" | "divorced" | ...
      // ...rest
    };
    step5: {
      person: {
        firstName: string;
        lastName: string;
        passportNumber: string;
        israeliId: string;
        // ...rest
      };
      // ...rest
    };
    step6: {
      children: Array<{
        firstName: string;
        birthDate: string;
        nationality: string;
        // ...rest
      }>;
    };
  };
};

// helper: checkboxes in fillPdfClient are drawn if value is truthy AND not "false"/"0"
function checked(b: boolean) {
  return b ? "1" : "";
}

export function intakeToPdfFields(db: Intake): Record<string, string> {
  const s1 = db.intake.step1;
  const s2 = db.intake.step2;
  const s3 = db.intake.step3;
  const s5 = db.intake.step5;
  const kids = db.intake.step6.children ?? [];

  const marital = (s3.maritalStatus || "").toLowerCase();

  return {
    // Applicant
    "israeliApplicant.firstName": s1.firstName ?? "",
    "israeliApplicant.lastName": s1.lastName ?? "",
    "israeliApplicant.idNumber": s1.israeliId ?? "",
    "israeliApplicant.phoneMobile": s1.phone ?? "",

    // Address: your DB has residenceAddress; your PDF has israeliApplicant.address (single string)
    "israeliApplicant.address": s2.residenceAddress ?? "",

    // PO box doesn't exist in your DB template -> leave empty (or extend DB schema if you want it stored)
    "israeliApplicant.poBox": "",

    // Foreign parent (mapped to step5.person)
    "foreignParent.firstName": s5.person.firstName ?? "",
    "foreignParent.lastName": s5.person.lastName ?? "",
    "foreignParent.idOrPassportNumber": s5.person.passportNumber || s5.person.israeliId || "",

    // Children 1..3 from children array
    "children.child1.firstName": kids[0]?.firstName ?? "",
    "children.child1.dateOfBirth": kids[0]?.birthDate ?? "",
    "children.child1.placeOfBirth": kids[0]?.nationality ?? "", // NOTE: no placeOfBirth in DB template

    "children.child2.firstName": kids[1]?.firstName ?? "",
    "children.child2.dateOfBirth": kids[1]?.birthDate ?? "",
    "children.child2.placeOfBirth": kids[1]?.nationality ?? "",

    "children.child3.firstName": kids[2]?.firstName ?? "",
    "children.child3.dateOfBirth": kids[2]?.birthDate ?? "",
    "children.child3.placeOfBirth": kids[2]?.nationality ?? "",

    // Marital status checkboxes (PDF expects separate fields, DB is one string)
    "israeliApplicant.maritalStatus.married": checked(marital === "married"),
    "israeliApplicant.maritalStatus.divorced": checked(marital === "divorced"),
    "israeliApplicant.maritalStatus.widowed": checked(marital === "widowed"),
    "israeliApplicant.maritalStatus.single": checked(marital === "single"),
    "israeliApplicant.maritalStatus.bigamist": checked(marital === "bigamist"),

    // formDate is not in DB template. You can compute it at fill-time:
    "formDate": new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  };
}
