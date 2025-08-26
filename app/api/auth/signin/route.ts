import { createClient } from "@/lib/supabase/server"; // Correct import for server-side routes
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // The redirectTo URL should be absolute for OAuth providers.
  const redirectTo = `${new URL(request.url).origin}/api/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Sign-in error:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }

  // The URL for the user to visit to sign in with Google.
  return NextResponse.json({ url: data.url });
}
