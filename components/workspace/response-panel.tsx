"use client";

import { ArrowUpRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { RESPONSE_TABS, type ProxyResponse } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";

function formatBytes(size: number) {
  return size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;
}

function bodyText(response: ProxyResponse, tab: string, pretty: boolean) {
  if (tab === "headers") {
    return (
      Object.entries(response.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n") || "(no headers)"
    );
  }
  if (!pretty) return response.body;
  try {
    return JSON.stringify(JSON.parse(response.body), null, 2);
  } catch {
    return response.body;
  }
}

export function ResponsePanel() {
  const {
    response,
    responseTab,
    setResponseTab,
    pretty,
    setPretty,
    notify,
    sending,
    runExample,
  } = useWorkspace();

  const text =
    response.status === "done"
      ? bodyText(response.data, responseTab, pretty)
      : null;

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      notify("Response copied.");
    } catch {
      notify("Clipboard unavailable. Select response text to copy.");
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <h2 className="flex items-center gap-3 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Response
          {response.status === "done" ? (
            <span
              aria-hidden
              className={cn(
                "size-2",
                response.data.status < 400
                  ? "bg-accent shadow-neon-sm"
                  : "bg-destructive shadow-neon-destructive",
              )}
            />
          ) : null}
        </h2>

        {response.status === "done" ? (
          <div className="flex items-center gap-4 font-mono text-xs">
            <span
              className={cn(
                "chamfer-xs px-2.5 py-1 font-bold tracking-wider",
                response.data.status < 400
                  ? "border border-accent/50 text-accent"
                  : "border border-destructive/50 text-destructive",
              )}
            >
              {response.data.status} {response.data.statusText}
            </span>
            <span className="text-muted-foreground">
              {response.data.duration} ms
            </span>
            <span className="text-muted-foreground">
              {formatBytes(response.data.size)}
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Response view"
          className="flex items-center gap-1"
        >
          {RESPONSE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={responseTab === tab}
              onClick={() => setResponseTab(tab)}
              className={cn(
                "chamfer-xs min-h-11 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
                responseTab === tab
                  ? "bg-accent/10 text-accent shadow-neon-sm"
                  : "text-muted-foreground hover:text-accent",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <Checkbox
              checked={pretty}
              onChange={(event) => setPretty(event.target.checked)}
            />
            pretty
          </label>
          <Button
            variant="ghost"
            size="sm"
            surface="bg-background"
            disabled={!text}
            onClick={() => void copy()}
          >
            <Copy className="size-4" strokeWidth={1.5} />
            Copy
          </Button>
        </div>
      </div>

      {response.status === "idle" ? (
        <div className="chamfer relative overflow-hidden tech-grid border border-border bg-card/40 px-6 py-16 text-center">
          <div
            aria-hidden
            className="mx-auto grid size-14 place-items-center border border-accent/40 bg-accent/5 glow-accent-sm"
          >
            <ArrowUpRight className="size-6 text-accent" strokeWidth={1.5} />
          </div>
          <h3 className="mt-6 font-display text-xl font-bold uppercase tracking-wide text-foreground">
            Ready when you are.
          </h3>
          <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
            Enter an endpoint and hit Send.
            <br />
            Your response will show up right here.
          </p>
          <div className="mt-7 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              surface="bg-background"
              disabled={sending}
              onClick={() => void runExample()}
            >
              Try an example
              <ArrowUpRight className="size-4" strokeWidth={1.5} />
            </Button>
          </div>
          <p className="mt-6 font-accent text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            ctrl / ⌘ + enter to send
          </p>
        </div>
      ) : (
        <pre
          tabIndex={0}
          className={cn(
            "chamfer max-h-[32rem] min-h-40 overflow-auto border border-border bg-background p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words",
            response.status === "text" && response.tone === "error"
              ? "text-destructive"
              : response.status === "text"
                ? "text-muted-foreground"
                : "text-foreground/90",
          )}
        >
          {response.status === "pending" ? (
            <>
              Waiting for response
              <span
                aria-hidden
                className="ml-1 inline-block h-3.5 w-2 animate-blink bg-accent align-middle"
              />
            </>
          ) : response.status === "text" ? (
            response.text
          ) : (
            text || "(empty response)"
          )}
        </pre>
      )}
    </section>
  );
}
