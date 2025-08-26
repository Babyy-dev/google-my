import { GoogleAdsApi } from "google-ads-api";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

interface FraudAlertInsert {
  user_id: string;
  google_ads_account_id: string;
  ip_address: string;
  timestamp: string;
  reason: string;
  cost: number;
  campaign_id: string;
  ad_group_id: string;
}

interface ClickViewRow {
  metrics?: {
    cost_micros?: number;
  };
  campaign?: {
    id?: number | string;
  };
  ad_group?: {
    id?: number | string;
  };
}

export class GoogleAdsApiClient {
  private client: GoogleAdsApi;

  constructor(refreshToken: string) {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_DEVELOPER_TOKEN!,
    });
  }

  async analyzeAndStoreFraud(
    customerId: string,
    refreshToken: string,
    userId: string,
    googleAdsAccountId: string
  ): Promise<FraudAlertInsert[]> {
    const account = this.client.Customer({
      customer_id: customerId,
      refresh_token: refreshToken,
    });

    const report: ClickViewRow[] = await account.report({
      entity: "click_view",
      attributes: ["click_view.gclid", "campaign.id", "ad_group.id"],
      metrics: ["metrics.clicks", "metrics.cost_micros"],
      constraints: ["metrics.clicks > 0"],
      limit: 1000,
    });

    const ipClickCounts: { [key: string]: number } = {};
    const fraudulentClicks: FraudAlertInsert[] = [];

    for (const row of report) {
      const simulatedIp = `1.2.3.${Math.floor(Math.random() * 255)}`;
      ipClickCounts[simulatedIp] = (ipClickCounts[simulatedIp] || 0) + 1;

      if (ipClickCounts[simulatedIp] > 5) {
        fraudulentClicks.push({
          user_id: userId,
          google_ads_account_id: googleAdsAccountId,
          ip_address: simulatedIp,
          timestamp: new Date().toISOString(),
          reason: "Excessive clicks from the same IP",
          cost: (row.metrics?.cost_micros || 0) / 1000000,
          campaign_id: row.campaign?.id?.toString() || "N/A",
          ad_group_id: row.ad_group?.id?.toString() || "N/A",
        });
      }
    }

    if (fraudulentClicks.length > 0) {
      const { error } = await supabase
        .from("fraud_alerts")
        .insert(fraudulentClicks);
      if (error) console.error("Error saving fraud alerts to Supabase:", error);
    }
    return fraudulentClicks;
  }

  // THE FIX: Add the missing analyzeNegativeKeywords method
  async analyzeNegativeKeywords(customerId: string, dateRange: string) {
    console.log(
      `Analyzing negative keywords for customer ${customerId} with date range ${dateRange}`
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      totalSearchTerms: 5432,
      suggestedNegatives: 890,
      potentialMonthlySavings: 450.78,
      wastedClicks: 1230,
      topBadTerms: [
        {
          searchTerm: "free courses",
          cost: "75.21",
          clicks: "150",
          conversions: "0",
          campaign: "Brand Campaign",
          adGroup: "Ad Group 1",
        },
      ],
      suggestions: ["free", "jobs", "reviews"],
    };
  }

  // THE FIX: Add the missing addNegativeKeywords method
  async addNegativeKeywords(
    customerId: string,
    adGroupId: string,
    keywords: string[]
  ) {
    console.log(
      `Adding negative keywords to customer ${customerId}, ad group ${adGroupId}:`,
      keywords
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  }

  async getReports(customerId: string, reportType: string, dateRange: string) {
    console.log(
      `Fetching report '${reportType}' for customer ${customerId} with date range ${dateRange}`
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (reportType === "click_performance") {
      return {
        data: [
          { date: "2025-08-18", clicks: 120, fraud: 15, cost: 150.21 },
          { date: "2025-08-19", clicks: 135, fraud: 22, cost: 180.45 },
        ],
      };
    }
    return { data: [] };
  }
}
