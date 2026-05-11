"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  currentPlan: string;
}

export function UpgradeActions({ currentPlan }: Props) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);

  const isPro = currentPlan === "PRO" || currentPlan === "TEAM";

  async function handleCheckout() {
    setLoading("checkout");
    try {
      const res = await fetch("/api/billing/create-checkout", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Could not start checkout. Try again.");
        setLoading(null);
      }
    } catch {
      alert("Could not start checkout. Try again.");
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Could not open billing portal. Try again.");
        setLoading(null);
      }
    } catch {
      alert("Could not open billing portal. Try again.");
      setLoading(null);
    }
  }

  if (isPro) {
    return (
      <div className="space-y-3">
        <div className="text-center py-3 bg-teal/10 border border-teal/20 rounded-lg text-sm text-teal font-medium">
          You are on the {currentPlan} plan
        </div>
        <Button
          variant="outline"
          className="w-full border-line text-ink-mute hover:text-ink"
          onClick={handlePortal}
          disabled={loading !== null}
        >
          {loading === "portal" ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Manage billing
        </Button>
      </div>
    );
  }

  return (
    <Button
      className="w-full bg-terracotta hover:bg-terracotta-deep text-cream h-12 text-base font-medium"
      onClick={handleCheckout}
      disabled={loading !== null}
    >
      {loading === "checkout" ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : null}
      Upgrade to Pro — $12/mo
    </Button>
  );
}
