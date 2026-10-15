import { test } from "node:test";
import assert from "node:assert/strict";
import { loopmap } from "../content/loopmap.ts";
import { renderSvg, renderBriefSvg, renderTwin, checkMap, wrap, fits, shortLane, shortItem } from "./loopmap.ts";

// A catalog that agrees with the map exactly: every non-store item, with its kind.
function agreeingCatalog(map = loopmap) {
  const skill = (i) => ({ name: i.label, invocation: i.id, description: "x", modelInvocable: i.kind === "model" });
  const items = map.items.filter((i) => i.kind !== "store");
  const plugin = (slug) => ({
    slug, description: "x", tags: [],
    skills: items.filter((i) => i.lane === slug && (i.kind === "model" || i.kind === "typed")).map(skill),
    agents: items.filter((i) => i.lane === slug && i.kind === "agent").map((i) => ({ name: i.label, invocation: i.id, description: "x", tools: [] })),
  });
  const [engine, ...coaches] = map.lanes.filter((l) => l.id !== "ai-coach").map((l) => plugin(l.id));
  const hooks = items.filter((i) => i.kind === "hook").map((i) => {
    const [plugin, event, script] = i.id.split(":");
    return { plugin, event, script, id: i.id };
  });
  return { engine, coaches, commands: items.filter((i) => i.kind === "cmd").map(skill), hooks };
}

test("renders deterministically", () => {
  assert.equal(renderSvg(loopmap), renderSvg(loopmap));
  assert.equal(renderTwin(loopmap), renderTwin(loopmap));
});

test("the svg passes design-coach's static rules", () => {
  const svg = renderSvg(loopmap);
  assert.match(svg, /^<svg [^>]*viewBox="0 0 \d+ \d+"[^>]*role="img"[^>]*aria-label="[^"]+"/);
  assert.doesNotMatch(svg, /<style|<script|<foreignObject|font-family/);
  const sizes = [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.ok(sizes.length > 200, "text is sized by attribute");
  assert.ok(Math.min(...sizes) >= 12, "no text under 12px");
  assert.ok(svg.includes("&lt;private&gt;") && !svg.includes("<private>"), "text is escaped");
});

test("every label fits its box, and a label that doesn't stops the render", () => {
  for (const line of wrap("Anything between private tags is stripped before a single byte is written.", 12, 216)) {
    assert.ok(fits(line, 12, 216), line);
  }
  const bad = structuredClone(loopmap);
  bad.items[0].label = "a label far too long for any chip";
  assert.throws(() => renderSvg(bad), /does not fit/);
});

test("the brief passes the same static rules, and names every hook, skill, command and agent", () => {
  const svg = renderBriefSvg(loopmap);
  assert.equal(svg, renderBriefSvg(loopmap), "deterministic");
  assert.match(svg, /^<svg [^>]*viewBox="0 0 1152 \d+"[^>]*role="img"/);
  assert.doesNotMatch(svg, /<style|<script|<foreignObject|font-family/);
  assert.ok(Math.min(...[...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]))) >= 12, "no text under 12px");
  // every coach heads a chip, and every hook, skill, command and agent is named in one
  const words = [...svg.matchAll(/>([^<]+)<\/text>/g)].map((m) => m[1]).join(" ").replace(/,/g, " ");
  for (const l of loopmap.lanes) assert.ok(svg.includes(`>${shortLane(l.id)}</text>`), l.id);
  for (const i of loopmap.items.filter((x) => x.kind !== "store")) {
    for (const w of shortItem(i).split(" ")) assert.ok(words.includes(w), i.id);
  }
});

test("every item, lane and special case reaches the text twin, with its source", () => {
  const twin = renderTwin(loopmap);
  for (const i of loopmap.items) assert.ok(twin.includes(i.id.startsWith("/") ? i.id : i.label), i.id);
  for (const l of loopmap.lanes) assert.ok(twin.includes(`<h4>${l.title}</h4>`), l.id);
  assert.equal((twin.match(/github\.com\/MohammedMoataz\/ai-coach\/blob\/main\//g) ?? []).length >= loopmap.items.length, true);
  assert.ok(!twin.includes("<private>"));
});

test("checkMap: an agreeing catalog is clean", () => {
  assert.deepEqual(checkMap(loopmap, agreeingCatalog()), []);
});

test("checkMap: a catalog skill missing from the map fails, and so does a map item the catalog lost", () => {
  const cat = agreeingCatalog();
  cat.coaches[0].skills.push({ name: "ghost", invocation: "/memory-coach:ghost", description: "x", modelInvocable: true });
  assert.ok(checkMap(loopmap, cat).some((p) => p.includes("/memory-coach:ghost: in the catalog but missing")));
  const gone = agreeingCatalog();
  gone.commands = gone.commands.filter((c) => c.invocation !== "/ai-coach:sitrep");
  assert.ok(checkMap(loopmap, gone).some((p) => p.includes("/ai-coach:sitrep: not in the catalog")));
});

test("checkMap: a skill drawn as the wrong kind, or in the wrong column, fails", () => {
  const cat = agreeingCatalog();
  cat.coaches.find((p) => p.slug === "memory-coach").skills.find((s) => s.name === "recall").modelInvocable = false;
  assert.ok(checkMap(loopmap, cat).some((p) => p.includes("/memory-coach:recall: drawn as model, the catalog says typed")));
  const moved = structuredClone(loopmap);
  moved.items.find((i) => i.id === "ai-coach-core:PreToolUse:guard.js").col = "post";
  assert.ok(checkMap(moved, agreeingCatalog()).some((p) => p.includes('guard.js: belongs in column "pre"')));
});
