# AI Coach brand extract

Source: Artifact https://claude.ai/code/artifact/6af8cd31-919e-4c84-a640-76a7c7df3948 (version 1791416246-428e), read 2026-10-08.

Palette intent (from the page's own CSS comment): "Palette from the AI Coach mark itself: navy and electric cyan, and the blue that exists only where the two rings overlap, reserved for the chained route. Type: IBM Plex Mono for display and code, IBM Plex Sans for reading."

## 1. CSS custom properties

### Light (`:root`)

```css
:root {
  color-scheme: light;
  --bg: #f2f7fc;  --surface: #ffffff;  --surface-2: #e7f0f9;
  --border: #cbdaea;  --border-strong: #8fa9c4;
  --text: #06182b;  --ink-soft: #2c4a68;  --muted: #4c6582;
  --accent: #0a7389;  --accent-hover: #14527e;  --accent-contrast: #ffffff;
  --accent-2: #16699e;  --accent-2-ink: #ffffff;
  --navy: #14276b;  --warn: #8a4d08;
  --k-manual: #5e7794;  --k-auto: #0b8fa9;  --k-chain: #3e63c8;  --k-hook: #c27c12;
  --term-bg: #061524;  --term-ink: #c9dcf2;  --term-dim: #7f9bb8;
  --sans: "IBM Plex Sans", -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  --mono: "IBM Plex Mono", "JetBrains Mono", ui-monospace, Consolas, Menlo, monospace;
  --radius: 6px;
  --logo: /* data URI, omitted (base64 PNG, 1024x1024) */;
}
```

### Dark (`@media (prefers-color-scheme: dark)`)

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #04101f;  --surface: #0a1b2e;  --surface-2: #102640;
    --border: #1d3a5a;  --border-strong: #35587e;
    --text: #dce9f5;  --ink-soft: #b2c7dc;  --muted: #91a9c2;
    --accent: #14d6f2;  --accent-hover: #7ae8f8;  --accent-contrast: #04101f;
    --accent-2: #2e9bd6;  --accent-2-ink: #04101f;
    --navy: #8fa6ee;  --warn: #e0a253;
    --k-manual: #91a9c2;  --k-auto: #14d6f2;  --k-chain: #7c97e8;  --k-hook: #e0a253;
  }
}
```

### Dark (`:root[data-theme="dark"]`), identical values

```css
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #04101f;  --surface: #0a1b2e;  --surface-2: #102640;
  --border: #1d3a5a;  --border-strong: #35587e;
  --text: #dce9f5;  --ink-soft: #b2c7dc;  --muted: #91a9c2;
  --accent: #14d6f2;  --accent-hover: #7ae8f8;  --accent-contrast: #04101f;
  --accent-2: #2e9bd6;  --accent-2-ink: #04101f;
  --navy: #8fa6ee;  --warn: #e0a253;
  --k-manual: #91a9c2;  --k-auto: #14d6f2;  --k-chain: #7c97e8;  --k-hook: #e0a253;
}
```

Not redefined in dark (same in both themes): `--term-bg`, `--term-ink`, `--term-dim`, `--sans`, `--mono`, `--radius`, `--logo`.

## 2. Fonts

Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
```

Declarations:

- `body { font: 16px/1.55 var(--sans); }`
- `h1, h2, h3, h4 { font-family: var(--mono); letter-spacing: -0.02em; }`
- `code { font-family: var(--mono); font-size: .92em; }`, `pre { font: 13px/1.6 var(--mono); }`
- `.eyebrow { font: 500 12px/1.5 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }`
- `.brand { font: 600 15px/1 var(--mono); }`, tabs `font: 500 13px/1 var(--mono)`, buttons `font: 13px/1 var(--sans)`
- Type scale: `h1 clamp(26px, 4vw, 39px)/1.15`; hero `h1 clamp(30px, 5vw, 50px)/1.08, letter-spacing -0.035em, max-width 16ch`; `h2 25px/1.25`; `h2.section 22px`; `h3 20px/1.3`; `h4 16px/1.35`; `.lead 18px/1.6 color var(--ink-soft) max-width 58ch`.

## 3. Radius, shadow, spacing

- Token: `--radius: 6px` (cards, pre, tables, zoom panels, `.skill`).
- Literal radii: `4px` (buttons, small chips), `999px` (pills, tags, badges, filter chips), `50%` (round markers).
- No shadow tokens. Literal shadows only: `0 1px 4px rgba(0, 0, 0, .12)` (floating zoom toolbar); `inset 3px 0 0 var(--k-*)` (left accent bar on kind chips).
- No spacing tokens. Layout: `.wrap { max-width: 72rem; margin: 0 auto; padding: 24px 16px 64px; }`, `.prose { max-width: 70ch; }`, card padding 16px, `.skill` padding 20px (14px under 560px).
- Sticky header: `background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border);`. Logo mark 26x26 via `background: var(--logo) center / contain no-repeat`.

## 4. Hero "animated team graph"

`viewBox 0 0 260 160`, rendered `width:100%; max-width:460px`, sitting in a two-column auto-fit grid (`minmax(min(100%, 360px), 1fr)`) beside the copy. Nodes: one "me" node at (50,80), r=15, surface fill, navy stroke 2, navy center dot r=4; three teammate nodes at (140,48), (140,112), (212,80), r=13, surface fill, `--k-auto` stroke 2, `--k-auto` dot r=3.5. Edges: me to both middle nodes, both middle nodes to the right node (a diamond fan-in); `--k-auto` stroke 1.2, opacity .55. Animation: four `--accent-2` pulse dots (r=2.6) ride the edges via CSS `offset-path`. Keyframe `travel` (4.8s ease-in-out infinite) moves `offset-distance` 0% to 100%, fading in by 15% and out after 85%; delays 0 / 1.2 / 2.4 / 3.6s so knowledge appears to hop me to team to the far node. Under `prefers-reduced-motion: reduce` the pulses are hidden.

```html
<svg class="hero-art" viewBox="0 0 260 160" aria-hidden="true" focusable="false">
  <g class="h-edges"><path d="M65 80 L131 48"/><path d="M65 80 L131 112"/><path d="M149 48 L200 80"/><path d="M149 112 L200 80"/></g>
  <circle class="h-me" cx="50" cy="80" r="15"/><circle class="h-me-dot" cx="50" cy="80" r="4"/>
  <circle class="h-node" cx="140" cy="48" r="13"/><circle class="h-dot" cx="140" cy="48" r="3.5"/>
  <circle class="h-node" cx="140" cy="112" r="13"/><circle class="h-dot" cx="140" cy="112" r="3.5"/>
  <circle class="h-node" cx="212" cy="80" r="13"/><circle class="h-dot" cx="212" cy="80" r="3.5"/>
  <circle class="h-pulse" r="2.6" style="offset-path:path('M65 80 L131 48')"/>
  <circle class="h-pulse" r="2.6" style="offset-path:path('M65 80 L131 112'); animation-delay:1.2s"/>
  <circle class="h-pulse" r="2.6" style="offset-path:path('M149 48 L200 80'); animation-delay:2.4s"/>
  <circle class="h-pulse" r="2.6" style="offset-path:path('M149 112 L200 80'); animation-delay:3.6s"/>
</svg>
```

```css
.hero-art { width: 100%; max-width: 460px; height: auto; justify-self: center; }
.h-edges path { fill: none; stroke: var(--k-auto); stroke-width: 1.2; opacity: .55; }
.h-me { fill: var(--surface); stroke: var(--navy); stroke-width: 2; }
.h-me-dot { fill: var(--navy); }
.h-node { fill: var(--surface); stroke: var(--k-auto); stroke-width: 2; }
.h-dot { fill: var(--k-auto); }
.h-pulse { fill: var(--accent-2); animation: travel 4.8s ease-in-out infinite; }
@keyframes travel { 0% { offset-distance: 0%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { offset-distance: 100%; opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .h-pulse { animation: none; opacity: 0; } }
```

## 5. Marketing copy (verbatim)

### Hero

- Eyebrow: A coaching harness for Claude Code
- Headline: Your best session should be your normal one.
- Sub-headline: AI Coach keeps what a session learned and puts it in front of you next time, with who learned it. It shapes a vague ask until someone else could act on it, argues with a finding before it reaches you, and tracks a security finding until it is closed. The house rule: no claim without the evidence for it.
- Install: `claude plugin marketplace add MohammedMoataz/ai-coach` then `claude plugin install ai-coach@ai-coach`
- Fine print: Node 22.16+ or 24 · MIT · about 1,900 tokens of always-loaded context · your data lives in `~/.ai-coach/` and survives uninstalling

### Overview sections

- **How it is built**: One engine and nine coaches, installed together by the `ai-coach` bundle. The engine is hooks and a database; it is what runs on its own. The coaches are skills you call, plus six agents those skills spawn. Each has its own tab.
- **What changes about your day**: (no lede; card grid). First cards: "Memory that survives the session: Each session opens with what you and your teammates worked out, who learned it, and roughly when. Day two is when you notice you stopped repeating yourself." / "Knowledge that changes hands: What a teammate concluded travels in a git commit, reviewable in a pull request before it reaches your machine. No server, no account."

### Panels (eyebrow / heading / lede)

- ai-coach-core · the engine / The part that runs without being asked. Every coach reads and writes through it. / Nine hook bindings on eight Claude Code events, one `engine.js` with about 36 command-line verbs, and two SQLite databases in your home directory. No skills. (continues with Node version notes)
- Who calls what / Every skill and command, and the four ways one gets started. / One frontmatter line decides most of this.
- ai-coach · the bundle / Three commands that span the coaches. Install this plugin and you get the engine and every coach with it. / All three are user-only: they cost nothing until you type them.
- memory-coach / Search what was already learned, publish what you concluded, hand it to a teammate, and say who is on the team. / Four skills. No hooks or agents of its own: the recording is done by the engine, this coach is how you read and share it.
- prompt-coach / Write prompts that land, shape a big scope before you send it, see which habits cost you, and brief a context that cannot ask you a follow-up. / Four skills. Writes nothing, ever.
- security-coach / Injection defence for content you are about to trust, OWASP-grounded audits of code you ship, and pentest findings tracked to closure. / Three skills and the examiner agent. The always-on parts (the secrets guard and the injection spotlight) are engine hooks.
- harness-coach / What is installed next to the coach, and what is filling this session. / Two skills, no hooks or agents.
- investigation-coach / Onboard anyone onto the project: evidence-cited docs, an architecture map you can open in Obsidian or draw.io, and study material. / Three skills and the scout agent.
- atlas-coach / Everything outside the repo: verified web research, documents in and markdown out, competitor and industry analysis, and docs turned into code in your idiom. / Four skills, three agents, and `tools/ingest.js` (zero-dependency Node with an FTS5 search index).
- strategy-coach / Document what the business is, mapped to the code that implements it, and specify what comes next with a checkable definition of done. / Two skills, no agents of its own. Inward-facing by design; looking outward is atlas-coach.
- analysis-coach / The business-analyst half: requirements nobody can argue about later, data turned into an analysis that has already been argued with, and the version an executive reads. / Three skills and the critic agent.
- design-coach / How a published page should look, made checkable: text that stays in its box, zoomable diagrams, the project's own fonts and palette, and WCAG contrast in both themes. / One skill, two scripts (`check-artifact.js`, `probe-overflow.js`) and two hooks: the only hooks outside the engine.
