import Link from "next/link";
import Script from "next/script";
import { getCatalog } from "@/lib/coaches";
import { SITE_URL, pageMeta } from "@/lib/site";
import { checkMap, renderSvg, renderTwin } from "@/lib/loopmap";
import { loopmap } from "@/content/loopmap";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";
import "@/lib/loopmap.css";
import "./zoom.css";
import "./how.css";

export const metadata = pageMeta({
  title: "How it works: the agent loop, with every coach in it",
  description:
    "Claude Code's agent loop, step by step, with every AI Coach hook, skill, command and agent at the step where it acts, and the special cases that decide what each one does.",
  path: "/how-it-works",
});

const ZOOM = [
  ["out", "Zoom out", "Zoom out (−)", "−"],
  ["reset", "Reset to 100%", "Reset to 100% (0)", "100%"],
  ["in", "Zoom in", "Zoom in (+)", "+"],
  ["fit", "Fit to view", "Fit to view (f)", "⤢"],
  ["full", "Fullscreen", "Fullscreen", "⛶"],
] as const;

export default async function HowItWorks() {
  const catalog = await getCatalog();
  // The map and the catalog must agree both ways: a new, renamed or removed skill, agent, command
  // or hook fails the build here, and the last good deploy stays live until the map follows.
  const problems = checkMap(loopmap, catalog);
  if (problems.length) throw new Error(`content/loopmap.ts disagrees with the catalog:\n- ${problems.join("\n- ")}`);

  return (
    <>
      <JsonLd
        data={breadcrumbs(SITE_URL, [
          ["Home", "/"],
          ["How it works", "/how-it-works"],
        ])}
      />
      <header className="page-head how-head">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span className="muted">/</span> <span className="muted">how it works</span>
          </nav>
          <p className="eyebrow">The agent loop</p>
          <h1>Every coach, at the step where it acts</h1>
          <p className="lead">
            One turn of Claude Code, from session start to session end, with all {catalog.counts.coaches} coaches, the
            engine&apos;s {catalog.hooks.length} hook bindings, {catalog.counts.skills} skills, {catalog.counts.agents}{" "}
            agents and {catalog.counts.commands} commands placed where they enter it. Drag to move, ctrl + wheel to zoom.{" "}
            <a href="#how-text">Read it as text ↓</a>
          </p>
        </div>
      </header>

      <figure className="zoomable how-canvas">
        <figcaption>
          Columns are the loop&apos;s steps; rows are the plugins. A chip&apos;s outline and mark say how it enters, the
          numbered circles are the special cases, and the panels at the bottom list where it asks and what it writes.
        </figcaption>
        <div className="zoom-viewport" tabIndex={0} aria-label="Agent loop diagram; pan and zoom">
          <div className="zoom-toolbar" role="group" aria-label="Diagram zoom">
            {ZOOM.map(([k, label, tip, text]) => (
              <button key={k} type="button" data-zoom={k} aria-label={label} title={tip}>
                {text}
              </button>
            ))}
          </div>
          <span className="zoom-hint">drag or wheel to move · ctrl+wheel to zoom · double-click fits</span>
          <div className="zoom-stage" dangerouslySetInnerHTML={{ __html: renderSvg(loopmap, { describedBy: "how-text" }) }} />
        </div>
      </figure>

      <div className="wrap how-twin" dangerouslySetInnerHTML={{ __html: renderTwin(loopmap, { id: "how-text" }) }} />

      <Script src="/zoom.js" strategy="afterInteractive" />
    </>
  );
}
