import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-display-md text-ink">
            Wander<em>ly</em>
          </h1>
          <p className="mt-2 text-sm text-ink-mute">
            Your trips, beautifully organized.
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-cream border border-line rounded-2xl shadow-card",
              headerTitle: "font-display text-display-xs text-ink",
              headerSubtitle: "text-sm text-ink-mute",
              formButtonPrimary:
                "bg-terracotta hover:bg-terracotta-deep text-paper rounded-lg font-medium transition-colors",
              formFieldInput:
                "rounded-lg border border-line bg-paper text-ink placeholder:text-ink-mute/50 focus:ring-2 focus:ring-terracotta focus:border-transparent",
              formFieldLabel: "font-mono text-[10px] uppercase tracking-badge text-ink-mute",
              footerActionText: "text-ink-mute text-xs",
              footerActionLink: "text-terracotta hover:text-terracotta-deep",
            },
          }}
        />
      </div>
    </main>
  );
}
