import BottomNav from "@/lib/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* הורדנו את ה-Navbar העליון כי בתמונה יש רק כפתור שפה */}
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
      <BottomNav />
    </>
  );
}