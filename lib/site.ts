// Canonical origin: explicit env, else Vercel's production host, else local dev.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const title = (slug: string) => slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
