"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { GlitchText } from "@/components/ui/glitch-text";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/lib/workspace";

const FEATURES = [
  ["01", "Projects that keep work separate"],
  ["02", "Named requests, ready to run again"],
  ["03", "Saved securely to your workspace"],
] as const;

export function AccountScreen() {
  const { account, setAccountMode, submitAccount, closeAccount, config } = useWorkspace();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const registering = account.mode === "register";
  const locked = Boolean(account.setup) || account.busy;

  return (
    <main className="relative z-10 min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/4 hidden size-[38rem] -skew-y-6 tech-grid-strong opacity-70 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 size-[22rem] rounded-full bg-accent-secondary/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 size-[26rem] rounded-full bg-accent-tertiary/10 blur-[140px]"
      />

      <div className="relative mx-auto grid min-h-dvh max-w-7xl grid-cols-1 items-center gap-16 px-6 py-16 lg:grid-cols-[3fr_2fr] lg:gap-8 lg:py-24">
        <section className="flex flex-col">
          <a
            href="/"
            className="group flex items-center gap-3 font-display text-lg font-bold uppercase tracking-[0.3em] text-foreground"
          >
            <span className="chamfer-xs grid size-8 place-items-center bg-accent font-display text-sm text-background glow-accent-sm">
              a
            </span>
            apt
          </a>

          <p className="mt-12 font-accent text-[11px] uppercase tracking-[0.4em] text-accent text-glow">
            // your apis, organized
          </p>

          <h1 className="mt-5 font-display text-5xl font-black uppercase leading-[0.95] tracking-widest text-foreground md:text-7xl lg:text-8xl">
            <span className="block animate-glitch">
              <GlitchText text="One account." duration="6s" />
            </span>
            <span className="mt-1 block text-accent text-glow-lg">
              <GlitchText text="Every project." duration="4.6s" />
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-relaxed tracking-wide text-muted-foreground md:text-lg">
            Keep requests together. Pick up where you left off.
            <br />
            Your private API workspace, wherever you work.
            <span
              aria-hidden
              className="ml-1.5 inline-block h-4 w-2.5 animate-blink bg-accent align-middle"
            />
          </p>

          <div className="mt-12 flex flex-col gap-4">
            {FEATURES.map(([index, label]) => (
              <div
                key={index}
                className="flex items-center gap-4 border-l border-border pl-4 transition-colors hover:border-l-accent"
              >
                <span className="font-accent text-xs tracking-[0.2em] text-accent">
                  {index}
                </span>
                <span className="font-mono text-sm tracking-wide text-foreground/75">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <span className="chamfer-xs border border-border px-3 py-1.5 font-accent text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              http / rest
            </span>
            <span className="chamfer-xs border border-border px-3 py-1.5 font-accent text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              utf-8
            </span>
            <span className="chamfer-xs border border-accent/40 px-3 py-1.5 font-accent text-[10px] uppercase tracking-[0.3em] text-accent">
              {config?.hosted ? "cloud workspace" : "local server"}
            </span>
          </div>
        </section>

        <section className="lg:-ml-8 lg:mt-16">
          <Card variant="holographic" contentClassName="p-7 md:p-8">
            <div className="flex items-center gap-2 font-accent text-[10px] uppercase tracking-[0.35em] text-accent">
              <span aria-hidden className="size-1.5 animate-blink bg-accent" />
              welcome to apt
            </div>

            <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-foreground">
              {registering
                ? "Create your workspace"
                : "Sign in to your workspace"}
            </h2>
            <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
              {registering
                ? "A fresh space for every API you build."
                : "Your projects and requests are waiting."}
            </p>

            <form
              className="mt-7 flex flex-col gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                void submitAccount(email, password, name);
              }}
            >
              {registering ? (
                <Field label="your name">
                  <Input
                    prompt
                    value={name}
                    maxLength={80}
                    autoComplete="name"
                    required
                    disabled={locked}
                    placeholder="Ada Lovelace"
                    onChange={(event) => setName(event.target.value)}
                  />
                </Field>
              ) : null}

              <Field label="email address">
                <Input
                  prompt
                  type="email"
                  value={email}
                  maxLength={254}
                  autoComplete="username"
                  required
                  disabled={locked}
                  placeholder="you@example.com"
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Field
                label="password"
                hint={registering ? "Use at least 12 characters." : undefined}
              >
                <Input
                  prompt
                  type="password"
                  value={password}
                  minLength={registering ? 12 : 1}
                  maxLength={256}
                  autoComplete={
                    registering ? "new-password" : "current-password"
                  }
                  required
                  disabled={locked}
                  placeholder="••••••••••••"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>

              <p
                role="alert"
                aria-live="assertive"
                className={
                  account.error
                    ? "chamfer-xs border-l-2 border-l-destructive bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive"
                    : "hidden"
                }
              >
                {account.error}
              </p>

              <Button
                type="submit"
                variant="glitch"
                size="md"
                className="w-full"
                surface="bg-muted"
                disabled={locked}
              >
                {account.busy
                  ? "Authenticating…"
                  : registering
                    ? "Create account →"
                    : "Sign in →"}
              </Button>
            </form>

            <Button
              variant="ghost"
              size="sm"
              surface="bg-muted"
              className="mt-4 w-full"
              disabled={locked}
              onClick={() => setAccountMode(registering ? "login" : "register")}
            >
              {registering
                ? "Already have an account? Sign in"
                : "New here? create an account"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              surface="bg-card"
              className="mt-2 w-full border-border/80 text-muted-foreground hover:text-foreground"
              disabled={account.busy}
              onClick={() => closeAccount()}
            >
              ← Continue as Guest (No login required)
            </Button>

            {account.setup ? (
              <p className="chamfer-xs mt-4 border-l-2 border-l-accent-tertiary bg-accent-tertiary/10 px-3 py-2 font-mono text-[11px] leading-relaxed text-accent-tertiary">
                {account.setup}
              </p>
            ) : null}
          </Card>
        </section>
      </div>
    </main>
  );
}
