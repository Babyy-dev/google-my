// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { useGoogleAdsContext } from "@/app/contexts/GoogleAdsContext";
import { ConnectGoogleAds } from "@/components/auth/connect-google-ads";

interface RecentAlert {
  ip: string;
  location: string;
  type: string;
  cost: string;
  clicks: string;
  risk: "High" | "Medium" | "Low";
  status: "Blocked" | "Monitoring";
}

interface DashboardData {
  stats: {
    savedBudget: string;
    blockedIPs: string;
    keywordsBlocked: string;
    detectionRate: string;
  };
  charts: {
    fraudVsValid: Array<Record<string, number | string>>;
    budgetSavings: Array<Record<string, number | string>>;
  };
  recentAlerts: RecentAlert[];
}

const initialDashboardData: DashboardData = {
  stats: {
    savedBudget: "$0",
    blockedIPs: "0",
    keywordsBlocked: "0",
    detectionRate: "0%",
  },
  charts: {
    fraudVsValid: [],
    budgetSavings: [],
  },
  recentAlerts: [],
};

export default function DashboardPage() {
  const { user, session } = useAuth();
  const {
    isConnected,
    customerId,
    loginCustomerId,
    loading: contextLoading,
  } = useGoogleAdsContext();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [dashboardData, setDashboardData] =
    useState<DashboardData>(initialDashboardData);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!isConnected || !customerId || !session?.provider_refresh_token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          refreshToken: session.provider_refresh_token,
          loginCustomerId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error("Failed to fetch dashboard data:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [isConnected, customerId, loginCustomerId, session]);

  useEffect(() => {
    if (!contextLoading) {
      if (isConnected) {
        fetchDashboardData();
      } else {
        setLoading(false); // If not connected, stop loading
      }
    }
  }, [isConnected, contextLoading, fetchDashboardData]);

  useEffect(() => {
    if (searchParams?.get("connected") === "true") {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (loading || contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If the user is logged in but has not connected their Google Ads account, show the connection component.
  if (!isConnected) {
    return (
      <ConnectGoogleAds
        title="Welcome to your Dashboard"
        description="Connect your Google Ads account to see your live performance and protection stats."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {showSuccess && (
        <div className="md:col-span-3 mb-4">
          <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mt-1">
              Google Ads account connected successfully!
            </p>
          </div>
        </div>
      )}

      <div className="md:col-span-3 grid gap-4 md:grid-cols-4">
        <Kpi
          title="Saved Budget (7d)"
          value={dashboardData.stats.savedBudget}
        />
        <Kpi title="Blocked IPs (7d)" value={dashboardData.stats.blockedIPs} />
        <Kpi
          title="Keywords Blocked"
          value={dashboardData.stats.keywordsBlocked}
        />
        <Kpi
          title="Fraud Rate (7d)"
          value={dashboardData.stats.detectionRate}
        />
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>📊 Fraud vs Valid Clicks (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={dashboardData.charts.fraudVsValid}
              series={[
                { key: "Valid Clicks", name: "Valid Clicks", color: "#10b981" },
                {
                  key: "Fraud Blocked",
                  name: "Fraud Blocked",
                  color: "#ef4444",
                },
              ]}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>💰 Budget Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={dashboardData.charts.budgetSavings}
              series={[
                { key: "Savings", name: "Budget Saved ($)", color: "#f59e0b" },
              ]}
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>🎯 Recent Fraud Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Fraud Type</TableHead>
                  <TableHead>Wasted Budget</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.recentAlerts.map(
                  (alert: RecentAlert, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{alert.ip}</TableCell>
                      <TableCell>{alert.location}</TableCell>
                      <TableCell>{alert.type}</TableCell>
                      <TableCell>{alert.cost}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alert.risk === "High"
                              ? "destructive"
                              : alert.risk === "Medium"
                              ? "warning"
                              : "default"
                          }
                        >
                          {alert.risk}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            alert.status === "Blocked" ? "success" : "secondary"
                          }
                        >
                          {alert.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium text-foreground/60 mb-1">
          {title}
        </div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
