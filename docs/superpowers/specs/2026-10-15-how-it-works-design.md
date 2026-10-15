# How it works: the agent loop, with every coach in it

Date: 2026-10-15 · Status: built · Repo: MohammedMoataz/ai-coach-website · Tracks MohammedMoataz/ai-coach#57

## Intent

The user asked for "the agents loop" drawn in one big diagram, on the website and on the landing
artifact. It should show every coach next to its own skills, at the step of the loop where each one
acts, with the details and special cases. In the user's words, it is "a big move and powerful point
to distinguish the power of the ai-coach plugins and how they work". It takes a whole page of free,
pan-and-zoom space.

## What was built

- **One source, two hosts.**
  - `content/loopmap.ts` holds every step, lane, item, edge and special case. Each one carries the
    `file:line` (or docs URL) it was read from.
  - `lib/loopmap.ts` renders it three ways:
    - `renderSvg`, a string
    - `renderTwin`, an HTML text version
    - `checkMap`, which checks the map against the catalog
  - The site page and `artifact/build.mjs` call the same functions, and `lib/loopmap.css` is
    loaded verbatim by both.
- **Layout:** a swimlane matrix on a horizontal timeline.
  - **Columns** are the loop steps: session start, prompt, model turn, pre-tool, permission, tool
    runs, post-tool, turn end and notification, compaction, session end, and across sessions.
  - **Rows** are the 13 plugins.
  - **Chips** sit where each item enters: typed skills and commands at the prompt, model-invoked
    skills at the model turn, agents where the Agent tool runs, and hooks at their event.
  - **Encoding:** the entry kind is the outline colour plus a mark, so colour is never the only
    channel.
  - **Above the spine**, arcs show the loop, compaction and the next session. **Below the lanes**,
    two panels list where it asks and what it writes, both derived from the items, next to the
    numbered special cases.
- **Pan and zoom:** `public/zoom.js` is a verbatim copy of design-coach's script, with no React
  port. The artifact inlines the same file.
- **Drift guard:**
  - The page throws at build if the catalog has a skill, agent, command or hook binding the map
    lacks, or the other way round.
  - It also throws on a wrong kind or column. The catalog now reads `hooks.json` and agent
    `model:` for this.
  - The user chose to fail the build rather than warn.
- **Sources** are in the text version only, as GitHub links (the user's choice). The canvas stays
  visual.

## Deviations, stated

- **Node count.** design-coach advises ≤ 7 nodes per view. The page has 50 chips, because the user
  asked for the whole loop on one page. Lanes keep each region readable, every word reads at
  100 %, and the text version is the accessible and phone reading surface.
- **The canvas height** is `calc(100dvh − nav − 96px)` (60dvh on phones), not 100dvh. The viewport
  captures wheel and touch, so a full-screen canvas would trap the page.

## Checks

- Unit tests (`lib/loopmap.test.mjs`) cover:
  - deterministic output
  - no `<style>`, `<script>`, `foreignObject` or font-family in the svg
  - no text under 12 px
  - escaping
  - a too-long label stops the render
  - every item reaches the text version
  - `checkMap` both ways, plus kind and column
- The production build ran against the live v1.18.0 catalog and was clean.
- Overflow probe at 100 %, light and dark: 390 labels, 0 overlaps. One verb straddles a lane band's
  edge; it sits on a background fill with a halo.
- The artifact lint reports 0 errors and 0 warnings.
