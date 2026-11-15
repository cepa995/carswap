/** The heading over each section of the landing page. */
export function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="font-display text-4xl leading-none font-extrabold tracking-tight text-balance sm:text-5xl">
      {children}
    </h2>
  );
}
