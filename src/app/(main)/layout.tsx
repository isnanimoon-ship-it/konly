import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("key", "site_name")
    .single();

  const siteName = settings?.value ?? "쇼핑링크";

  return (
    <div className="min-h-screen flex flex-col">
      <Header siteName={siteName} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
