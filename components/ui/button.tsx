"use client";

import { cn } from "@/lib/cn";
import { Chamfer } from "./chamfer";

export type ButtonVariant =
  "default" | "secondary" | "outline" | "ghost" | "glitch" | "destructive";

export type ButtonSize = "sm" | "md" | "icon";

type VariantStyle = {
  thickness: "1px" | "2px";
  border: string;
  surface: string;
  surfaceHover: string;
  text: string;
  host: string;
};

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  default: {
    thickness: "2px",
    border: "bg-accent",
    surface: "bg-background",
    surfaceHover: "group-hover:bg-accent",
    text: "text-accent group-hover:text-background",
    host: "hover:glow-accent",
  },
  secondary: {
    thickness: "2px",
    border: "bg-accent-secondary",
    surface: "bg-background",
    surfaceHover: "group-hover:bg-accent-secondary",
    text: "text-accent-secondary group-hover:text-background",
    host: "hover:glow-secondary",
  },
  outline: {
    thickness: "1px",
    border: "bg-border group-hover:bg-accent focus-visible:bg-accent",
    surface: "bg-background",
    surfaceHover: "",
    text: "text-foreground/75 group-hover:text-accent",
    host: "hover:glow-accent-sm",
  },
  ghost: {
    thickness: "1px",
    border: "bg-transparent",
    surface: "bg-transparent",
    surfaceHover: "group-hover:bg-accent/10",
    text: "text-muted-foreground group-hover:text-accent",
    host: "",
  },
  glitch: {
    thickness: "2px",
    border: "bg-accent",
    surface: "bg-accent",
    surfaceHover: "group-hover:brightness-110",
    text: "text-background animate-rgb-shift",
    host: "hover:glow-accent",
  },
  destructive: {
    thickness: "1px",
    border: "bg-destructive/50 group-hover:bg-destructive",
    surface: "bg-background",
    surfaceHover: "group-hover:bg-destructive",
    text: "text-destructive group-hover:text-background",
    host: "hover:glow-destructive",
  },
};

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-11 gap-1.5 px-3 text-[11px] tracking-[0.15em]",
  md: "min-h-11 gap-2 px-5 text-xs tracking-[0.2em]",
  icon: "size-11 justify-center text-xs tracking-normal",
};

const BASE =
  "group relative inline-block select-none font-mono uppercase transition-[filter,color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Surface color when the button sits on something other than the void. */
  surface?: string;
  contentClassName?: string;
};

export function Button({
  variant = "default",
  size = "md",
  surface,
  className,
  contentClassName,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const style = VARIANTS[variant];

  return (
    <button
      type={type}
      className={cn(BASE, style.host, size === "icon" && "w-fit", className)}
      {...props}
    >
      <Chamfer
        size="sm"
        thickness={style.thickness}
        border={style.border}
        surface={cn(
          surface ?? style.surface,
          style.surfaceHover,
          "transition-[background-color,filter]",
        )}
        contentAs="span"
        contentClassName={cn(
          SIZE[size],
          "flex items-center justify-center",
          style.text,
          "transition-colors",
          contentClassName,
        )}
      >
        {children}
      </Chamfer>
    </button>
  );
}
