// Fades content up as it scrolls into view, with a CSS scroll-driven animation (globals.css,
// [data-reveal]): no JavaScript, nothing to hydrate. Browsers without view timelines show it as-is.
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-reveal className={className}>
      {children}
    </div>
  );
}
