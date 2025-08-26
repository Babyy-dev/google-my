"use client";

import { useState, useEffect } from "react";
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

export default function ClickFraudPage() {
  const { session } = useAuth();
  const { analyzeFraud, loading, error } = useGoogleAds();
  const { isConnected, customerId, connectGoogleAds } = useGoogleAdsContext();
  const [fraudData, setFraudData] = useState<FraudAnalysis>(initialFraudData);
  const [inputCustomerId, setInputCustomerId] = useState("");

  useEffect(() => {
    if (isConnected && customerId) {
      fetchFraudData(customerId);
    }
  }, [isConnected, customerId]);

  const fetchFraudData = async (id: string) => {
    if (!session?.provider_refresh_token) return;
    try {
      const data = await analyzeFraud(
        id.replace(/-/g, ""),
        session.provider_refresh_token
      );
      setFraudData(data);
    } catch (e) {
      console.error("Error fetching fraud data:", e);
    }
  };

  const handleConnect = () => {
    if (!inputCustomerId) return;
    connectGoogleAds(inputCustomerId);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🛡️ Connect to Google Ads</CardTitle>
            <CardDescription>
              Enter your Google Ads Customer ID to begin fraud analysis.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-left">
              <label
                htmlFor="customerId"
                className="text-sm font-medium text-gray-700"
              >
                Google Ads Customer ID (e.g., 123-456-7890)
              </label>
              <Input
                id="customerId"
                placeholder="Enter your 10-digit Customer ID"
                value={inputCustomerId}
                onChange={(e) => setInputCustomerId(e.target.value)}
                className="mt-1 text-center text-lg tracking-wider"
              />
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
            <Button
              onClick={handleConnect}
              disabled={!inputCustomerId || loading}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {loading ? "🔍 Connecting..." : "🚀 Connect & Analyze"}
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
              value={`$${fraudData.summary.totalCost.toFixed(0)}`}
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
              {fraudData.alerts.map((alert: any, index: number) => (
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

function KpiCard({ title, value, change }: any) {
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
