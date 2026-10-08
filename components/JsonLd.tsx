// Structured data for search engines. Values come from the ai-coach repo, so "<" is escaped:
// a description containing "</script>" must not be able to close the tag.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c") }}
    />
  );
}

export const breadcrumbs = (site: string, items: [name: string, path: string][]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${site}${path}` })),
});
