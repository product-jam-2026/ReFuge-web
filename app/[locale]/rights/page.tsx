import { getMessages } from "@/i18n/request";
import { RightsAccordion, RightItem } from "@/lib/components/RightsAccordion";
import styles from "./page.module.css";

type RightsPageProps = {
  params: { locale: string };
};

export default async function RightsPage({ params }: RightsPageProps) {
  // אם getMessages אצלכם לא async – פשוט הורידי את async וה- await
  const messages = await getMessages(params.locale);
  const items = (messages.rights.items || []) as RightItem[];

  return (
    <main className={styles.container}>
      <h1 className={styles.title}>{messages.rights.pageTitle}</h1>
      <RightsAccordion items={items} />
    </main>
  );
}
