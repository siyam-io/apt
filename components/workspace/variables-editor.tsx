"use client";

import { Plus, Trash2, Zap, Info, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox, Input } from "@/components/ui/input";
import { useWorkspace } from "@/lib/workspace";

export function VariablesEditor() {
  const { variables, addVariable, updateVariable, deleteVariable, setVariables } =
    useWorkspace();

  const presets = [
    { key: "baseUrl", value: typeof window !== "undefined" ? window.location.origin : "http://localhost:3001" },
    { key: "echoUrl", value: "/api/echo" },
    { key: "token", value: "dev_secret_token_123" },
  ];

  function applyPreset(preset: { key: string; value: string }) {
    const existingIndex = variables.findIndex((v) => v.key.toLowerCase() === preset.key.toLowerCase());
    if (existingIndex >= 0) {
      updateVariable(existingIndex, { value: preset.value, enabled: true });
    } else {
      addVariable(preset.key, preset.value);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground">
            Environment & URL Variables
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            Postman-Style Interpolation ({variables.length} configured)
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-accent text-[9px] uppercase tracking-wider text-muted-foreground mr-1">
            Presets:
          </span>
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => applyPreset(p)}
              className="chamfer-xs bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-accent/20 hover:text-accent transition-colors"
            >
              +{p.key}
            </button>
          ))}
        </div>
      </div>

      <div className="chamfer-sm bg-border p-px">
        <div className="chamfer-sm divide-y divide-border/60 bg-input">
          {variables.length ? (
            variables.map((variable, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2.5 py-1.5 transition-colors focus-within:bg-accent/5"
              >
                <Checkbox
                  checked={variable.enabled}
                  aria-label="Enable variable"
                  onChange={(event) =>
                    updateVariable(index, { enabled: event.target.checked })
                  }
                />
                <div className="relative w-[35%] min-w-0 flex items-center">
                  <span className="font-mono text-xs text-accent mr-1">{"{"}</span>
                  <Input
                    bare
                    size="sm"
                    className="w-full min-w-0 font-bold text-accent"
                    value={variable.key}
                    placeholder="variable_name"
                    aria-label="Variable key"
                    onChange={(event) =>
                      updateVariable(index, { key: event.target.value.replace(/[{}]/g, "") })
                    }
                  />
                  <span className="font-mono text-xs text-accent ml-1">{"}"}</span>
                </div>
                <Input
                  bare
                  size="sm"
                  className="min-w-0 flex-1 text-foreground"
                  value={variable.value}
                  placeholder="e.g. http://localhost:3001"
                  aria-label="Variable value"
                  onChange={(event) =>
                    updateVariable(index, { value: event.target.value })
                  }
                />
                <button
                  type="button"
                  aria-label="Remove variable"
                  onClick={() => deleteVariable(index)}
                  className="grid size-8 place-items-center text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.5} />
                </button>
              </div>
            ))
          ) : (
            <div className="p-6 text-center font-mono text-xs text-muted-foreground">
              No variables defined. Click &quot;Add variable&quot; below or pick a preset above.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          surface="bg-card"
          className="self-start"
          onClick={() => addVariable()}
        >
          <Plus className="size-4" strokeWidth={1.5} />
          Add variable
        </Button>

        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <Info className="size-3.5 text-accent shrink-0" />
          <span>
            Use <code className="text-accent">{"{baseUrl}"}</code> or <code className="text-accent">{"{{baseUrl}}"}</code> in URL, Headers, Params, or Body.
          </span>
        </div>
      </div>
    </section>
  );
}
