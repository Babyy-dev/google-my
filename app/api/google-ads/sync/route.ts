import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const { customerId, refreshToken, googleAdsAccountId } =
      await request.json();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!customerId || !refreshToken || !googleAdsAccountId) {
      return NextResponse.json(
        { error: "Missing required parameters for sync" },
        { status: 400 }
      );
    }

    // This is a background task, so we don't need to wait for it to finish.
    const client = new GoogleAdsApiClient(refreshToken);
    client
      .analyzeAndStoreFraud(
        customerId,
        refreshToken,
        user.id,
        googleAdsAccountId
      )
      .catch((err) => {
        console.error(
          `Background sync failed for customer ${customerId}:`,
          err
        );
      });

    return NextResponse.json({
      success: true,
      message: "Background data sync initiated successfully.",
    });
  } catch (error: unknown) {
    console.error("Sync API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { error: "Failed to initiate sync process", details: errorMessage },
      { status: 500 }
    );
  }
}
