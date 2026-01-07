import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("profiles")                // <- your table
    .select("data")                  // <- jsonb column
    .eq("email", email)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // assumes shape: profiles.data.intake = {...}
  return NextResponse.json({ intake: data?.data?.intake ?? null });
}
