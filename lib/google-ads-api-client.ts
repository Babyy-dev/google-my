// lib/google-ads-api-client.ts
import { GoogleAdsApi, enums } from "google-ads-api";
import { SupabaseClient } from "@supabase/supabase-js";

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

const BOT_UA_FRAGMENTS = [
  "bot",
  "spider",
  "crawler",
  "headless",
  "slurp",
  "googlebot",
];

export class GoogleAdsApiClient {
  private client: GoogleAdsApi;
  private customerId: string;
  private loginCustomerId?: string;
  private refreshToken: string;

  constructor(
    refreshToken: string,
    customerId: string,
    loginCustomerId?: string
  ) {
    this.client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_DEVELOPER_TOKEN!,
    });
    this.customerId = customerId;
    this.loginCustomerId = loginCustomerId;
    this.refreshToken = refreshToken;
  }

  private getCustomer() {
    return this.client.Customer({
      customer_id: this.customerId,
      login_customer_id: this.loginCustomerId || this.customerId,
      refresh_token: this.refreshToken,
    });
  }

  static async listAccessibleCustomers(
    refreshToken: string
  ): Promise<string[]> {
    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_DEVELOPER_TOKEN!,
    });
    const accessibleCustomers = await client.listAccessibleCustomers(
      refreshToken
    );
    return accessibleCustomers.resource_names;
  }

  async validate(): Promise<void> {
    const customer = this.getCustomer();
    await customer.report({
      entity: "customer",
      attributes: ["customer.id"],
      limit: 1,
    });
  }

  async analyzeAndStoreFraud(
    supabase: SupabaseClient,
    userId: string,
    googleAdsAccountId: string
  ): Promise<FraudAlertInsert[]> {
    const customer = this.getCustomer();

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("click_fraud_threshold")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile for threshold:", profileError);
      return [];
    }

    const clickThreshold = profile?.click_fraud_threshold || 3;

    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: clicks, error: clickError } = await supabase
      .from("ad_clicks")
      .select("ip_address, gclid, user_agent")
      .gte("created_at", twentyFourHoursAgo);

    if (clickError) {
      console.error("Error fetching clicks from DB:", clickError);
      return [];
    }

    const ipCounts: { [key: string]: number } = {};
    const fraudulentGclidsWithReason: Map<string, string> = new Map();

    for (const click of clicks) {
      if (click.user_agent) {
        const isBot = BOT_UA_FRAGMENTS.some((fragment) =>
          click.user_agent!.toLowerCase().includes(fragment)
        );
        if (isBot && click.gclid) {
          fraudulentGclidsWithReason.set(click.gclid, "Known bot user agent");
        }
      }

      if (click.ip_address) {
        ipCounts[click.ip_address] = (ipCounts[click.ip_address] || 0) + 1;
        if (ipCounts[click.ip_address] > clickThreshold && click.gclid) {
          fraudulentGclidsWithReason.set(
            click.gclid,
            `Exceeded click threshold of ${clickThreshold}`
          );
        }
      }
    }

    if (fraudulentGclidsWithReason.size === 0) {
      return [];
    }

    const fraudulentGclids = Array.from(fraudulentGclidsWithReason.keys()).map(
      (gclid) => `'${gclid}'`
    );

    const report = await customer.report({
      entity: "click_view",
      attributes: ["campaign.id", "ad_group.id", "click_view.gclid"],
      metrics: ["metrics.cost_micros"],
      constraints: {
        "click_view.gclid": { IN: fraudulentGclids },
      } as any,
    });

    const fraudulentClicks: FraudAlertInsert[] = report.map((row) => ({
      user_id: userId,
      google_ads_account_id: googleAdsAccountId,
      ip_address:
        clicks.find((c) => c.gclid === row.click_view?.gclid)?.ip_address ||
        "Unknown",
      timestamp: new Date().toISOString(),
      reason:
        (row.click_view?.gclid &&
          fraudulentGclidsWithReason.get(row.click_view.gclid)) ||
        "Suspicious Activity",
      cost: (row.metrics?.cost_micros || 0) / 1000000,
      campaign_id: (row.campaign?.id || "").toString(),
      ad_group_id: (row.ad_group?.id || "").toString(),
    }));

    if (fraudulentClicks.length > 0) {
      const { error } = await supabase
        .from("fraud_alerts")
        .insert(fraudulentClicks);
      if (error) console.error("Error saving fraud alerts to Supabase:", error);
    }

    return fraudulentClicks;
  }

  async analyzeNegativeKeywords(dateRange: string = "LAST_30_DAYS") {
    const customer = this.getCustomer();

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
        ...new Set(
          topBadTerms.map((t) => (t.searchTerm || "").split(" ")).flat()
        ),
      ].filter(Boolean),
    };
  }

  async addNegativeKeywords(adGroupId: string, keywords: string[]) {
    const customer = this.getCustomer();

    await customer.mutateResources([
      {
        entity: "ad_group_criterion",
        operation: "create",
        resource: {
          ad_group: `customers/${this.customerId}/adGroups/${adGroupId}`,
          negative: true,
          keyword: {
            text: keywords[0],
            match_type: enums.KeywordMatchType.BROAD,
          },
        },
      },
    ]);

    return { success: true };
  }

  async blockIpsFromCampaign(campaignId: string, ips: string[]): Promise<void> {
    if (ips.length === 0) {
      return;
    }

    const customer = this.getCustomer();
    const resources = ips.map((ip) => ({
      entity: "campaign_criterion",
      operation: "create",
      resource: {
        campaign: `customers/${this.customerId}/campaigns/${campaignId}`,
        negative: true,
        ip_block: {
          ip_address: ip,
        },
      },
    }));

    try {
      await customer.mutateResources(resources as any);
      console.log(
        `Successfully blocked ${ips.length} IPs from campaign ${campaignId}`
      );
    } catch (error) {
      console.error(`Failed to block IPs for campaign ${campaignId}:`, error);
    }
  }

  async getReports(
    reportType: "click_performance" | "search_terms" | "budget_data",
    dateRange: string = "LAST_7_DAYS"
  ): Promise<any> {
    const customer = this.getCustomer();
    let queryOptions: any = { date_constant: dateRange };

    switch (reportType) {
      case "click_performance":
        queryOptions = {
          ...queryOptions,
          entity: "click_view",
          attributes: ["campaign.name", "ad_group.name", "click_view.gclid"],
          metrics: ["metrics.clicks", "metrics.cost_micros"],
        };
        break;
      case "search_terms":
        queryOptions = {
          ...queryOptions,
          entity: "search_term_view",
          attributes: ["search_term_view.search_term", "campaign.name"],
          metrics: [
            "metrics.clicks",
            "metrics.cost_micros",
            "metrics.conversions",
          ],
        };
        break;
      case "budget_data":
        queryOptions = {
          ...queryOptions,
          entity: "campaign_budget",
          attributes: ["campaign.name", "campaign_budget.amount_micros"],
        };
        break;
      default:
        throw new Error("Invalid report type specified.");
    }

    return await customer.report(queryOptions);
  }
}
