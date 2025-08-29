// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";
import { subDays } from "date-fns";

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
    const { customerId, refreshToken, loginCustomerId } = body;

    const sevenDaysAgo = subDays(new Date(), 7).toISOString();
    const { data: alerts, error: alertsError } = await supabase
      .from("fraud_alerts")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo);

    if (alertsError) throw alertsError;

    const savedBudget = alerts.reduce(
      (sum, alert) => sum + (alert.cost || 0),
      0
    );
    const blockedIPs = new Set(alerts.map((alert) => alert.ip_address)).size;
    const recentAlerts = alerts
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10)
      .map((a) => ({
        ip: a.ip_address,
        location: "Unknown",
        type: a.reason,
        cost: `$${(a.cost || 0).toFixed(2)}`,
        clicks: "N/A",
        risk: "High" as "High" | "Medium" | "Low",
        status: "Blocked" as "Blocked" | "Monitoring",
      }));

    // If no Google Ads credentials are provided, return summary data only
    if (!customerId || !refreshToken) {
      return NextResponse.json({
        stats: {
          savedBudget: `$${savedBudget.toFixed(2)}`,
          blockedIPs: blockedIPs.toString(),
          keywordsBlocked: "0",
          detectionRate: "N/A",
        },
        charts: {
          fraudVsValid: [],
          budgetSavings: [],
        },
        recentAlerts,
      });
    }

    // If credentials ARE provided, fetch live data from Google Ads
    const client = new GoogleAdsApiClient(
      refreshToken,
      customerId,
      loginCustomerId
    );

    const reportData = await client.getReports(
      "click_performance",
      "LAST_7_DAYS"
    );

    const dailyData: { [key: string]: { valid: number; fraud: number } } = {};
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i);
      const formattedDate = date.toISOString().split("T")[0];
      dailyData[formattedDate] = { valid: 0, fraud: 0 };
    }

    let totalValidClicks = 0;
    if (reportData) {
      reportData.forEach((row: any) => {
        const date = row.segments?.date;
        if (date && dailyData[date]) {
          const clicks = Number(row.metrics?.clicks) || 0;
          dailyData[date].valid += clicks;
          totalValidClicks += clicks;
        }
      });
    }

    alerts.forEach((alert) => {
      const date = new Date(alert.created_at).toISOString().split("T")[0];
      if (dailyData[date]) {
        dailyData[date].fraud += 1;
      }
    });

    const fraudVsValid = Object.entries(dailyData)
      .map(([date, counts]) => ({
        label: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        "Valid Clicks": counts.valid,
        "Fraud Blocked": counts.fraud,
      }))
      .reverse();

    const totalFraudClicks = alerts.length;
    const totalClicks = totalValidClicks + totalFraudClicks;
    const detectionRate =
      totalClicks > 0 ? (totalFraudClicks / totalClicks) * 100 : 0;

    const dashboardData = {
      stats: {
        savedBudget: `$${savedBudget.toFixed(2)}`,
        blockedIPs: blockedIPs.toString(),
        keywordsBlocked: "0",
        detectionRate: `${detectionRate.toFixed(1)}%`,
      },
      charts: {
        fraudVsValid,
        budgetSavings: [],
      },
      recentAlerts,
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error("Dashboard Stats API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats", details: errorMessage },
      { status: 500 }
    );
  }
}
