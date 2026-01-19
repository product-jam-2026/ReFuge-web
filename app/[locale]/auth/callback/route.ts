import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const locale = requestUrl.pathname.split("/")[1] || "he";

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
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

  return NextResponse.redirect(new URL(`/${locale}/login`, requestUrl.origin));
}
