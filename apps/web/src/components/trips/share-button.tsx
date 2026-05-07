"use client";

import { useTransition, useState } from "react";
import { createShareLink } from "@/actions/trips";

export function ShareButton({ tripId }: { tripId: string }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  function handleShare() {
    startTransition(async () => {
      const { token } = await createShareLink(tripId);
      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <button
      onClick={handleShare}
      disabled={isPending}
      className="w-full rounded-lg bg-paper-deep border border-line py-2 text-sm text-ink hover:border-terracotta hover:text-terracotta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {copied ? (
        <><span>✓</span> Link copied!</>
      ) : isPending ? (
        "Generating…"
      ) : (
        <><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>Share link</>
      )}
    </button>
  );
}
