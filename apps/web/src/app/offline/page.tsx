export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-terracotta/10 border border-terracotta/20 flex items-center justify-center mx-auto mb-6">
        <svg
          className="h-7 w-7 text-terracotta"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      </div>

      <h1 className="font-display text-3xl text-ink mb-3">
        You&apos;re <em>offline</em>
      </h1>
      <p className="text-ink-mute text-sm max-w-xs mb-8">
        No internet connection. Your cached trips are still available — navigate back to view them.
      </p>

      <a
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-5 py-2.5 text-sm font-medium text-cream hover:bg-terracotta-deep transition-colors"
      >
        View cached trips
      </a>
    </div>
  );
}
