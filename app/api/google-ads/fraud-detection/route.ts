// app/api/google-ads/fraud-detection/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  console.log("--- Fraud Detection API started ---");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("API Error: Unauthorized access attempt.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { customerId, refreshToken, loginCustomerId } = await request.json();
    console.log(
      `Received customerId: ${customerId}, loginCustomerId: ${loginCustomerId}`
    );

    if (!customerId || !refreshToken) {
      console.error("API Error: Missing customerId or refreshToken.");
      return NextResponse.json(
        { error: "Missing customerId or refreshToken" },
        { status: 400 }
      );
    }

    console.log("Step 1: Fetching account data from Supabase...");
    const { data: accountData, error: accountError } = await supabase
      .from("google_ads_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("customer_id", customerId)
      .single();

    if (accountError || !accountData) {
      console.error(
        "API Error: Google Ads account not found in database.",
        accountError
      );
      return NextResponse.json(
        { error: "Google Ads account not found for this user." },
        { status: 404 }
      );
    }
    console.log("Step 1: Success. Found account ID:", accountData.id);

    console.log("Step 2: Fetching user profile from Supabase...");
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("click_fraud_threshold")
      .eq("id", user.id)
      .single();

    const clickThreshold = profile?.click_fraud_threshold || 3;
    console.log(`Step 2: Success. Using click threshold: ${clickThreshold}`);

    const client = new GoogleAdsApiClient(
      refreshToken,
      customerId,
      loginCustomerId
    );

    console.log("Step 3: Analyzing and storing fraud data...");
    const analysisResults = await client.analyzeAndStoreFraud(
      supabase,
      user.id,
      accountData.id,
      clickThreshold
    );
    console.log(
      `Step 3: Success. Found ${analysisResults.length} fraudulent clicks.`
    );

    const totalCost = analysisResults.reduce(
      (sum, alert) => sum + (alert.cost || 0),
      0
    );
    const highRiskAlerts = analysisResults.length;

    const fullAnalysis = {
      riskLevel: highRiskAlerts > 5 ? "high" : "low",
      totalAlerts: analysisResults.length,
      highRiskAlerts,
      mediumRiskAlerts: 0,
      summary: {
        totalClicks: 0,
        totalCost,
        totalConversions: 0,
        avgCPC: 0,
        conversionRate: 0,
      },
      alerts: analysisResults.map((a) => ({
        ip: a.ip_address,
        location: "Unknown",
        type: a.reason,
        cost: `$${(a.cost || 0).toFixed(2)}`,
        clicks: "N/A",
        risk: "High" as const,
        status: "Blocked" as const,
      })),
      recommendations: [],
    };

    console.log("--- Fraud Detection API finished successfully ---");
    return NextResponse.json({
      success: true,
      message: "Fraud analysis complete.",
      analysis: fullAnalysis,
    });
  } catch (error: any) {
    console.error(
      "---!!!!!!!!!!!!!!!!! FRAUD DETECTION API CRASHED !!!!!!!!!!!!!!!!!! ---"
    );
    // FIX: Log the raw error object directly for better inspection
    console.error("Raw Error Object:", error);

    const errorMessage =
      error.errors?.[0]?.message ||
      error.message ||
      "An unknown server error occurred.";

    return NextResponse.json(
      {
        error: "Failed to analyze fraud patterns.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
