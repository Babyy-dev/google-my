// app/api/auth/signin/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${request.headers.get("origin")}/api/auth/callback`,
      scopes: "https://www.googleapis.com/auth/adwords",
      // FIX: These two options are critical to fix the refresh token error.
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Error during sign-in:", error);
    return NextResponse.json(
      { error: "Could not sign in with Google" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data.url });
}
