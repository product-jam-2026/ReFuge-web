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

  // Phone numbers (loose)
  replaceAll(/(\+?\d[\d\s().-]{7,}\d)/g, "PHONE");

  // Israeli ID (9 digits)
  replaceAll(/\b\d{9}\b/g, "IL_ID");

  // Credit card-ish sequences
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

// --- פונקציה גנרית לביצוע התרגום ---
async function runTranslation(text: string, targetLang: 'hebrew' | 'arabic') {
  const inputText = (text ?? "").trim();
  if (!inputText) return "";

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return `Error: Missing API Key`;

  // 1. הסתרת פרטים רגישים
  const { redactedText, map } = redactPII(inputText);

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // הגדרת הפרומפט בהתאם לשפת היעד
    let promptInstruction = "";
    if (targetLang === 'hebrew') {
      promptInstruction = `
        Task: Translate the text from Arabic (or English) to Hebrew.
        If parts are already in Hebrew, keep them as-is.
        Output ONLY the Hebrew translation.
      `;
    } else {
      promptInstruction = `
        Task: Translate the text from Hebrew (or English) to Arabic.
        If parts are already in Arabic, keep them as-is.
        Output ONLY the Arabic translation.
      `;
    }

    const prompt = `
      You are a professional translator helping refugees fill official forms in Israel.
      ${promptInstruction}
      
      CRITICAL RULES:
      - No explanations. No quotes. No markdown.
      - Translate faithfully.
      - Do not change, remove, or move tokens in the format [[REDACTED_*]].
      
      Text:
      ${redactedText}
    `.trim();

    const result = await model.generateContent(prompt);
    const translatedText = result.response.text().trim();

    // 2. שחזור הפרטים
    return restorePII(translatedText, map);

  } catch (error) {
    console.error(`${targetLang} Translation error:`, error);
    return inputText; // במקרה שגיאה מחזירים את המקור
  }
}

/**
 * תרגום לערבית -> עברית
 */
export async function translateToHebrew(inputText: string) {
  return runTranslation(inputText, 'hebrew');
}

/**
 * תרגום לעברית -> ערבית (חדש!)
 */
export async function translateToArabic(inputText: string) {
  return runTranslation(inputText, 'arabic');
}