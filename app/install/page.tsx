import { getCatalog } from "@/lib/coaches";
import { SITE_URL, pageMeta } from "@/lib/site";
import { INSTALL, REPO_URL, faq } from "@/content/copy";
import { InstallTabs } from "@/components/InstallTabs";
import { JsonLd, breadcrumbs } from "@/components/JsonLd";

export const metadata = pageMeta({
  title: "Install in Claude Code",
  description:
    "Install AI Coach in Claude Code with two commands, pick a single coach, or wire its memory into Cursor, Codex, opencode and other MCP harnesses.",
  path: "/install",
});

// `code` in backticks becomes <code>; structured data gets the plain text.
const rich = (s: string) => s.split("`").map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
const plain = (s: string) => s.replaceAll("`", "");

export default async function InstallPage() {
  const { coaches } = await getCatalog();
  return (
    <>
      <JsonLd
        data={{
          "@graph": [
            breadcrumbs(SITE_URL, [
              ["Home", "/"],
              ["Install", "/install"],
            ]),
            {
              "@type": "FAQPage",
              mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: plain(a) } })),
            },
          ],
        }}
      />
      <header className="page-head">
        <div className="wrap">
          <p className="eyebrow">Install</p>
          <h1>Two commands in Claude Code.</h1>
          <p className="lead">
            Requires <strong>Node 22.16+ or 24+</strong>: the memory needs <code>node:sqlite</code> with FTS5 in its
            bundled SQLite. The 23.x line ships the module without FTS5 and is not supported; on a Node that cannot run
            it, the engine says so on stderr instead of failing silently.
          </p>
        </div>
      </header>
      <section className="section-sm" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <InstallTabs bundle={INSTALL} coaches={coaches.map((c) => c.slug)} repo={REPO_URL} />

          <h2 className="h2" style={{ marginTop: 56, marginBottom: 20 }}>
            Good to know
          </h2>
          <div className="faq">
            {faq.map(({ q, a }) => (
              <details key={q}>
                <summary>{q}</summary>
                <p className="prose">{rich(a)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
