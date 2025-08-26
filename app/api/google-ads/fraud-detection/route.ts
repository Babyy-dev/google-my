import { NextRequest, NextResponse } from "next/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId, refreshToken } = await request.json();

  if (!customerId || !refreshToken) {
    return NextResponse.json(
      { error: "Missing customerId or refreshToken" },
      { status: 400 }
    );
  }

  // Get the linked google_ads_account_id from your database
  const { data: accountData, error: accountError } = await supabase
    .from("google_ads_accounts")
    .select("id")
    .eq("user_id", user.id)
    .eq("customer_id", customerId)
    .single();

  if (accountError || !accountData) {
    return NextResponse.json(
      { error: "Google Ads account not found for this user." },
      { status: 404 }
    );
  }

  try {
    const client = new GoogleAdsApiClient(refreshToken);
    const analysisResults = await client.analyzeAndStoreFraud(
      customerId,
      refreshToken,
      user.id,
      accountData.id
    );

    return NextResponse.json({
      success: true,
      message: "Fraud analysis complete.",
      analysis: {
        totalAlerts: analysisResults.length,
        alerts: analysisResults,
      },
    });
  } catch (error: any) {
    console.error("Google Ads API Error:", error);
    return NextResponse.json(
      { error: "Failed to analyze fraud patterns", details: error.message },
      { status: 500 }
    );
  }
}
