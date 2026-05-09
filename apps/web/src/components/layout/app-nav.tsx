import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export async function AppNav() {
  const locale = await getLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-xl text-ink">
            Wander<em>ly</em>
          </span>
        </Link>

        {/* Search shortcut */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <Link href="/search" className="relative w-full group">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <svg className="h-4 w-4 text-ink-mute" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="w-full rounded-lg border border-line bg-paper py-2 pl-9 pr-4 text-sm text-ink-mute/60 group-hover:border-terracotta/40 transition-colors">
              Search flights…
            </div>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link
            href="/plan"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:border-terracotta/40 hover:text-terracotta transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Plan
          </Link>
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-paper hover:bg-terracotta-deep transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New trip
          </Link>

          <LocaleSwitcher currentLocale={locale} />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
