import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ user: null, role: null });

  const { data: role } = await supabase.rpc("get_my_role");

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    role: role ?? null,
  });
}
