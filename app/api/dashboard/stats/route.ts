import { NextRequest, NextResponse } from "next/server";

// Mock data for the dashboard
const dashboardData = {
  stats: {
    savedBudget: "$1,234",
    blockedIPs: "567",
    keywordsBlocked: "890",
    detectionRate: "99.8%",
  },
  charts: {
    fraudVsValid: [
      { name: "Day 1", "Valid Clicks": 4000, "Fraud Blocked": 2400 },
      { name: "Day 2", "Valid Clicks": 3000, "Fraud Blocked": 1398 },
    ],
    budgetSavings: [
      { name: "Jan", Savings: 400 },
      { name: "Feb", Savings: 300 },
    ],
  },
  recentAlerts: [
    {
      ip: "192.168.1.1",
      location: "USA",
      type: "Bot",
      cost: "$5.00",
      clicks: "10",
      risk: "High",
      status: "Blocked",
    },
    {
      ip: "10.0.0.1",
      location: "Canada",
      type: "VPN",
      cost: "$2.50",
      clicks: "5",
      risk: "Medium",
      status: "Blocked",
    },
  ],
};

export async function GET() {
  return NextResponse.json(dashboardData);
}
