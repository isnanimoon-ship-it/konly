import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams
    .get("ids")
    ?.split(",")
    .map(Number)
    .filter(Boolean);

  if (!ids || ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .in("id", ids)
    .eq("is_active", true);

  // localStorage 순서대로 정렬
  const products = ids
    .map((id) => (data ?? []).find((p) => p.id === id))
    .filter(Boolean);

  return NextResponse.json({ products });
}
