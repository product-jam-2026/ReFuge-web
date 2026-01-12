// lib/geo/countries.ts

export type CountryOption = {
  iso2: string;
  ar: string;
  he: string;
};

// רשימה חלקית ומוותאמת - ניתן להרחיב את הרשימה הזו לפי הצורך
export const countriesList: CountryOption[] = [
  { iso2: "SD", ar: "السودان", he: "סודאן" },
  { iso2: "ER", ar: "إريتريا", he: "אריתריאה" },
  { iso2: "ET", ar: "إثيوبيا", he: "אתיופיה" },
  { iso2: "SS", ar: "جنوب السودان", he: "דרום סודאן" },
  { iso2: "EG", ar: "مصر", he: "מצרים" },
  { iso2: "IL", ar: "إسرائيل", he: "ישראל" },
  { iso2: "JO", ar: "الأردن", he: "ירדן" },
  { iso2: "UA", ar: "أوكرانيا", he: "אוקראינה" },
  { iso2: "RU", ar: "روسيا", he: "רוסיה" },
  { iso2: "US", ar: "الولايات المتحدة", he: "ארצות הברית" },
  { iso2: "CA", ar: "كندا", he: "קנדה" },
  { iso2: "DE", ar: "ألمانيا", he: "גרמניה" },
  { iso2: "FR", ar: "فرنسا", he: "צרפת" },
  { iso2: "GB", ar: "المملكة المتحدة", he: "בריטניה" },
  { iso2: "TR", ar: "تركيا", he: "טורקיה" },
  // ... אפשר להוסיף עוד מדינות מכאן
];

export function getCountryOptions() {
  return countriesList;
}