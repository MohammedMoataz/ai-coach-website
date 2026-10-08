# AI Coach website — design spec

Date: 2026-10-08 · Status: awaiting review · Repo: `MohammedMoataz/ai-coach-website`

## 1. Intent

**Outcome.** A public website for [AI Coach](https://github.com/MohammedMoataz/ai-coach) that
turns a Claude Code user who has never heard of it into one who has copied the install command.

**Audience.** Developers who use Claude Code (and, secondarily, Codex / Cursor / opencode /
Windsurf / Gemini CLI via the MCP adapters) deciding whether to adopt it.

**Success criteria.**
- A visitor can state what AI Coach does and copy `claude plugin marketplace add
  MohammedMoataz/ai-coach` + `claude plugin install ai-coach@ai-coach` from the first screen.
- Every coach, skill, agent and command shipped on ai-coach `main` appears on the site, with
  counts that match the repo — computed, never typed.
- Lighthouse ≥ 90 in all four categories on the production URL; WCAG AA contrast in both themes;
  fully keyboard-operable; no horizontal scroll at 360px; honours `prefers-reduced-motion`.

**Vision and mission, as the product states them** (README, marketplace manifest):
- Tagline: *Harness your team. A coach for using Claude Code well.*
- Problem: every session starts cold — constraints re-explained, traps rediscovered, a
  teammate's conclusions lost on checkout.
- House rule: **no claim without the evidence for it.** The site obeys it too: no invented
  stats, no testimonials, no unmeasured performance numbers; an estimate is labelled as one.

### What the user decided (2026-10-08)
| Topic | Decision |
|---|---|
| Audience | Developers who install it |
| Scope | Landing page + one page per coach + `/engine` + `/install` |
| Content source | Fetched at build time from ai-coach `main`; marketing copy hand-written |
| Look | Reuse current brand: logo, cover, palette and team-graph motif from the existing landing artifact |
| UI library | PrimeReact, styled mode (Lara) with brand tokens overriding its CSS variables |
| Motion | `motion` (Framer Motion) |
| Deploy | Vercel via CLI, `*.vercel.app` for now, custom domain later |
| Rebuild trigger | ai-coach push to `main` touching manifests → `repository_dispatch` → site deploy Action |
| Repo | Public, MIT |

### Assumptions
- No backend, no auth, no analytics, no forms. Everything is static at build time.
- English only.
- GitHub Releases are stale (latest published: v1.0.0; marketplace says 1.16.3), so the site
  reads `main` and shows the marketplace `version` field, never a release.

### Out of scope (YAGNI)
Blog, docs search, changelog page (link to GitHub instead), analytics, i18n, newsletter,
custom domain. Each can be added when there is a reason.

## 2. Site map and content

### `/` landing
1. **Nav** — logo, Coaches menu (all coaches from data), Install, GitHub link, theme toggle.
2. **Hero** — "Harness your team.", one-line pitch, the two install commands in a copy block,
   animated team graph (sessions linked through shared memory).
3. **The problem** — "Every session starts cold": three beats (re-explain, rediscover, lose a
   teammate's work).
4. **What happens on its own** — the automatic layer: session brief, corrections, distillation,
   compaction snapshot, prompt hints, secrets guard (off by default — said plainly), injection
   check (warn-only — said plainly).
5. **The coaches** — card grid, one per marketplace plugin except `ai-coach` (bundle) and
   `ai-coach-core` (engine, linked separately): name, description, skill chips, link.
6. **Evidence, not etiquette** — the house rule; the always-loaded token cost with the README's
   own label ("expected", not re-probed).
7. **Beyond Claude Code** — harness strip: Claude Code native; Codex CLI, Cursor, opencode via
   MCP + compiled rules; "anything that speaks MCP". Includes the honest line: outside Claude
   Code the automatic layer is a convention, not a mechanism.
8. **Three commands** — `/ai-coach:start`, `/ai-coach:wrap`, `/ai-coach:sitrep`, descriptions
   from command frontmatter.
9. **Final CTA** — install block again, GitHub, MIT.

### `/coaches/[slug]` (one per coach) and `/engine` (ai-coach-core)
- Header: name, description, tags, `claude plugin install <slug>@ai-coach`.
- Skills: `/coach:skill` invocation, description, argument hint, badge **model-invocable** or
  **you invoke** (from `disable-model-invocation`), model pin when present.
- Agents (if any): name, description, tools.
- Prev / next coach.

### `/install`
Node requirement (≥ 22.16 or ≥ 24; 23.x unsupported, with the reason), bundle vs single coach,
MCP adapter setup for other harnesses (linking `adapters/README.md`), uninstall.

## 3. Architecture and data flow

**Stack.** Next.js latest stable, App Router, TypeScript. Runtime deps: `primereact`,
`primeicons`, `motion`, `yaml`. Nothing else without a reason.

**`lib/coaches.ts`** — `server-only`, the single data module.
1. `GET api.github.com/repos/MohammedMoataz/ai-coach/git/trees/main?recursive=1` → select
   `.claude-plugin/marketplace.json`, `plugins/*/skills/*/SKILL.md`, `plugins/*/agents/*.md`,
   `plugins/ai-coach/commands/*.md`.
2. Fetch each from `raw.githubusercontent.com` in parallel; split frontmatter on `---`, parse
   with `yaml`. Fields used: `description`, `argument-hint`, `disable-model-invocation`,
   `model`, `name`, `tools`.
3. Return
   `{ version, coaches: [{ slug, description, tags, skills[], agents[] }], engine, commands[], counts }`.
4. `fetch(url, { cache: 'force-cache' })` — fetched once per build; all pages static.
5. Optional `GITHUB_TOKEN` env sent as `Authorization` (unauthenticated limit is 60/h).
6. **Fails the build** on any non-2xx, unparsable frontmatter, missing `description`, or a skill
   directory without `SKILL.md`. Vercel keeps serving the last good deploy.

**Rendering.** `app/page.tsx`, `app/coaches/[slug]/page.tsx` (`generateStaticParams` from data,
`dynamicParams = false`), `app/engine/page.tsx`, `app/install/page.tsx` are server components.
PrimeReact and motion live in small `'use client'` leaf components.

**Rebuild loop.**
- ai-coach: `.github/workflows/notify-site.yml` — `on: push` to `main` with paths
  `.claude-plugin/marketplace.json`, `plugins/*/skills/**/SKILL.md`, `plugins/*/agents/*.md`,
  `plugins/ai-coach/commands/*.md`; runs
  `gh api repos/MohammedMoataz/ai-coach-website/dispatches -f event_type=ai-coach-updated`
  with secret `SITE_DISPATCH_TOKEN`.
- site: `.github/workflows/deploy.yml` — `on: repository_dispatch (ai-coach-updated)`, push to
  `main`, `workflow_dispatch`; runs `vercel pull --environment=production`,
  `vercel build --prod`, `vercel deploy --prebuilt --prod` with secrets `VERCEL_TOKEN`,
  `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `GITHUB_TOKEN` passed to the build.
- Vercel Deploy Hooks are not used: they require a Git-connected project, and this one is
  CLI-deployed by decision.

**Secrets the user creates.** A Vercel access token; a fine-grained GitHub PAT with
`contents: write` on `ai-coach-website` only (what `repository_dispatch` requires), stored in
ai-coach as `SITE_DISPATCH_TOKEN`.

## 4. Visual system and motion

- **Tokens.** `app/tokens.css` holds the palette and font tokens taken from the existing landing
  artifact's light (`:root`) and dark blocks — extracted by grep from the saved HTML, not read
  whole. The same variables override Lara's `--primary-color`, `--surface-*`, `--text-color`,
  `--border-radius`: one palette.
- **Assets.** `assets/logo.png` and `assets/cover.jpg` from ai-coach copied once into `public/`.
- **Fonts.** The artifact's face via `next/font` (self-hosted, no layout shift).
- **Theme.** Dark + light; follows `prefers-color-scheme`, manual toggle persisted in
  `localStorage` (wrapped in try/catch); a blocking inline `<head>` script sets the theme before
  paint; the Lara light/dark stylesheet swapped by one `<link>`.
- **Motion.**
  - Hero team graph — SVG; edges draw via `pathLength`, nodes pulse, gentle loop.
  - Section reveal — fade/rise on `whileInView`, `once: true`; coach cards stagger.
  - Coach card hover lift; skill chips use layout animation.
  - Install block — typed on first view; copy confirms with a check morph; Clipboard API with
    select-text fallback.
  - Route fade via `app/template.tsx`.
  - `MotionConfig reducedMotion="user"` at the root: reduced motion collapses all of the above
    to instant state. Mandatory.
- **SEO.** Metadata per page, Open Graph image from `cover.jpg`, `app/sitemap.ts`,
  `app/robots.ts`.

## 5. Errors, testing, delivery

**Errors.** Build-time fetch is the only trust boundary: validated and fail-closed as above.
Frontmatter strings render as React text only — never `dangerouslySetInnerHTML`. Unknown slug →
`notFound()`.

**Tests.** `lib/coaches.test.ts` on the built-in `node --test` runner against a fixture tree +
files: quoted `argument-hint` parses; `disable-model-invocation` maps to the badge; counts are
right; a missing `description` throws. CI on every PR: lint, `tsc --noEmit`, `node --test`,
`next build`.

**Verification before "done".** Lighthouse on the production URL, keyboard walk-through,
reduced-motion pass, 360px check — each with its output shown.

**Delivery (PRs on this repo, in order).**
1. Scaffold — Next.js, PrimeReact theme, tokens, nav, footer, theme toggle, CI.
2. `lib/coaches.ts` + test.
3. Landing sections + motion.
4. `/coaches/[slug]`, `/engine`, `/install`.
5. SEO / OG / Lighthouse fixes.
6. Vercel link + first prod deploy (user runs `vercel login`), then `deploy.yml`.
7. In ai-coach (separate PR): `notify-site.yml` and a README link to the site.
