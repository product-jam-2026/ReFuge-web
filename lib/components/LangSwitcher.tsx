'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';

export default function LangSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const currentLabel = locale === 'ar' ? 'العربية' : 'עברית';
  const nextLocale = locale === 'ar' ? 'he' : 'ar';

  const onToggle = () => {
    const nextPath = pathname.replace(/^\/(he|ar)(?=\/|$)/, `/${nextLocale}`);
    router.push(nextPath);
  };

  return (
    <button type="button" className="langFab" onClick={onToggle}>
      {currentLabel}
    </button>
  );
}
