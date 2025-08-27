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

  try {
    const body = await request.json();
    const { customerId, accessToken, refreshToken, accountName, currencyCode } =
      body;

    if (!customerId || !accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // --- REAL-TIME VALIDATION STEP ---
    try {
      const client = new GoogleAdsApiClient(refreshToken, customerId);
      await client.validate();
    } catch (validationError) {
      console.error("Google Ads validation failed:", validationError);
      return NextResponse.json(
        { error: "Invalid Google Ads Customer ID or credentials." },
        { status: 400 }
      );
    }
    // --- END VALIDATION STEP ---

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { data, error } = await supabase
      .from("google_ads_accounts")
      .upsert(
        {
          user_id: user.id,
          customer_id: customerId,
          account_name: accountName || `Google Ads Account ${customerId}`,
          currency_code: currencyCode || "USD",
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
      return NextResponse.json(
        {
          error: "Failed to save Google Ads account connection",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Google Ads account connected successfully",
      account: data,
    });
  } catch (error: unknown) {
    console.error("Connect API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to process connection", details: errorMessage },
      { status: 500 }
    );
  }
}
