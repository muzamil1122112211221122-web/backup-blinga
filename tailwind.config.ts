import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "spin-reverse": {
          from: { transform: "rotate(360deg)" },
          to: { transform: "rotate(0deg)" },
        },
        "twinkle": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "toast-pop-in": {
          "0%": { opacity: "0", transform: "scale(0.65) translateY(20px)" },
          "65%": { opacity: "1", transform: "scale(1.06) translateY(-3px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "toast-pop-out": {
          "0%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "100%": { opacity: "0", transform: "scale(0.8) translateY(10px)" },
        },
        "toast-pop-slide-in": {
          "0%": { opacity: "0", transform: "scale(0.5) translateY(-60px)" },
          "55%": { opacity: "1", transform: "scale(1.07) translateY(6px)" },
          "75%": { transform: "scale(0.97) translateY(-3px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "toast-pop-slide-out": {
          "0%": { opacity: "1", transform: "scale(1) translateY(0)" },
          "30%": { transform: "scale(1.04) translateY(-4px)" },
          "100%": { opacity: "0", transform: "scale(0.7) translateY(-40px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin-slow 10s linear infinite",
        "spin-reverse": "spin-reverse 8s linear infinite",
        "twinkle": "twinkle 2s ease-in-out infinite",
        "twinkle-delay": "twinkle 3s ease-in-out infinite 1s",
        "toast-pop-in": "toast-pop-in 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "toast-pop-out": "toast-pop-out 0.22s ease-in forwards",
        "toast-pop-slide-in": "toast-pop-slide-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "toast-pop-slide-out": "toast-pop-slide-out 0.28s cubic-bezier(0.55, 0, 1, 0.45) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
