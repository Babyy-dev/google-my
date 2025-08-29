import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error(
      "🔴 STRIPE_SECRET_KEY is not set in your environment variables."
    );
    return NextResponse.json(
      { error: "Server is not configured for payments." },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceId } = await request.json();

    // Add a specific check for the priceId
    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is missing." },
        { status: 400 }
      );
    }

    let { data: profile } = await supabase
      .from("user_profiles")
      .select("id, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      const { data: newProfile, error: insertError } = await supabase
        .from("user_profiles")
        .insert({ id: user.id, email: user.email })
        .select("id, stripe_customer_id")
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        return NextResponse.json(
          { error: "Failed to create user profile." },
          { status: 500 }
        );
      }
      profile = newProfile;
    }

    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await supabase
        .from("user_profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${request.headers.get(
        "origin"
      )}/dashboard/billing?success=true`,
      cancel_url: `${request.headers.get("origin")}/dashboard/billing`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error("🔴 Stripe Checkout Session Error:", error.message);
    return NextResponse.json(
      { error: "Failed to create Stripe checkout session." },
      { status: 500 }
    );
  }
}
