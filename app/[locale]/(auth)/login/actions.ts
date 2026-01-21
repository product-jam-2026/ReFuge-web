"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function sendMagicLink(formData: FormData) {
  const origin = headers().get("origin");
  const referer = headers().get("referer") || "";
  const localeMatch = referer.match(/\/(he|ar)(?=\/|$)/);
  const locale = localeMatch?.[1] || "he";
  const email = formData.get("email") as string;

  const supabase = createClient(cookies());

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/${locale}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/${locale}/login?message=Could not send magic link`);
  }

  redirect(`/${locale}/login?message=Check your email for the login link`);
}

export async function goToSignUp() {
  redirect("/signup");
}
