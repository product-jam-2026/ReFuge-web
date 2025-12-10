'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export default function LangSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const localActive = useLocale();

  const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    startTransition(() => {
      // החלפת הכתובת הנוכחית לכתובת עם השפה החדשה
      // למשל: /he/login -> /en/login
      router.replace(`/${nextLocale}`);
    });
  };

  return (
    <label className='border-2 rounded'>
      <p className='sr-only'>Change language</p>
      <select
        defaultValue={localActive}
        className='bg-transparent py-2'
        onChange={onSelectChange}
        disabled={isPending}
      >
        <option value='he'>עברית</option>
        <option value='ar'>العربية</option>
        <option value='en'>English</option>
      </select>
    </label>
  );
}