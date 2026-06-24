import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ManageSidebar from "./ManageSidebar";

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const [{ data: { user } }, { data: role }, { data: settings }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_my_role"),
    supabase.from("site_settings").select("value").eq("key", "site_name").single(),
  ]);

  if (!user) redirect("/auth/login");
  if (role !== "admin") redirect("/");

  const siteName = settings?.value ?? "쇼핑링크";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <ManageSidebar siteName={siteName} />
      <div className="flex-1 min-w-0">
        <main className="p-6 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
