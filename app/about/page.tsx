import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import {
  Terminal,
  Zap,
  Shield,
  Heart,
  Layers,
  Cpu,
  CheckCircle,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About APT — The Minimalist Postman Alternative",
  description: "Why we built APT: fighting developer bloat, honoring hacker ergonomics, and creating a faster API workbench.",
};

export default function AboutPage() {
  const values = [
    {
      title: "Anti-Bloat Manifesto",
      desc: "An API client shouldn't take 15 seconds to open, nor should it consume 1 GB of your machine's RAM. We believe developer tools must be razor-sharp, instant, and respectful of your hardware.",
    },
    {
      title: "No Forced Cloud Locks",
      desc: "Testing an API is a fundamental developer right, not a subscription tier. APT guarantees that guest mode is always first-class. You can test forever without creating an account.",
    },
    {
      title: "Radical Transparency",
      desc: "Zero tracking, zero analytics scripts, and zero corporate telemetry. All project collections and passwords use salted scrypt and live in your own database.",
    },
    {
      title: "Cyberpunk HUD Ergonomics",
      desc: "Inspired by William Gibson's cyberspace and terminal aesthetic. Chamfered geometries, CRT scanlines, and high-contrast monospace palettes provide immersion and precision.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        {/* Hero */}
        <div className="text-center">
          <span className="chamfer-xs border border-accent/40 bg-accent/10 px-4 py-1.5 font-accent text-xs uppercase tracking-[0.3em] text-accent">
            // Origin & Vision
          </span>
          <h1 className="mt-6 font-display text-4xl font-black uppercase tracking-wider text-foreground sm:text-5xl">
            Why We Built APT
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
            API development used to be simple: curl, inspect, iterate. Then desktop API clients became bloated enterprise platforms that locked basic features behind cloud logins.
          </p>
        </div>

        {/* Narrative Section */}
        <section className="mt-16">
          <div className="chamfer border border-border bg-card/70 p-8 md:p-12">
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-accent text-glow-sm">
              The Postman Fatigue
            </h2>
            <div className="mt-6 space-y-4 font-mono text-sm leading-relaxed text-foreground/90">
              <p>
                Like thousands of engineers, we found ourselves waiting 12 seconds for our desktop API clients to start up just to test a single webhook. We watched memory usage climb past 800 MB for a simple HTTP probe. Worst of all, basic offline scratchpads started requiring team invites and corporate accounts.
              </p>
              <p>
                APT (API Workbench) was built as an antidote: a lightweight web-native workbench running on Next.js 16 and Node 24 that opens instantaneously in your browser tab.
              </p>
              <p>
                Whether you just want to test an endpoint without logging in or you want a full project collection synced with PostgreSQL, APT provides both without compromise.
              </p>
            </div>
          </div>
        </section>

        {/* Values Grid */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Core Principles
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {values.map((val, idx) => (
              <div key={idx} className="chamfer border border-border bg-card/60 p-6">
                <h3 className="font-display text-base font-bold text-accent">
                  {val.title}
                </h3>
                <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Architecture Stack
          </h2>
          <div className="chamfer mt-6 border border-border bg-card/60 p-6">
            <div className="grid grid-cols-2 gap-4 font-mono text-xs sm:grid-cols-4">
              <div className="border-l-2 border-accent pl-3">
                <div className="text-muted-foreground uppercase text-[10px]">Framework</div>
                <div className="font-bold text-foreground mt-1">Next.js 16 (App Router)</div>
              </div>
              <div className="border-l-2 border-accent-secondary pl-3">
                <div className="text-muted-foreground uppercase text-[10px]">Styling</div>
                <div className="font-bold text-foreground mt-1">Tailwind CSS v4</div>
              </div>
              <div className="border-l-2 border-accent-tertiary pl-3">
                <div className="text-muted-foreground uppercase text-[10px]">Database</div>
                <div className="font-bold text-foreground mt-1">PostgreSQL + PG Pool</div>
              </div>
              <div className="border-l-2 border-accent pl-3">
                <div className="text-muted-foreground uppercase text-[10px]">HTTP Engine</div>
                <div className="font-bold text-foreground mt-1">Undici 8 + Node 24</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/workbench"
            className="chamfer inline-flex items-center gap-2 border border-accent bg-accent px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-background hover:bg-accent/90 glow-accent"
          >
            <Zap className="size-4 fill-current" />
            <span>Try APT In Action</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
