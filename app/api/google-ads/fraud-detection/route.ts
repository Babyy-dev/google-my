// app/api/google-ads/fraud-detection/route.ts
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

  try {
    const { customerId, refreshToken, loginCustomerId } = await request.json();

    if (!customerId || !refreshToken) {
      return NextResponse.json(
        { error: "Missing customerId or refreshToken" },
        { status: 400 }
      );
    }

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

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("click_fraud_threshold, click_fraud_window_hours") // Fetch the new column
      .eq("id", user.id)
      .single();

    const clickThreshold = profile?.click_fraud_threshold || 3;
    const windowHours = profile?.click_fraud_window_hours || 24; // Get the new value

    const client = new GoogleAdsApiClient(
      refreshToken,
      customerId,
      loginCustomerId
    );

    const analysisResults = await client.analyzeAndStoreFraud(
      supabase,
      user.id,
      accountData.id,
      clickThreshold,
      windowHours // Pass the new value here
    );

    if (analysisResults.length > 0) {
      const ipsToBlock = new Map<string, string[]>();
      for (const alert of analysisResults) {
        if (alert.campaign_id && alert.ip_address !== "Unknown") {
          if (!ipsToBlock.has(alert.campaign_id)) {
            ipsToBlock.set(alert.campaign_id, []);
          }
          ipsToBlock.get(alert.campaign_id)!.push(alert.ip_address);
        }
      }

      for (const [campaignId, ips] of ipsToBlock.entries()) {
        await client.blockIpsFromCampaign(campaignId, [...new Set(ips)]);
      }
    }

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

    return NextResponse.json({
      success: true,
      message: "Fraud analysis complete.",
      analysis: fullAnalysis,
    });
  } catch (error: any) {
    console.error("Fraud Detection API Error:", JSON.stringify(error, null, 2));

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
