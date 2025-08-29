// app/api/google-ads/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleAdsApiClient } from "@/lib/google-ads-api-client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { customerId, refreshToken } = await request.json();
    const cleanedCustomerId = customerId.replace(/-/g, "");

    if (!customerId || !refreshToken) {
      return NextResponse.json(
        { error: "Missing Customer ID or Refresh Token." },
        { status: 400 }
      );
    }

    // This is the new, simplified validation logic.
    // We will try to access the account directly. If it's a manager account,
    // the API will throw a specific error that we can catch.

    const client = new GoogleAdsApiClient(refreshToken, cleanedCustomerId);

    try {
      await client.validate();
      // If validate() succeeds, it's a valid, non-manager account we can access directly.
      return NextResponse.json({
        success: true,
        message: "Customer ID is valid.",
        loginCustomerId: null, // We are not using a manager ID
      });
    } catch (error: any) {
      // Check for the specific error indicating a manager account
      if (
        error.message &&
        error.message.includes(
          "Metrics cannot be requested for a manager account"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "This is a Manager Account ID. Please provide a specific Client Account ID.",
          },
          { status: 400 }
        );
      }

      // For all other errors (permissions, invalid ID, etc.), give a general error.
      // This is more secure and covers cases where the ID is simply wrong.
      return NextResponse.json(
        {
          error:
            "Invalid Customer ID or you do not have permission to access this account.",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Validation API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during validation." },
      { status: 500 }
    );
  }
}
