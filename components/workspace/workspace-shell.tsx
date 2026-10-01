"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { GlitchText } from "@/components/ui/glitch-text";
import { cn } from "@/lib/cn";
import { useWorkspace } from "@/lib/workspace";
import { RequestEditor } from "./request-editor";
import { ResponsePanel } from "./response-panel";
import { Sidebar } from "./sidebar";

function Topbar() {
  const { projects, projectId, config, isGuest, openAccount } = useWorkspace();
  const project = projects.find((item) => item.id === projectId);

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background/85 px-6 py-3.5 backdrop-blur-md lg:px-10">
      <div className="flex items-center gap-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
          workspace
          <span className="mx-2 text-accent">/</span>
          <strong className="font-display font-bold tracking-[0.2em] text-foreground">
            {project?.name ?? "Guest Workspace"}
          </strong>
        </p>

        <nav className="hidden items-center gap-4 text-xs font-mono uppercase tracking-wider text-muted-foreground md:flex">
          <a href="/" className="hover:text-foreground transition-colors">Home</a>
          <a href="/features" className="hover:text-foreground transition-colors">Features</a>
          <a href="/docs" className="hover:text-foreground transition-colors">Docs</a>
          <a href="/about" className="hover:text-foreground transition-colors">About</a>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {isGuest ? (
          <button
            type="button"
            onClick={() => openAccount("register")}
            className="chamfer-xs flex items-center gap-2 border border-accent/40 bg-accent/10 px-3 py-1 font-accent text-[10px] uppercase tracking-[0.2em] text-accent transition-colors hover:bg-accent hover:text-background"
          >
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            Connect Cloud Project
          </button>
        ) : null}

        <span
          className={cn(
            "chamfer-xs flex items-center gap-2 border px-3 py-1.5 font-accent text-[10px] uppercase tracking-[0.25em]",
            isGuest
              ? "border-accent/40 text-accent/80"
              : config?.hosted
                ? "border-accent-tertiary/50 text-accent-tertiary"
                : "border-accent/50 text-accent",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 animate-flicker",
              isGuest
                ? "bg-accent/80"
                : config?.hosted
                  ? "bg-accent-tertiary"
                  : "bg-accent",
            )}
          />
          {isGuest
            ? "guest / local storage"
            : config?.hosted
              ? "cloud workspace"
              : "local server"}
        </span>
      </div>
    </header>
  );
}

function Telemetry() {
  const { saved, history, projects, activeId } = useWorkspace();
  const stats = [
    ["collection", String(saved.length)],
    ["history", String(history.length)],
    ["projects", String(projects.length)],
    ["mode", activeId ? "editing" : "draft"],
  ] as const;

  return (
    <Card
      variant="holographic"
      className="relative z-20 -mt-10 mb-10 lg:mx-6"
      contentClassName="p-0"
    >
      <dl className="grid grid-cols-2 divide-border lg:grid-cols-4 lg:divide-x">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-1 border-b border-border px-6 py-4 last:border-b-0 lg:border-b-0 lg:last:border-b-0"
          >
            <dt className="font-accent text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              {label}
            </dt>
            <dd className="font-display text-xl font-bold uppercase tracking-widest text-accent">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function WorkspaceShell() {
  const { send, newRequest, sending, saving, switching } = useWorkspace();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void send();
      }
      if (event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        if (!sending && !saving && !switching) newRequest();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [newRequest, saving, send, sending, switching]);

  return (
    /* overflow-x-clip contains the bleeding HUD artwork without creating a
       scroll container, which would break the sticky sidebar. */
    <div className="relative z-10 flex min-h-dvh flex-col overflow-x-clip lg:flex-row">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-10 lg:px-10 lg:py-14">
          <section className="relative pb-4">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-10 hidden size-64 rotate-6 tech-grid-strong opacity-60 xl:block"
            />
            <p className="font-accent text-[11px] uppercase tracking-[0.4em] text-accent text-glow">
              // build. send. understand.
            </p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-0">
                <h1 className="font-display text-3xl font-black uppercase leading-tight tracking-widest text-foreground md:text-5xl">
                  <GlitchText text="Every request," duration="7s" />{" "}
                  <span className="text-accent text-glow">
                    a little clearer.
                  </span>
                </h1>
                <p className="mt-4 max-w-xl font-mono text-xs leading-relaxed text-muted-foreground md:text-sm">
                  Your APIs. One focused workspace.
                  <span
                    aria-hidden
                    className="ml-1.5 inline-block h-3.5 w-2 animate-blink bg-accent align-middle"
                  />
                </p>
              </div>
              <span className="chamfer-xs shrink-0 border border-accent/40 px-3 py-2 font-accent text-[10px] uppercase tracking-[0.3em] text-accent">
                http / rest
              </span>
            </div>
          </section>

          <Telemetry />

          <Card contentClassName="p-6 md:p-8">
            <RequestEditor />
          </Card>

          <Card variant="terminal" label="apt://response-stream">
            <ResponsePanel />
          </Card>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 font-mono text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-1.5 animate-blink bg-accent" />
              Private projects. Built for your flow.
            </span>
            <span>
              UTF-8 <span className="mx-1.5 text-accent">·</span> REST client
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
