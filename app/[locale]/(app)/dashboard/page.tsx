import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

// ✅ אצלך supabase יושב בשורש הפרויקט (לא בתוך lib)
// אם אצלך זה באמת בתוך lib — תשני בהתאם, אבל לפי המבנה ששלחת זה בשורש.
import { createClient } from '../../../../lib/supabase/server';

function getGreetingKey(hour: number) {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'noon';
  if (hour >= 17 && hour <= 23) return 'evening';
  return 'night';
}

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard');

  const supabase = createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // מצב פיתוח: גם בלי התחברות
  let firstName = t('fallbackName');

  let dbError: string | null = null;

  if (user) {
    const { data: profileRow, error } = await supabase
      .from('profiles')
      .select('data')
      .eq('id', user.id)
      .maybeSingle();

    if (error) dbError = error.message;

    firstName =
      (profileRow as any)?.data?.intake?.step1?.firstName ||
      (profileRow as any)?.data?.intake?.step1?.first_name ||
      firstName;
  }

  const hour = new Date().getHours();
  const greetingKey = getGreetingKey(hour);
  const greeting = t(`greetings.${greetingKey}`);

  return (
    <div className="appShell">
      <div className="appFrame">
        <main className="page">
          <section className="dashboardHero">
            <div>
              <h1 className="dashboardTitle">
                {t('greetingLine', { greeting, name: firstName })}
              </h1>
              <p className="dashboardSubtitle">{t('subtitle')}</p>
            </div>

            <div className="dashboardIllustration" aria-hidden="true">
              <Image
                src="/illustrations/family.svg"
                alt=""
                width={220}
                height={220}
                priority
              />
            </div>
          </section>

          <section className="cardsGrid">
            {/* קישורים יחסיים כדי לשמור על /he או /ar */}
            <Link href="profile" className="cardBtn cardBlueLight">
              <div className="cardBtnTitle">{t('cards.profile.title')}</div>
              <div className="cardBtnDesc">{t('cards.profile.desc')}</div>
            </Link>

            <Link href="forms" className="cardBtn cardOrange">
              <div className="cardBtnTitle">{t('cards.forms.title')}</div>
              <div className="cardBtnDesc">{t('cards.forms.desc')}</div>
            </Link>

            <Link href="rights" className="cardBtn cardBlue">
              <div className="cardBtnTitle">{t('cards.rights.title')}</div>
              <div className="cardBtnDesc">{t('cards.rights.desc')}</div>
            </Link>

            <button type="button" className="cardBtn cardGreen cardDisabled" disabled>
              <div className="cardBtnTitle">{t('cards.myForms.title')}</div>
              <div className="cardBtnDesc">{t('cards.myForms.desc')}</div>
            </button>
          </section>

          {process.env.NODE_ENV !== 'production' && dbError && (
            <p className="muted" style={{ marginTop: 18 }}>
              DB error: {dbError}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
