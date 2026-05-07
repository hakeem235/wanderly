"use client";

import { useState, useTransition } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { createSegment } from "@/actions/segments";

const TYPES = [
  { value: "FLIGHT",   label: "Flight",   icon: "✈" },
  { value: "LODGING",  label: "Lodging",  icon: "🏨" },
  { value: "ACTIVITY", label: "Activity", icon: "🎫" },
  { value: "TRANSFER", label: "Transfer", icon: "🚗" },
  { value: "FOOD",     label: "Dining",   icon: "🍽" },
  { value: "NOTE",     label: "Note",     icon: "📝" },
] as const;

type SegmentType = (typeof TYPES)[number]["value"];

export function AddSegmentDialog({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<SegmentType>("FLIGHT");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const payload: Record<string, unknown> = {};
    if (type === "FLIGHT") {
      payload.from = fd.get("from"); payload.to = fd.get("to");
      payload.flightNumber = fd.get("flightNumber"); payload.airline = fd.get("airline");
      payload.cabin = fd.get("cabin");
    } else if (type === "LODGING") {
      payload.address = fd.get("address"); payload.confirmationCode = fd.get("confirmationCode");
      payload.roomType = fd.get("roomType");
    } else if (type === "ACTIVITY" || type === "FOOD") {
      payload.address = fd.get("address"); payload.confirmationCode = fd.get("confirmationCode");
    } else if (type === "TRANSFER") {
      payload.from = fd.get("from"); payload.to = fd.get("to"); payload.mode = fd.get("mode");
    } else if (type === "NOTE") {
      payload.content = fd.get("content");
    }

    startTransition(async () => {
      try {
        await createSegment({
          tripId,
          type,
          title:    fd.get("title") as string,
          startsAt: fd.get("startsAt") as string,
          endsAt:   (fd.get("endsAt") as string) || undefined,
          payload,
        });
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg border border-dashed border-line px-4 py-2.5 text-sm text-ink-mute hover:border-terracotta hover:text-terracotta transition-colors">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add segment
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-paper border border-line shadow-card-elevated p-6 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="font-display text-display-xs text-ink">
            Add <em>segment</em>
          </Dialog.Title>

          {/* Type selector */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-badge transition-colors ${
                  type === t.value
                    ? "bg-terracotta text-paper"
                    : "bg-paper-deep text-ink-mute hover:text-ink"
                }`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field label="Title" htmlFor="title">
              <input id="title" name="title" type="text" required placeholder={titlePlaceholder(type)} className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts at" htmlFor="startsAt">
                <input id="startsAt" name="startsAt" type="datetime-local" required className={inputCls} />
              </Field>
              {type !== "NOTE" && (
                <Field label="Ends at (optional)" htmlFor="endsAt">
                  <input id="endsAt" name="endsAt" type="datetime-local" className={inputCls} />
                </Field>
              )}
            </div>

            {/* Type-specific fields */}
            {type === "FLIGHT" && <FlightFields />}
            {type === "LODGING" && <LodgingFields />}
            {(type === "ACTIVITY" || type === "FOOD") && <LocationFields />}
            {type === "TRANSFER" && <TransferFields />}
            {type === "NOTE" && <NoteFields />}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 rounded-lg border border-line py-2.5 text-sm text-ink-mute hover:text-ink transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button type="submit" disabled={isPending} className="flex-1 rounded-lg bg-terracotta py-2.5 text-sm font-medium text-paper hover:bg-terracotta-deep transition-colors disabled:opacity-60">
                {isPending ? "Adding…" : "Add segment"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function titlePlaceholder(type: SegmentType) {
  const map: Record<SegmentType, string> = {
    FLIGHT:   "Saudia SV803 RUH → NRT",
    LODGING:  "Park Hyatt Tokyo",
    ACTIVITY: "Tsukiji Outer Market",
    TRANSFER: "Airport → Hotel",
    FOOD:     "Narisawa",
    NOTE:     "Pack light — it's hot in August",
  };
  return map[type];
}

function FlightFields() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From (IATA)" htmlFor="from"><input id="from" name="from" type="text" placeholder="RUH" maxLength={4} className={inputCls} /></Field>
        <Field label="To (IATA)" htmlFor="to"><input id="to" name="to" type="text" placeholder="NRT" maxLength={4} className={inputCls} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Flight number" htmlFor="flightNumber"><input id="flightNumber" name="flightNumber" type="text" placeholder="SV803" className={inputCls} /></Field>
        <Field label="Cabin" htmlFor="cabin">
          <select id="cabin" name="cabin" defaultValue="economy" className={inputCls}>
            {["economy","premium","business","first"].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Airline" htmlFor="airline"><input id="airline" name="airline" type="text" placeholder="Saudia" className={inputCls} /></Field>
    </>
  );
}

function LodgingFields() {
  return (
    <>
      <Field label="Address" htmlFor="address"><input id="address" name="address" type="text" placeholder="3-7-1-2 Nishishinjuku, Tokyo" className={inputCls} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Confirmation code" htmlFor="confirmationCode"><input id="confirmationCode" name="confirmationCode" type="text" className={inputCls} /></Field>
        <Field label="Room type" htmlFor="roomType"><input id="roomType" name="roomType" type="text" placeholder="Deluxe King" className={inputCls} /></Field>
      </div>
    </>
  );
}

function LocationFields() {
  return (
    <>
      <Field label="Address / Location" htmlFor="address"><input id="address" name="address" type="text" className={inputCls} /></Field>
      <Field label="Confirmation / Booking ref" htmlFor="confirmationCode"><input id="confirmationCode" name="confirmationCode" type="text" className={inputCls} /></Field>
    </>
  );
}

function TransferFields() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From" htmlFor="from"><input id="from" name="from" type="text" placeholder="Narita Airport" className={inputCls} /></Field>
        <Field label="To" htmlFor="to"><input id="to" name="to" type="text" placeholder="Park Hyatt Tokyo" className={inputCls} /></Field>
      </div>
      <Field label="Mode" htmlFor="mode">
        <select id="mode" name="mode" defaultValue="taxi" className={inputCls}>
          {["taxi","train","bus","shuttle","private","ferry"].map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
        </select>
      </Field>
    </>
  );
}

function NoteFields() {
  return (
    <Field label="Note" htmlFor="content">
      <textarea id="content" name="content" rows={3} className={`${inputCls} resize-none`} placeholder="Pack light — it's hot in August" />
    </Field>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-mono uppercase tracking-badge text-ink-mute mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm text-ink placeholder:text-ink-mute/50 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all";
