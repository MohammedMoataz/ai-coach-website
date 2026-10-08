import { getCatalog } from "@/lib/coaches";
import { SITE_URL, pageMeta, title } from "@/lib/site";
import { automatic, pitch } from "@/content/copy";
import { PluginView } from "@/components/PluginView";
import { Reveal } from "@/components/Reveal";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

export const metadata = pageMeta({
  title: "The engine: hooks and memory for Claude Code",
  description: pitch["ai-coach-core"],
  path: "/engine",
});

export default async function EnginePage() {
  const { engine, coaches } = await getCatalog();
  return (
    <PluginView
      plugin={engine}
      eyebrow="ai-coach-core · the engine"
      prev={null}
      next={coaches[0] ? { href: `/coaches/${coaches[0].slug}`, label: title(coaches[0].slug) } : null}
    >
      <JsonLd
        data={breadcrumbs(SITE_URL, [
          ["Home", "/"],
          ["The engine", "/engine"],
        ])}
      />
      <section className="section-sm">
        <div className="wrap">
          <h2 className="h2">{automatic.title}</h2>
          <p className="lead">{automatic.lede} It has no skills of its own.</p>
          <div className="grid">
            {automatic.items.map((it) => (
              <Reveal key={it.title}>
                <div className="card">
                  <span className="card-icon">
                    <i className={`pi ${it.icon}`} aria-hidden />
                  </span>
                  <h3>{it.title}</h3>
                  <p>{it.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </PluginView>
  );
}
