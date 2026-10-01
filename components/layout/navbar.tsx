"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Shield, BookOpen, Info, Zap, ArrowRight } from "lucide-react";

import type { Route } from "next";

export function Navbar() {
  const pathname = usePathname();

  const links: Array<{ href: Route; label: string; badge?: string }> = [
    { href: "/", label: "Home" },
    { href: "/workbench", label: "Workbench", badge: "Live" },
    { href: "/features", label: "Features" },
    { href: "/docs", label: "Docs" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <span className="chamfer-xs grid size-9 place-items-center bg-accent font-display text-sm font-bold text-background glow-accent-sm transition-transform group-hover:scale-105">
            a
          </span>
          <span className="flex flex-col">
            <span className="font-display text-base font-bold uppercase tracking-[0.25em] text-foreground transition-colors group-hover:text-accent">
              apt
            </span>
            <span className="font-accent text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              api workbench
            </span>
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                  active
                    ? "text-accent font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {link.badge ? (
                  <span className="ml-1.5 rounded bg-accent/20 px-1.5 py-0.5 font-accent text-[9px] text-accent">
                    {link.badge}
                  </span>
                ) : null}
                {active ? (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-accent glow-accent-sm" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          <Link
            href="/workbench"
            className="chamfer-xs group flex items-center gap-2 border border-accent bg-accent/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-accent transition-all hover:bg-accent hover:text-background glow-accent-sm"
          >
            <Zap className="size-3.5 fill-current" />
            <span>Launch Workbench</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </header>
  );
}
