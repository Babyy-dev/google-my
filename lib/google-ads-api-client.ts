import { GoogleAdsApi, enums } from "google-ads-api";
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

export class GoogleAdsApiClient {
  private client: GoogleAdsApi;
  private customerId: string;
  private refreshToken: string;

  constructor(refreshToken: string, customerId: string) {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_DEVELOPER_TOKEN!,
    });
    this.customerId = customerId;
    this.refreshToken = refreshToken;
  }

  async analyzeAndStoreFraud(
    userId: string,
    googleAdsAccountId: string
  ): Promise<FraudAlertInsert[]> {
    const customer = this.client.Customer({
      customer_id: this.customerId,
      login_customer_id: this.customerId,
      refresh_token: this.refreshToken,
    });

    const report = await customer.report({
      entity: "click_view",
      attributes: ["click_view.gclid", "campaign.id", "ad_group.id"],
      metrics: ["metrics.cost_micros"],
      date_constant: "LAST_7_DAYS",
    });

    const clickCounts: { [key: string]: number } = {};
    const fraudulentClicks: FraudAlertInsert[] = [];

    for (const row of report) {
      const gclid = row.click_view?.gclid;
      if (gclid) {
        clickCounts[gclid] = (clickCounts[gclid] || 0) + 1;
        if (clickCounts[gclid] > 1) {
          fraudulentClicks.push({
            user_id: userId,
            google_ads_account_id: googleAdsAccountId,
            ip_address: "Simulated IP (from GCLID)",
            timestamp: new Date().toISOString(),
            reason: "Simulated: Multiple clicks with the same GCLID",
            cost: (row.metrics?.cost_micros || 0) / 1000000,
            campaign_id: (row.campaign?.id || "").toString(),
            ad_group_id: (row.ad_group?.id || "").toString(),
          });
        }
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

  async analyzeNegativeKeywords(dateRange: string = "LAST_30_DAYS") {
    const customer = this.client.Customer({
      customer_id: this.customerId,
      login_customer_id: this.customerId,
      refresh_token: this.refreshToken,
    });

    const report = await customer.report({
      entity: "search_term_view",
      attributes: [
        "search_term_view.search_term",
        "campaign.name",
        "ad_group.name",
        "ad_group.id",
      ],
      metrics: ["metrics.cost_micros", "metrics.clicks", "metrics.conversions"],
      date_constant: dateRange as any,
      limit: 100,
    });

    const topBadTerms = report
      .filter(
        (row) =>
          (row.metrics?.conversions || 0) === 0 &&
          (row.metrics?.clicks || 0) > 10
      )
      .map((row) => ({
        searchTerm: row.search_term_view?.search_term,
        cost: ((row.metrics?.cost_micros || 0) / 1000000).toFixed(2),
        clicks: row.metrics?.clicks,
        conversions: row.metrics?.conversions,
        campaign: row.campaign?.name,
        adGroup: row.ad_group?.name,
        adGroupId: row.ad_group?.id,
      }));

    return {
      totalSearchTerms: report.length,
      suggestedNegatives: topBadTerms.length,
      potentialMonthlySavings: topBadTerms.reduce(
        (sum, term) => sum + parseFloat(term.cost),
        0
      ),
      wastedClicks: topBadTerms.reduce(
        (sum, term) => sum + (term.clicks || 0),
        0
      ),
      topBadTerms: topBadTerms,
      suggestions: [
        ...new Set(topBadTerms.map((t) => t.searchTerm?.split(" ")).flat()),
      ].filter(Boolean),
    };
  }

  async addNegativeKeywords(adGroupId: string, keywords: string[]) {
    const customer = this.client.Customer({
      customer_id: this.customerId,
      login_customer_id: this.customerId,
      refresh_token: this.refreshToken,
    });

    const response = await customer.mutateResources([
      {
        entity: "ad_group_criterion",
        operation: "create",
        resource: {
          ad_group: `customers/${this.customerId}/adGroups/${adGroupId}`,
          negative: true,
          keyword: {
            text: keywords[0], // Assuming one keyword for simplicity
            match_type: enums.KeywordMatchType.BROAD,
          },
        },
      },
    ]);

    return { success: true };
  }
}
