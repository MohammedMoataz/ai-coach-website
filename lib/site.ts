// Canonical origin: explicit env, else Vercel's production host, else local dev. No trailing
// slash, because the sitemap and robots routes append paths to it.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const title = (slug: string) => slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
