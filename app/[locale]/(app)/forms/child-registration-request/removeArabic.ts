// removeArabic.ts

// Covers Arabic + Arabic Supplement + Arabic Extended-A + Arabic Presentation Forms
const ARABIC_SCRIPT_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]|(?:\uD83A[\uDE00-\uDEFF])/g;

export function stripArabicLetters(input: string): string {
  // Remove Arabic script chars, then normalize whitespace
  return input
    .replace(ARABIC_SCRIPT_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

type AnyJson =
  | null
  | boolean
  | number
  | string
  | AnyJson[]
  | { [k: string]: AnyJson };

export function removeArabicFromJson<T extends AnyJson>(value: T): T {
  if (typeof value === "string") {
    return stripArabicLetters(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((v) => removeArabicFromJson(v as AnyJson)) as T;
  }

  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = removeArabicFromJson(v as AnyJson);
    }
    return out as T;
  }

  return value;
}
