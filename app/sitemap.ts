import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/coaches";
import { SITE_URL } from "@/lib/site";

// lastModified is the ai-coach commit the site was built from: every page's content comes from
// it, so it is the honest "changed since" date for crawlers.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { coaches, updated } = await getCatalog();
  const lastModified = updated ? new Date(updated) : undefined;
  return [
    { path: "/", priority: 1 },
    { path: "/install", priority: 0.9 },
    { path: "/engine", priority: 0.7 },
    ...coaches.map((c) => ({ path: `/coaches/${c.slug}`, priority: 0.7 })),
  ].map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency: "weekly", priority }));
}
