// middleware.ts (שורש הפרויקט)

import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";

const intlMiddleware = createMiddleware({
  locales: ["en", "he", "ar"],
  defaultLocale: "he",
});

const PUBLIC_FILE = /\.(.*)$/;

function isPublicPath(pathname: string) {
  // קבצים/נתיבים מערכתיים
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_vercel") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return true;
  }

  // דפי auth שפתוחים גם בלי התחברות
  // (התאימי אם אצלך הנתיבים נקראים אחרת)
  const publicRoutes = [
    /^\/(he|ar|en)\/login\/?$/i,
    /^\/(he|ar|en)\/signup\/?$/i,
    /^\/(he|ar|en)\/signup\/.*$/i,
    /^\/(he|ar|en)\/auth\/callback\/?$/i,
  ];

  return publicRoutes.some((re) => re.test(pathname));
}

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export default async function middleware(req: NextRequest) {
  // 1) קודם כל next-intl (מוסיף/מתקן locale ב-URL)
  const intlResponse = intlMiddleware(req);

  // אם next-intl מחזיר redirect (למשל מ-/ ל-/he) — מחזירים מיד כדי למנוע לופים
  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  // 2) מתג שמדליק/מכבה חסימה דרך ENV
  const guardEnabled = process.env.NEXT_PUBLIC_ENABLE_AUTH_GUARD === "true";
  if (!guardEnabled) {
    return intlResponse;
  }

  const pathname = req.nextUrl.pathname;

  // 3) נתיבים ציבוריים – לא חוסמים
  if (isPublicPath(pathname)) {
    return intlResponse;
  }

  // 4) בדיקת משתמש דרך Supabase (עם cookies)
  let res = intlResponse as NextResponse;

  // כאן אנחנו עושים cast ל-any כדי ש-TS לא "יכעס" על getAll/setAll
  const cookieMethods = {
    getAll() {
      return (req.cookies as any).getAll?.() ?? [];
    },
    setAll(cookiesToSet: CookieToSet[]) {
      cookiesToSet.forEach(({ name, value, options }) => {
        res.cookies.set(name, value, options);
      });
    },
  } as any;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 5) אם אין user – redirect ל-login באותו locale
  if (!user) {
    const locale = pathname.split("/")[1] || "he";
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/${locale}/login`;
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
