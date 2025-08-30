// app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FraudDetectionSettings({ profile, onUpdate, saving }: any) {
  const [threshold, setThreshold] = useState(
    profile?.click_fraud_threshold || 3
  );
  const [windowHours, setWindowHours] = useState(
    profile?.click_fraud_window_hours || 24
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      click_fraud_threshold: threshold,
      click_fraud_window_hours: windowHours,
    });
  };

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
          <CardTitle>🛡️ Click Fraud Settings</CardTitle>
          <CardDescription>
            Configure the rules for automatic IP blocking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="click-threshold">
              IP Click Threshold
            </label>
            <p className="text-xs text-foreground/60">
              Block an IP after this many clicks.
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="click-threshold"
                type="number"
                value={threshold}
                onChange={(e) =>
                  setThreshold(parseInt(e.target.value, 10) || 2)
                }
                className="w-24"
                min="2"
                max="10"
              />
              <span className="text-sm text-foreground/70">clicks</span>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="time-window">
              Detection Time Window
            </label>
            <p className="text-xs text-foreground/60">
              Count clicks from the same IP within this period.
            </p>
            <Select
              value={String(windowHours)}
              onValueChange={(value: string) => setWindowHours(Number(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a time window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.0167">1 Minute</SelectItem>
                <SelectItem value="1">1 Hour</SelectItem>
                <SelectItem value="24">24 Hours (Recommended)</SelectItem>
                <SelectItem value="168">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// The rest of the page remains the same
export default function SettingsPage() {
  const { profile, loading, error, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company: "",
    phone_number: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        company: profile.company || "",
        phone_number: profile.phone_number || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      await updateProfile(formData);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsUpdate = async (updates: any) => {
    try {
      setSaving(true);
      await updateProfile(updates);
    } catch (err) {
      console.error("Failed to update settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        company: profile.company || "",
        phone_number: profile.phone_number || "",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Account Profile</CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="name">
                Full Name
              </label>
              <Input
                id="name"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="company">
                Company
              </label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Enter your company name"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="phone">
                Phone Number
              </label>
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={(e) =>
                  handleInputChange("phone_number", e.target.value)
                }
                placeholder="Enter your phone number"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <FraudDetectionSettings
        profile={profile}
        onUpdate={handleSettingsUpdate}
        saving={saving}
      />

      <Card>
        <CardHeader>
          <CardTitle>Security & Privacy</CardTitle>
          <CardDescription>Protect your account and data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-foreground/70">
                  Add an extra layer of security
                </p>
              </div>
              <Badge variant="outline" className="text-red-600 border-red-200">
                Disabled
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <h4 className="font-medium">Login Notifications</h4>
                <p className="text-sm text-foreground/70">
                  Get notified of new logins
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Enabled
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
