"use client";

import { X } from "lucide-react";
import { Checkbox, Input } from "@/components/ui/input";
import type { KeyValueRow } from "@/lib/types";

export type KeyValueRowsProps = {
  rows: KeyValueRow[];
  kind: "parameter" | "header";
  onChange: (rows: KeyValueRow[]) => void;
};

export function KeyValueRows({ rows, kind, onChange }: KeyValueRowsProps) {
  const plural = kind === "parameter" ? "parameters" : "headers";
  const patch = (index: number, value: Partial<KeyValueRow>) =>
    onChange(
      rows.map((row, position) =>
        position === index ? { ...row, ...value } : row,
      ),
    );

  return (
    <div className="chamfer-sm bg-border p-px">
      <div className="chamfer-sm divide-y divide-border/60 bg-input">
        {rows.length ? (
          rows.map((row, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-2.5 py-1 transition-colors focus-within:bg-accent/5"
            >
              <Checkbox
                checked={row.enabled}
                aria-label={`Enable ${kind}`}
                onChange={(event) =>
                  patch(index, { enabled: event.target.checked })
                }
              />
              <Input
                bare
                size="sm"
                className="w-[38%] min-w-0"
                value={row.key}
                placeholder="Key"
                aria-label={`${kind} key`}
                onChange={(event) => patch(index, { key: event.target.value })}
              />
              <Input
                bare
                size="sm"
                className="min-w-0 flex-1"
                value={row.value}
                placeholder="Value"
                aria-label={`${kind} value`}
                onChange={(event) =>
                  patch(index, { value: event.target.value })
                }
              />
              <button
                type="button"
                aria-label={`Remove ${kind}`}
                onClick={() =>
                  onChange(rows.filter((_, position) => position !== index))
                }
                className="grid min-h-11 w-11 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          ))
        ) : (
          <p className="px-3 py-3 font-mono text-xs text-muted-foreground">
            No {plural} yet.
          </p>
        )}
      </div>
    </div>
  );
}
