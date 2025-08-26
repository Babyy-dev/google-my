import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient(); // <-- Add await
  await supabase.auth.signOut();
  return NextResponse.redirect(`${request.nextUrl.origin}/login`);
}
