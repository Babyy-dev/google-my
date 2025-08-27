import { NextRequest, NextResponse } from "next/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";

export async function POST(request: NextRequest) {
  try {
    const {
      customerId,
      refreshToken,
      loginCustomerId,
      action,
      adGroupId,
      keywords,
      dateRange,
    } = await request.json();

    if (!customerId || !refreshToken || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const client = new GoogleAdsApiClient(
      refreshToken,
      customerId,
      loginCustomerId
    );

    if (action === "analyze") {
      const analysis = await client.analyzeNegativeKeywords(dateRange);
      return NextResponse.json({ analysis });
    }

    if (action === "add_negatives") {
      if (!adGroupId || !keywords) {
        return NextResponse.json(
          { error: "Missing adGroupId or keywords for add action" },
          { status: 400 }
        );
      }
      await client.addNegativeKeywords(adGroupId, keywords);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Negative Keywords API Error:", error);
    const errorMessage =
      error.errors?.[0]?.message ||
      error.message ||
      "An unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
