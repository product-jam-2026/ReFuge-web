import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { createClient } from '../../../../lib/supabase/server';

// שעה לפי אזור זמן ישראל (כדי שברכה תתאים גם אם השרת לא באותה שעה)
function getHourInTimeZone(timeZone = 'Asia/Jerusalem') {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    timeZone,
  }).formatToParts(new Date());

  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '12';
  return Number(hourStr);
}

function getGreetingKey(hour: number) {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'noon';
  if (hour >= 17 && hour <= 23) return 'evening';
  return 'night';
}

export default async function HomePage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const t = await getTranslations('HomePage');

  const supabase = createClient(cookies());

  // מצב פיתוח: גם בלי התחברות
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const hour = getHourInTimeZone('Asia/Jerusalem');
  const greeting = t(`greetings.${getGreetingKey(hour)}`);

  // לינקים עם locale
  const hrefProfile = `/${locale}/profile`;
  const hrefForms = `/${locale}/forms`;
  const hrefRights = `/${locale}/rights`;

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
                width={240}
                height={240}
                priority
              />
            </div>
          </section>

          <section className="cardsGrid">
            {/* אזור אישי - רחב (כמו הכרטיסים שמתחת) */}
            <Link href={hrefProfile} className="cardBtn cardOrange cardWide">
              <div className="cardBtnTitle">{t('cards.profile.title')}</div>
              <div className="cardBtnDesc">{t('cards.profile.desc')}</div>
            </Link>

            {/* טפסים למילוי - רחב */}
            <Link href={hrefForms} className="cardBtn cardBlue cardWide">
              <div className="cardBtnTitle">{t('cards.forms.title')}</div>
              <div className="cardBtnDesc">{t('cards.forms.desc')}</div>
            </Link>

            {/* זכויות - רחב */}
            <Link href={hrefRights} className="cardBtn cardGreen cardWide">
              <div className="cardBtnTitle">{t('cards.rights.title')}</div>
              <div className="cardBtnDesc">{t('cards.rights.desc')}</div>
            </Link>
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
