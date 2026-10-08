import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCatalog } from "./coaches.ts";

const market = {
  version: "9.9.9",
  plugins: [
    { name: "ai-coach-core", source: "./plugins/ai-coach-core", description: "The engine.", tags: ["engine"] },
    { name: "memory-coach", source: "./plugins/memory-coach", description: "Memory.", tags: ["memory"] },
    { name: "ai-coach", source: "./plugins/ai-coach", description: "The bundle." },
  ],
};

const fixture = (m = market) => ({
  ".claude-plugin/marketplace.json": JSON.stringify(m),
  "plugins/memory-coach/skills/recall/SKILL.md":
    '---\r\ndescription: Searches memory.\r\nargument-hint: "<query> [--gap \\"<the gap>\\"] | --health"\r\n---\r\n# body',
  "plugins/memory-coach/skills/roster/SKILL.md":
    "---\ndescription: Who is on the team: roster and trust.\ndisable-model-invocation: true\nmodel: haiku\n---\n",
  "plugins/memory-coach/agents/scout.md": "---\nname: scout\ndescription: Sweeps.\ntools: Read, Grep\n---\n",
  "plugins/ai-coach/commands/start.md": "---\ndescription: Day one.\ndisable-model-invocation: true\n---\n",
});

test("builds the catalog from repo files", () => {
  const files = fixture();
  const c = buildCatalog("abc", Object.keys(files), files);
  assert.equal(c.version, "9.9.9");
  assert.equal(c.engine.slug, "ai-coach-core");
  assert.deepEqual(c.coaches.map((p) => p.slug), ["memory-coach"]);
  const [recall, roster] = c.coaches[0].skills;
  assert.equal(recall.invocation, "/memory-coach:recall");
  assert.equal(recall.argumentHint, '<query> [--gap "<the gap>"] | --health');
  assert.equal(recall.modelInvocable, true);
  assert.equal(roster.modelInvocable, false);
  assert.equal(roster.model, "haiku");
  assert.equal(roster.description, "Who is on the team: roster and trust.");
  assert.deepEqual(c.coaches[0].agents[0].tools, ["Read", "Grep"]);
  assert.equal(c.commands[0].invocation, "/ai-coach:start");
  assert.deepEqual(c.counts, { coaches: 1, skills: 2, modelInvocable: 1, agents: 1, commands: 1 });
});

test("a missing description fails the build", () => {
  const files = fixture();
  files["plugins/memory-coach/skills/roster/SKILL.md"] = "---\nmodel: haiku\n---\n";
  assert.throws(() => buildCatalog("abc", Object.keys(files), files), /roster\/SKILL\.md: missing description/);
});

test("a skill directory without SKILL.md fails the build", () => {
  const files = fixture();
  const paths = [...Object.keys(files), "plugins/memory-coach/skills/ghost/notes.md"];
  assert.throws(() => buildCatalog("abc", paths, files), /skills\/ghost: no SKILL\.md/);
});

test("a plugin is read from its marketplace source directory, not its name", () => {
  const renamed = { ...market, plugins: market.plugins.map((p) => (p.name === "memory-coach" ? { ...p, source: "./plugins/mem/" } : p)) };
  const files = Object.fromEntries(
    Object.entries(fixture(renamed)).map(([k, v]) => [k.replace("plugins/memory-coach/", "plugins/mem/"), v]),
  );
  const c = buildCatalog("abc", Object.keys(files), files);
  assert.deepEqual(c.coaches[0].skills.map((s) => s.invocation), ["/memory-coach:recall", "/memory-coach:roster"]);
  assert.equal(c.counts.agents, 1);
});

test("a source outside ./plugins/<dir> fails the build", () => {
  const remote = { ...market, plugins: market.plugins.map((p) => (p.name === "memory-coach" ? { ...p, source: "https://example.com/x.git" } : p)) };
  const files = fixture(remote);
  assert.throws(() => buildCatalog("abc", Object.keys(files), files), /unsupported source for memory-coach/);
});
