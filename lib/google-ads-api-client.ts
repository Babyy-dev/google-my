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

// This interface is just for our mock data structure
interface MockClickViewRow {
  metrics: {
    cost_micros: number;
  };
  campaign: {
    id: string;
  };
  ad_group: {
    id: string;
  };
}

export class GoogleAdsApiClient {
  private client: GoogleAdsApi;

  constructor(refreshToken: string) {
    // We still initialize the client, but we won't use it in the mocked function
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
    console.log("--- USING MOCK GOOGLE ADS API DATA ---");

    // Bypassing the actual API call to avoid the 500 error.
    // This simulates a successful report from the Google Ads API.
    const mockReport: MockClickViewRow[] = [
      {
        campaign: { id: "12345" },
        ad_group: { id: "67890" },
        metrics: { cost_micros: 500000 },
      },
      {
        campaign: { id: "12345" },
        ad_group: { id: "67890" },
        metrics: { cost_micros: 750000 },
      },
      {
        campaign: { id: "54321" },
        ad_group: { id: "98765" },
        metrics: { cost_micros: 300000 },
      },
    ];

    // The rest of your logic can now run on this mock data.
    // NOTE: The IP addresses here are simulated because the real API doesn't provide them.
    const ipClickCounts: { [key: string]: number } = {};
    const fraudulentClicks: FraudAlertInsert[] = [];
    const simulatedIps = ["203.0.113.10", "203.0.113.10", "198.51.100.55"]; // Simulate repeat clicks from one IP

    for (let i = 0; i < mockReport.length; i++) {
      const row = mockReport[i];
      const simulatedIp = simulatedIps[i];
      ipClickCounts[simulatedIp] = (ipClickCounts[simulatedIp] || 0) + 1;

      // Simulate fraud if an IP clicks more than once
      if (ipClickCounts[simulatedIp] > 1) {
        fraudulentClicks.push({
          user_id: userId,
          google_ads_account_id: googleAdsAccountId,
          ip_address: simulatedIp,
          timestamp: new Date().toISOString(),
          reason: "Excessive clicks from the same IP",
          cost: (row.metrics.cost_micros || 0) / 1000000,
          campaign_id: row.campaign.id.toString(),
          ad_group_id: row.ad_group.id.toString(),
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

  async analyzeNegativeKeywords(customerId: string, dateRange: string) {
    console.log(`Analyzing negative keywords for customer ${customerId}`);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
    return {
      totalSearchTerms: 5432,
      suggestedNegatives: 890,
      potentialMonthlySavings: 450.78,
      wastedClicks: 1230,
      topBadTerms: [
        {
          searchTerm: "free online courses for dogs",
          cost: "75.21",
          clicks: "150",
          conversions: "0",
          campaign: "Brand Campaign",
          adGroup: "Ad Group 1",
        },
        {
          searchTerm: "dog collar repair jobs",
          cost: "55.43",
          clicks: "110",
          conversions: "0",
          campaign: "Performance Max",
          adGroup: "Ad Group 2",
        },
      ],
      suggestions: ["free", "jobs", "reviews", "repair"],
    };
  }

  async addNegativeKeywords(
    customerId: string,
    adGroupId: string,
    keywords: string[]
  ) {
    console.log(
      `MOCK: Adding negative keywords to customer ${customerId}, ad group ${adGroupId}:`,
      keywords
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  }

  async getReports(customerId: string, reportType: string, dateRange: string) {
    console.log(
      `Fetching mock report '${reportType}' for customer ${customerId}`
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
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
