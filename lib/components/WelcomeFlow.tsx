"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client"; 
import styles from "./WelcomeFlow.module.css";

type ScreenState = "splash" | "onboarding" | "login";

const WelcomeFlow = ({ locale }: { locale: string }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>("splash");
  const [splashPhase, setSplashPhase] = useState(0);
  const [isExiting, setIsExiting] = useState(false); 
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (currentScreen === "splash") {
      const textTimer = setTimeout(() => { setSplashPhase(1); }, 1500);
      const exitTimer = setTimeout(() => { setIsExiting(true); }, 3500);
      const switchTimer = setTimeout(() => { setCurrentScreen("onboarding"); }, 4000);
      return () => { clearTimeout(textTimer); clearTimeout(exitTimer); clearTimeout(switchTimer); };
    }
  }, [currentScreen]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/${locale}/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) { console.error("Login failed:", error.message); setLoading(false); }
  };

  return (
    <div className={styles.container} dir="rtl">
      
      {/* --- מצב 1: Splash --- */}
      {currentScreen === "splash" && (
        <div className={`${styles.splashScreen} ${isExiting ? styles.fadeOut : ''}`}>
           <Image 
             src="/images/logo-refuge.svg" 
             alt="ReFuge Logo" 
             width={81} 
             height={76} 
             priority
             className={styles.logoImage}
           />
           
           <div className={styles.bottomGroup}>
             <Image 
               src="/images/welcome-hands.png" 
               alt="Welcome Hands"
               width={430}
               height={250}
               className={styles.handsImage}
               priority
             />
             <div className={styles.splashTextContainer}>
               <h1 className={`${styles.splashTitle} ${splashPhase === 0 ? styles.textVisible : styles.textHidden}`}>
                 أهلاً وسهلاً <br /> ברוכים הבאים
               </h1>
               <h1 className={`${styles.splashTitle} ${splashPhase === 1 ? styles.textVisible : styles.textHidden} ${styles.absoluteText}`}>
                 نحن ري-فيوج <br /> אנחנו רה-פיוג׳
               </h1>
             </div>
           </div>
        </div>
      )}

      {/* --- מצב 2: Onboarding --- */}
      {currentScreen === "onboarding" && (
        <div className={`${styles.onboardingScreen} ${styles.fadeIn}`}>
          <Image 
            src="/images/logos-hias-refuge.svg" 
            alt="HIAS & ReFuge"
            width={155}
            height={60}
            className={styles.topLogos}
          />
          <Image 
            src="/images/onboarding-envelope.png" 
            alt="Onboarding"
            width={280}
            height={280}
            className={styles.envelopeImage}
            priority
          />
          <div className={styles.textContainer}>
            {/* הורדתי את ה-balancedText וסומך על ה-CSS החדש */}
            <h2 className={styles.obTitle}>
              التطبيق دا بيرافقك في الاجراءات الورقية لتسهيل العملية عليك
            </h2>
            <h2 className={styles.obTitle}>
              האפליקציה נועדה ללוות אותך בתהליכים בירוקרטיים
            </h2>
            <p className={styles.obBody}>
              بتقدر تحفظ معلوماتك، تعرف على حقوقك، وتعبّي الاستمارات بطريقة سهلة وبسيطة
            </p>
            <p className={styles.obBody}>
              אפשר לשמור מידע אישי, לקרוא על זכויות, ולמלא טפסים בצורה פשוטה
            </p>
          </div>
          <button className={styles.startButton} onClick={() => setCurrentScreen("login")}>
            <span>ابدأ</span>
            <span>התחל</span>
          </button>
        </div>
      )}

      {/* --- מצב 3: Login --- */ }
      {currentScreen === "login" && (
        <div className={`${styles.loginScreen} ${styles.fadeIn}`}>
          <div className={styles.loginCard}>
            <div className={styles.googleHeader} style={{ paddingRight: '16px' }}> {/* הזזתי את ה-padding לפה */}
  
  <Image 
    src="https://authjs.dev/img/providers/google.svg" 
    alt="Google" 
    width={18} 
    height={18} 
    style={{ flexShrink: 0 }} /* מונע כיווץ של האייקון */
  />

  <div className={styles.googleHeaderText} style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'flex-start', 
    gap: '2px', 
    lineHeight: '1.2',
    textAlign: 'right',
    width: '100%'
    /* מחקתי מכאן את ה-paddingRight */
  }}>
    <span>تسجيل الدخول باستخدام جوجل</span>
    <span>התחברות באמצעות גוגל</span>
  </div>

</div>
            <div className={styles.loginContent}>
                <Image src="/images/logo-refuge-orange.svg" alt="ReFuge" width={50} height={50} className={styles.loginLogo} />
                <h2 className={styles.loginTitle}>בחר חשבון</h2>
                <button onClick={handleGoogleLogin} disabled={loading} className={styles.googleBtn}>
                  {loading ? (
                    <span className="w-full text-center">מתחבר...</span>
                  ) : (
                    <>
                      <Image src="https://authjs.dev/img/providers/google.svg" alt="G" width={28} height={28} className={styles.googleIconInBtn} />
                      <div className={styles.userInfo}>
                         <span className={styles.userName}>התחברות עם חשבון Google</span>
                         <span className={styles.userEmail}>לחץ כאן כדי להמשיך</span>
                      </div>
                    </>
                  )}
                </button>
                <div className={styles.termsText}>
                 אם בחרת להשתמש בשירותים שלנו, המשמעות היא שנתת בנו אמון לטפל באופן הולם במידע שמסרת לנו. אנחנו מבינים שמדובר באחריות גדולה ואנחנו עושים מאמצים רבים כדי להגן על המידע שלך ולתת לך שליטה.
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeFlow;