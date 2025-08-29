// app/contexts/GoogleAdsContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/lib/auth"; // Import the useAuth hook

interface GoogleAdsContextType {
  customerId: string | null;
  loginCustomerId: string | null;
  isConnected: boolean;
  connectGoogleAds: (id: string, loginId?: string) => void;
  disconnectGoogleAds: () => void;
  loading: boolean;
}

const GoogleAdsContext = createContext<GoogleAdsContextType | undefined>(
  undefined
);

export function GoogleAdsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth(); // Get user and auth loading status
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loginCustomerId, setLoginCustomerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const disconnectGoogleAds = () => {
    localStorage.removeItem("google_ads_customer_id");
    localStorage.removeItem("google_ads_login_customer_id");
    setCustomerId(null);
    setLoginCustomerId(null);
    setIsConnected(false);
  };

  useEffect(() => {
    // This effect now reacts to changes in authentication status
    if (!authLoading) {
      if (user) {
        // User is logged in, check for a saved connection
        const storedCustomerId = localStorage.getItem("google_ads_customer_id");
        if (storedCustomerId) {
          const storedLoginId = localStorage.getItem(
            "google_ads_login_customer_id"
          );
          setCustomerId(storedCustomerId);
          setLoginCustomerId(storedLoginId);
          setIsConnected(true);
        } else {
          // User is logged in but has no saved connection, ensure we are disconnected
          setIsConnected(false);
        }
      } else {
        // User is logged out, so ensure everything is disconnected and cleared
        disconnectGoogleAds();
      }
    }
    setLoading(authLoading);
  }, [user, authLoading]);

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
        disconnectGoogleAds,
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
