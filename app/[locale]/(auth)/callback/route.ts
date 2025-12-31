import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // 1) exchange code -> session
  await supabase.auth.exchangeCodeForSession(code);

  // 2) get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?message=Auth failed", requestUrl.origin)
    );
  }

  // 3) check registration status
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, registration_completed")
    .eq("id", user.id)
    .maybeSingle();

  // לא קיים פרופיל או לא הושלמה הרשמה -> signup
  if (!profile || !profile.registration_completed) {
    return NextResponse.redirect(new URL("/signup", requestUrl.origin));
  }

  // רשום -> home
  return NextResponse.redirect(new URL("/home", requestUrl.origin));
}
