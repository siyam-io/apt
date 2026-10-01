import Link from "next/link";
import { Terminal, Shield, Zap, GitBranch, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-card/60 pt-16 pb-12 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:gap-16">
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <span className="chamfer-xs grid size-8 place-items-center bg-accent font-display text-sm font-bold text-background glow-accent-sm">
                a
              </span>
              <span className="font-display text-base font-bold uppercase tracking-[0.25em] text-foreground">
                apt
              </span>
            </Link>
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              The high-performance, cyberpunk API client & workbench. Zero Electron bloat. 100% guest-friendly. Built for engineers.
            </p>
            <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent">
              <span className="size-2 rounded-full bg-accent animate-ping" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="flex flex-col gap-3">
            <h4 className="font-accent text-xs uppercase tracking-[0.25em] text-foreground">
              Platform
            </h4>
            <ul className="flex flex-col gap-2 font-mono text-xs text-muted-foreground">
              <li>
                <Link href="/workbench" className="transition-colors hover:text-accent">
                  API Workbench (Live)
                </Link>
              </li>
              <li>
                <Link href="/features" className="transition-colors hover:text-accent">
                  Feature Matrix
                </Link>
              </li>
              <li>
                <Link href="/docs" className="transition-colors hover:text-accent">
                  Documentation & Guides
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-accent">
                  About & Mission
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Capabilities */}
          <div className="flex flex-col gap-3">
            <h4 className="font-accent text-xs uppercase tracking-[0.25em] text-foreground">
              Capabilities
            </h4>
            <ul className="flex flex-col gap-2 font-mono text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Zap className="size-3 text-accent" />
                <span>Instant Guest Testing</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="size-3 text-accent-tertiary" />
                <span>SSRF Protection Shield</span>
              </li>
              <li className="flex items-center gap-2">
                <Terminal className="size-3 text-accent-secondary" />
                <span>REST & JSON Streaming</span>
              </li>
              <li className="flex items-center gap-2">
                <GitBranch className="size-3 text-foreground" />
                <span>PostgreSQL Cloud Projects</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Architecture */}
          <div className="flex flex-col gap-3">
            <h4 className="font-accent text-xs uppercase tracking-[0.25em] text-foreground">
              Stack Architecture
            </h4>
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              Built on Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, PostgreSQL, and Undici engine.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="chamfer-xs bg-muted px-2 py-1 font-mono text-[10px] text-accent">Next.js 16</span>
              <span className="chamfer-xs bg-muted px-2 py-1 font-mono text-[10px] text-accent-secondary">Tailwind v4</span>
              <span className="chamfer-xs bg-muted px-2 py-1 font-mono text-[10px] text-accent-tertiary">PostgreSQL</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-center font-mono text-[11px] text-muted-foreground md:flex-row md:text-left">
          <p>© {new Date().getFullYear()} APT — API Workbench. Open source & community built.</p>
          <p className="flex items-center gap-1.5">
            Designed with <Heart className="size-3 text-destructive fill-destructive" /> for developers who hate bloat.
          </p>
        </div>
      </div>
    </footer>
  );
}
