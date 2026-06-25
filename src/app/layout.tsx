import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import VisitorTracker from "@/components/VisitorTracker";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site_name")
    .single();
  const siteName = data?.value ?? "쇼핑링크";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.konly.co.kr";
  const description = "국내 생산 상품만 직접 검수해 모았습니다. 중국산 걱정 없이 Made in Korea 상품을 카테고리별로 찾아보세요.";

  return {
    metadataBase: new URL(siteUrl),
    title: { template: `%s | ${siteName}`, default: siteName },
    description,
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName,
      title: siteName,
      description,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
    },
    other: {
      "naver-site-verification": "fb80f879f4a844dffe23ce60d6b08c621939b7a7",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ToastProvider>
          <VisitorTracker />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
