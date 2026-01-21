import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // וודאי שהנתיב הזה נכון לקובץ שלך!
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // ברירת מחדל לשפה הנוכחית ב-URL
  const currentLocale = requestUrl.pathname.split("/")[1] || "he";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/${currentLocale}/login?error=no_code`);
  }

  // 1. שימוש בקליינט המרכזי והיציב (במקום ליצור ידנית)
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // 2. החלפת הקוד ב-Session (הקוקיז נשמרים אוטומטית ע"י ה-createClient)
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth error:", error);
    return NextResponse.redirect(`${origin}/${currentLocale}/login?error=auth_exchange_failed`);
  }

  // 3. שליפת המשתמש והפרופיל (הלוגיקה המקורית שלך)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/${currentLocale}/login?error=no_user`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("registration_completed, PrefLang")
    .eq("id", user.id)
    .maybeSingle();

  // בחירת שפה לפי הפרופיל (או השארת השפה הנוכחית אם אין העדפה)
  const redirectLocale = profile?.PrefLang === "ar" ? "ar" : "he"; // אפשר לשנות לוגיקה אם רוצים לכפות שפה
  
  const isCompleted = profile?.registration_completed === true;

  // 4. ההחלטה לאן להפנות
  if (isCompleted) {
    return NextResponse.redirect(`${origin}/${redirectLocale}/home`);
  } else {
    // אם לא סיים הרשמה - שולחים ל-Intake (כמו בקוד המקורי שלך)
    return NextResponse.redirect(`${origin}/${redirectLocale}/signup/intake`);
  }
}