// lib/stripe.ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // FIX: Use the exact version string TypeScript is requesting.
  apiVersion: "2025-08-27.basil",
  typescript: true,
});
