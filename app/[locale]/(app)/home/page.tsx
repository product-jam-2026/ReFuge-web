import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';

import { createClient } from '../../../../lib/supabase/server';
import styles from './HomePage.module.css';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = t('fallbackName');
  let dbError: string | null = null;
  let gender: string | null = null;

  if (user) {
    const { data: profileRow, error } = await supabase
      .from('profiles')
      .select('data')
      .eq('id', user.id)
      .maybeSingle();

    if (error) dbError = error.message;

    const step1 = (profileRow as any)?.data?.intake?.step1 ?? {};
    const nameFromDb =
      step1?.firstName?.[locale] ||
      step1?.first_name?.[locale] ||
      step1?.firstName ||
      step1?.first_name;

    firstName = nameFromDb || firstName;
    gender = step1?.gender || (profileRow as any)?.data?.gender || null;
  }

  const hour = getHourInTimeZone('Asia/Jerusalem');
  const greeting = t(`greetings.${getGreetingKey(hour)}`);
  const greetingLineRaw = t('greetingLine', { greeting, name: firstName });
  const greetingLine =
    greetingLineRaw.includes('HomePage.greetingLine') ||
    greetingLineRaw.includes('greetingLine')
      ? `${greeting}, ${firstName}`
      : greetingLineRaw;

  // routes
  const hrefProfile = `/${locale}/profile`;
  const hrefForms = `/${locale}/forms`;
  const hrefRights = `/${locale}/rights`;
  const isFemale = gender === 'female';
  const familyIllustration = isFemale
    ? '/illustrations/family%20female.svg'
    : '/illustrations/family%20male.svg';

  return (
<main className={`${styles.root} homeFullBleed`}>
      {/* ✅ תכלת למעלה (full width) */}
      <section className={styles.topCard}>
        <h1 className={styles.title}>
          {greetingLine}
        </h1>
        <p className={styles.subtitle}>{t('subtitle')}</p>
      </section>

      {/* ✅ כל מה שמתחת לתכלת */}
      <div className={styles.content}>
        {/* איור באזור הלבן */}
        <div className={styles.illustrationArea} aria-hidden="true">
          <div className={styles.illustrationWrap}>
            <Image
              src={familyIllustration}
              alt=""
              width={520}
              height={520}
              priority
            />
          </div>
        </div>

        {/* כרטיסים למטה (1 רחב + 2 חצי-חצי) */}
        <section className={styles.cardsGrid}>
          {/* כחול רחב */}
          <Link
            href={hrefForms}
            className={`${styles.card} ${styles.cardBlue} ${styles.cardWide}`}
          >
            <span className={styles.chev} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="26" viewBox="0 0 27 26" fill="none">
                <path d="M16.2012 18.6892L10.2012 12.6892L16.2012 6.68921" stroke="#011429" strokeWidth="1.5" />
              </svg>
            </span>
            <div className={styles.cardText}>
              <div className={styles.cardTitle}>{t('cards.forms.title')}</div>
              <div className={styles.cardDesc}>{t('cards.forms.desc')}</div>
            </div>
          </Link>

          {/* כתום */}
          <Link
            href={hrefProfile}
            className={`${styles.card} ${styles.cardOrange}`}
          >
            <span className={styles.chev} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="26" viewBox="0 0 27 26" fill="none">
                <path d="M16.2012 18.6892L10.2012 12.6892L16.2012 6.68921" stroke="#011429" strokeWidth="1.5" />
              </svg>
            </span>
            <div className={styles.cardText}>
              <div className={styles.cardTitle}>{t('cards.profile.title')}</div>
              <div className={styles.cardDesc}>{t('cards.profile.desc')}</div>
            </div>
          </Link>

          {/* ירוק */}
          <Link href={hrefRights} className={`${styles.card} ${styles.cardGreen}`}>
            <span className={styles.chev} aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="26" viewBox="0 0 27 26" fill="none">
                <path d="M16.2012 18.6892L10.2012 12.6892L16.2012 6.68921" stroke="#011429" strokeWidth="1.5" />
              </svg>
            </span>
            <div className={styles.cardText}>
              <div className={styles.cardTitle}>{t('cards.rights.title')}</div>
              <div className={styles.cardDesc}>{t('cards.rights.desc')}</div>
            </div>
          </Link>
        </section>

        {process.env.NODE_ENV !== 'production' && dbError && (
          <p className={styles.muted}>DB error: {dbError}</p>
        )}
      </div>
    </main>
  );
}
