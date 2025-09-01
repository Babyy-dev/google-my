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
        { error: "Missing required parameters." },
        { status: 400 }
      );
    }

    // First, let's check if the entered ID is a manager account itself.
    // This is a common user error we can catch early.
    try {
      const testClient = new GoogleAdsApiClient(
        refreshToken,
        cleanedCustomerId,
        cleanedCustomerId
      );
      await testClient.validate();
    } catch (error: any) {
      if (
        error.message &&
        error.message.includes(
          "Metrics cannot be requested for a manager account"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "The ID you entered is for a Manager Account. Please provide a specific Client Account ID.",
          },
          { status: 400 }
        );
      }
      // If it's another error, we'll let the main logic handle it.
    }

    // Get all accounts the user has access to.
    const accessibleCustomers =
      await GoogleAdsApiClient.listAccessibleCustomers(refreshToken);

    // The key is to find an account in the accessible list that can be used to log in
    // and access the specific customerId the user provided.
    for (const managerResourceName of accessibleCustomers) {
      const managerId = managerResourceName.split("/")[1];
      try {
        const client = new GoogleAdsApiClient(
          refreshToken,
          cleanedCustomerId, // The Client ID we are trying to access
          managerId // The account we are using to "log in" via the API
        );

        await client.validate();

        // SUCCESS: If the validate() call does not throw an error, it means this managerId
        // has permission to access the user's customerId. We've found the correct path.
        return NextResponse.json({
          success: true,
          message: "Customer ID is valid.",
          loginCustomerId: managerId, // This is the required "login-customer-id" for future API calls
        });
      } catch (e: any) {
        // This is an expected failure. It simply means this specific manager account
        // does not have access to the client account. We continue trying the next one.
      }
    }

    // If we loop through all accessible accounts and none of them can access the
    // provided customerId, then the ID is truly invalid or the user lacks permissions.
    return NextResponse.json(
      {
        error:
          "Invalid Customer ID or you do not have permission to access this account.",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Validation API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during validation." },
      { status: 500 }
    );
  }
}
