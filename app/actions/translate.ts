'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function translateToHebrew(text: string) {
  if (!text) return "";

  try {
    // מודל Flash הוא המהיר והמומלץ כרגע
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a professional translator.
      Translate the following text into Hebrew.
      The input can be in any language (English, Arabic, etc.).
      If the input is already in Hebrew, return it as is.
      Give ONLY the translation.
      
      Text: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
    
  } catch (error) {
    console.error("Translation error:", error);
    return "שגיאה בתרגום.";
  }
}