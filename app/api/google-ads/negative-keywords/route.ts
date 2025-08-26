import { NextRequest, NextResponse } from "next/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";

export async function POST(request: NextRequest) {
  const { customerId, refreshToken, action, adGroupId, keywords, dateRange } =
    await request.json();
  const client = new GoogleAdsApiClient(refreshToken);

  if (action === "analyze") {
    const analysis = await client.analyzeNegativeKeywords(
      customerId,
      dateRange
    );
    return NextResponse.json({ analysis });
  }

  if (action === "add_negatives") {
    await client.addNegativeKeywords(customerId, adGroupId, keywords);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
