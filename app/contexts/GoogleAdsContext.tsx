"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface GoogleAdsContextType {
  customerId: string | null;
  isConnected: boolean;
  connectGoogleAds: (id: string) => void;
  loading: boolean;
}

const GoogleAdsContext = createContext<GoogleAdsContextType | undefined>(
  undefined
);

export function GoogleAdsProvider({ children }: { children: ReactNode }) {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Set loading to false as we no longer check for a persistent connection
  const loading = false;

  const connectGoogleAds = (id: string) => {
    if (id) {
      // We still set it in localStorage for the current session if needed
      localStorage.setItem("google_ads_customer_id", id);
      setCustomerId(id);
      setIsConnected(true);
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
