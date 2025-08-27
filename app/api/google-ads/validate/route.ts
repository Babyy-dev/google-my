// babyy-dev/google-my/google-my-2a6844f4f7375e420870493040d07233448ab22c/app/api/google-ads/validate/route.ts
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
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const accessibleCustomers =
      await GoogleAdsApiClient.listAccessibleCustomers(refreshToken);

    // Check if the user entered a Manager ID they have direct access to.
    const isManagerAccount = accessibleCustomers.some(
      (name) => name === `customers/${cleanedCustomerId}`
    );

    if (isManagerAccount) {
      // Forbid connecting with a Manager ID, as we cannot get metrics from it.
      return NextResponse.json(
        {
          error:
            "This is a Manager Account ID. Please provide a specific Client Account ID to analyze.",
        },
        { status: 400 }
      );
    }

    // If the ID is not a directly accessible manager account, it must be a client account.
    // Now, we find which of the user's accessible manager accounts can access this client ID.
    const managerAccounts = accessibleCustomers.filter((name: string) =>
      name.startsWith("customers/")
    );

    for (const managerResourceName of managerAccounts) {
      const managerId = managerResourceName.split("/")[1];
      try {
        // Attempt to validate the client ID using a manager ID for login.
        const client = new GoogleAdsApiClient(
          refreshToken,
          cleanedCustomerId,
          managerId
        );
        await client.validate();
        // If it succeeds, we've found the correct manager for this client.
        return NextResponse.json({
          success: true,
          message: "Customer ID is valid.",
          loginCustomerId: managerId,
        });
      } catch (e) {
        // This manager can't access the client, so we'll try the next one.
      }
    }

    // If we loop through all managers and none can access the ID, it's invalid or the user lacks permission.
    return NextResponse.json(
      {
        error: "Invalid Client ID or you do not have permission to access it.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Validation API error:", error);
    const errorMessage =
      error.errors?.[0]?.message ||
      error.message ||
      "An unknown error occurred";
    return NextResponse.json(
      { error: `Failed to process validation: ${errorMessage}` },
      { status: 500 }
    );
  }
}
