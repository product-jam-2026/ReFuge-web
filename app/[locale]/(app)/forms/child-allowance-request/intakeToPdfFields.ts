type Intake = {
  intake: {
    step1: {
      firstName: string;
      lastName: string;
      birthDate: string;
      israeliId: string;
      passportNumber: string;
      phone: string;
      email: string;
    };
    step2: {
      entryDate: string;
    };
    step3: {
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
      maritalStatus: string;
    };
    step4: {
      bank: {
        bankName: string;
        branch: string; // in your DB template this is one string
        accountNumber: string;
      };
    };
    step5: {
      person: {
        firstName: string;
        lastName: string;
        birthDate: string;
        israeliId: string;
        passportNumber: string;
      };
      phone: string;
      email: string;
    };
    step6: {
      children: Array<{
        firstName: string;
        lastName: string;
        birthDate: string;
        israeliId: string;
        entryDate: string;
      }>;
    };
  };
};

function splitEmail(email: string): { prefix: string; postfix: string } {
  const e = (email ?? "").trim();
  const at = e.indexOf("@");
  if (at === -1) return { prefix: e, postfix: "" };
  return { prefix: e.slice(0, at), postfix: e.slice(at + 1) };
}

function fullName(first: string, last: string) {
  return `${(first ?? "").trim()} ${(last ?? "").trim()}`.trim();
}

// export function intakeToPdfFields(db: Intake): Record<string, string> {
//   const s1 = db.intake.step1;
//   const s2 = db.intake.step2;
//   const s3 = db.intake.step3;
//   const s4 = db.intake.step4;
//   const s5 = db.intake.step5;

//   const kids = db.intake.step6.children ?? [];

//   const fatherEmail = splitEmail(s1.email);
//   const reqEmail = splitEmail(s5.email);

//   const fatherAddr = s3.registeredAddress;
//   const reqAddr = s3.mailingDifferent ? s3.mailingAddress : s3.registeredAddress;

//   return {
//     // ===== Page 0: Father =====
//     "father.familyName": s1.lastName ?? "",
//     "father.firstName": s1.firstName ?? "",
//     "father.idNumber": s1.israeliId || s1.passportNumber || "",
//     "father.birthDate": s1.birthDate ?? "",
//     "father.entryDate": s2.entryDate ?? "",

//     "father.address.street": fatherAddr.street ?? "",
//     "father.address.houseNumber": fatherAddr.houseNumber ?? "",
//     "father.address.houseEntranceNumber": fatherAddr.entry ?? "",
//     "father.address.apartmentNumber": fatherAddr.apartment ?? "",
//     "father.address.city": fatherAddr.city ?? "",
//     "father.address.zipcode": fatherAddr.zip ?? "",

//     "father.phoneMobile": s1.phone ?? "",
//     // PDF has phoneHome but DB doesn't:
//     "father.phoneHome": "",
//     // PDF split email into two fields around a printed '@'
//     "father.emailPrefix": fatherEmail.prefix,
//     "father.emailPostfix": fatherEmail.postfix,

//     // ===== Page 1: Allowance requester =====
//     "allowanceRequester.lastName": s5.person.lastName ?? "",
//     "allowanceRequester.firstName": s5.person.firstName ?? "",
//     "allowanceRequester.idNumber": s5.person.israeliId || s5.person.passportNumber || "",
//     "allowanceRequester.birthDate": s5.person.birthDate ?? "",
//     // No entryDate in step5 in your DB template — use main entryDate as a default:
//     "allowanceRequester.entryDate": s2.entryDate ?? "",

//     "allowanceRequester.address.street": reqAddr.street ?? "",
//     "allowanceRequester.address.homeNumber": reqAddr.houseNumber ?? "",
//     "allowanceRequester.address.enteranceNumber": reqAddr.entry ?? "",
//     "allowanceRequester.address.apartmentNumber": reqAddr.apartment ?? "",
//     "allowanceRequester.address.city": reqAddr.city ?? "",
//     "allowanceRequester.address.zipcode": reqAddr.zip ?? "",

//     "allowanceRequester.phoneMobile": s5.phone ?? "",
//     // PDF has phoneHome but DB doesn't:
//     "allowanceRequester.phoneHome": "",
//     "allowanceRequester.emailPrefix": reqEmail.prefix,
//     "allowanceRequester.emailPostfix": reqEmail.postfix,

//     // ===== Page 1: Bank account =====
//     "bankAccount.owner1": fullName(s1.firstName, s1.lastName),
//     "bankAccount.owner2": fullName(s5.person.firstName, s5.person.lastName),
//     "bankAccount.bankName": s4.bank.bankName ?? "",
//     // PDF wants branchName + branchNumber separately; DB template has one "branch" string
//     "bankAccount.branchName": "",
//     "bankAccount.branchNumber": s4.bank.branch ?? "",
//     "bankAccount.accountNumber": s4.bank.accountNumber ?? "",

//     // ===== Page 2: Children (up to 3) =====
//     "child1.idNumber": kids[0]?.israeliId ?? "",
//     "child1.lastName": kids[0]?.lastName ?? "",
//     "child1.firstName": kids[0]?.firstName ?? "",
//     "child1.birthDate": kids[0]?.birthDate ?? "",
//     "child1.entryDate": kids[0]?.entryDate ?? "",
//     // not in DB template — page.tsx will fill these via extras:
//     "child1.firstEntryDate": kids[0]?.entryDate ?? "",
//     "child1.fileJoinDate": "",

//     "child2.idNumber": kids[1]?.israeliId ?? "",
//     "child2.lastName": kids[1]?.lastName ?? "",
//     "child2.firstName": kids[1]?.firstName ?? "",
//     "child2.birthDate": kids[1]?.birthDate ?? "",
//     "child2.entryDate": kids[1]?.entryDate ?? "",
//     "child2.firstEntryDate": kids[1]?.entryDate ?? "",
//     "child2.fileJoinDate": "",

//     "child3.idNumber": kids[2]?.israeliId ?? "",
//     "child3.lastName": kids[2]?.lastName ?? "",
//     "child3.firstName": kids[2]?.firstName ?? "",
//     "child3.birthDate": kids[2]?.birthDate ?? "",
//     "child3.entryDate": kids[2]?.entryDate ?? "",
//     "child3.firstEntryDate": kids[2]?.entryDate ?? "",
//     "child3.fileJoinDate": "",
//   };
// }

type PdfExtras = {
  formDate?: string;
  poBox?: string;
  applicantSignature?: string;
  requesterEntryDate?: string;

  father?: {
    phoneHome?: string;
    emailPrefix?: string;
    emailPostfix?: string;
  };
  allowanceRequester?: {
    phoneHome?: string;
    emailPrefix?: string;
    emailPostfix?: string;
  };
  bankAccount?: {
    branchName?: string;
    branchNumber?: string;
    owner1?: string;
    owner2?: string;
  };
  children?: Array<{
    firstEntryDate?: string;
    fileJoinDate?: string;
  }>;
};

export function intakeToPdfFields(
  db: Intake,
  extras?: PdfExtras,
): Record<string, string> {
  const s1 = db.intake.step1;
  const s2 = db.intake.step2;
  const s3 = db.intake.step3;
  const s4 = db.intake.step4;
  const s5 = db.intake.step5;

  const kids = db.intake.step6.children ?? [];

  const fatherEmail = splitEmail(s1.email);
  const reqEmail = splitEmail(s5.email);

  const fatherAddr = s3.registeredAddress;
  const reqAddr = s3.mailingDifferent
    ? s3.mailingAddress
    : s3.registeredAddress;

  const base: Record<string, string> = {
    // ===== Page 0: Father =====
    "father.familyName": s1.lastName ?? "",
    "father.firstName": s1.firstName ?? "",
    "father.idNumber": s1.israeliId || s1.passportNumber || "",
    "father.birthDate": s1.birthDate ?? "",
    "father.entryDate": s2.entryDate ?? "",

    "father.address.street": fatherAddr.street ?? "",
    "father.address.houseNumber": fatherAddr.houseNumber ?? "",
    "father.address.houseEntranceNumber": fatherAddr.entry ?? "",
    "father.address.apartmentNumber": fatherAddr.apartment ?? "",
    "father.address.city": fatherAddr.city ?? "",
    "father.address.zipcode": fatherAddr.zip ?? "",

    "father.phoneMobile": s1.phone ?? "",
    "father.phoneHome": "",
    "father.emailPrefix": fatherEmail.prefix,
    "father.emailPostfix": fatherEmail.postfix,

    // ===== Page 1: Allowance requester =====
    "allowanceRequester.lastName": s5.person.lastName ?? "",
    "allowanceRequester.firstName": s5.person.firstName ?? "",
    "allowanceRequester.idNumber":
      s5.person.israeliId || s5.person.passportNumber || "",
    "allowanceRequester.birthDate": s5.person.birthDate ?? "",
    "allowanceRequester.entryDate": s2.entryDate ?? "",

    "allowanceRequester.address.street": reqAddr.street ?? "",
    "allowanceRequester.address.homeNumber": reqAddr.houseNumber ?? "",
    "allowanceRequester.address.enteranceNumber": reqAddr.entry ?? "",
    "allowanceRequester.address.apartmentNumber": reqAddr.apartment ?? "",
    "allowanceRequester.address.city": reqAddr.city ?? "",
    "allowanceRequester.address.zipcode": reqAddr.zip ?? "",

    "allowanceRequester.phoneMobile": s5.phone ?? "",
    "allowanceRequester.phoneHome": "",
    "allowanceRequester.emailPrefix": reqEmail.prefix,
    "allowanceRequester.emailPostfix": reqEmail.postfix,

    // ===== Page 1: Bank account =====
    "bankAccount.owner1": fullName(s1.firstName, s1.lastName),
    "bankAccount.owner2": fullName(s5.person.firstName, s5.person.lastName),
    "bankAccount.bankName": s4.bank.bankName ?? "",
    "bankAccount.branchName": "",
    "bankAccount.branchNumber": s4.bank.branch ?? "",
    "bankAccount.accountNumber": s4.bank.accountNumber ?? "",

    // ===== Page 2: Children (up to 3) =====
    "child1.idNumber": kids[0]?.israeliId ?? "",
    "child1.lastName": kids[0]?.lastName ?? "",
    "child1.firstName": kids[0]?.firstName ?? "",
    "child1.birthDate": kids[0]?.birthDate ?? "",
    "child1.entryDate": kids[0]?.entryDate ?? "",
    "child1.firstEntryDate": kids[0]?.entryDate ?? "",
    "child1.fileJoinDate": "",

    "child2.idNumber": kids[1]?.israeliId ?? "",
    "child2.lastName": kids[1]?.lastName ?? "",
    "child2.firstName": kids[1]?.firstName ?? "",
    "child2.birthDate": kids[1]?.birthDate ?? "",
    "child2.entryDate": kids[1]?.entryDate ?? "",
    "child2.firstEntryDate": kids[1]?.entryDate ?? "",
    "child2.fileJoinDate": "",

    "child3.idNumber": kids[2]?.israeliId ?? "",
    "child3.lastName": kids[2]?.lastName ?? "",
    "child3.firstName": kids[2]?.firstName ?? "",
    "child3.birthDate": kids[2]?.birthDate ?? "",
    "child3.entryDate": kids[2]?.entryDate ?? "",
    "child3.firstEntryDate": kids[2]?.entryDate ?? "",
    "child3.fileJoinDate": "",
  };

  if (!extras) return base;

  // --- top-level extras you mentioned ---
  if (extras.formDate != null) base["formDate"] = extras.formDate;
  if (extras.poBox != null) base["poBox"] = extras.poBox;
  if (extras.applicantSignature != null)
    base["applicantSignature"] = extras.applicantSignature;

  // requester entry date override (since not in step5)
  if (extras.requesterEntryDate != null)
    base["allowanceRequester.entryDate"] = extras.requesterEntryDate;

  // --- overrides for PDF-only fields ---
  if (extras.father?.phoneHome != null)
    base["father.phoneHome"] = extras.father.phoneHome;
  if (extras.father?.emailPrefix != null)
    base["father.emailPrefix"] = extras.father.emailPrefix;
  if (extras.father?.emailPostfix != null)
    base["father.emailPostfix"] = extras.father.emailPostfix;

  if (extras.allowanceRequester?.phoneHome != null)
    base["allowanceRequester.phoneHome"] = extras.allowanceRequester.phoneHome;
  if (extras.allowanceRequester?.emailPrefix != null)
    base["allowanceRequester.emailPrefix"] =
      extras.allowanceRequester.emailPrefix;
  if (extras.allowanceRequester?.emailPostfix != null)
    base["allowanceRequester.emailPostfix"] =
      extras.allowanceRequester.emailPostfix;

  if (extras.bankAccount?.branchName != null)
    base["bankAccount.branchName"] = extras.bankAccount.branchName;
  if (extras.bankAccount?.branchNumber != null)
    base["bankAccount.branchNumber"] = extras.bankAccount.branchNumber;
  if (extras.bankAccount?.owner1 != null)
    base["bankAccount.owner1"] = extras.bankAccount.owner1;
  if (extras.bankAccount?.owner2 != null)
    base["bankAccount.owner2"] = extras.bankAccount.owner2;

  for (let i = 0; i < 3; i++) {
    const idx = i + 1;
    const c = extras.children?.[i];
    if (!c) continue;
    if (c.firstEntryDate != null)
      base[`child${idx}.firstEntryDate`] = c.firstEntryDate;
    if (c.fileJoinDate != null)
      base[`child${idx}.fileJoinDate`] = c.fileJoinDate;
  }

  return base;
}
