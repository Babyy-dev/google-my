// app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/websites", label: "Your Websites" }, // <-- ADD THIS LINE
    { href: "/dashboard/click-fraud", label: "Click Fraud" },
    { href: "/dashboard/keywords", label: "Keywords" },
    { href: "/dashboard/billing", label: "Billing" },
    { href: "/dashboard/settings", label: "Settings" },
    { href: "/dashboard/how-it-works", label: "How It Works" },
  ];

  return (
    <ProtectedRoute>
      <div className="relative min-h-[100dvh] w-full">
        {/* ... (rest of the file is the same) */}
        <aside className="fixed inset-y-0 top-16 hidden w-64 border-r border-[color-mix(in_oklab,currentColor_12%,transparent)] bg-background/85 backdrop-blur md:flex md:flex-col">
          <div className="px-4 pb-3 pt-4 text-xs font-medium uppercase tracking-wide text-foreground/60">
            Dashboard
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-6">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-[oklch(0.96_0.07_40)] hover:text-[oklch(0.36_0.12_40)]",
                  pathname === l.href &&
                    "bg-[oklch(0.96_0.07_40)] text-[oklch(0.36_0.12_40)]"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-[color-mix(in_oklab,currentColor_12%,transparent)] p-3 text-xs text-foreground/60">
            © {new Date().getFullYear()} AdShield
          </div>
        </aside>

        <main className="md:pl-64">
          <div className="mx-auto w-full max-w-screen-2xl px-6 pb-12 pt-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
