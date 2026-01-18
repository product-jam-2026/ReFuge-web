import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { fileName, bytesBase64 } = await req.json();

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
  );

  const buffer = Buffer.from(bytesBase64, "base64");

  const { data, error } = await supabase.storage
    .from("generated-pdfs")
    .upload(`child-registration/${fileName}`, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ path: data.path });
}
