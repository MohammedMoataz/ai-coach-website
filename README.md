# AI Coach website

The public site for [AI Coach](https://github.com/MohammedMoataz/ai-coach): a landing page, one
page per coach, the engine, and install instructions.

Next.js 16 (App Router, fully static), PrimeReact 10 (MIT) themed onto the AI Coach brand, and
CSS-only motion. Design spec: [`docs/superpowers/specs/2026-10-08-ai-coach-website-design.md`](docs/superpowers/specs/2026-10-08-ai-coach-website-design.md).

## Where the content comes from

Every coach, skill, agent and command, and every count on the site, is read at build time from
the ai-coach repo's `main` branch (`lib/coaches.ts`): `marketplace.json` plus the frontmatter of
each `SKILL.md`, agent and command file. Nothing countable is typed in by hand, so the site cannot
drift from the repo. A missing or malformed file fails the build, which keeps the last good deploy
live. Marketing copy that is not countable lives in `content/copy.ts`.

## Develop

Requires Node 24.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # catalog parser tests (node --test)
npm run lint
npm run typecheck
npm run build
```

Set `GITHUB_TOKEN` (any token, no scopes needed) if builds hit GitHub's unauthenticated rate limit
of 60 requests an hour.

`npm run dev` and `npm run build` first run `scripts/themes.mjs`, which generates `app/lara.css`:
PrimeReact's Lara theme with its colours rewritten onto the brand tokens and trimmed to the
components the site renders. Using a new PrimeReact component? Add it to `USED` in that script.

## Deploy

Production deploys run through the Vercel CLI in `.github/workflows/deploy.yml`, on push to
`main`, by hand, and whenever ai-coach changes its catalog. One-time setup:

1. `npm i -g vercel`, then `vercel login` and `vercel link` in this directory.
2. Repo secrets: `VERCEL_TOKEN` (vercel.com/account/tokens), and `VERCEL_ORG_ID` /
   `VERCEL_PROJECT_ID` from `.vercel/project.json`.
3. Production address: https://ai-coach-harness.vercel.app (the old `ai-coach-website.vercel.app`
   308-redirects to it). It is the canonical URL in every page, the sitemap, robots and structured
   data; override it with `NEXT_PUBLIC_SITE_URL` in the Vercel project if the domain changes.

Until `VERCEL_TOKEN` exists the deploy workflow skips itself instead of failing.

**Rebuild on ai-coach changes:** ai-coach's `notify-site` workflow sends a `repository_dispatch`
(`ai-coach-updated`) here when `marketplace.json`, a `SKILL.md`, an agent or a command changes on
its `main`. It needs a fine-grained token with **Contents: write** on this repo only, stored in
ai-coach as `SITE_DISPATCH_TOKEN`.

## SEO

- Every page sets its canonical URL, Open Graph and Twitter tags through `pageMeta()` in
  `lib/site.ts`.
- Structured data (JSON-LD): `SoftwareApplication` + `WebSite` on the home page,
  `BreadcrumbList` on inner pages, `FAQPage` on `/install` (from the same `faq` list the page
  renders).
- Nothing a crawler should read hides behind JavaScript: tab panels render into the HTML, the FAQ
  is native `<details>`, and the footer links every page.
- `/sitemap.xml` (dated by the ai-coach commit), `/robots.txt`, and `/llms.txt` for AI assistants.
- Search Console: set `GOOGLE_SITE_VERIFICATION` in the Vercel project to emit the ownership
  meta tag, redeploy, verify, then submit `/sitemap.xml`.

## License

MIT. PrimeReact 10 and PrimeIcons 7 are MIT; newer majors of both are not, so do not bump them
without checking.
