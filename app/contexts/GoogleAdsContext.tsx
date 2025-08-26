"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/lib/auth";

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
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem("google_ads_customer_id");
    if (user && storedId) {
      setCustomerId(storedId);
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
    setLoading(false);
  }, [user]);

  const connectGoogleAds = (id: string) => {
    if (id) {
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
