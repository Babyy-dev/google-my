// app/dashboard/how-it-works/page.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HowItWorksPage() {
  const [loading, setLoading] = useState(false);

  const handleDemoClick = () => {
    setLoading(true);
    window.location.href = `/api/track-click?lpurl=${
      window.location.origin
    }/dashboard/how-it-works&gclid=demo-gclid-${Date.now()}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🛡️ How AdShield Works: A Quick Demo</CardTitle>
          <CardDescription>
            This page explains how AdShield tracks and blocks fraudulent clicks
            from your Google Ads campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Step 1: The Tracking Template
            </h3>
            <p className="text-sm text-foreground/80">
              To track clicks, you need to add a simple piece of code, called a
              &quot;Tracking Template,&quot; to your Google Ads campaigns. This
              template redirects users through our system for a split second to
              log their IP address before sending them to your actual landing
              page.
            </p>
            <div className="p-3 bg-gray-100 rounded-md text-sm font-mono mt-2 overflow-x-auto">
              {`${
                typeof window !== "undefined" ? window.location.origin : ""
              }/api/track-click?lpurl={lpurl}&gclid={gclid}`}
            </div>
            <p className="text-xs text-foreground/60 mt-2">
              You can find this setting under:{" "}
              <span className="font-semibold">
                Your Google Ads Campaign &gt; Settings &gt; Campaign URL options
              </span>
              .
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Step 2: Simulate a Live Ad Click
            </h3>
            <p className="text-sm text-foreground/80">
              Click the button below to simulate what happens when a user clicks
              your ad. We&apos;ll log the click in our database, just like a
              real one.
            </p>
            <Button
              onClick={handleDemoClick}
              disabled={loading}
              className="mt-2"
            >
              {loading ? "Redirecting..." : "🚀 Simulate Ad Click"}
            </Button>
            <p className="text-xs text-foreground/60 mt-2">
              This will redirect you and then bring you back to this page.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">
              Step 3: The Block Rule
            </h3>
            <p className="text-sm text-foreground/80">
              Our system checks the number of clicks from each IP address. Based
              on the &quot;IP Click Threshold&quot; you set on the{" "}
              <a href="/dashboard/settings" className="underline text-primary">
                Settings
              </a>{" "}
              page, if an IP clicks too many times, we automatically add it to
              your campaign&apos;s IP exclusion list in Google Ads. This
              instantly stops them from seeing and clicking your ads again,
              saving you money.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
