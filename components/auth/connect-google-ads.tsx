// components/auth/connect-google-ads.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useGoogleAdsContext } from "@/app/contexts/GoogleAdsContext";

interface ConnectGoogleAdsProps {
  title?: string;
  description?: string;
}

export function ConnectGoogleAds({
  title,
  description,
}: ConnectGoogleAdsProps) {
  const { session } = useAuth();
  const { connectGoogleAds } = useGoogleAdsContext();
  const [inputCustomerId, setInputCustomerId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    if (!inputCustomerId) {
      setError("Please enter a Google Ads Customer ID.");
      setIsConnecting(false);
      return;
    }

    if (!session?.provider_refresh_token) {
      setError(
        "Authentication error: Refresh Token is missing. Please sign out and sign back in."
      );
      setIsConnecting(false);
      return;
    }

    try {
      const validationResponse = await fetch("/api/google-ads/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: inputCustomerId,
          refreshToken: session.provider_refresh_token,
        }),
      });

      const validationData = await validationResponse.json();
      if (!validationResponse.ok) {
        throw new Error(validationData.error || "Validation failed.");
      }

      const { loginCustomerId } = validationData;

      await fetch("/api/google-ads/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: inputCustomerId.replace(/-/g, ""),
          loginCustomerId: loginCustomerId,
          accessToken: session.provider_token,
          refreshToken: session.provider_refresh_token,
          accountName: `Google Ads ${inputCustomerId}`,
          currencyCode: "USD",
        }),
      });

      connectGoogleAds(inputCustomerId, loginCustomerId);
    } catch (e: any) {
      console.error("Connection failed", e);
      setError(e.message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {title || "🛡️ Connect to Google Ads"}
          </CardTitle>
          <CardDescription>
            {description ||
              "Enter your Google Ads Client Customer ID to begin analysis."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-left">
            <label
              htmlFor="customerId"
              className="text-sm font-medium text-gray-700"
            >
              Google Ads Client ID (e.g., 123-456-7890)
            </label>
            <Input
              id="customerId"
              placeholder="Enter your 10-digit Client ID"
              value={inputCustomerId}
              onChange={(e) => setInputCustomerId(e.target.value)}
              className="mt-1 text-center text-lg tracking-wider"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isConnecting ? "🔗 Validating..." : "🚀 Connect & Analyze"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
