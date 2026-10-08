import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/coaches";
import { SITE_URL, pageMeta, title } from "@/lib/site";
import { pitch } from "@/content/copy";
import { PluginView } from "@/components/PluginView";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getCatalog()).coaches.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/coaches/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const coach = (await getCatalog()).coaches.find((c) => c.slug === slug);
  if (!coach) return {};
  return pageMeta({ title: `${title(slug)} for Claude Code`, description: pitch[slug] ?? coach.description, path: `/coaches/${slug}` });
}

export default async function CoachPage({ params }: PageProps<"/coaches/[slug]">) {
  const { slug } = await params;
  const { coaches } = await getCatalog();
  const i = coaches.findIndex((c) => c.slug === slug);
  if (i < 0) notFound();
  const at = (j: number) => (coaches[j] ? { href: `/coaches/${coaches[j].slug}`, label: title(coaches[j].slug) } : null);

  return (
    <>
      <JsonLd
        data={breadcrumbs(SITE_URL, [
          ["Home", "/"],
          ["Coaches", "/#coaches"],
          [title(slug), `/coaches/${slug}`],
        ])}
      />
      <PluginView
        plugin={coaches[i]}
        eyebrow={`Coach ${i + 1} of ${coaches.length}`}
        prev={i === 0 ? { href: "/engine", label: "The engine" } : at(i - 1)}
        next={at(i + 1)}
      />
    </>
  );
}
