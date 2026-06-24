import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailClient from "@/components/products/ProductDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const supabase = await createClient();

  const [{ data: product }, { data: siteSetting }] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "site_name").single(),
  ]);

  if (!product) return { title: "상품을 찾을 수 없습니다" };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const siteName = siteSetting?.value ?? "쇼핑링크";
  const description =
    product.description ||
    `${product.category?.name ? product.category.name + " " : ""}${product.title} - 국내산 제품 쿠팡 최저가 링크`;
  const productUrl = `${siteUrl}/products/${slug}`;

  return {
    title: product.title,
    description,
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName,
      title: `${product.title} | ${siteName}`,
      description,
      url: productUrl,
      images: product.image_url
        ? [{ url: product.image_url, alt: product.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | ${siteName}`,
      description,
      images: product.image_url ? [product.image_url] : [],
    },
    alternates: {
      canonical: productUrl,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[ProductDetail] Supabase error:", error.message, "slug:", slug);
  }

  if (!product) {
    console.error("[ProductDetail] Product not found. slug:", slug, "rawSlug:", rawSlug);
    notFound();
  }

  let relatedProducts: typeof product[] = [];
  if (product.category_id) {
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("category_id", product.category_id)
      .eq("is_active", true)
      .neq("id", product.id)
      .order("click_count", { ascending: false })
      .limit(6);
    relatedProducts = data ?? [];
  }

  return (
    <ProductDetailClient product={product} relatedProducts={relatedProducts} />
  );
}
