"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Define plan details without environment variables here
const planOptions = [
  {
    name: "Professional",
    price: "$49/mo",
    description: "For growing businesses",
    current: true,
    popular: true,
    features: [
      "100K clicks/month",
      "Advanced fraud detection",
      "Priority support",
      "Real-time alerts",
    ],
  },
  {
    name: "Enterprise",
    price: "$199/mo",
    description: "For large organizations",
    current: false,
    popular: false,
    features: [
      "Unlimited clicks",
      "Custom AI models",
      "Dedicated support",
      "API access",
    ],
  },
];

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (priceId: string | undefined) => {
    // This is the check that is correctly identifying the error.
    if (!priceId) {
      console.error(
        "Stripe Price ID is not configured. Please check your .env.local file and restart your server."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("Failed to create checkout session:", errorBody.error);
        setLoading(false);
        return;
      }

      const { sessionId } = await response.json();

      if (!sessionId) {
        console.error("Session ID is missing from the API response.");
        setLoading(false);
        return;
      }

      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: sessionId });
    } catch (error) {
      console.error("An error occurred during the upgrade process:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error("Failed to create portal session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>🚀 Current Subscription</CardTitle>
              <CardDescription>
                Your active plan and usage details
              </CardDescription>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              ✅ Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-blue-800">
                    Professional Plan
                  </h3>
                  <span className="text-2xl font-bold text-blue-600">
                    $49/mo
                  </span>
                </div>
                <div className="text-sm text-blue-600 space-y-1">
                  <div>✅ Up to 100K ad clicks/month</div>
                  <div>✅ Advanced fraud detection</div>
                  <div>✅ Real-time monitoring</div>
                  <div>✅ Priority support</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleUpgrade(
                      process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
                    )
                  }
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                >
                  {loading ? "Processing..." : "🔄 Upgrade Plan"}
                </Button>
                <Button
                  onClick={handleManageSubscription}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  {loading ? "Processing..." : "⚙️ Manage"}
                </Button>
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Usage This Month</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Ad Clicks Monitored</span>
                    <span>23,456 / 100,000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: "23%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>IPs Blocked</span>
                    <span>1,289</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>💎 Available Plans</CardTitle>
          <CardDescription>Compare and upgrade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <PlanOption
              plan={planOptions[0]}
              onSelect={() =>
                handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID)
              }
              loading={loading}
              isCurrent={true}
            />
            <PlanOption
              plan={planOptions[1]}
              onSelect={() =>
                handleUpgrade(
                  process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID
                )
              }
              loading={loading}
              isCurrent={false}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanOption({
  plan,
  onSelect,
  loading,
  isCurrent,
}: {
  plan: any;
  onSelect: () => void;
  loading: boolean;
  isCurrent: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg border-2 ${
        isCurrent
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{plan.name}</span>
          {isCurrent && (
            <Badge variant="default" className="text-xs">
              Current
            </Badge>
          )}
        </div>
        <span className="font-bold text-lg">{plan.price}</span>
      </div>
      <div className="text-xs text-foreground/60 mb-2">{plan.description}</div>
      <div className="text-xs space-y-1">
        {plan.features.map((feature: string, i: number) => (
          <div key={i} className="flex items-center gap-1">
            <span className="text-green-500">✓</span>
            <span>{feature}</span>
          </div>
        ))}
      </div>
      {!isCurrent && (
        <Button
          size="sm"
          className="w-full mt-3"
          variant={plan.popular ? "default" : "outline"}
          onClick={onSelect}
          disabled={loading}
        >
          {plan.popular ? "🚀 Upgrade" : "Select Plan"}
        </Button>
      )}
    </div>
  );
}
