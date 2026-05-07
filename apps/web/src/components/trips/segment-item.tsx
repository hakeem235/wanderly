"use client";

import { useTransition } from "react";
import { deleteSegment } from "@/actions/segments";

export type SegmentData = {
  id: string;
  type: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  payload: Record<string, unknown>;
};

const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  FLIGHT:   { icon: "✈",  color: "text-teal",       label: "Flight" },
  LODGING:  { icon: "🏨", color: "text-gold",        label: "Lodging" },
  ACTIVITY: { icon: "🎫", color: "text-sage",        label: "Activity" },
  TRANSFER: { icon: "🚗", color: "text-rust",        label: "Transfer" },
  FOOD:     { icon: "🍽", color: "text-terracotta",  label: "Dining" },
  NOTE:     { icon: "📝", color: "text-ink-mute",    label: "Note" },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function SegmentItem({ segment, tripId }: { segment: SegmentData; tripId: string }) {
  const meta = TYPE_META[segment.type] ?? { icon: "•", color: "text-ink-mute", label: segment.type };
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Remove this segment?")) return;
    startTransition(() => deleteSegment(tripId, segment.id));
  }

  return (
    <div className="group flex gap-4 py-4 px-4 rounded-xl hover:bg-paper-warm transition-colors">
      <div className={`mt-0.5 text-xl flex-shrink-0 w-8 text-center ${meta.color}`}>
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-badge text-ink-mute">
              {meta.label}
            </span>
            <h4 className="font-body text-sm font-medium text-ink leading-snug mt-0.5">
              {segment.title}
            </h4>
          </div>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-mute hover:text-destructive text-xs px-2 py-1 rounded"
            aria-label="Delete segment"
          >
            {isPending ? "…" : "✕"}
          </button>
        </div>

        <p className="mt-1 text-xs text-ink-mute font-mono">
          {formatTime(segment.startsAt)}
          {segment.endsAt && ` — ${formatTime(segment.endsAt)}`}
        </p>

        <SegmentPayload type={segment.type} payload={segment.payload} />
      </div>
    </div>
  );
}

function SegmentPayload({ type, payload }: { type: string; payload: Record<string, unknown> }) {
  if (type === "FLIGHT") {
    return (
      <p className="mt-1.5 text-xs text-ink-mute">
        {[payload.from, payload.to].filter(Boolean).map(String).join(" → ")}
        {!!payload.flightNumber && ` · ${String(payload.flightNumber)}`}
        {!!payload.cabin && ` · ${String(payload.cabin).charAt(0).toUpperCase() + String(payload.cabin).slice(1)}`}
      </p>
    );
  }
  if (type === "LODGING") {
    return (
      <p className="mt-1.5 text-xs text-ink-mute">
        {payload.address != null ? String(payload.address) : null}
        {!!payload.confirmationCode && ` · Ref: ${String(payload.confirmationCode)}`}
      </p>
    );
  }
  if (type === "NOTE") {
    return <p className="mt-1.5 text-xs text-ink-mute italic">{payload.content != null ? String(payload.content) : null}</p>;
  }
  if (payload.address) {
    return <p className="mt-1.5 text-xs text-ink-mute">{String(payload.address)}</p>;
  }
  return null;
}
