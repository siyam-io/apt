import { cn } from "@/lib/cn";

export type ChamferSize = "xs" | "sm" | "md";

const CLIP: Record<ChamferSize, string> = {
  xs: "chamfer-xs",
  sm: "chamfer-sm",
  md: "chamfer",
};

const THICKNESS_CLASS = { "1px": "inset-px", "2px": "inset-0.5" } as const;

export type ChamferProps = {
  size?: ChamferSize;
  /** Background classes for the frame layer. */
  border?: string;
  /** Background classes for the inner surface. Must be opaque to mask the frame. */
  surface?: string;
  thickness?: keyof typeof THICKNESS_CLASS;
  /** Classes for the unclipped host — focus rings and drop-shadow glow live here. */
  className?: string;
  /** Classes for the content wrapper. */
  contentClassName?: string;
  contentAs?: "div" | "span";
  children?: React.ReactNode;
};

/**
 * `clip-path` cannot draw a stroke, so the frame is a filled layer showing
 * through a 1px/2px inset of the inner surface. The host element stays
 * unclipped, which keeps focus rings and `drop-shadow` glow working — both are
 * erased when applied to a clipped element.
 */
export function Chamfer({
  size = "md",
  border = "bg-border",
  surface = "bg-card",
  thickness = "1px",
  className,
  contentClassName,
  contentAs: Content = "div",
  children,
}: ChamferProps) {
  return (
    <div className={cn("relative", className)}>
      <span
        aria-hidden
        className={cn("absolute inset-0", CLIP[size], border)}
      />
      <span
        aria-hidden
        className={cn(
          "absolute",
          THICKNESS_CLASS[thickness],
          CLIP[size],
          surface,
        )}
      />
      <Content className={cn("relative", contentClassName)}>{children}</Content>
    </div>
  );
}
