import { createClient } from "@/lib/supabase/server"; // שימי לב לייבוא מ-server
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // חילוץ ה-locale מתוך ה-URL כדי לדעת לאן להחזיר (he/ar/en)
  const locale = requestUrl.pathname.split("/")[1] || "he";

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // 1. המרת הקוד לסשן
    await supabase.auth.exchangeCodeForSession(code);

    // 2. קבלת המשתמש
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 3. בדיקה אם המשתמש סיים הרשמה
      const { data: profile } = await supabase
        .from("profiles")
        .select("registration_completed, PrefLang")
        .eq("id", user.id)
        .maybeSingle();

      const preferredLocale = profile?.PrefLang ? "ar" : "he";
      const redirectLocale = locale === "ar" || locale === "he" ? locale : preferredLocale;
      const isCompleted = profile?.registration_completed === true;

      if (isCompleted) {
        return NextResponse.redirect(new URL(`/${redirectLocale}/home`, requestUrl.origin));
      }

      return NextResponse.redirect(new URL(`/${redirectLocale}/signup/intake`, requestUrl.origin));
    }
  }

  // במקרה של שגיאה או חוסר בקוד -> חזרה ללוגין
  return NextResponse.redirect(new URL(`/${locale}/login`, requestUrl.origin));
}
