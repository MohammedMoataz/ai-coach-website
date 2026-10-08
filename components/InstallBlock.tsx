"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "primereact/button";

// A terminal that "types" the install commands once it scrolls into view. The text itself is
// static and readable from first paint; a dimming overlay steps off it in CSS (globals.css,
// .term-line). Changing the text per keystroke would delay the page's largest paint until the
// typing finished.
export function InstallBlock({ lines, label = "terminal" }: { lines: string[]; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Start typing once the block is mostly on screen. A class, not state: nothing re-renders.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("go");
        io.disconnect();
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      // No clipboard permission: select the commands so Ctrl+C works.
      const pre = ref.current?.querySelector("pre");
      if (pre) getSelection()?.selectAllChildren(pre);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Each line starts typing after the previous one finishes (24ms a character, 200ms pause).
  const delays = lines.map((_, i) => lines.slice(0, i).reduce((ms, l) => ms + l.length * 24 + 200, 0));
  return (
    <div className="term" ref={ref}>
      <div className="term-bar">
        <i />
        <i />
        <i />
        <span>{label}</span>
        <Button text className="term-copy" onClick={copy} aria-label={copied ? "Copied" : "Copy commands"}>
          <i key={copied ? "y" : "n"} className={`pi ${copied ? "pi-check" : "pi-copy"}`} aria-hidden />
          <span>{copied ? "Copied" : "Copy"}</span>
        </Button>
      </div>
      <pre>
        {lines.map((l, i) => {
          const style = { "--n": l.length, "--d": `${delays[i]}ms` } as React.CSSProperties;
          return (
            <div key={l} className="term-line" style={style}>
              <span className="prompt">$ </span>
              {l}
              {i === lines.length - 1 && <span className="caret" aria-hidden />}
            </div>
          );
        })}
      </pre>
    </div>
  );
}
