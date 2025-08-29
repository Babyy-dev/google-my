"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { useGoogleAds, FraudAnalysis } from "@/hooks/useGoogleAds";
import { useGoogleAdsContext } from "@/app/contexts/GoogleAdsContext";

const initialFraudData: FraudAnalysis = {
  riskLevel: "low",
  totalAlerts: 0,
  highRiskAlerts: 0,
  mediumRiskAlerts: 0,
  summary: {
    totalClicks: 0,
    totalCost: 0,
    totalConversions: 0,
    avgCPC: 0,
    conversionRate: 0,
  },
  alerts: [],
  recommendations: [],
};

interface Alert {
  ip: string;
  location: string;
  type: string;
  cost: string;
  clicks: string;
  risk: "High" | "Medium" | "Low";
  status: "Blocked" | "Monitoring";
}

export default function ClickFraudPage() {
  const { session } = useAuth();
  const { analyzeFraud, loading } = useGoogleAds();
  const {
    isConnected,
    customerId,
    connectGoogleAds,
    loading: contextLoading,
  } = useGoogleAdsContext();
  const [fraudData, setFraudData] = useState<FraudAnalysis>(initialFraudData);
  const [inputCustomerId, setInputCustomerId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const fetchFraudData = useCallback(
    async (id: string) => {
      if (!session?.provider_refresh_token) {
        setConnectError("Session expired. Please sign in again.");
        return;
      }
      try {
        const data = await analyzeFraud(
          id.replace(/-/g, ""),
          session.provider_refresh_token
        );
        setFraudData(data);
      } catch (e: any) {
        console.error("Error fetching fraud data:", e);
        setConnectError(e.message || "Failed to fetch fraud data.");
      }
    },
    [session, analyzeFraud]
  );

  useEffect(() => {
    if (isConnected && customerId) {
      fetchFraudData(customerId);
    }
  }, [isConnected, customerId, fetchFraudData]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectError(null);

    if (!inputCustomerId) {
      setConnectError("Please enter a Google Ads Customer ID.");
      setIsConnecting(false);
      return;
    }

    if (!session?.provider_refresh_token) {
      setConnectError(
        "Authentication error: Refresh Token is missing. Please sign out and sign back in. Ensure your server environment variables (GOOGLE_CLIENT_ID, etc.) are set correctly in your .env.local file."
      );
      setIsConnecting(false);
      return;
    }

    try {
      const validationResponse = await fetch("/api/google-ads/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: inputCustomerId,
          refreshToken: session.provider_refresh_token,
        }),
      });

      const validationData = await validationResponse.json();
      if (!validationResponse.ok) {
        throw new Error(validationData.error || "Validation failed.");
      }

      const { loginCustomerId } = validationData;

      await fetch("/api/google-ads/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: inputCustomerId.replace(/-/g, ""),
          loginCustomerId: loginCustomerId,
          accessToken: session.provider_token,
          refreshToken: session.provider_refresh_token,
          accountName: `Google Ads ${inputCustomerId}`,
          currencyCode: "USD",
        }),
      });

      connectGoogleAds(inputCustomerId, loginCustomerId);
    } catch (e: any) {
      console.error("Connection failed", e);
      setConnectError(e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🛡️ Connect to Google Ads</CardTitle>
            <CardDescription>
              Enter your Google Ads **Client Customer ID** to begin analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-left">
              <label
                htmlFor="customerId"
                className="text-sm font-medium text-gray-700"
              >
                Google Ads Client ID (e.g., 123-456-7890)
              </label>
              <Input
                id="customerId"
                placeholder="Enter your 10-digit Client ID"
                value={inputCustomerId}
                onChange={(e) => setInputCustomerId(e.target.value)}
                className="mt-1 text-center text-lg tracking-wider"
              />
              {connectError && (
                <p className="text-red-500 text-sm mt-2">{connectError}</p>
              )}
            </div>
            <Button
              onClick={handleConnect}
              disabled={loading || isConnecting}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isConnecting ? "🔗 Validating..." : "🚀 Connect & Analyze"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fraud Analysis</CardTitle>
          <CardDescription>
            A real-time overview of detected threats and campaign
            vulnerabilities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <KpiCard
              title="Threats Blocked"
              value={fraudData.totalAlerts.toString()}
              change={`${fraudData.highRiskAlerts} high risk`}
            />
            <KpiCard
              title="Potential Budget Saved"
              value={`$${fraudData.summary.totalCost.toFixed(2)}`}
              change="over 7 days"
            />
            <KpiCard
              title="Total Clicks Analyzed"
              value={fraudData.summary.totalClicks.toLocaleString()}
              change="in the last week"
            />
            <KpiCard
              title="Overall Risk Level"
              value={
                fraudData.riskLevel.charAt(0).toUpperCase() +
                fraudData.riskLevel.slice(1)
              }
              change="based on alerts"
            />
            <KpiCard
              title="Average CPC"
              value={`$${fraudData.summary.avgCPC.toFixed(2)}`}
              change="across campaigns"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Fraud Alerts</CardTitle>
          <CardDescription>
            Live threats detected by AdShield in your campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fraudData.alerts.map((alert: Alert, index: number) => (
                <TableRow key={index}>
                  <TableCell>{alert.ip}</TableCell>
                  <TableCell>{alert.location}</TableCell>
                  <TableCell>{alert.type}</TableCell>
                  <TableCell>{alert.cost}</TableCell>
                  <TableCell>{alert.clicks}</TableCell>
                  <TableCell>{alert.risk}</TableCell>
                  <TableCell>{alert.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) {
  return (
    <Card className="overflow-hidden border-2 shadow-lg">
      <CardContent className="p-6">
        <div className="text-sm font-medium opacity-90 mb-2">{title}</div>
        <div className="text-4xl font-bold mb-2">{value}</div>
        <div className="flex items-center text-sm opacity-90">{change}</div>
      </CardContent>
    </Card>
  );
}
