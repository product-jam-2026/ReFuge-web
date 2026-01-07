type AnyObj = Record<string, any>;

function formatAddress(addr?: AnyObj): string {
  if (!addr) return "";
  const parts = [
    [addr.street, addr.houseNumber].filter(Boolean).join(" "),
    addr.entry ? `כניסה ${addr.entry}` : "",
    addr.apartment ? `דירה ${addr.apartment}` : "",
    addr.city ?? "",
    addr.zip ? `מיקוד ${addr.zip}` : "",
  ].filter(Boolean);

  return parts.join(", ");
}

function mapMaritalStatusToKey(status?: string):
  | "married"
  | "divorced"
  | "widowed"
  | "single"
  | "bigamist"
  | null {
  if (!status) return null;
  const s = status.trim().toLowerCase();

  if (["married", "נשוי", "נשואה", "נשוי/אה"].includes(s)) return "married";
  if (["divorced", "גרוש", "גרושה", "גרוש/ה"].includes(s)) return "divorced";
  if (["widowed", "אלמן", "אלמנה", "אלמן/נה"].includes(s)) return "widowed";
  if (["single", "רווק", "רווקה", "רווק/ה"].includes(s)) return "single";
  if (["bigamist", "ביגמיסט", "ביגמיסטית", "ביגמיסט/ית"].includes(s)) return "bigamist";

  return null;
}

export function intakeToChildRegistrationFields(intake: AnyObj): Record<string, string> {
  // intake here is the object at data.intake (not the full wrapper)
  const s1 = intake?.step1 ?? {};
  const s3 = intake?.step3 ?? {};
  const s5 = intake?.step5 ?? {};
  const kids = intake?.step6?.children ?? [];

  const fields: Record<string, string> = {};

  // Example mapping you asked for:
  fields["israeliApplicant.phoneMobile"] = s1.phone ?? "";

  // Other useful mappings (only include what exists in your fieldMap)
  fields["formDate"] = new Date().toISOString().slice(0, 10);
  fields["israeliApplicant.firstName"] = s1.firstName ?? "";
  fields["israeliApplicant.lastName"] = s1.lastName ?? "";
  fields["israeliApplicant.idNumber"] = s1.israeliId ?? "";
  fields["israeliApplicant.address"] = formatAddress(s3.registeredAddress);
  fields["israeliApplicant.poBox"] = ""; // if you add to intake later, map it here

  // marital status checkbox (only one key gets "true")
  const msKey = mapMaritalStatusToKey(s3.maritalStatus);
  if (msKey) fields[`israeliApplicant.maritalStatus.${msKey}`] = "true";

  // foreignParent (your PDF expects foreignParent.*; you decide which intake step)
  // Example: use step5.person fields if that represents the other parent
  const p = s5.person ?? {};
  fields["foreignParent.firstName"] = p.firstName ?? "";
  fields["foreignParent.lastName"] = p.lastName ?? "";
  fields["foreignParent.idOrPassportNumber"] = p.passportNumber ?? p.israeliId ?? "";

  // children.child1..child3
  for (let i = 0; i < Math.min(3, kids.length); i++) {
    const idx = i + 1;
    const c = kids[i] ?? {};
    fields[`children.child${idx}.firstName`] = c.firstName ?? "";
    fields[`children.child${idx}.dateOfBirth`] = c.birthDate ?? "";
    // intake doesn’t have placeOfBirth -> map something (or leave blank)
    fields[`children.child${idx}.placeOfBirth`] = c.residenceCountry ?? "";
  }

  return fields;
}
