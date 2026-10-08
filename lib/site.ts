import type { Metadata } from "next";

// Canonical origin, used for canonical links, the sitemap, robots and structured data. Always
// the production address, even in local and preview builds: canonical tags must name one URL.
// No trailing slash, because callers append paths.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://ai-coach-harness.vercel.app").replace(/\/+$/, "");

export const title = (slug: string) => slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

// Per-page metadata. Next replaces (not merges) a parent's openGraph when a page sets one, so
// every page builds the whole block here: canonical URL, Open Graph and Twitter in one place.
export function pageMeta({ title, description, path }: { title?: string; description: string; path: string }): Metadata {
  const ogTitle = title ? `${title} · AI Coach` : "AI Coach — a coaching harness for Claude Code";
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: "AI Coach",
      url: path,
      title: ogTitle,
      description,
      images: [{ url: "/cover.jpg", alt: "AI Coach — harness your team" }],
    },
    twitter: { card: "summary_large_image", title: ogTitle, description },
  };
}
