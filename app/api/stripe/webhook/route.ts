// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

// Helper function to update or create a subscription record in your database.
async function upsertSubscriptionRecord(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const { data: userProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", subscription.customer as string)
    .single();

  if (userProfile) {
    const subscriptionData = {
      id: userProfile.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      // FIX: Use a type assertion `(subscription as any)` to bypass the incorrect TypeScript error.
      stripe_current_period_end: new Date(
        (subscription as any).current_period_end * 1000
      ).toISOString(),
      status: subscription.status,
    };

    const { error } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData);
    if (error) {
      console.error("Supabase upsert error:", error);
      throw error;
    }
    console.log(
      `Successfully upserted subscription for user: ${userProfile.id}`
    );
  } else {
    console.error(
      `Webhook Error: No user profile found for Stripe customer ID: ${subscription.customer}`
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      console.error("Webhook secret not found.");
      return new NextResponse("Webhook secret not found.", { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.log(`❌ Webhook signature verification failed: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await upsertSubscriptionRecord(supabase, subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await upsertSubscriptionRecord(supabase, subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error("Error handling webhook event:", error);
    return new NextResponse("Webhook handler failed. See server logs.", {
      status: 500,
    });
  }

  return NextResponse.json({ received: true });
}
