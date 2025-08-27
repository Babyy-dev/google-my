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
    const client = new GoogleAdsApiClient(refreshToken, customerId);
    const analysisResults = await client.analyzeAndStoreFraud(
      user.id,
      accountData.id
    );

    const totalCost = analysisResults.reduce(
      (sum, alert) => sum + alert.cost,
      0
    );
    const highRiskAlerts = analysisResults.length;

    const fullAnalysis = {
      riskLevel: highRiskAlerts > 5 ? "high" : "low",
      totalAlerts: analysisResults.length,
      highRiskAlerts: highRiskAlerts,
      mediumRiskAlerts: 0,
      summary: {
        totalClicks: 0, // This would need another API call to get total clicks
        totalCost: totalCost,
        totalConversions: 0, // This would need another API call
        avgCPC: 0,
        conversionRate: 0,
      },
      alerts:
        analysisResults.length > 0
          ? analysisResults.map((a) => ({
              ip: a.ip_address,
              location: "Unknown",
              type: "Bot Traffic (Simulated)",
              cost: `$${a.cost.toFixed(2)}`,
              clicks: "N/A",
              risk: "High" as "High" | "Medium" | "Low",
              status: "Blocked" as "Blocked" | "Monitoring",
            }))
          : [],
      recommendations: [],
    };

    return NextResponse.json({
      success: true,
      message: "Fraud analysis complete.",
      analysis: fullAnalysis,
    });
  } catch (error: unknown) {
    console.error("Google Ads API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to analyze fraud patterns", details: errorMessage },
      { status: 500 }
    );
  }
}
