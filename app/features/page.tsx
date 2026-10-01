import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  Zap,
  Shield,
  Layers,
  Database,
  Terminal,
  Cpu,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle,
  FileCode,
  Gauge,
  Sliders,
  Share2,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — APT API Workbench",
  description: "Explore the complete feature set of APT: Instant Guest Mode, SSRF Shield, Collections, and Performance.",
};

export default function FeaturesPage() {
  const deepFeatures = [
    {
      title: "Zero-Barrier Guest Mode",
      tagline: "API testing without sign-up roadblocks",
      description:
        "Unlike modern desktop clients that demand cloud accounts just to send a basic GET request, APT provides a first-class guest experience. Compose queries, inspect payloads, view status codes, and preserve your drafts entirely in browser localStorage.",
      bullets: [
        "No account creation or credit card required",
        "Instant request history stored locally",
        "Full support for all HTTP verbs and headers",
        "Zero tracking or telemetry data collection",
      ],
      icon: Zap,
    },
    {
      title: "Hardened SSRF Network Guardian",
      tagline: "Enterprise safety for hosted environments",
      description:
        "When hosted publicly, APT's undici-based proxy verifies target hosts against DNS resolution records, actively pinning connection sockets and barring requests to local addresses, private RFC-1918 subnets, loopbacks, and AWS/GCP metadata endpoints.",
      bullets: [
        "DNS re-binding attack mitigation",
        "Configurable private subnet policy for local servers",
        "Enforces strict 2 MB response limits to prevent heap overflow",
        "Timeout safeguards up to 45 seconds",
      ],
      icon: Shield,
    },
    {
      title: "PostgreSQL Cloud Workspaces",
      tagline: "Seamless multi-project organization",
      description:
        "When you choose to sign in, your requests seamlessly migrate to PostgreSQL persistence. Create isolated project workspaces, group named queries into collections, and sync across any browser without third-party vendor lock-in.",
      bullets: [
        "Up to 100 private projects per account",
        "500 saved requests per project with auto-pruning history",
        "Transactional safety with PostgreSQL advisory locks",
        "Salted scrypt password hashing & HttpOnly cookies",
      ],
      icon: Database,
    },
    {
      title: "Cyberpunk HUD & Design System",
      tagline: "Crafted for focused, tactile developer experience",
      description:
        "Built with an uncompromising cyberpunk aesthetic: clip-path chamfers instead of generic border-radii, CRT scanline overlays, tech-grid textures, Orbitron and JetBrains Mono typography, and high-contrast color tokens.",
      bullets: [
        "Reduced motion accessibility support",
        "Tactile glitch and pulse animations",
        "Keyboard-first navigation (Ctrl+Enter to send, Alt+N for new)",
        "Zero ad-hoc CSS; 100% token-governed theme",
      ],
      icon: Terminal,
    },
    {
      title: "Deep Response Diagnostics",
      tagline: "Sub-millisecond insight into your APIs",
      description:
        "Inspect every aspect of upstream server behavior: precise duration timings in milliseconds, total payload sizes, HTTP status codes, raw headers, formatted JSON syntax views, and quick one-click clipboard exports.",
      bullets: [
        "Response size and duration benchmarks",
        "Full response header inspection",
        "Pretty-print JSON formatting with syntax preservation",
        "Quick copy buttons for headers and response body",
      ],
      icon: Gauge,
    },
    {
      title: "Headers & Secret Masking",
      tagline: "Prevent accidental credential exposure",
      description:
        "Headers containing passwords, tokens, API keys, or authorization cookies are automatically masked and sanitized before saving to prevent accidental credential leakage in saved collections.",
      bullets: [
        "Automatic regex detection of sensitive keys",
        "One-click toggle for individual header rows",
        "Bearer token and API key pre-configured modes",
        "Separate parameter and header tab management",
      ],
      icon: Sliders,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        {/* Header */}
        <div className="text-center">
          <span className="chamfer-xs border border-accent/40 bg-accent/10 px-4 py-1.5 font-accent text-xs uppercase tracking-[0.3em] text-accent">
            // Architecture & Capabilities
          </span>
          <h1 className="mt-6 font-display text-4xl font-black uppercase tracking-wider text-foreground sm:text-6xl">
            Everything You Need.
            <br />
            <span className="text-accent text-glow">Nothing You Don't.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
            Engineered from scratch to replace bloated desktop API clients with a razor-sharp,
            lightweight, and fully private web workbench.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
          {deepFeatures.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="chamfer flex flex-col justify-between border border-border bg-card/70 p-8 glow-accent-sm transition-all hover:border-accent/60 hover:bg-card"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="chamfer-xs grid size-10 place-items-center border border-accent/40 bg-accent/10 text-accent">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                        {item.title}
                      </h3>
                      <span className="font-accent text-[11px] uppercase tracking-wide text-accent">
                        {item.tagline}
                      </span>
                    </div>
                  </div>

                  <p className="mt-5 font-mono text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>

                  <ul className="mt-6 space-y-2 border-t border-border/60 pt-6 font-mono text-xs">
                    {item.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-2.5 text-foreground/90">
                        <CheckCircle className="size-3.5 shrink-0 text-accent" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="chamfer border border-border bg-card p-10 glow-accent-sm">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground sm:text-3xl">
              Experience the Speed Yourself
            </h2>
            <p className="mx-auto mt-3 max-w-md font-mono text-xs text-muted-foreground">
              No download. No installer. No forced accounts. Launch the workbench right in your browser.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/workbench"
                className="chamfer flex items-center gap-2 border border-accent bg-accent px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-background hover:bg-accent/90"
              >
                <Zap className="size-4 fill-current" />
                <span>Launch Live Workbench</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
