"use client";

import { cn } from "@/lib/cn";

export function Notice({ message }: { message: string | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed bottom-6 left-1/2 z-50 w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 transition-opacity duration-200",
        message ? "opacity-100" : "opacity-0",
      )}
    >
      {message ? (
        <div className="chamfer-sm flex items-start gap-3 border-l-2 border-l-accent bg-card/95 p-4 backdrop-blur-sm glow-accent-sm animate-rise">
          <span
            aria-hidden
            className="mt-1 inline-block size-1.5 shrink-0 animate-blink bg-accent"
          />
          <p className="font-mono text-xs leading-relaxed text-foreground">
            {message}
          </p>
        </div>
      ) : null}
    </div>
  );
}
