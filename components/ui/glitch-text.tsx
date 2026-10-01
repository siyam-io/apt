import { cn } from "@/lib/cn";

export type GlitchTextProps = {
  text: string;
  className?: string;
  /** Overrides the per-layer animation period, e.g. "5s". */
  duration?: string;
};

/**
 * Renders the text three times: the magenta and cyan layers sit behind the base
 * text and only surface briefly, when the `glitch-a`/`glitch-b` clip animations
 * sweep a slice into view.
 */
export function GlitchText({ text, className, duration }: GlitchTextProps) {
  return (
    <span
      className={cn("cyber-glitch", className)}
      data-text={text}
      style={
        duration
          ? ({ "--glitch-duration": duration } as React.CSSProperties)
          : undefined
      }
    >
      {text}
    </span>
  );
}
