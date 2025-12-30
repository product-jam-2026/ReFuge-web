"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleLoginButton() {
  const supabase = createClient();

  const signInWithGoogle = async () => {
    const origin = window.location.origin;
    const locale = window.location.pathname.split("/")[1] || "he";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/${locale}/callback`,
      },
    });

    if (error) {
      console.error("Google OAuth error:", error.message);
    }
  };

  return (
    <button type="button" onClick={signInWithGoogle}>
      Log In with Google
    </button>
  );
}
