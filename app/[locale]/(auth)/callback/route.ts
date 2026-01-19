import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const locale = requestUrl.pathname.split("/")[1] || "he";
  const redirectUrl = new URL(`/${locale}/auth/callback`, requestUrl.origin);
  redirectUrl.search = requestUrl.search;
  return NextResponse.redirect(redirectUrl);
}
