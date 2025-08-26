import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, customerId } = await request.json();

  if (!code || !customerId) {
    return NextResponse.json(
      { error: "Missing authorization code or customer ID" },
      { status: 400 }
    );
  }

  try {
    // This is a conceptual step. In a real app, you would exchange the code
    // for tokens using a library like google-auth-library.
    // For this fix, we'll assume the session's provider_token is the access token
    // and provider_refresh_token is the one we need to store.
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.provider_token || !session?.provider_refresh_token) {
      throw new Error("Could not retrieve tokens from session.");
    }

    const accessToken = session.provider_token;
    const refreshToken = session.provider_refresh_token;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { data, error } = await supabase
      .from("google_ads_accounts")
      .upsert(
        {
          user_id: user.id,
          customer_id: customerId.replace(/-/g, ""),
          account_name: `Google Ads ${customerId}`,
          currency_code: "USD",
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expiresAt.toISOString(),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,customer_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw new Error("Failed to save Google Ads account connection.");
    }

    return NextResponse.json({
      success: true,
      message: "Google Ads account connected successfully",
      account: data,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Token handling error:", errorMessage);
    return NextResponse.json(
      { error: "Failed to process token", details: errorMessage },
      { status: 500 }
    );
  }
}
