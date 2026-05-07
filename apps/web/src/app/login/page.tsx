import { signIn } from "@/auth";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await auth();
  if (session) redirect(searchParams.callbackUrl ?? "/dashboard");

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-display-md text-ink">
            Wander<em>ly</em>
          </h1>
          <p className="mt-2 text-sm text-ink-mute font-body">
            Your trips, beautifully organized.
          </p>
        </div>

        <div className="bg-cream border border-line rounded-2xl p-8 shadow-card">
          <h2 className="font-display text-display-xs text-ink mb-1">
            Sign in
          </h2>
          <p className="text-sm text-ink-mute mb-6">
            We&apos;ll send a magic link to your email.
          </p>

          <form
            action={async (formData: FormData) => {
              "use server";
              const email = formData.get("email") as string;
              await signIn("nodemailer", {
                email,
                redirectTo: searchParams.callbackUrl ?? "/dashboard",
              });
            }}
          >
            <label
              htmlFor="email"
              className="block text-xs font-mono uppercase tracking-badge text-ink-mute mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-mute/50 focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent transition-all"
            />

            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-terracotta px-5 py-2.5 text-sm font-medium text-paper hover:bg-terracotta-deep transition-colors focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2"
            >
              Send magic link
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-ink-mute">
          By signing in you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
