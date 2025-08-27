// babyy-dev/google-my/google-my-2a6844f4f7375e420870493040d07233448ab22c/app/api/google-ads/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const {
      customerId,
      loginCustomerId,
      accessToken,
      refreshToken,
      accountName,
      currencyCode,
    } = body;

    if (!customerId || !accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const { data, error } = await supabase
      .from("google_ads_accounts")
      .upsert(
        {
          user_id: user.id,
          customer_id: customerId,
          login_customer_id: loginCustomerId, // Save the manager ID
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
