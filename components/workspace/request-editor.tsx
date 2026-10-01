"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Code2, Plus, Save, Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { emptyRow, HTTP_METHODS, type HttpMethod } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { KeyValueRows } from "./key-value-rows";
import { VariablesEditor } from "./variables-editor";

const TABS = [
  ["params", "Params"],
  ["headers", "Headers"],
  ["body", "Body"],
  ["auth", "Authorization"],
  ["vars", "Variables ({x})"],
  ["settings", "Settings"],
] as const;

type TabId = (typeof TABS)[number][0];

function PanelHeading({
  title,
  detail,
  children,
}: {
  title: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-foreground">
          {title}
        </h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          {detail}
        </span>
      </div>
      {children}
    </div>
  );
}

export function RequestEditor() {
  const {
    form,
    updateForm,
    auth,
    updateAuth,
    activeId,
    sending,
    saving,
    switching,
    send,
    cancelSend,
    saveRequest,
    formatBody,
    focusToken,
    projects,
    projectId,
    variables,
    resolveVariables,
  } = useWorkspace();

  const [tab, setTab] = useState<TabId>("params");
  const urlRef = useRef<HTMLInputElement>(null);
  const busy = sending || saving || switching;

  useEffect(() => {
    if (focusToken > 0) urlRef.current?.focus();
  }, [focusToken]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0",
              activeId ? "bg-accent shadow-neon-sm" : "bg-muted-foreground",
            )}
          />
          <Input
            aria-label="Request name"
            value={form.name}
            maxLength={100}
            size="sm"
            className="max-w-sm"
            onChange={(event) => updateForm({ name: event.target.value })}
          />
          <span className="hidden font-accent text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:inline">
            {activeId ? "editing saved" : "unsaved"}
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          surface="bg-card"
          disabled={busy || !projectId}
          onClick={() => void saveRequest()}
        >
          <Save className="size-4" strokeWidth={1.5} />
          {activeId ? "Update request" : "Save request"}
        </Button>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <div className="lg:w-36">
            <Select
              aria-label="HTTP method"
              value={form.method}
              onChange={(event) =>
                updateForm({ method: event.target.value as HttpMethod })
              }
              className="font-bold tracking-[0.2em]"
            >
              {HTTP_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex-1">
            <Input
              ref={urlRef}
              prompt
              type="text"
              aria-label="Request URL"
              placeholder="https://api.example.com/v1/users or {baseUrl}/api/users"
              value={form.url}
              required
              onChange={(event) => updateForm({ url: event.target.value })}
            />
          </div>

          <div className="flex items-stretch gap-3">
            <Button
              type="submit"
              variant="glitch"
              className="flex-1 lg:flex-none"
              disabled={busy || !projectId}
            >
              {sending ? "Sending…" : "Send"}
              <ArrowUpRight className="size-4" strokeWidth={1.5} />
            </Button>
            {sending ? (
              <Button variant="destructive" onClick={cancelSend}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>

        {/* Live Variable URL Preview */}
        {form.url.includes("{") ? (
          <div className="chamfer-xs flex flex-wrap items-center justify-between gap-3 border border-accent/40 bg-accent/5 px-4 py-2 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-accent text-[9px] uppercase tracking-wider text-muted-foreground">
                Resolved URL:
              </span>
              <span className="font-bold text-accent underline decoration-accent/40">
                {resolveVariables(form.url)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTab("vars")}
              className="font-accent text-[9px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
            >
              Configure Variables ({variables.length}) →
            </button>
          </div>
        ) : null}

        <div
          role="tablist"
          aria-label="Request settings"
          className="flex flex-wrap items-center gap-1 border-b border-border"
        >
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "chamfer-xs min-h-11 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors",
                tab === id
                  ? "bg-accent/10 text-accent shadow-neon-sm"
                  : "text-muted-foreground hover:text-accent",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "params" ? (
          <section className="flex flex-col gap-4">
            <PanelHeading
              title="Query parameters"
              detail="Appended to your request URL"
            />
            <KeyValueRows
              kind="parameter"
              rows={form.params}
              onChange={(params) => updateForm({ params })}
            />
            <Button
              variant="ghost"
              size="sm"
              surface="bg-card"
              className="self-start"
              onClick={() =>
                updateForm({ params: [...form.params, emptyRow()] })
              }
            >
              <Plus className="size-4" strokeWidth={1.5} />
              Add parameter
            </Button>
          </section>
        ) : null}

        {tab === "headers" ? (
          <section className="flex flex-col gap-4">
            <PanelHeading
              title="Request headers"
              detail="Custom HTTP headers"
            />
            <KeyValueRows
              kind="header"
              rows={form.headers}
              onChange={(headers) => updateForm({ headers })}
            />
            <Button
              variant="ghost"
              size="sm"
              surface="bg-card"
              className="self-start"
              onClick={() =>
                updateForm({ headers: [...form.headers, emptyRow()] })
              }
            >
              <Plus className="size-4" strokeWidth={1.5} />
              Add header
            </Button>
          </section>
        ) : null}

        {tab === "body" ? (
          <section className="flex flex-col gap-4">
            <PanelHeading title="Request body" detail="Raw text / JSON">
              <Button
                variant="ghost"
                size="sm"
                surface="bg-card"
                onClick={formatBody}
              >
                <Code2 className="size-4" strokeWidth={1.5} />
                Format JSON
              </Button>
            </PanelHeading>
            <Textarea
              aria-label="Request body"
              value={form.body}
              placeholder='{"message": "Hello, API"}'
              onChange={(event) => updateForm({ body: event.target.value })}
            />
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              GET and HEAD requests do not send a body. JSON content type is
              added when valid JSON is detected.
            </p>
          </section>
        ) : null}

        {tab === "auth" ? (
          <section className="flex max-w-xl flex-col gap-5">
            <Field label="auth type">
              <Select
                value={auth.type}
                onChange={(event) =>
                  updateAuth({ type: event.target.value as typeof auth.type })
                }
              >
                <option value="none">No authentication</option>
                <option value="bearer">Bearer token</option>
                <option value="key">API key header</option>
              </Select>
            </Field>

            {auth.type === "key" ? (
              <Field label="header name">
                <Input
                  prompt
                  value={auth.key}
                  onChange={(event) => updateAuth({ key: event.target.value })}
                />
              </Field>
            ) : null}

            {auth.type !== "none" ? (
              <Field label="secret">
                <Input
                  prompt
                  type="password"
                  autoComplete="off"
                  placeholder="Enter token or API key"
                  value={auth.token}
                  onChange={(event) =>
                    updateAuth({ token: event.target.value })
                  }
                />
              </Field>
            ) : null}

            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              Auth secrets stay in memory and are excluded from saved requests
              and history.
            </p>
          </section>
        ) : null}

        {tab === "vars" ? <VariablesEditor /> : null}

        {tab === "settings" ? (
          <section className="flex max-w-xl flex-col gap-5">
            <Field label="timeout (milliseconds)">
              <Input
                prompt
                type="number"
                min={1}
                max={45000}
                value={form.timeout}
                onChange={(event) =>
                  updateForm({ timeout: Number(event.target.value) })
                }
              />
            </Field>
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              Response limit: 2 MB (4 MB encoded). Redirects are returned
              without following them.
            </p>
          </section>
        ) : null}
      </form>

      <p className="font-mono text-[11px] text-muted-foreground">
        <span className="text-accent">$</span> target project:{" "}
        <span className="text-foreground/80">
          {projects.find((project) => project.id === projectId)?.name ??
            "none selected"}
        </span>
      </p>
    </div>
  );
}
