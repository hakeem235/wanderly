"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { createTrip } from "@/actions/trips";

export function CreateTripDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const budgetRaw = fd.get("budget") as string;
    const budgetCents = budgetRaw ? Math.round(parseFloat(budgetRaw) * 100) : undefined;

    startTransition(async () => {
      try {
        const result = await createTrip({
          title:       fd.get("title") as string,
          destination: fd.get("destination") as string,
          startDate:   fd.get("startDate") as string,
          endDate:     fd.get("endDate") as string,
          budgetCents,
          currency:    (fd.get("currency") as string) || "USD",
        });
        setOpen(false);
        router.push(`/trips/${result.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-5 py-2.5 text-sm font-medium text-paper hover:bg-terracotta-deep transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New trip
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-paper border border-line shadow-card-elevated p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="font-display text-display-xs text-ink">
            New <em>trip</em>
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-ink-mute">
            Give your trip a title and pick your dates.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Trip title" htmlFor="title">
              <input
                id="title"
                name="title"
                type="text"
                required
                placeholder="Tokyo Aug 2026"
                className={inputCls}
              />
            </Field>

            <Field label="Destination" htmlFor="destination">
              <input
                id="destination"
                name="destination"
                type="text"
                required
                placeholder="Tokyo, JP"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Departs" htmlFor="startDate">
                <input id="startDate" name="startDate" type="date" required className={inputCls} />
              </Field>
              <Field label="Returns" htmlFor="endDate">
                <input id="endDate" name="endDate" type="date" required className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Budget (optional)" htmlFor="budget">
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="5000"
                  className={inputCls}
                />
              </Field>
              <Field label="Currency" htmlFor="currency">
                <select id="currency" name="currency" defaultValue="USD" className={inputCls}>
                  {["USD", "EUR", "GBP", "SAR", "AED", "JPY"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="flex-1 rounded-lg border border-line py-2.5 text-sm text-ink-mute hover:text-ink transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 rounded-lg bg-terracotta py-2.5 text-sm font-medium text-paper hover:bg-terracotta-deep transition-colors disabled:opacity-60"
              >
                {isPending ? "Creating…" : "Create trip"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-mono uppercase tracking-badge text-ink-mute mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-sm text-ink placeholder:text-ink-mute/50 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all";
