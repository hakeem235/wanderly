export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 text-4xl">✉️</div>
        <h1 className="font-display text-display-sm text-ink mb-2">
          Check your inbox
        </h1>
        <p className="text-sm text-ink-mute">
          We sent a magic link to your email. Click it to sign in — the link
          expires in 10 minutes.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-4 text-xs font-mono text-terracotta border border-terracotta/20 rounded-lg px-4 py-2 bg-terracotta/5">
            DEV: Magic link logged to server console.
          </p>
        )}
      </div>
    </main>
  );
}
