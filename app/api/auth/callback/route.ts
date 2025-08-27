// babyy-dev/google-my/google-my-2a6844f4f7375e420870493040d07233448ab22c/app/api/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect to the dashboard after session is handled.
  return NextResponse.redirect(`${origin}/dashboard`);
}
