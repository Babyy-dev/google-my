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

    const isDirectlyAccessible = accessibleCustomers.some(
      (name: string) => name === `customers/${cleanedCustomerId}`
    );

    // This is the crucial check. If the ID provided is a Manager Account, we reject it.
    if (isDirectlyAccessible) {
      try {
        // We attempt to get metrics. This will FAIL for a manager account.
        const testClient = new GoogleAdsApiClient(
          refreshToken,
          cleanedCustomerId
        );
        await testClient.validate(); // This calls the report endpoint
      } catch (error: any) {
        if (
          error.message.includes(
            "Metrics cannot be requested for a manager account"
          )
        ) {
          return NextResponse.json(
            {
              error:
                "This is a Manager Account ID. Please provide a specific Client Account ID to analyze.",
            },
            { status: 400 }
          );
        }
      }
      // If it's directly accessible and NOT a manager account, it's valid on its own.
      return NextResponse.json({
        success: true,
        message: "Customer ID is valid.",
      });
    }

    // If not directly accessible, it must be a child account. We find its manager.
    const managerAccounts = accessibleCustomers.filter((name: string) =>
      name.startsWith("customers/")
    );

    for (const managerResourceName of managerAccounts) {
      const managerId = managerResourceName.split("/")[1];
      try {
        const client = new GoogleAdsApiClient(
          refreshToken,
          cleanedCustomerId,
          managerId
        );
        await client.validate();
        // If validation succeeds, we found the right manager for this client.
        return NextResponse.json({
          success: true,
          message: "Customer ID is valid.",
          loginCustomerId: managerId,
        });
      } catch (e) {
        // This manager can't access the client, so we continue to the next one.
      }
    }

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
