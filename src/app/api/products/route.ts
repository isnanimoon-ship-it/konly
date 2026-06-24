import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 24;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const parentId = sp.get("parentId") ? Number(sp.get("parentId")) : null;
  const childId = sp.get("childId") ? Number(sp.get("childId")) : null;
  const q = sp.get("q") ?? "";
  const page = Number(sp.get("page") ?? "0");

  const supabase = await createClient();

  let categoryIds: number[] = [];
  if (childId) {
    categoryIds = [childId];
  } else if (parentId) {
    const { data: children } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", parentId);
    if (children && children.length > 0) {
      categoryIds = children.map((c) => c.id);
    } else {
      categoryIds = [parentId];
    }
  }

  let queryBuilder = supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (categoryIds.length > 0) {
    queryBuilder = queryBuilder.in("category_id", categoryIds);
  }

  if (q) {
    queryBuilder = queryBuilder.ilike("title", `%${q}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [] });
}
