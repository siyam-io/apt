import { cn } from "@/lib/cn";

export type FieldProps = {
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: FieldProps) {
  return (
    <label htmlFor={htmlFor} className={cn("flex flex-col gap-2", className)}>
      <span className="font-accent text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="text-[11px] leading-relaxed text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
