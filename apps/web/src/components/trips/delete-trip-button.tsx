"use client";

import { useTransition } from "react";
import { deleteTrip } from "@/actions/trips";

export function DeleteTripButton({ tripId }: { tripId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this trip and all its segments? This cannot be undone.")) return;
    startTransition(() => deleteTrip(tripId));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-full rounded-lg border border-line py-2 text-sm text-ink-mute hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete trip"}
    </button>
  );
}
