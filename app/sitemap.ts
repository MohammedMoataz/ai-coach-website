import { execSync } from "node:child_process";
import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/coaches";
import { SITE_URL } from "@/lib/site";

// A page changes when its content (the ai-coach commit) or the site itself (this repo's last
// commit) changes, so lastModified is the later of the two. Builds without a git checkout fall
// back to the ai-coach date alone.
function siteCommitDate(): string {
  try {
    return execSync("git log -1 --format=%cI", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { coaches, updated } = await getCatalog();
  const dates = [updated, siteCommitDate()].filter(Boolean).map((d) => new Date(d).getTime());
  const lastModified = dates.length ? new Date(Math.max(...dates)) : undefined;
  return [
    { path: "/", priority: 1 },
    { path: "/install", priority: 0.9 },
    { path: "/engine", priority: 0.7 },
    ...coaches.map((c) => ({ path: `/coaches/${c.slug}`, priority: 0.7 })),
  ].map(({ path, priority }) => ({ url: `${SITE_URL}${path}`, lastModified, changeFrequency: "weekly", priority }));
}
