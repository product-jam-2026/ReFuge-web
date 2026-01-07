const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("❌ Missing GOOGLE_API_KEY. Run: export GOOGLE_API_KEY='...'");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent("Hello, are you working?");
    console.log("Response:", result.response.text());
    console.log("✅ SUCCESS! המפתח תקין והמודל עובד.");
  } catch (e) {
    console.error("❌ ERROR:", e.message);
  }
}

run();

