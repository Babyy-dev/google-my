// app/api/google-ads/sync/route.ts
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

    // Get the login_customer_id from the database to handle MCC accounts
    const { data: accountData, error: accountError } = await supabase
      .from("google_ads_accounts")
      .select("login_customer_id")
      .eq("id", googleAdsAccountId)
      .single();

    if (accountError) {
      console.error("Sync error fetching account data:", accountError);
      throw new Error(
        "Could not retrieve Google Ads account details for sync."
      );
    }

    // FIX: Fetch the user's profile to get the click threshold
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("click_fraud_threshold")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Sync error fetching profile data:", profileError);
      throw new Error("Could not retrieve user profile for sync.");
    }

    const clickThreshold = profileData?.click_fraud_threshold || 3; // Default to 3

    // Correctly instantiate the client with all required arguments
    const client = new GoogleAdsApiClient(
      refreshToken,
      customerId,
      accountData?.login_customer_id || undefined
    );

    // This is a background task, so we don't wait for it to finish.
    client
      .analyzeAndStoreFraud(
        supabase, // Pass the Supabase client instance
        user.id,
        googleAdsAccountId,
        clickThreshold // FIX: Pass the clickThreshold as the 4th argument
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
