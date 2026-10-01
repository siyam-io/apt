import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { QuickTester } from "@/components/home/quick-tester";
import { GlitchText } from "@/components/ui/glitch-text";
import {
  Zap,
  Shield,
  Layers,
  Terminal,
  Cpu,
  Lock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Database,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const comparisonItems = [
    {
      feature: "Guest Mode (Test Without Login)",
      apt: true,
      postman: false,
      detail: "APT allows immediate execution with no account wall.",
    },
    {
      feature: "Application Footprint & RAM",
      apt: "~30-40 MB",
      postman: "800+ MB (Electron)",
      detail: "Zero desktop bloat; ultra-fast browser execution.",
    },
    {
      feature: "Cold Startup Latency",
      apt: "< 0.3s",
      postman: "10-15s",
      detail: "Loads in the blink of an eye with Turbopack Next.js.",
    },
    {
      feature: "SSRF & Private Network Guard",
      apt: true,
      postman: false,
      detail: "DNS-pinned hosted protection against internal host exploits.",
    },
    {
      feature: "Cloud Project Persistence",
      apt: true,
      postman: true,
      detail: "Optional PostgreSQL cloud sync whenever you choose to sign in.",
    },
    {
      feature: "Cyberpunk HUD & Keyboard First",
      apt: true,
      postman: false,
      detail: "Chamfered HUD styling, high-contrast dark theme, and Ctrl+Enter execution.",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "Instant Guest Testing",
      desc: "No forced sign-ups or corporate paywalls. Drop in a URL, choose your HTTP verb, send the payload, and get live diagnostics immediately.",
      badge: "Zero Friction",
    },
    {
      icon: Shield,
      title: "SSRF & Network Shield",
      desc: "Our native Undici dispatcher validates and pins DNS addresses to protect hosted deployments against private network probing and internal attacks.",
      badge: "Enterprise Security",
    },
    {
      icon: Database,
      title: "Hybrid Local + Cloud Sync",
      desc: "Guest requests and history persist seamlessly in local storage. When you're ready, connect your account to sync into PostgreSQL projects.",
      badge: "PostgreSQL Backed",
    },
    {
      icon: Terminal,
      title: "Full HTTP/REST Verbs",
      desc: "Full support for GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS with custom headers, query params, raw/JSON payloads, and auth headers.",
      badge: "Complete RFC",
    },
    {
      icon: Cpu,
      title: "Streaming Response Inspector",
      desc: "Live millisecond timing, payload size computation, formatted JSON pretty-printing, raw text viewing, and instant clipboard exports.",
      badge: "Real-time Metrics",
    },
    {
      icon: Lock,
      title: "Salted Scrypt Security",
      desc: "When using accounts, credentials are encrypted with salted scrypt, session tokens are HttpOnly and stored only as hashes server-side.",
      badge: "Zero Telemetry",
    },
  ];

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background Ambience */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/4 hidden size-[38rem] -skew-y-6 tech-grid-strong opacity-40 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 size-[28rem] rounded-full bg-accent/5 blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1/3 left-1/4 size-[32rem] rounded-full bg-accent-secondary/5 blur-[160px]"
      />

      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-6">
        {/* HERO SECTION */}
        <section className="pt-20 pb-16 text-center md:pt-28 md:pb-24">
          <div className="inline-flex items-center gap-2 chamfer-xs border border-accent/40 bg-accent/10 px-4 py-1.5 font-accent text-xs uppercase tracking-[0.3em] text-accent">
            <span className="size-2 rounded-full bg-accent animate-ping" />
            <span>Next-Gen API Workbench // 100% Guest Capable</span>
          </div>

          <h1 className="mt-8 font-display text-4xl font-black uppercase leading-[1.05] tracking-wider text-foreground sm:text-6xl lg:text-7xl">
            <span className="block">The API client</span>
            <span className="mt-2 block text-accent text-glow-lg animate-glitch">
              <GlitchText text="Built for pure speed." duration="5s" />
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Say goodbye to bloated 800 MB desktop apps and mandatory sign-in screens.
            Test APIs instantly in guest mode, organize into cloud projects, and monitor live latency.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/workbench"
              className="chamfer group flex items-center gap-2 border border-accent bg-accent px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-accent/90 glow-accent"
            >
              <Zap className="size-4 fill-current" />
              <span>Launch Workbench (No Login)</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/features"
              className="chamfer group flex items-center gap-2 border border-border bg-card/80 px-7 py-3.5 font-mono text-sm font-medium uppercase tracking-wider text-foreground transition-colors hover:border-accent/60"
            >
              <span>Explore Features</span>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-accent" />
              <span>No Credit Card or Account</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-accent" />
              <span>Full Postman Alternative</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-accent" />
              <span>Lightweight & Self-Hostable</span>
            </div>
          </div>
        </section>

        {/* INTERACTIVE LIVE QUICK TESTER */}
        <section className="py-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 text-center">
              <span className="font-accent text-[11px] uppercase tracking-[0.3em] text-accent">
                // Try It Live In 3 Seconds
              </span>
              <h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-wider text-foreground">
                Instant Request Runner
              </h2>
            </div>
            <QuickTester />
          </div>
        </section>

        {/* COMPARISON MATRIX (APT VS POSTMAN) */}
        <section className="py-20 md:py-28">
          <div className="text-center">
            <span className="font-accent text-xs uppercase tracking-[0.3em] text-accent">
              // Why Developers Switch
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-wide text-foreground sm:text-4xl">
              APT vs. Legacy API Clients
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-mono text-sm text-muted-foreground">
              Why run an entire Chromium browser just to fire a single JSON endpoint?
            </p>
          </div>

          <div className="mt-12 overflow-x-auto">
            <div className="chamfer min-w-[640px] border border-border bg-card/60 p-6 backdrop-blur-sm">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className="border-b border-border/80 pb-4 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-4 font-accent">Capability / Metric</th>
                    <th className="py-4 text-accent font-bold">APT Workbench</th>
                    <th className="py-4 text-muted-foreground">Postman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {comparisonItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="font-medium text-foreground">{item.feature}</div>
                        <div className="text-xs text-muted-foreground/80">{item.detail}</div>
                      </td>
                      <td className="py-4 font-bold text-accent">
                        {typeof item.apt === "boolean" ? (
                          item.apt ? (
                            <CheckCircle2 className="size-5 text-accent" />
                          ) : (
                            <XCircle className="size-5 text-destructive" />
                          )
                        ) : (
                          item.apt
                        )}
                      </td>
                      <td className="py-4 text-muted-foreground">
                        {typeof item.postman === "boolean" ? (
                          item.postman ? (
                            <CheckCircle2 className="size-5 text-accent" />
                          ) : (
                            <XCircle className="size-5 text-destructive" />
                          )
                        ) : (
                          item.postman
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CORE FEATURE GRID */}
        <section className="py-16">
          <div className="text-center">
            <span className="font-accent text-xs uppercase tracking-[0.3em] text-accent">
              // Engineered For Power
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold uppercase tracking-wide text-foreground sm:text-4xl">
              High-Tech Architecture
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-mono text-sm text-muted-foreground">
              Every component is tailored for developer ergonomics, security, and low-latency throughput.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div
                  key={index}
                  className="chamfer group flex flex-col justify-between border border-border bg-card/70 p-7 transition-all hover:border-accent/60 hover:bg-card glow-accent-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="chamfer-xs grid size-10 place-items-center bg-accent/10 border border-accent/30 text-accent transition-transform group-hover:scale-110">
                        <Icon className="size-5" />
                      </div>
                      <span className="font-accent text-[10px] uppercase tracking-wider text-muted-foreground">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-lg font-bold tracking-wide text-foreground group-hover:text-accent transition-colors">
                      {feat.title}
                    </h3>
                    <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2 font-mono text-[11px] text-accent">
                    <span>Explore module</span>
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="my-20">
          <div className="chamfer relative overflow-hidden border border-accent/40 bg-card p-10 text-center glow-accent md:p-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-accent/10 blur-[100px]"
            />
            <span className="font-accent text-xs uppercase tracking-[0.3em] text-accent">
              // Ready To Work?
            </span>
            <h2 className="mt-3 font-display text-3xl font-black uppercase tracking-wider text-foreground sm:text-5xl">
              Start Testing APIs in Seconds.
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-mono text-sm leading-relaxed text-muted-foreground">
              No registration needed. Jump straight into the workbench and test your first endpoint now.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/workbench"
                className="chamfer flex items-center gap-2 border border-accent bg-accent px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-wider text-background transition-all hover:bg-accent/90"
              >
                <Zap className="size-4 fill-current" />
                <span>Open Workbench</span>
              </Link>
              <Link
                href="/docs"
                className="chamfer flex items-center gap-2 border border-border bg-background px-6 py-3.5 font-mono text-sm font-medium uppercase tracking-wider text-foreground hover:border-accent"
              >
                <span>Read Documentation</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
