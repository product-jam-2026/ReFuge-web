interface AppLayoutProps {
  children: React.ReactNode;
  params: { locale: string };
}

export default function AppLayout({ children, params: { locale } }: AppLayoutProps) {
  const dir = "rtl";

  return (
    <div dir={dir}>
      {children}
    </div>
  );
}
