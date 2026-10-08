import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/coaches";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { coaches } = await getCatalog();
  return ["/", "/install", "/engine", ...coaches.map((c) => `/coaches/${c.slug}`)].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
}
