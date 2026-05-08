import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main
      className="min-h-screen bg-paper flex flex-col items-center justify-center px-4 py-12"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 10%, rgba(184,92,56,0.06) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(31,79,74,0.04) 0%, transparent 40%)",
      }}
    >
      {/* Back to home */}
      <div className="w-full max-w-sm mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-ink-mute hover:text-ink transition-colors font-mono uppercase tracking-badge"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
      </div>

      {/* Wordmark */}
      <div className="mb-8 text-center">
        <Link href="/" className="font-display text-4xl text-ink hover:text-ink-soft transition-colors">
          Wander<em className="text-terracotta italic">ly</em>
        </Link>
        <p className="mt-2 text-sm text-ink-mute">
          Your trips, beautifully organized.
        </p>
      </div>

      {/* Clerk component — styled via variables so internal specificity doesn't fight us */}
      <SignIn
        appearance={{
          variables: {
            colorPrimary: "#B85C38",
            colorBackground: "#FAF6EC",
            colorText: "#15191F",
            colorTextSecondary: "#5C6470",
            colorTextOnPrimaryBackground: "#FAF6EC",
            colorInputBackground: "#F5EFE3",
            colorInputText: "#15191F",
            colorDanger: "#B85C38",
            borderRadius: "0.75rem",
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "14px",
            spacingUnit: "16px",
          },
          elements: {
            rootBox: "w-full max-w-sm",
            card:
              "!bg-cream !border !border-line !rounded-2xl !shadow-none !p-8",
            headerTitle:
              "!font-display !text-xl !text-ink !font-normal",
            headerSubtitle: "!text-sm !text-ink-mute",
            socialButtonsBlockButton:
              "!border !border-line !bg-paper hover:!bg-paper-warm !text-ink !text-sm !rounded-xl !transition-colors",
            socialButtonsBlockButtonText: "!text-ink !font-medium",
            dividerLine: "!bg-line",
            dividerText: "!text-ink-mute !text-xs !font-mono !uppercase !tracking-[0.1em]",
            formFieldLabel:
              "!font-mono !text-[10px] !uppercase !tracking-[0.15em] !text-ink-mute",
            formFieldInput:
              "!bg-paper !border !border-line !text-ink !text-sm !rounded-xl focus:!ring-2 focus:!ring-terracotta focus:!border-transparent !transition-colors",
            formButtonPrimary:
              "!bg-terracotta hover:!bg-terracotta-deep !text-paper !font-medium !text-sm !rounded-xl !transition-colors !shadow-none",
            footerActionText: "!text-ink-mute !text-xs",
            footerActionLink:
              "!text-terracotta hover:!text-terracotta-deep !font-medium",
            identityPreviewEditButton: "!text-terracotta",
            formResendCodeLink: "!text-terracotta",
            otpCodeFieldInput:
              "!border !border-line !bg-paper !text-ink !rounded-xl",
            alertText: "!text-sm",
            formFieldSuccessText: "!text-teal !text-xs",
            formFieldErrorText: "!text-terracotta !text-xs",
          },
        }}
      />

      <p className="mt-8 font-mono text-[10px] uppercase tracking-badge text-ink-mute">
        © 2026 Wanderly · Made in Riyadh
      </p>
    </main>
  );
}
