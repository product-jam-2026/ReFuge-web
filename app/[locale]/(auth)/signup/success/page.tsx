// app/[locale]/(auth)/signup/success/page.tsx

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import styles from "@/lib/styles/IntakeForm.module.css"; // שימוש באותם סגנונות

const SUCCESS_IMAGE = "/images/intake-success.svg"; // הניחי את התמונה שלך כאן

export default async function IntakeSuccessPage({
  params,
}: {
  params: { locale: string };
}) {
  const supabase = createClient(cookies());
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/${params.locale}/login`);

  // שליפת השם הפרטי כדי להציג "שלום מוחמד"
  const { data: profile } = await supabase
    .from("profiles")
    .select("data")
    .eq("id", data.user.id)
    .single();

  // נסיון לשלוף שם בעברית או ערבית, או שם משתמש כללי
  const step1 = profile?.data?.intake?.step1 || {};
  const firstNameObj = step1.firstName || {};
  // כאן נציג את השם לפי השפה הנוכחית או ברירת מחדל
  const displayName = params.locale === 'he' ? (firstNameObj.he || firstNameObj.ar) : (firstNameObj.ar || firstNameObj.he);

  return (
    <div className={styles.pageContainer} style={{ background: '#fff' }}>
      <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%', 
          padding: '24px',
          textAlign: 'center'
      }}>
        
        {/* תמונה */}
        <div style={{ marginBottom: '40px' }}>
            {/* אנא וודאי שיש לך את התמונה בתיקיית public/images */}
            <Image 
                src={SUCCESS_IMAGE} 
                alt="Success" 
                width={280} 
                height={280} 
                style={{ objectFit: 'contain' }}
            />
        </div>

        {/* טקסטים */}
        <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#011429', 
            marginBottom: '16px' 
        }}>
          {params.locale === 'he' ? `שלום ${displayName || ''}` : `مرحبا ${displayName || ''}`}
        </h1>

        <p style={{ 
            fontSize: '16px', 
            color: '#6B7280', 
            lineHeight: '1.5',
            maxWidth: '300px',
            marginBottom: '60px'
        }}>
          {params.locale === 'he' 
            ? "כל הפרטים נשמרו בהצלחה ויופיעו באזור האישי. עכשיו אפשר להתחיל למלא טפסים באפליקציה"
            : "تم حفظ جميع التفاصيل بنجاح وستظهر في المنطقة الشخصية. الآن يمكنك البدء في ملء النماذج في التطبيق"}
        </p>

        {/* כפתור כניסה לאפליקציה */}
        <Link href={`/${params.locale}/home`} className={styles.btnDark} style={{ width: '100%', textDecoration: 'none' }}>
           {params.locale === 'he' ? "בוא נתחיל" : "يلا نبدأ"}
        </Link>

      </div>
    </div>
  );
}