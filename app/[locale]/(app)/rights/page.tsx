'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import styles from './RightsPage.module.css';
import { useTextToSpeech } from '@/lib/hooks/useTextToSpeech';

type CategoryKey = 'status' | 'work' | 'health' | 'education' | 'help';

type FaqItem = {
  id: string;
  category: CategoryKey;
  question: { he: string; ar: string };
  answer: { he: string; ar: string };
  phone?: string;
  whatsapp?: string; // digits only, e.g. 972546270898
};

const CATEGORY_LABELS: Record<CategoryKey, { he: string; ar: string }> = {
  status: { he: 'מעמד', ar: 'وضع' },
  work: { he: 'עבודה', ar: 'عمل' },
  health: { he: 'בריאות', ar: 'صحة' },
  education: { he: 'חינוך', ar: 'تعليم' },
  help: { he: 'סיוע', ar: 'مساعدة' },
};

const FAQS: FaqItem[] = [
  {
    id: 'status-visa',
    category: 'status',
    question: { he: 'איזה סוג אשרה יש לי ומה היא מקנה?', ar: 'ما نوع التأشيرة التي أحملها؟' },
    answer: {
      he: 'רוב הסודנים מחזיקים באשרת "2(א)5". היא מגנה מגירוש אך אינה מקנה זכויות סוציאליות.',
      ar: 'معظم السودانيين يحملون تأشيرة "2(أ)5" التي تحمي من الترحيل مؤقتاً.',
    },
  },
  {
    id: 'status-a5',
    category: 'status',
    question: { he: 'שמעתי שסודנים יכולים לקבל תעודת זהות (א/5). האם אני זכאי?', ar: 'هل يحق لي الحصول على هوية أ/5؟' },
    answer: {
      he: 'המעמד ניתן לכ-4,000 איש (בעיקר מדרפור והנילוס הכחול). בדקו פרטנית מול HIAS ישראל בטלפון: 03-6911322.',
      ar: 'مُنحت لآلاف الأشخاص (خاصة من دارفور). افحص استحقاقك مع منظمة هياس (HIAS) على الرقم: 03-6911322.',
    },
    phone: '03-6911322',
  },
  {
    id: 'status-child',
    category: 'status',
    question: { he: 'הילד שלי נולד בישראל. האם הוא מקבל אזרחות?', ar: 'طفلي ولد في إسرائيل، هل يحصل على الجنسية؟' },
    answer: { he: 'לא באופן אוטומטי. הוא מקבל את מעמד הוריו.', ar: 'لا، يحصل عادة على وضع والديه (2(أ)5).' },
  },
  {
    id: 'status-resettle',
    category: 'status',
    question: { he: 'אני רוצה לעזוב לקנדה או לארה"ב. האם זה אפשרי?', ar: 'أريد الهجرة إلى كندا أو أمريكا؟' },
    answer: { he: 'ישנם מסלולי יישוב מחדש מוגבלים. ניתן להתייעץ עם HIAS.', ar: 'توجد مسارات محدودة. يمكن استشارة HIAS بخصوص ذلك.' },
    phone: '03-6911322',
  },

  {
    id: 'work-legal',
    category: 'work',
    question: { he: 'האם מותר לי לעבוד באופן חוקי עם אשרת 2(א)5?', ar: 'هل يسمح لي بالعمل قانونياً؟' },
    answer: { he: 'כן, המדינה אינה קונסת מעסיקים של פליטים.', ar: 'نعم، يُسمح بتوظيف طالبي اللجوء من السودان وإريتريا.' },
  },
  {
    id: 'work-unpaid',
    category: 'work',
    question: { he: 'המעסיק לא שילם לי משכורת. מה אני יכול לעשות?', ar: 'صاحب العمل لم يدفع لي، ماذا أفعل؟' },
    answer: { he: 'פנו לקו לעובד לסיוע חינם בוואטסאפ.', ar: 'تواصل مع عنوان للعامل (Kav LaOved) عبر الواتساب.' },
    whatsapp: '972525349870',
  },
  {
    id: 'work-btl',
    category: 'work',
    question: { he: 'האם אני זכאי לקצבת ילדים או ביטוח לאומי?', ar: 'هل أستحق مخصصات التأمين الوطني؟' },
    answer: { he: 'בדרך כלל לא, למעט תאונות עבודה או לידה.', ar: 'لا، إلا في حالات حوادث العمل أو الولادة.' },
  },
  {
    id: 'work-deposit',
    category: 'work',
    question: { he: 'מה קרה עם "חוק הפיקדון" (20%)?', ar: 'ماذا حدث بخصوص "قانون الإيداع" (20%)؟' },
    answer: { he: 'החוק בוטל והכספים אמורים להיות מוחזרים אליכם.', ar: 'تم إلغاء القانون ويجب استعادة الأموال المخصومة.' },
  },

  {
    id: 'health-care',
    category: 'health',
    question: { he: 'איך אני יכול לקבל טיפול רפואי אם אני חולה?', ar: 'كيف أحصل على علاج طبي؟' },
    answer: {
      he: 'ניתן לפנות לרופאים לזכויות אדם: 03-5133120 או למרפאת טרם: 073-2255390.',
      ar: 'يمكن التوجه لـ أطباء لحقوق الإنسان: 03-5133120 أو عيادة تيريم للاجئين: 073-2255390.',
    },
    phone: '03-5133120',
  },
  {
    id: 'health-license',
    category: 'health',
    question: { he: 'האם אני יכול להוציא רישיון נהיגה?', ar: 'هل يمكنني استخراج رخصة قيادة؟' },
    answer: { he: 'לרוב רק בעלי מעמד א/5 יכולים.', ar: 'عادة فقط لحاملي إقامة أ/5.' },
  },
  {
    id: 'health-war',
    category: 'health',
    question: { he: 'נפגעתי או פוניתי במלחמה ("חרבות ברזל"). האם מגיע לי פיצוי?', ar: 'تضررتُ بسبب الحرب، هل أستحق تعويضاً؟' },
    answer: {
      he: 'ישנו פיצוי חלקי. למידע פנו למוקד לפליטים ולמהגרים בוואטסאפ.',
      ar: 'يوجد تعويض جزئي. تواصل مع مركز الاستشارة للاجئين والمهاجرين عبر الواتساب.',
    },
    whatsapp: '972546270898',
  },

  {
    id: 'edu-school',
    category: 'education',
    question: { he: 'איך אני רושם את הילדים שלי לבית הספר?', ar: 'كيف أسجل أطفالي في المدرسة؟' },
    answer: {
      he: 'הרישום חינם בבית העירייה. לסיוע פנו לא.ס.ף: 053-7275801.',
      ar: 'التسجيل مجاني في البلدية. للمساعدة تواصل مع منظمة آساف (ASSAF): 053-7275801.',
    },
    phone: '053-7275801',
  },
  {
    id: 'edu-bank',
    category: 'education',
    question: { he: 'למה אני לא מצליח לפתוח חשבון בנק?', ar: 'لماذا لا أستطيع فتح حساب بنكي؟' },
    answer: {
      he: 'בנקים מערימים קשיים למי שאין לו ת"ז. מומלץ להיעזר בארגוני הסיוע לגישור.',
      ar: 'البنوك تضع عوائق لمن لا يملك هوية إسرائيلية. استعن بالمنظمات للمساعدة.',
    },
  },

  {
    id: 'help-violence',
    category: 'help',
    question: { he: 'אני אישה החווה אלימות במשפחה. למי אני יכולה לפנות?', ar: 'أنا امرأة أعاني من العنف المنزلي، لمن أتوجه؟' },
    answer: { he: 'פנו למסיל"ה: 03-5264020 או למוקד הרווחה: 118.', ar: 'تواصل مع مركز מסيل"ה: 03-5264020 أو خط الطوارئ: 118.' },
    phone: '118',
  },
  {
    id: 'help-forms',
    category: 'help',
    question: { he: 'מי יכול לעזור לי במילוי טפסים מול משרד הפנים?', ar: 'من يساعدني في ملء النماذج أمام وزارة الداخلية؟' },
    answer: { he: 'HIAS ישראל או המוקד לפליטים בטלפון: 03-5602527.', ar: 'منظمة هياس أو مركز الاستشارة للاجئين: 03-5602527.' },
    phone: '03-5602527',
  },
];

function FilterIcon() {
  return (
    <img src="/illustrations/Filter.svg" alt="" width="16" height="16" />
  );
}

function BackChevron() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="22" viewBox="0 0 11 22" fill="none" aria-hidden="true">
      <g clipPath="url(#clip0_1820_2548)">
        <path d="M3.19922 4.25879L9.19922 10.2588L3.19922 16.2588" stroke="#011429" strokeWidth="1.5" />
      </g>
      <defs>
        <clipPath id="clip0_1820_2548">
          <rect width="22" height="11" fill="white" transform="translate(0 22) rotate(-90)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function DownChevron({ open }: { open: boolean }) {
  return (
    <span className={`${styles.downCircle} ${open ? styles.downOpen : ''}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function RightsPage() {
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const lang: 'he' | 'ar' = isArabic ? 'ar' : 'he';

  const { speak, stop } = useTextToSpeech();

  const [filterOpen, setFilterOpen] = useState(false);

  // ✅ multi-select
  const [selected, setSelected] = useState<CategoryKey[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const visibleFaqs = useMemo(() => {
    if (selected.length === 0) return FAQS; // אם לא נבחר כלום => מציג הכל
    return FAQS.filter((f) => selected.includes(f.category));
  }, [selected]);

  const title = lang === 'he' ? 'מידע בנושא זכויות' : 'معلومات حول الحقوق';

  const toggleItem = (id: string) => {
    stop();
    setOpenId((prev) => (prev === id ? null : id));
  };

  const toggleCategory = (key: CategoryKey) => {
    stop();
    setOpenId(null);
    setSelected((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return [...prev, key];
    });
  };

  const whatsappHref = (digits: string) => `https://wa.me/${digits}`;
  const telHref = (tel: string) => `tel:${tel.replace(/[^0-9+]/g, '')}`;

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>

        <Link href={`/${locale}/home`} className={styles.backBtn} aria-label={lang === 'he' ? 'חזרה' : 'رجوع'}>
          <BackChevron />
        </Link>
      </header>

      {/* ✅ filter + tags as one aligned grid */}
      <div className={`${styles.topControls} ${filterOpen ? styles.filtersOpen : styles.filtersClosed}`}>
        <button
          type="button"
          className={styles.filterPill}
          onClick={() => setFilterOpen((v) => !v)}
          aria-expanded={filterOpen}
        >
          <FilterIcon />
          <span>{lang === 'he' ? 'סינון' : 'تصفية'}</span>
        </button>

        {(['work', 'education', 'help', 'health', 'status'] as CategoryKey[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`${styles.tag} ${styles[`tag${k[0].toUpperCase()}${k.slice(1)}`]} ${
              selected.includes(k) ? styles.tagSelected : ''
            }`}
            onClick={() => toggleCategory(k)}
          >
            {CATEGORY_LABELS[k][lang]}
          </button>
        ))}
      </div>

      <section className={styles.list}>
        {visibleFaqs.map((item) => {
          const open = openId === item.id;
          const q = item.question[lang];
          const a = item.answer[lang];

          return (
            <article key={item.id} className={styles.item}>
              <button
                type="button"
                className={styles.itemHead}
                onClick={() => toggleItem(item.id)}
                aria-expanded={open}
              >
                <span className={styles.qText}>{q}</span>
                <DownChevron open={open} />
              </button>

              {open && (
                <div className={styles.itemBody}>
                  <p className={styles.answer}>{a}</p>

                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.speakBtn}
                      onClick={() => speak(`${q} ${a}`, locale)}
                      aria-label={lang === 'he' ? 'הקראה' : 'استماع'}
                      title={lang === 'he' ? 'הקראה' : 'استماع'}
                    >
                      <img src="/illustrations/speaker.svg" alt="" width="20" height="20" />
                    </button>

                    <div className={styles.links}>
                      {item.phone && (
                        <a className={styles.link} href={telHref(item.phone)}>
                          {lang === 'he' ? 'שיחה' : 'اتصال'}: {item.phone}
                        </a>
                      )}
                      {item.whatsapp && (
                        <a className={styles.link} href={whatsappHref(item.whatsapp)} target="_blank" rel="noreferrer">
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
