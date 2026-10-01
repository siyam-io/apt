import { cn } from "@/lib/cn";
import { Chamfer } from "./chamfer";

export type CardVariant = "default" | "terminal" | "holographic";

export type CardProps = {
  variant?: CardVariant;
  /** Accent border and neon lift on hover. */
  interactive?: boolean;
  padding?: boolean;
  /** Label shown in the terminal variant's title bar. */
  label?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
};

function TerminalBar({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-2.5">
      <span aria-hidden className="size-2.5 rounded-full bg-destructive/90" />
      <span
        aria-hidden
        className="size-2.5 rounded-full bg-accent-secondary/90"
      />
      <span aria-hidden className="size-2.5 rounded-full bg-accent/90" />
      <span className="ml-2 truncate font-accent text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label ?? "apt://terminal"}
      </span>
    </div>
  );
}

export function Card({
  variant = "default",
  interactive = false,
  padding = true,
  label,
  className,
  contentClassName,
  children,
}: CardProps) {
  if (variant === "holographic") {
    return (
      <div
        className={cn(
          "relative glow-accent",
          interactive &&
            "transition-transform duration-300 hover:-translate-y-px",
          className,
        )}
      >
        <Chamfer
          size="md"
          thickness="1px"
          border="bg-accent/50"
          surface="bg-muted/70 backdrop-blur-md"
          contentClassName={cn(padding && "p-6", contentClassName)}
        >
          {children}
        </Chamfer>
        {(
          [
            "left-0 top-0 border-l border-t",
            "right-0 top-0 border-r border-t",
            "left-0 bottom-0 border-l border-b",
            "right-0 bottom-0 border-r border-b",
          ] as const
        ).map((position) => (
          <span
            key={position}
            aria-hidden
            className={cn(
              "pointer-events-none absolute size-3.5 animate-hue border-accent",
              position,
            )}
          />
        ))}
      </div>
    );
  }

  const terminal = variant === "terminal";

  return (
    <Chamfer
      size="md"
      thickness="1px"
      border={cn("bg-border", interactive && "group-hover:bg-accent")}
      surface="bg-card"
      className={cn(
        "group transition-[transform,filter] duration-300",
        interactive &&
          "hover:-translate-y-px hover:glow-accent focus-within:glow-accent",
        className,
      )}
      contentClassName={cn(
        "flex h-full flex-col",
        terminal && "bg-background",
        padding && !terminal && "p-6",
        terminal && "pb-6",
        contentClassName,
      )}
    >
      {terminal ? <TerminalBar label={label} /> : null}
      <div
        className={cn(
          "flex h-full flex-col",
          terminal && padding && "px-6 pt-5",
          terminal && !padding && "pt-5",
        )}
      >
        {children}
      </div>
    </Chamfer>
  );
}
