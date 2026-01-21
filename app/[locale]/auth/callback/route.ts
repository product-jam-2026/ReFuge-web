import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from "@/lib/config";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const locale = requestUrl.pathname.split("/")[1] || "he";

  if (!code) {
    return NextResponse.redirect(new URL(`/${locale}/login`, requestUrl.origin));
  }

  const cookieStore = cookies();
  const response = NextResponse.next();
  const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  await supabase.auth.exchangeCodeForSession(code);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, requestUrl.origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("registration_completed, PrefLang")
    .eq("id", user.id)
    .maybeSingle();

  const redirectLocale = profile?.PrefLang ? "ar" : "he";
  const isCompleted = profile?.registration_completed === true;

  const target = isCompleted
    ? `/${redirectLocale}/home`
    : `/${redirectLocale}/signup/intake`;

  const redirectResponse = NextResponse.redirect(new URL(target, requestUrl.origin));
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
