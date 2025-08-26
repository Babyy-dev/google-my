"use client";

import { AuthProvider } from "@/lib/auth";
import { GoogleAdsProvider } from "@/app/contexts/GoogleAdsContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <GoogleAdsProvider>{children}</GoogleAdsProvider>
    </AuthProvider>
  );
}
