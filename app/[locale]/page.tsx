import WelcomeFlow from '@/lib/components/WelcomeFlow';

// מקבלים את הפרמטרים מה-URL כדי לדעת איזו שפה להעביר
export default function HomePage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <main>
      <WelcomeFlow locale={locale} />
    </main>
  );
}