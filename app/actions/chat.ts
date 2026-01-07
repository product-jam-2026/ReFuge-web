'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash"; // ✅ מודל קיים אצלך ברשימה

export async function askAI(
  userQuestion: string,
  contextItems: { question: string; answer: string }[],
  locale: string
) {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return "Error: API Key is missing. Please set GOOGLE_API_KEY in .env.local";
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const contextString = contextItems
      .map((item) => `Right: ${item.question}\nDetails: ${item.answer}`)
      .join("\n---\n");

    const prompt = `
You are a helpful assistant for refugees.
Answer based ONLY on the context below.
Language: ${locale}.

Context:
${contextString}

Question: "${userQuestion}"
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Google AI Error:", error);
    return "מצטערים, המערכת נתקלה בבעיה. נסה שוב.";
  }
}
