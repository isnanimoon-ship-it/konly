import { createClient } from "@/lib/supabase/server";
import { Category } from "@/lib/types";
import HomeClient from "@/components/products/HomeClient";
import { Suspense } from "react";

const PAGE_SIZE = 24;

async function buildCategoryTree(flat: Category[]): Promise<Category[]> {
  const parents = flat.filter((c) => c.parent_id === null);
  return parents.map((parent) => ({
    ...parent,
    children: flat
      .filter((c) => c.parent_id === parent.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: categoriesRaw }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1),
  ]);

  const categories = await buildCategoryTree(categoriesRaw ?? []);

  return (
    <Suspense>
      <HomeClient
        categories={categories}
        initialProducts={products ?? []}
      />
    </Suspense>
  );
}
