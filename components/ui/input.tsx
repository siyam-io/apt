"use client";

import { cn } from "@/lib/cn";

const FRAME =
  "chamfer-sm relative bg-border p-px transition-[background-color,filter] duration-150 focus-within:bg-accent focus-within:glow-accent-sm";

const CONTROL =
  "w-full bg-transparent font-mono text-accent outline-none placeholder:font-mono placeholder:text-muted-foreground";

const CONTROL_SIZE = {
  sm: "min-h-10 py-2 text-xs",
  md: "min-h-11 py-2.5 text-sm",
} as const;

export type ControlSize = keyof typeof CONTROL_SIZE;

// `size` collides with the native numeric attribute, so it is replaced by the
// control-size scale and the native one is dropped.
export type InputProps = Omit<React.ComponentPropsWithRef<"input">, "size"> & {
  /** Renders the terminal `>` prompt before the value. */
  prompt?: boolean;
  size?: ControlSize;
  /** Drops the chamfered frame for dense rows and inline editing. */
  bare?: boolean;
  frameClassName?: string;
};

export function Input({
  prompt = false,
  size = "md",
  bare = false,
  className,
  frameClassName,
  ...props
}: InputProps) {
  if (bare) {
    return (
      <input
        className={cn(
          CONTROL,
          CONTROL_SIZE[size],
          "border-b border-transparent px-2 transition-colors focus:border-accent",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <div className={cn(FRAME, frameClassName)}>
      <div className="chamfer-sm relative flex items-center">
        {prompt ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 font-mono text-sm text-accent"
          >
            &gt;
          </span>
        ) : null}
        <input
          className={cn(
            CONTROL,
            CONTROL_SIZE[size],
            "focus-visible:shadow-none",
            prompt ? "pl-7 pr-3" : "px-3",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <div className={FRAME}>
      <textarea
        spellCheck={false}
        className={cn(
          CONTROL,
          "min-h-40 resize-y p-3 text-sm leading-relaxed focus-visible:shadow-none",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export type SelectProps = Omit<
  React.ComponentPropsWithRef<"select">,
  "size"
> & {
  size?: ControlSize;
};

export function Select({
  className,
  children,
  size = "md",
  ...props
}: SelectProps) {
  return (
    <div className={FRAME}>
      <select
        className={cn(
          CONTROL,
          CONTROL_SIZE[size],
          "cursor-pointer appearance-none pl-3 pr-8 focus-visible:shadow-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-accent"
      >
        ▾
      </span>
    </div>
  );
}

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "chamfer-xs size-4 shrink-0 cursor-pointer appearance-none border border-border bg-input transition-colors checked:border-accent checked:bg-accent checked:shadow-neon-sm focus-visible:outline-none focus-visible:shadow-neon focus-visible:ring-0",
        className,
      )}
      {...props}
    />
  );
}
