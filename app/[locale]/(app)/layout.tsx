import BottomNav from "@/lib/components/BottomNav";

interface AppLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function AppLayout({ children, params: { locale } }: AppLayoutProps) {
  const dir = locale === "en" ? "ltr" : "rtl";

  return (
    <>
      <div dir={dir}>
        {children}
      </div>
      <BottomNav />
    </>
  );
}
