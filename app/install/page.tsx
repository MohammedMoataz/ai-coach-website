import type { Metadata } from "next";
import { getCatalog } from "@/lib/coaches";
import { INSTALL, REPO_URL } from "@/content/copy";
import { InstallTabs } from "@/components/InstallTabs";

export const metadata: Metadata = {
  title: "Install",
  description: "Install AI Coach in Claude Code with two commands, pick single coaches, or wire its memory into Cursor, Codex, opencode and other MCP harnesses.",
};

export default async function InstallPage() {
  const { coaches } = await getCatalog();
  return (
    <>
      <header className="page-head">
        <div className="wrap">
          <p className="eyebrow">Install</p>
          <h1>Two commands in Claude Code.</h1>
          <p className="lead">
            Requires <strong>Node 22.16+ or 24+</strong>: the memory needs <code>node:sqlite</code> with FTS5 in its bundled
            SQLite. The 23.x line ships the module without FTS5 and is not supported; on a Node that cannot run it, the
            engine says so on stderr instead of failing silently.
          </p>
        </div>
      </header>
      <section className="section-sm" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <InstallTabs
            bundle={INSTALL}
            coaches={coaches.map((c) => c.slug)}
            repo={REPO_URL}
          />
        </div>
      </section>
    </>
  );
}
