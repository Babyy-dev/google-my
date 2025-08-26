import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { customerId, refreshToken, reportType, dateRange } =
      await request.json();

    if (!customerId || !refreshToken || !reportType) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const client = new GoogleAdsApiClient(refreshToken);
    const reportData = await client.getReports(
      customerId,
      reportType,
      dateRange
    );

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error: unknown) {
    console.error("Reports API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to fetch Google Ads report", details: errorMessage },
      { status: 500 }
    );
  }
}
