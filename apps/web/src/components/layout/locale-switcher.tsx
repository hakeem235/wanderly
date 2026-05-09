"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = async () => {
    const next = currentLocale === "en" ? "ar" : "en";
    await fetch("/api/locale", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ locale: next }),
    });
    startTransition(() => router.refresh());
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="text-sm font-mono text-ink-mute hover:text-ink transition-colors px-2 py-1 rounded border border-transparent hover:border-line"
      title={currentLocale === "en" ? "Switch to Arabic" : "Switch to English"}
    >
      {currentLocale === "en" ? "عربي" : "EN"}
    </button>
  );
}
