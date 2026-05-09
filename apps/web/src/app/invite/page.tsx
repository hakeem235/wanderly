"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const { userId } = useAuth();
  const router = useRouter();
  const [code, setCode]       = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  if (!userId) {
    router.replace("/sign-up");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/invite/redeem", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ code: code.trim().toUpperCase() }),
    });

    const data = (await res.json()) as { ok?: boolean; error?: string };

    if (res.ok && data.ok) {
      router.replace("/dashboard");
    } else {
      setError(data.error ?? "Something went wrong.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="font-display text-3xl text-ink">
            Wander<em>ly</em>
          </span>
          <p className="text-ink-mute text-sm mt-2">Closed beta · invitation only</p>
        </div>

        <div className="bg-paper border border-line rounded-2xl p-8">
          <h1 className="font-display text-xl text-ink mb-1">Enter your invite code</h1>
          <p className="text-sm text-ink-mute mb-6">
            Wanderly is invite-only during beta. Enter your code to unlock access.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WNDLY-XXXX-XXXX"
              className="w-full rounded-lg border border-line bg-paper-warm px-4 py-2.5 font-mono tracking-widest text-center text-sm uppercase placeholder:text-ink-mute/40 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
              maxLength={14}
              autoComplete="off"
              spellCheck={false}
            />

            {error && (
              <p className="text-sm text-terracotta">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading || code.length < 8}
              className="w-full bg-terracotta hover:bg-terracotta-deep text-cream"
            >
              {loading ? "Verifying…" : "Unlock access →"}
            </Button>
          </form>

          <p className="text-xs text-ink-mute text-center mt-6">
            No invite?{" "}
            <a href="mailto:beta@wanderly.co" className="text-terracotta hover:underline">
              Request one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
