import type { Config } from "tailwindcss";

export const wanderlyPreset: Config = {
  content: [],
  theme: {
    extend: {
      colors: {
        // shadcn/ui CSS-variable tokens (values set in globals.css)
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        // Wanderly brand tokens
        ink: "#15191F",
        "ink-soft": "#2A2F38",
        "ink-mute": "#5C6470",
        paper: "#F5EFE3",
        "paper-warm": "#EFE6D4",
        "paper-deep": "#E8DEC9",
        cream: "#FAF6EC",
        terracotta: "#B85C38",
        "terracotta-deep": "#8E3F22",
        teal: "#1F4F4A",
        "teal-deep": "#0F312E",
        sage: "#88947B",
        gold: "#C9A24B",
        rust: "#D6856B",
        line: "#D8CCB3",
        "line-soft": "#E5DCC8",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      fontSize: {
        "display-2xl": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
        "display-md": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-sm": ["1.875rem", { lineHeight: "1.25" }],
        "display-xs": ["1.5rem", { lineHeight: "1.3" }],
      },
      letterSpacing: {
        badge: "0.175em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(21,25,31,0.08), 0 1px 2px -1px rgba(21,25,31,0.06)",
        "card-hover": "0 4px 12px 0 rgba(21,25,31,0.12), 0 2px 4px -1px rgba(21,25,31,0.08)",
        "card-elevated": "0 8px 24px 0 rgba(21,25,31,0.14), 0 4px 8px -2px rgba(21,25,31,0.1)",
      },
      backgroundImage: {
        "topo-light": "url('/patterns/topo-light.svg')",
        "topo-warm": "url('/patterns/topo-warm.svg')",
      },
    },
  },
  plugins: [],
} satisfies Config;
