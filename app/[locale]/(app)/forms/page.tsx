// export default function FormsPage() {
// return <div className="p-6 text-center text-2xl">🚧 עמוד טפסים - בבנייה 🚧</div>;

import { useTranslations } from "next-intl";
import Link from "next/link";
import LangSwitcher from "@/lib/components/LangSwitcher"; // וודאי שהנתיב נכון

export default function FormsPage() {
  const t = useTranslations("FormsPage");

  return (
    <main className="p-6 pb-24 max-w-md mx-auto min-h-screen bg-white">
      {/* כפתור שפה צף בצד */}
      <div className="flex justify-end mb-4">
        <LangSwitcher />
      </div>

      {/* רשימת הטפסים */}
      <div className="flex flex-col gap-4">
        {/* טופס 1 */}
        <Link
          href="/forms/child-registration-request"
          className="bg-orange-300 p-6 rounded-2xl shadow-sm text-right hover:opacity-90 transition-opacity"
        >
          <h2 className="text-xl font-bold text-orange-900 mb-2">
            {t("forms.childRegistrationRequest.title")}
          </h2>
        </Link>

        {/* טופס 2 */}
        <Link
          href="/forms/child-allowance-request"
          className="bg-orange-300 p-6 rounded-2xl shadow-sm text-right hover:opacity-90 transition-opacity"
        >
          <h2 className="text-xl font-bold text-orange-900 mb-2">
            {t("forms.childAllowanceRequest.title")}
          </h2>
        </Link>

        {/* טופס 3 */}
        <Link
          href="/forms/person-registration-request"
          className="bg-orange-300 p-6 rounded-2xl shadow-sm text-right hover:opacity-90 transition-opacity"
        >
          <h2 className="text-xl font-bold text-orange-900 mb-2">
            {t("forms.personRegistrationRequest.title")}
          </h2>
        </Link>
      </div>
    </main>
  );
}
