import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "light" | "outline";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap " +
  "transition duration-200 ease-out-expo active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-on-accent shadow-accent hover:bg-accent-strong",
  secondary: "bg-raised text-fg ring-1 ring-inset ring-line-strong hover:bg-hover",
  ghost: "text-fg-muted hover:bg-raised hover:text-fg",
  // For red surfaces, where a red button would vanish. Both read their colours
  // from the surrounding scope, so they are light on `dark-surface`.
  light: "bg-fg text-canvas shadow-float hover:bg-fg/90",
  outline: "text-fg ring-2 ring-inset ring-fg/70 hover:bg-fg/10",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
};

/** Class string for anything that should look like a button, e.g. a link. */
export function buttonClass(options: { variant?: Variant; size?: Size; className?: string } = {}): string {
  const { variant = "primary", size = "md", className } = options;
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}
