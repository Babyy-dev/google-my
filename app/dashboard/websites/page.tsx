// app/dashboard/websites/page.tsx
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
import { Input } from "@/components/ui/input";
import { useGoogleAdsContext } from "@/app/contexts/GoogleAdsContext";
import { ConnectGoogleAds } from "@/components/auth/connect-google-ads";

// FIX: Define a specific type for a Website object
interface Website {
  url: string;
  googleAdsConnected: boolean;
}

// FIX: Explicitly type the initial empty array
const initialWebsites: Website[] = [];

export default function WebsitesPage() {
  const { isConnected } = useGoogleAdsContext();
  // FIX: Provide the type to the useState hook
  const [websites, setWebsites] = useState<Website[]>(initialWebsites);
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");

  // In a real app, this would save to your Supabase 'websites' table
  const handleAddWebsite = () => {
    if (newWebsiteUrl && !websites.some((w) => w.url === newWebsiteUrl)) {
      setWebsites([
        ...websites,
        { url: newWebsiteUrl, googleAdsConnected: false },
      ]);
      setNewWebsiteUrl("");
    }
  };

  // If no websites have been added yet, show a welcome/onboarding screen
  if (websites.length === 0) {
    return (
      <Onboarding
        onAddWebsite={handleAddWebsite}
        newWebsiteUrl={newWebsiteUrl}
        setNewWebsiteUrl={setNewWebsiteUrl}
      />
    );
  }

  // If a website has been added but Google Ads is not connected
  if (websites.length > 0 && !isConnected) {
    return (
      <ConnectGoogleAds
        title={`Connect Google Ads for ${websites[0].url}`}
        description="To protect your website, connect the Google Ads account that runs its campaigns."
      />
    );
  }

  // Main view showing connected websites
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Protected Websites</CardTitle>
          <CardDescription>
            Manage the websites and Google Ads accounts you are protecting with
            AdShield.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {websites.map((website, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-semibold">{website.url}</p>
                <p className="text-sm text-green-600">Status: Protected</p>
              </div>
              <Button variant="outline">Manage</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// A helper component for the initial onboarding state
function Onboarding({ onAddWebsite, newWebsiteUrl, setNewWebsiteUrl }: any) {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to AdShield!</CardTitle>
          <CardDescription>
            Let's get your first website protected. Enter the URL of the website
            you want to shield from click fraud.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="url"
            placeholder="e.g., your-company-website.com"
            value={newWebsiteUrl}
            onChange={(e) => setNewWebsiteUrl(e.target.value)}
          />
          <Button onClick={onAddWebsite} className="w-full">
            Add Website
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
