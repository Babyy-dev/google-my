// babyy-dev/google-my/google-my-2a6844f4f7375e420870493040d07233448ab22c/hooks/useGoogleAds.ts
"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useGoogleAdsContext } from "@/app/contexts/GoogleAdsContext";

export interface GoogleAdsAccount {
  customerId: string;
  name: string;
  currencyCode: string;
}

export interface FraudAnalysis {
  riskLevel: "low" | "medium" | "high";
  totalAlerts: number;
  highRiskAlerts: number;
  mediumRiskAlerts: number;
  summary: {
    totalClicks: number;
    totalCost: number;
    totalConversions: number;
    avgCPC: number;
    conversionRate: number;
  };
  alerts: any[];
  recommendations: string[];
}

export interface NegativeKeywordAnalysis {
  totalSearchTerms: number;
  suggestedNegatives: number;
  potentialMonthlySavings: number;
  wastedClicks: number;
  topBadTerms: any[];
  suggestions: string[];
}

export function useGoogleAds() {
  const { user } = useAuth();
  const { loginCustomerId } = useGoogleAdsContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFraud = useCallback(
    async (
      customerId: string,
      refreshToken: string,
      dateRange: string = "LAST_7_DAYS"
    ): Promise<FraudAnalysis> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/google-ads/fraud-detection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            refreshToken,
            dateRange,
            loginCustomerId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to analyze fraud patterns"
          );
        }

        const data = await response.json();
        return data.analysis;
      } catch (err: any) {
        setError(err.message || "Failed to analyze fraud patterns");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loginCustomerId]
  );

  const analyzeNegativeKeywords = useCallback(
    async (
      customerId: string,
      refreshToken: string,
      dateRange: string = "LAST_30_DAYS"
    ): Promise<NegativeKeywordAnalysis> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/google-ads/negative-keywords", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            refreshToken,
            action: "analyze",
            dateRange,
            loginCustomerId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to analyze negative keywords"
          );
        }

        const data = await response.json();
        return data.analysis;
      } catch (err: any) {
        setError(err.message || "Failed to analyze negative keywords");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loginCustomerId]
  );

  const addNegativeKeywords = useCallback(
    async (
      customerId: string,
      refreshToken: string,
      adGroupId: string,
      keywords: string[]
    ): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/google-ads/negative-keywords", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            refreshToken,
            action: "add_negatives",
            adGroupId,
            keywords,
            loginCustomerId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to add negative keywords");
        }

        return true;
      } catch (err: any) {
        setError(err.message || "Failed to add negative keywords");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loginCustomerId]
  );

  return {
    loading,
    error,
    analyzeFraud,
    analyzeNegativeKeywords,
    addNegativeKeywords,
  };
}
