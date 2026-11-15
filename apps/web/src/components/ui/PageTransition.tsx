import { ViewTransition, type ReactNode } from "react";

const directional = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
} as const;

/**
 * Slides a page in the direction of travel when a link says which way it is
 * going (`transitionTypes={["nav-forward"]}`). Belongs in each page, not in a
 * layout: layouts persist across navigation and never enter or exit.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={directional} exit={directional} default="none">
      {children}
    </ViewTransition>
  );
}
