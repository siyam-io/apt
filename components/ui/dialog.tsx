"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { Button } from "./button";
import { Input } from "./input";

export type ConfirmOptions = {
  title: string;
  description?: string;
  action?: string;
};

export type DialogApi = {
  /** Resolves true when confirmed, false when dismissed. */
  confirmAction: (options: ConfirmOptions) => Promise<boolean>;
  /** Resolves the trimmed name, or null when dismissed. */
  requestName: (title: string, value?: string) => Promise<string | null>;
};

type PendingInput = {
  kind: "confirm" | "name";
  title: string;
  description?: string;
  action: string;
  initial: string;
};

type Pending = PendingInput & {
  resolve: (result: string | boolean | null) => void;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog() {
  const dialog = useContext(DialogContext);
  if (!dialog) throw new Error("useDialog must be used inside DialogProvider");
  return dialog;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<Pending | null>(null);
  const [input, setInput] = useState("");
  const current = useRef<Pending | null>(null);

  const open = useCallback((pending: PendingInput) => {
    return new Promise<string | boolean | null>((resolve) => {
      // One modal at a time, mirroring the previous imperative implementation.
      if (current.current) {
        resolve(pending.kind === "confirm" ? false : null);
        return;
      }
      const entry = { ...pending, resolve };
      current.current = entry;
      setInput(entry.initial);
      setRequest(entry);
    });
  }, []);

  const confirmAction = useCallback(
    async (options: ConfirmOptions) =>
      (await open({
        kind: "confirm",
        title: options.title,
        description: options.description,
        action: options.action ?? "Confirm",
        initial: "",
      })) === true,
    [open],
  );

  const requestName = useCallback(
    async (title: string, value = "") => {
      const result = await open({
        kind: "name",
        title,
        action: "Save",
        initial: value,
      });
      return typeof result === "string" ? result : null;
    },
    [open],
  );

  const finish = useCallback((result: string | boolean | null) => {
    const pending = current.current;
    current.current = null;
    setRequest(null);
    pending?.resolve(result);
  }, []);

  return (
    <DialogContext.Provider value={{ confirmAction, requestName }}>
      {children}
      {request ? (
        <dialog
          ref={(element) => {
            if (element && !element.open) element.showModal();
          }}
          aria-labelledby="cyber-dialog-title"
          onCancel={(event) => {
            event.preventDefault();
            finish(request.kind === "confirm" ? false : null);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              finish(request.kind === "confirm" ? false : null);
            }
          }}
          className="chamfer-sm fixed inset-0 m-auto w-[min(28rem,calc(100vw-2rem))] bg-border p-px text-foreground backdrop:bg-background/85 backdrop:backdrop-blur-sm"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (request.kind === "confirm") {
                finish(true);
                return;
              }
              if (!input.trim()) return;
              finish(input.trim());
            }}
            className="chamfer-sm bg-card p-6"
          >
            <div className="flex items-center gap-2 font-accent text-[10px] uppercase tracking-[0.3em] text-accent">
              <span aria-hidden className="size-1.5 animate-blink bg-accent" />
              {request.kind === "confirm" ? "confirm" : "input"}
            </div>
            <h2
              id="cyber-dialog-title"
              className="mt-3 font-display text-lg font-bold uppercase tracking-wide text-foreground"
            >
              {request.title}
            </h2>
            {request.description ? (
              <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                {request.description}
              </p>
            ) : null}
            {request.kind === "name" ? (
              <Input
                className="mt-5"
                aria-label="Name"
                value={input}
                maxLength={100}
                required
                autoFocus
                placeholder="name"
                onChange={(event) => setInput(event.target.value)}
              />
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                surface="bg-card"
                onClick={() =>
                  finish(request.kind === "confirm" ? false : null)
                }
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="glitch"
                size="sm"
                surface="bg-card"
                autoFocus={request.kind === "confirm"}
              >
                {request.action}
              </Button>
            </div>
          </form>
        </dialog>
      ) : null}
    </DialogContext.Provider>
  );
}
