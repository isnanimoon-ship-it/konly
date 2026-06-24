import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { product_id } = await request.json();
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.rpc("increment_product_click", { p_product_id: product_id });

    if (user) {
      await supabase.rpc("upsert_recently_viewed", {
        p_user_id: user.id,
        p_product_id: product_id,
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
