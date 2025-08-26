import { NextRequest, NextResponse } from "next/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";

export async function POST(request: NextRequest) {
  const { customerId, refreshToken, dateRange } = await request.json();
  const client = new GoogleAdsApiClient(refreshToken);
  const analysis = await client.analyzeFraud(customerId, dateRange);
  return NextResponse.json({ analysis });
}
