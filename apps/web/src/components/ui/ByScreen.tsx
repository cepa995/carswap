import type { ReactNode } from "react";

/**
 * Words that differ between a phone, where cars are swiped, and a big screen,
 * where they are parked from a gallery. Both are in the page and CSS shows
 * one, so the server does not have to guess the screen. The hidden one is
 * `display: none`, which also keeps it from screen readers.
 */
export function ByScreen({ phone, desktop }: { phone: ReactNode; desktop: ReactNode }) {
  return (
    <>
      <span className="lg:hidden">{phone}</span>
      <span className="max-lg:hidden">{desktop}</span>
    </>
  );
}
