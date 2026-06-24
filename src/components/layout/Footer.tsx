import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Footer() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value");

  const getSetting = (key: string) =>
    settings?.find((s) => s.key === key)?.value ?? "";

  const siteName = getSetting("site_name") || "쇼핑링크";
  const copyright = getSetting("copyright") || `© ${new Date().getFullYear()} ${siteName}. All rights reserved.`;
  const footerText = getSetting("footer_text");
  const footerExtra = getSetting("footer_extra");

  return (
    <footer className="bg-gray-50 border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <p className="text-sm font-semibold text-gray-700">{siteName}</p>
            {footerText && (
              <p className="text-xs text-gray-500">{footerText}</p>
            )}
            {footerExtra && (
              <p className="text-xs text-gray-500">{footerExtra}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/notices" className="hover:text-gray-600 transition-colors">
              공지사항
            </Link>
            <span>|</span>
            <p>{copyright}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
