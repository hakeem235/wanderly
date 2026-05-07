import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export async function AppNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-xl text-ink">
            Wander<em>ly</em>
          </span>
        </Link>

        {/* Search bar placeholder */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
              <svg
                className="h-4 w-4 text-ink-mute"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="search"
              placeholder="Search destinations, trips..."
              className="w-full rounded-lg border border-line bg-paper py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-mute/60 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <Link
            href="/plan"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-paper hover:bg-terracotta-deep transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New trip
          </Link>

          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
