"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "@/lib/auth";

interface GoogleAdsContextType {
  customerId: string | null;
  isConnected: boolean;
  connectGoogleAds: (id: string) => Promise<boolean>;
  loading: boolean;
}

const GoogleAdsContext = createContext<GoogleAdsContextType | undefined>(
  undefined
);

export function GoogleAdsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const connectGoogleAds = async (id: string): Promise<boolean> => {
    if (!session?.provider_refresh_token) {
      return false;
    }

    setLoading(true);
    try {
      // The API endpoint will now handle all validation.
      const response = await fetch("/api/google-ads/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: id,
          accessToken: session.provider_token,
          refreshToken: session.provider_refresh_token,
        }),
      });

      if (!response.ok) {
        throw new Error("Invalid Google Ads Customer ID or credentials.");
      }

      localStorage.setItem("google_ads_customer_id", id);
      setCustomerId(id);
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error("Failed to connect to Google Ads:", error);
      setIsConnected(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleAdsContext.Provider
      value={{ customerId, isConnected, connectGoogleAds, loading }}
    >
      {children}
    </GoogleAdsContext.Provider>
  );
}

export function useGoogleAdsContext() {
  const context = useContext(GoogleAdsContext);
  if (context === undefined) {
    throw new Error(
      "useGoogleAdsContext must be used within a GoogleAdsProvider"
    );
  }
  return context;
}
