"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWorkspace } from "@/lib/workspace";
import type { HttpMethod } from "@/lib/types";

/** Method is the fastest signal in a request list, so it gets its own palette. */
const METHOD_TONE: Record<HttpMethod, string> = {
  GET: "text-accent-tertiary",
  POST: "text-accent",
  PUT: "text-accent-secondary",
  PATCH: "text-accent-secondary",
  DELETE: "text-destructive",
  HEAD: "text-muted-foreground",
  OPTIONS: "text-muted-foreground",
};

export function RequestList() {
  const {
    saved,
    history,
    listMode,
    search,
    loadRequest,
    deleteRequest,
    activeId,
    sending,
    saving,
    switching,
  } = useWorkspace();

  const list = listMode === "saved" ? saved : history;
  const needle = search.trim().toLowerCase();
  const visible = needle
    ? list.filter((item) =>
        `${item.name} ${item.url}`.toLowerCase().includes(needle),
      )
    : list;
  const busy = sending || saving || switching;

  if (!visible.length) {
    return (
      <p className="px-1 py-6 font-mono text-[11px] leading-relaxed text-muted-foreground">
        <span className="text-accent">$</span>{" "}
        {needle
          ? "no matching requests."
          : listMode === "saved"
            ? "save your first request to keep it close."
            : "your sent requests will appear here."}
        <span
          aria-hidden
          className="ml-1 inline-block h-3 w-1.5 animate-blink bg-accent align-middle"
        />
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {visible.map((item) => {
        const active = listMode === "saved" && item.id === activeId;
        return (
          <li key={item.id} className="group/item flex items-stretch gap-1">
            <button
              type="button"
              title={item.url}
              disabled={busy}
              onClick={() => loadRequest(item, listMode === "saved")}
              className={cn(
                "chamfer-xs flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left transition-colors disabled:opacity-50",
                active ? "bg-accent/10 shadow-neon-sm" : "hover:bg-accent/5",
              )}
            >
              <span
                className={cn(
                  "shrink-0 font-accent text-[10px] font-bold tracking-[0.1em]",
                  METHOD_TONE[item.method] ?? "text-muted-foreground",
                )}
              >
                {item.method}
              </span>
              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    "truncate font-mono text-xs",
                    active ? "text-accent" : "text-foreground/85",
                  )}
                >
                  {item.name || item.url}
                </span>
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {item.url}
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={busy}
              aria-label={`Delete ${item.name}`}
              onClick={() => void deleteRequest(item, listMode)}
              className="chamfer-xs grid min-h-11 w-10 shrink-0 place-items-center text-muted-foreground opacity-0 transition-[color,opacity] group-hover/item:opacity-100 hover:text-destructive focus-visible:opacity-100 disabled:opacity-30"
            >
              <Trash2 className="size-3.5" strokeWidth={1.5} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
