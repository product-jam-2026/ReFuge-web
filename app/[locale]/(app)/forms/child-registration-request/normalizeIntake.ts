// normalizeIntake.ts
import demo from "@/public/demo/intake.empty.json";
export type OldIntakeRecord = typeof demo;

function isObj(x: any): x is Record<string, any> {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

// whenever there are "he" and "ar" options, use the "he" option
function pickHe(x: any): string {
  if (typeof x === "string") return x;
  if (isObj(x)) {
    if (typeof x.he === "string") return x.he;
    if (typeof x.ar === "string") return x.ar;
  }
  return "";
}

function pickBool(x: any): boolean {
  if (typeof x === "boolean") return x;
  if (typeof x === "string") return x === "true";
  return false;
}

function str(x: any): string {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

export function normalizeToOldIntake(input: any): OldIntakeRecord {
  const tpl = structuredClone(demo) as OldIntakeRecord;

  const src = isObj(input) ? input : {};
  const intake = isObj(src.intake) ? src.intake : {};

  // ---- step1 ----
  const s1 = isObj(intake.step1) ? intake.step1 : {};
  tpl.intake.step1.email = str(s1.email);
  tpl.intake.step1.phone = str(s1.phone);
  tpl.intake.step1.gender = str(s1.gender);

  tpl.intake.step1.firstName = pickHe(s1.firstName) || str(s1.firstName);
  tpl.intake.step1.lastName = pickHe(s1.lastName) || str(s1.lastName);
  tpl.intake.step1.oldFirstName = pickHe(s1.oldFirstName) || str(s1.oldFirstName);
  tpl.intake.step1.oldLastName = pickHe(s1.oldLastName) || str(s1.oldLastName);

  tpl.intake.step1.birthDate = str(s1.birthDate);
  tpl.intake.step1.nationality = str(s1.nationality);
  tpl.intake.step1.israeliId = str(s1.israeliId);

  tpl.intake.step1.passportNumber = str(s1.passportNumber);
  tpl.intake.step1.passportIssueDate = str(s1.passportIssueDate);
  tpl.intake.step1.passportExpiryDate = str(s1.passportExpiryDate);
  tpl.intake.step1.passportIssueCountry = str(s1.passportIssueCountry);

  // ---- step2 ----
  const s2 = isObj(intake.step2) ? intake.step2 : {};
  tpl.intake.step2.visaType = str(s2.visaType);
  tpl.intake.step2.visaStartDate = str(s2.visaStartDate);
  tpl.intake.step2.visaEndDate = str(s2.visaEndDate);
  tpl.intake.step2.entryDate = str(s2.entryDate);

  tpl.intake.step2.residenceCountry = str(s2.residenceCountry);
  tpl.intake.step2.residenceCity = pickHe(s2.residenceCity) || str(s2.residenceCity);
  tpl.intake.step2.residenceAddress = pickHe(s2.residenceAddress) || str(s2.residenceAddress);

  // ---- step3 ----
  const s3 = isObj(intake.step3) ? intake.step3 : {};
  tpl.intake.step3.maritalStatus = str(s3.maritalStatus);
  tpl.intake.step3.statusDate = str(s3.statusDate);

  const reg = isObj(s3.registeredAddress) ? s3.registeredAddress : {};
  tpl.intake.step3.registeredAddress.city = str(reg.city);
  tpl.intake.step3.registeredAddress.street = pickHe(reg.street) || str(reg.street);
  tpl.intake.step3.registeredAddress.houseNumber = str(reg.houseNumber);
  tpl.intake.step3.registeredAddress.entry = str(reg.entry);
  tpl.intake.step3.registeredAddress.apartment = str(reg.apartment);
  tpl.intake.step3.registeredAddress.zip = str(reg.zip);

  tpl.intake.step3.mailingDifferent = pickBool(s3.mailingDifferent);

  const mail = isObj(s3.mailingAddress) ? s3.mailingAddress : {};
  tpl.intake.step3.mailingAddress.city = str(mail.city);
  tpl.intake.step3.mailingAddress.street = pickHe(mail.street) || str(mail.street);
  tpl.intake.step3.mailingAddress.houseNumber = str(mail.houseNumber);
  tpl.intake.step3.mailingAddress.entry = str(mail.entry);
  tpl.intake.step3.mailingAddress.apartment = str(mail.apartment);
  tpl.intake.step3.mailingAddress.zip = str(mail.zip);

  tpl.intake.step3.employmentStatus = str(s3.employmentStatus);

  // new schema has step3.occupation as object; old schema expects string
  // take occupationText if exists, else empty
  const occ = isObj(s3.occupation) ? s3.occupation : {};
  tpl.intake.step3.occupation = str(occ.occupationText || s3.occupation);

  // new schema has notWorkingSub; old schema expects notWorkingReason
  tpl.intake.step3.notWorkingReason = str(occ.notWorkingSub || s3.notWorkingReason);

  // ---- step4 ----
  const s4 = isObj(intake.step4) ? intake.step4 : {};
  tpl.intake.step4.healthFund = str(s4.healthFund);

  const bank = isObj(s4.bank) ? s4.bank : {};
  tpl.intake.step4.bank.bankName = str(bank.bankName);
  tpl.intake.step4.bank.branch = str(bank.branch);
  tpl.intake.step4.bank.accountNumber = str(bank.accountNumber);

  const ni = isObj(s4.nationalInsurance) ? s4.nationalInsurance : {};
  tpl.intake.step4.nationalInsurance.hasFile = str(ni.hasFile);
  tpl.intake.step4.nationalInsurance.fileNumber = str(ni.fileNumber);
  tpl.intake.step4.nationalInsurance.getsAllowance = str(ni.getsAllowance);
  tpl.intake.step4.nationalInsurance.allowanceType = str(ni.allowanceType);
  tpl.intake.step4.nationalInsurance.allowanceFileNumber = str(ni.allowanceFileNumber);

  // ---- step5 ----
  // OLD expects: step5.person
  // NEW has: step5.spouse
  const s5 = isObj(intake.step5) ? intake.step5 : {};
  const spouse = isObj(s5.spouse) ? s5.spouse : {};
  const personSrc = isObj(s5.person) ? s5.person : spouse; // support either

  tpl.intake.step5.person.firstName = pickHe(personSrc.firstName) || str(personSrc.firstName);
  tpl.intake.step5.person.lastName = pickHe(personSrc.lastName) || str(personSrc.lastName);
  tpl.intake.step5.person.oldFirstName = pickHe(personSrc.oldFirstName) || str(personSrc.oldFirstName);
  tpl.intake.step5.person.oldLastName = pickHe(personSrc.oldLastName) || str(personSrc.oldLastName);

  tpl.intake.step5.person.gender = str(personSrc.gender);
  tpl.intake.step5.person.birthDate = str(personSrc.birthDate);
  tpl.intake.step5.person.nationality = str(personSrc.nationality);
  tpl.intake.step5.person.israeliId = str(personSrc.israeliId);
  tpl.intake.step5.person.passportNumber = str(personSrc.passportNumber);

  // old step5 has separate maritalStatus/statusDate/phone/email
  tpl.intake.step5.maritalStatus = str(s5.maritalStatus);
  tpl.intake.step5.statusDate = str(s5.statusDate);
  tpl.intake.step5.phone = str(spouse.phone || s5.phone);
  tpl.intake.step5.email = str(spouse.email || s5.email);

  // ---- step6 ----
  const s6 = isObj(intake.step6) ? intake.step6 : {};
  const kids = Array.isArray(s6.children) ? s6.children : [];
  tpl.intake.step6.children = kids.map((c: any) => {
    const cc = isObj(c) ? c : {};
    return {
      lastName: pickHe(cc.lastName) || str(cc.lastName),
      firstName: pickHe(cc.firstName) || str(cc.firstName),
      gender: str(cc.gender),
      birthDate: str(cc.birthDate),
      nationality: str(cc.nationality),
      israeliId: str(cc.israeliId),
      residenceCountry: str(cc.residenceCountry),
      // NEW sometimes has arrivalToIsraelDate; prefer entryDate if exists, else arrivalToIsraelDate
      entryDate: str(cc.entryDate || cc.arrivalToIsraelDate),
    };
  });

  return tpl;
}
