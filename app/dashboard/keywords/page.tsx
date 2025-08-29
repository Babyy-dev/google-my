// app/dashboard/keywords/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGoogleAds, NegativeKeywordAnalysis } from "@/hooks/useGoogleAds";
import { useAuth } from "@/lib/auth";
import { useGoogleAdsContext } from "@/app/contexts/GoogleAdsContext";
import { ConnectGoogleAds } from "@/components/auth/connect-google-ads";

const initialAnalysis: NegativeKeywordAnalysis = {
  totalSearchTerms: 0,
  suggestedNegatives: 0,
  potentialMonthlySavings: 0,
  wastedClicks: 0,
  topBadTerms: [],
  suggestions: [],
};

export default function KeywordsPage() {
  const { session } = useAuth();
  const { analyzeNegativeKeywords, addNegativeKeywords, loading, error } =
    useGoogleAds();
  const {
    isConnected,
    customerId,
    loading: contextLoading,
  } = useGoogleAdsContext();
  const [analysis, setAnalysis] =
    useState<NegativeKeywordAnalysis>(initialAnalysis);

  const handleAnalyze = useCallback(
    async (id: string) => {
      if (!session?.provider_refresh_token) return;
      try {
        const result = await analyzeNegativeKeywords(
          id.replace(/-/g, ""),
          session.provider_refresh_token
        );
        setAnalysis(result);
      } catch (e) {
        console.error(e);
      }
    },
    [session, analyzeNegativeKeywords]
  );

  useEffect(() => {
    if (isConnected && customerId) {
      handleAnalyze(customerId);
    }
  }, [isConnected, customerId, handleAnalyze]);

  const handleAddKeywords = async (adGroupId: string, keywords: string[]) => {
    if (!session?.provider_refresh_token || !customerId) return;
    try {
      await addNegativeKeywords(
        customerId.replace(/-/g, ""),
        session.provider_refresh_token,
        adGroupId,
        keywords
      );
      handleAnalyze(customerId); // Refresh analysis after adding keywords
    } catch (e) {
      console.error(e);
    }
  };

  if (contextLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isConnected) {
    return <ConnectGoogleAds />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Negative Keyword Analysis</CardTitle>
          <CardDescription>
            Review suggested negative keywords to improve your campaign
            performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-lg border">
              <div className="text-xs text-foreground/60">
                Total Search Terms
              </div>
              <div className="text-2xl font-bold">
                {analysis.totalSearchTerms.toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-xs text-foreground/60">
                Suggested Negatives
              </div>
              <div className="text-2xl font-bold">
                {analysis.suggestedNegatives.toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-xs text-foreground/60">
                Potential Monthly Savings
              </div>
              <div className="text-2xl font-bold">
                ${analysis.potentialMonthlySavings.toFixed(2)}
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="text-xs text-foreground/60">Wasted Clicks</div>
              <div className="text-2xl font-bold">
                {analysis.wastedClicks.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Wasted Spend Search Terms</CardTitle>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Search Term</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Conversions</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Ad Group</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.topBadTerms.map((term: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>{term.searchTerm}</TableCell>
                  <TableCell>${term.cost}</TableCell>
                  <TableCell>{term.clicks}</TableCell>
                  <TableCell>{term.conversions}</TableCell>
                  <TableCell>{term.campaign}</TableCell>
                  <TableCell>{term.adGroup}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleAddKeywords(term.adGroupId, [term.searchTerm])
                      }
                      disabled={loading}
                    >
                      Add as Negative
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
