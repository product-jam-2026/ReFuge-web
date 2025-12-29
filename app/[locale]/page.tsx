import { redirect } from 'next/navigation';

export default function RootPage() {
  // ברגע שמישהו נכנס לאתר, הוא מועבר מיד לדף הבית החדש
  redirect('/home');
}