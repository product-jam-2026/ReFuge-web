"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import GoogleLoginButton from "./GoogleLoginButton";
import { sendMagicLink, goToSignUp } from "./actions";

export default function Login({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  const [showEmail, setShowEmail] = useState(false);

  // אם קיבלת message אחרי שליחה, נוח להשאיר את הטופס פתוח
  useEffect(() => {
    if (searchParams?.message) setShowEmail(true);
  }, [searchParams?.message]);

  return (
    <div className="content">
      <div className={styles.loginForm}>
        {/* 3 buttons */}
        <button type="button" onClick={() => setShowEmail((v) => !v)}>
          Log In with Email
        </button>

        <GoogleLoginButton />

        <button type="button" onClick={() => goToSignUp()}>
          Sign Up
        </button>

        {/* Email input מופיע רק אחרי לחיצה על Log In with Email */}
        {showEmail && (
          <form className={styles.emailForm} action={sendMagicLink}>
            <label htmlFor="email">
              Email{" "}
              <input
                name="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>

            <button type="submit">Send magic link</button>
          </form>
        )}

        {searchParams?.message && (
          <p className={styles.errorMessage}>{searchParams.message}</p>
        )}
      </div>
    </div>
  );
}
