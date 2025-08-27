// babyy-dev/google-my/google-my-2a6844f4f7375e420870493040d07233448ab22c/app/contexts/GoogleAdsContext.tsx
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
  loginCustomerId: string | null;
  isConnected: boolean;
  connectGoogleAds: (id: string, loginId?: string) => void;
  loading: boolean;
}

const GoogleAdsContext = createContext<GoogleAdsContextType | undefined>(
  undefined
);

export function GoogleAdsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loginCustomerId, setLoginCustomerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedCustomerId = localStorage.getItem("google_ads_customer_id");
    const storedLoginId = localStorage.getItem("google_ads_login_customer_id");
    if (storedCustomerId) {
      setCustomerId(storedCustomerId);
      setLoginCustomerId(storedLoginId);
      setIsConnected(true);
    }
  }, []);

  const connectGoogleAds = (id: string, loginId?: string) => {
    localStorage.setItem("google_ads_customer_id", id);
    if (loginId) {
      localStorage.setItem("google_ads_login_customer_id", loginId);
    } else {
      localStorage.removeItem("google_ads_login_customer_id");
    }
    setCustomerId(id);
    setLoginCustomerId(loginId || null);
    setIsConnected(true);
  };

  return (
    <GoogleAdsContext.Provider
      value={{
        customerId,
        loginCustomerId,
        isConnected,
        connectGoogleAds,
        loading,
      }}
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
