import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient(); // <-- Add await
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${request.nextUrl.origin}/dashboard`);
}
