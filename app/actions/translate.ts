'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

/**
 * RedactionResult:
 * - redactedText: הטקסט אחרי החלפת פרטים רגישים בטוקנים
 * - map: מיפוי טוקן -> הערך המקורי כדי שנוכל לשחזר אחרי התרגום
 */
type RedactionResult = {
  redactedText: string;
  map: Record<string, string>;
};

function redactPII(input: string): RedactionResult {
  let text = input;
  const map: Record<string, string> = {};
  let i = 0;

  const replaceAll = (regex: RegExp, label: string) => {
    text = text.replace(regex, (match) => {
      const token = `[[REDACTED_${label}_${i++}]]`;
      map[token] = match;
      return token;
    });
  };

  // Emails
  replaceAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "EMAIL");

  // Phone numbers (loose): catches +972..., 05x..., separators/spaces/dashes
  // NOTE: This may also catch some non-phone long digit sequences, but that's OK for privacy.
  replaceAll(/(\+?\d[\d\s().-]{7,}\d)/g, "PHONE");

  // Israeli ID (9 digits) - loose
  replaceAll(/\b\d{9}\b/g, "IL_ID");

  // Credit card-ish sequences (13-19 digits with optional separators) - conservative
  replaceAll(/\b(?:\d[ -]*?){13,19}\b/g, "CARD");

  return { redactedText: text, map };
}

function restorePII(translated: string, map: Record<string, string>) {
  let out = translated;
  // Restore longer tokens first (safer)
  const tokens = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const t of tokens) {
    out = out.split(t).join(map[t]);
  }
  return out;
}

/**
 * תרגום מערבית -> עברית.
 * אם הטקסט כבר בעברית (או מעורבב) - המודל עדיין יחזיר עברית,
 * אבל הוא לא אמור "להמציא" מידע חדש.
 */
export async function translateToHebrew(inputText: string) {
  const text = (inputText ?? "").trim();
  if (!text) return "";

  const apiKey = process.env.GOOGLE_API_KEY;
  console.log("SERVER sees GOOGLE_API_KEY:", apiKey ? apiKey.slice(0, 8) : "MISSING");
  if (!apiKey) return "שגיאה: חסר GOOGLE_API_KEY ב-.env.local";

  // ✅ Redaction לפני שליחה ל-LLM
  const { redactedText, map } = redactPII(text);

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `
You are a professional translator helping refugees fill official forms in Israel.

Task:
Translate the text from Arabic to Hebrew.
If parts are already in Hebrew, keep them as-is.

CRITICAL RULES:
- Output ONLY the Hebrew translation. No explanations. No quotes. No markdown.
- Do NOT add new facts. Translate faithfully.
- Preserve paragraphs and line breaks.
- Keep numbers and dates exactly as written.
- Do not change, remove, or move any tokens in the format [[REDACTED_*]].
- Use clear, respectful Hebrew. If the text sounds like a formal form answer, use a formal register.

Text:
${redactedText}
`.trim();

    const result = await model.generateContent(prompt);
    const hebrew = result.response.text().trim();

    // ✅ שחזור הפרטים אחרי התרגום
    return restorePII(hebrew, map);
  } catch (error) {
    console.error("Arabic->Hebrew Translation error:", error);
    return "שגיאה בתרגום. נסה שוב.";
  }
}

/**
 * Alias ברור יותר לשם הפונקציה (אם את רוצה להשתמש בשם הזה בקוד).
 */
export async function translateArabicToHebrew(inputText: string) {
  return translateToHebrew(inputText);
}
