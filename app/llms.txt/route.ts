import { getCatalog } from "@/lib/coaches";
import { SITE_URL, title } from "@/lib/site";
import { INSTALL, REPO_URL, hero, pitch } from "@/content/copy";

// /llms.txt (llmstxt.org): a plain-text map of the site for AI assistants, built from the same
// catalog as the pages, so it lists exactly what ships. Prerendered at build like everything else.
export const dynamic = "force-static";

export async function GET() {
  const c = await getCatalog();
  const lines = [
    "# AI Coach",
    "",
    `> A coaching harness for Claude Code. ${hero.lede}`,
    "",
    `Version ${c.version}. MIT. Source: ${REPO_URL}`,
    "",
    "Install in Claude Code:",
    ...INSTALL.map((l) => `    ${l}`),
    "",
    "## Pages",
    "",
    `- [Install](${SITE_URL}/install): requirements, single-coach installs, and setup for Cursor, Codex, opencode and other MCP harnesses`,
    `- [The engine](${SITE_URL}/engine): ${pitch["ai-coach-core"]}`,
    "",
    "## Coaches",
    "",
    ...c.coaches.flatMap((p) => [
      `- [${title(p.slug)}](${SITE_URL}/coaches/${p.slug}): ${pitch[p.slug] ?? p.description}`,
      ...p.skills.map((s) => `  - \`${s.invocation}\`: ${s.description}`),
      ...p.agents.map((a) => `  - agent \`${a.invocation}\`: ${a.description}`),
    ]),
    "",
    "## Commands",
    "",
    ...c.commands.map((s) => `- \`${s.invocation}\`: ${s.description}`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
