"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export async function sendMagicLink(formData: FormData) {
  const origin = headers().get("origin");
  const email = formData.get("email") as string;

  const supabase = createClient(cookies());

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?message=Could not send magic link");
  }

  redirect("/login?message=Check your email for the login link");
}

export async function goToSignUp() {
  redirect("/signup");
}
