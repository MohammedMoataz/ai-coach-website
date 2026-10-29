// Renders content/loopmap.ts: an SVG string, a text twin, and a check against the catalog.
// Pure and deterministic, with only type imports, so Node can run it directly (type stripping)
// for the artifact build, and the site imports the same file. Styling is classes only: each host
// maps .lm-* to its own tokens. No <style>, <script> or font-family inside the svg; font sizes
// are attributes (design-coach's lint, check-artifact.js).
import type { Callout, Col, Item, Kind, LoopMap, Step } from "../content/loopmap";
import type { Catalog } from "./coaches";

export const REPO_BLOB = "https://github.com/MohammedMoataz/ai-coach/blob/main/";

// ── text ───────────────────────────────────────────────────────────────────────────────────────
export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// design-coach's width rule for a label in a box: 0.6 × font-size × characters + 24 ≤ box width.
export const fits = (text: string, size: number, width: number) => 0.6 * size * [...text].length + 24 <= width;
function must(text: string, size: number, width: number) {
  if (!fits(text, size, width)) throw new Error(`loopmap: "${text}" does not fit ${width}px at ${size}px`);
  return text;
}
// Greedy word wrap to the same rule, so every wrapped line fits by construction.
export function wrap(text: string, size: number, width: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${w}` : w;
    if (fits(next, size, width)) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = must(w, size, width);
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── geometry ───────────────────────────────────────────────────────────────────────────────────
const HEAD_W = 400; // lane-header column
const SLOT = 232; // one chip slot
const CHIP_W = 216;
const CHIP_H = 52;
const PERM_W = 168; // the permission column carries the spine only
const NOTE = 16; // note line height
const GAP = 12;
const LANE_PAD = 18;
const colWidth = (s: Step) => (s.slots ? s.slots * SLOT + 16 : PERM_W);

export const KIND_TEXT: Record<Kind, string> = {
  typed: "you type it",
  cmd: "a command you type",
  model: "Claude calls it",
  agent: "a subagent",
  hook: "a hook: it just runs",
  store: "kept between sessions",
};
const HOOK_COL: Record<string, Col> = {
  SessionStart: "start", UserPromptSubmit: "prompt", PreToolUse: "pre", PostToolUse: "post",
  PostToolUseFailure: "post", Notification: "end", PreCompact: "compact", SessionEnd: "sessend",
};
const KIND_COL: Partial<Record<Kind, Col>> = { typed: "prompt", cmd: "prompt", model: "model", agent: "tool", store: "across" };

const t = (x: number, y: number, s: string, size: number, cls: string, extra = "") =>
  `<text x="${x}" y="${y}" font-size="${size}" class="${cls}"${extra}>${esc(s)}</text>`;

function glyph(kind: Kind, x: number, y: number): string {
  const c = `lm-g lm-g-${kind}`;
  switch (kind) {
    case "typed": return `<rect class="${c}" x="${x - 5}" y="${y - 5}" width="10" height="10"/>`;
    case "cmd": return `<rect class="${c}" x="${x - 6}" y="${y - 6}" width="12" height="12" stroke-width="2"/>`;
    case "model": return `<circle class="${c}" cx="${x}" cy="${y}" r="5.5"/>`;
    case "agent": return `<path class="${c}" d="M${x} ${y - 6.5}L${x + 6.5} ${y}L${x} ${y + 6.5}L${x - 6.5} ${y}Z"/>`;
    case "hook": return `<path class="${c}" d="M${x} ${y - 6}L${x + 6.5} ${y + 5}L${x - 6.5} ${y + 5}Z"/>`;
    case "store": return `<path class="${c}" d="M${x - 6} ${y - 4}h12v9h-12z M${x - 6} ${y - 4}l6 -3l6 3"/>`;
  }
}

type Placed = { item: Item; x: number; y: number; notes: string[] };
type Layout = {
  width: number;
  height: number;
  colX: Record<Col, number>;
  colW: Record<Col, number>;
  spine: { top: number; bottom: number; title: string[]; sub: string[]; step: Step }[];
  lanes: { id: string; y: number; h: number; title: string; line: string[] }[];
  placed: Map<string, Placed>;
  panelsY: number;
};

function layout(map: LoopMap): Layout {
  const colX = {} as Record<Col, number>;
  const colW = {} as Record<Col, number>;
  let x = HEAD_W;
  for (const s of map.steps) {
    colX[s.col] = x;
    colW[s.col] = colWidth(s);
    x += colW[s.col];
  }
  const width = x + 24;

  // Spine: a box per step, sized to its wrapped text.
  const boxW = (s: Step) => colWidth(s) - 16;
  const spineText = map.steps.map((s) => ({
    step: s,
    title: wrap(s.title, 18, boxW(s)),
    sub: s.sub.flatMap((p) => wrap(p, 13, boxW(s))),
  }));
  const spineTop = 170;
  const spineH = Math.max(...spineText.map((s) => 20 + s.title.length * 24 + 6 + s.sub.length * 18 + 14));
  const spine = spineText.map((s) => ({ ...s, top: spineTop, bottom: spineTop + spineH }));

  // Lanes: chips flow into each cell's slots; a row is as tall as its tallest chip + notes.
  const placed = new Map<string, Placed>();
  const lanes: Layout["lanes"] = [];
  let y = spineTop + spineH + 72;
  for (const lane of map.lanes) {
    const title = lane.title;
    const line = wrap(lane.line, 13, HEAD_W - 48);
    let laneH = LANE_PAD * 2 + 26 + line.length * 18;
    const cells: { col: Col; rows: Placed[][] }[] = [];
    for (const s of map.steps) {
      const here = map.items.filter((i) => i.lane === lane.id && i.col === s.col);
      if (!here.length) continue;
      const ordered = [...here.filter((i) => !i.fail), ...here.filter((i) => i.fail)];
      const rows: Placed[][] = [];
      for (const item of ordered) {
        const notes = (item.notes ?? []).flatMap((n) => wrap(n, 12, CHIP_W));
        const last = rows[rows.length - 1];
        const newRow = !last || last.length >= s.slots || (item.fail && !last[0].item.fail);
        if (newRow) rows.push([]);
        rows[rows.length - 1].push({ item, x: 0, y: 0, notes });
      }
      cells.push({ col: s.col, rows });
      const h = rows.reduce((sum, r) => sum + Math.max(...r.map((p) => CHIP_H + (p.notes.length ? p.notes.length * NOTE + 8 : 0))) + GAP, 0);
      laneH = Math.max(laneH, LANE_PAD * 2 + h - GAP);
    }
    for (const c of cells) {
      let ry = y + LANE_PAD;
      for (const r of c.rows) {
        r.forEach((p, i) => {
          p.x = colX[c.col] + 8 + i * SLOT;
          p.y = ry;
          placed.set(p.item.id, p);
        });
        ry += Math.max(...r.map((p) => CHIP_H + (p.notes.length ? p.notes.length * NOTE + 8 : 0))) + GAP;
      }
    }
    lanes.push({ id: lane.id, y, h: laneH, title, line });
    y += laneH;
  }
  return { width, height: 0, colX, colW, spine, lanes, placed, panelsY: y + 48 };
}

// ── panels below the lanes: derived from the items, so they can't drift from them ─────────────
type Panel = { title: string; rows: [string, string][] };
export function panels(map: LoopMap): Panel[] {
  const name = (i: Item) => (i.kind === "store" ? i.label : i.id.startsWith("/") ? i.id : i.label);
  return [
    { title: "Where it stops to ask", rows: map.items.filter((i) => i.gate).map((i) => [name(i), i.gate!]) },
    { title: "Where it writes", rows: map.items.filter((i) => i.writes).map((i) => [name(i), i.writes!]) },
  ];
}

// ── the svg ────────────────────────────────────────────────────────────────────────────────────
export function renderSvg(map: LoopMap, opts: { describedBy?: string } = {}): string {
  const L = layout(map);
  const out: string[] = [];
  const stepOf = new Map(L.spine.map((s) => [s.step.col, s]));
  const mid = (c: Col) => L.colX[c] + L.colW[c] / 2;

  // lane bands and column rules first, so everything else sits on top
  L.lanes.forEach((ln, i) => {
    out.push(`<rect class="lm-lane ${i % 2 ? "lm-lane-b" : "lm-lane-a"}" x="0" y="${ln.y}" width="${L.width}" height="${ln.h}"/>`);
  });
  const lanesTop = L.lanes[0].y;
  const lanesBottom = L.lanes[L.lanes.length - 1].y + L.lanes[L.lanes.length - 1].h;
  for (const s of map.steps) out.push(`<line class="lm-rule" x1="${L.colX[s.col]}" y1="${lanesTop}" x2="${L.colX[s.col]}" y2="${lanesBottom}"/>`);

  // title and legend
  out.push(t(24, 52, must(map.title, 30, 1400), 30, "lm-t lm-title", ' font-weight="700"'));
  // the subtitle stays inside the header column: the loop arcs run above the spine from x = HEAD_W
  wrap("Every plugin at the step of the loop where it acts.", 15, HEAD_W - 48)
    .forEach((line, i) => out.push(t(24, 88 + i * 21, line, 15, "lm-m")));
  const kinds: Kind[] = ["typed", "cmd", "model", "agent", "hook", "store"];
  kinds.forEach((k, i) => {
    const ly = 196 + i * 30;
    out.push(glyph(k, 36, ly - 5));
    out.push(t(54, ly, must(KIND_TEXT[k], 14, HEAD_W - 60), 14, "lm-t"));
  });
  out.push(t(24, 196 + kinds.length * 30 + 8, "Stroke and mark show how it enters.", 13, "lm-m"));

  // spine. --i is the step's place in the turn: loopmap.css lights each step, and the chips that
  // act at it, in that order.
  const at = new Map(map.steps.map((s, i) => [s.col, i]));
  for (const s of L.spine) {
    const x = L.colX[s.step.col] + 8;
    const w = L.colW[s.step.col] - 16;
    out.push(`<rect class="lm-step" x="${x}" y="${s.top}" width="${w}" height="${s.bottom - s.top}" rx="8" style="--i:${at.get(s.step.col)}"/>`);
    s.title.forEach((line, i) => out.push(t(x + 12, s.top + 30 + i * 24, line, 18, "lm-t", ' font-weight="700"')));
    const subTop = s.top + 30 + s.title.length * 24 + 6;
    s.sub.forEach((line, i) => out.push(t(x + 12, subTop + i * 18, line, 13, "lm-m")));
  }
  // straight arrows between neighbouring steps
  for (let i = 0; i < L.spine.length - 1; i++) {
    const a = L.spine[i], b = L.spine[i + 1];
    const y = a.top + 22;
    out.push(`<line class="lm-flow" x1="${L.colX[a.step.col] + L.colW[a.step.col] - 8}" y1="${y}" x2="${L.colX[b.step.col] + 8}" y2="${y}" marker-end="url(#lm-ah)"/>`);
  }
  // the loops above the spine, and the turn's end below it
  const arc = (from: Col, to: Col, y: number, label: string) => {
    const x1 = mid(from), x2 = mid(to), top = stepOf.get(from)!.top;
    out.push(`<path class="lm-arc" d="M${x1} ${top} V${y} H${x2} V${top - 2}" marker-end="url(#lm-ah)"/>`);
    const lx = Math.min(x1, x2) + 16;
    out.push(t(lx, y - 8, must(label, 13, Math.abs(x2 - x1)), 13, "lm-t lm-arc-label", ' font-weight="600"'));
  };
  arc("across", "start", 76, "next session: the brief is read back");
  arc("compact", "start", 110, "compaction resumes as SessionStart:compact");
  arc("post", "model", 144, "the result returns: the loop");
  {
    const m = stepOf.get("model")!, e = stepOf.get("end")!;
    const y = m.bottom + 36;
    out.push(`<path class="lm-arc" d="M${mid("model")} ${m.bottom} V${y} H${mid("end")} V${e.bottom + 2}" marker-end="url(#lm-ah)"/>`);
    out.push(t(mid("model") + 16, y + 20, must("no tool call: the turn ends and waits for you", 13, mid("end") - mid("model")), 13, "lm-t lm-arc-label", ' font-weight="600"'));
  }

  // lane headers
  for (const ln of L.lanes) {
    out.push(t(24, ln.y + LANE_PAD + 22, must(ln.title, 20, HEAD_W - 48), 20, "lm-t", ' font-weight="700"'));
    ln.line.forEach((line, i) => out.push(t(24, ln.y + LANE_PAD + 48 + i * 18, line, 13, "lm-m")));
  }

  // edges under the chips they connect. A verb shared by several arrows from one source (or into
  // one target) is written once, beside that source (or target), instead of once per arrow.
  const count = (key: (e: LoopMap["edges"][number]) => string) => {
    const n = new Map<string, number>();
    for (const e of map.edges) n.set(key(e), (n.get(key(e)) ?? 0) + 1);
    return n;
  };
  const bySource = count((e) => `${e.from} ${e.verb}`), byTarget = count((e) => `${e.to} ${e.verb}`);
  const labelled = new Set<string>();
  const chips = [...L.placed.values()];
  for (const e of map.edges) {
    const a = L.placed.get(e.from)!, b = L.placed.get(e.to)!;
    const x2 = b.x, y2 = b.y + CHIP_H / 2;
    // A chip with a neighbour to its right sends its edges out of its bottom, not under the neighbour.
    const blocked = chips.some((c) => c.y === a.y && c.x === a.x + SLOT);
    const [x1, y1] = blocked ? [a.x + CHIP_W / 2, a.y + CHIP_H] : [a.x + CHIP_W, a.y + CHIP_H / 2];
    const k = Math.max(40, (x2 - x1) / 2);
    const c1 = blocked ? `${x1} ${y1 + Math.max(40, (y2 - y1) / 2)}` : `${x1 + k} ${y1}`;
    out.push(`<path class="lm-edge" d="M${x1} ${y1} C${c1} ${x2 - k} ${y2} ${x2 - 2} ${y2}" marker-end="url(#lm-ah)"/>`);
    const half = 0.3 * 12 * [...e.verb].length;
    // An edge too short to hold its verb gets it above the target chip, clear of the source's callout.
    const short = !blocked && x2 - x1 < 2 * half + 24;
    let at: [number, number] | null = short ? [x2 + 4, b.y - 6] : [(x1 + x2) / 2 - half, (y1 + y2) / 2 - 6];
    for (const [many, key, pos] of [
      [bySource, `${e.from} ${e.verb}`, blocked ? [x1 + 8, y1 + 18] : [x1 + 10, y1 - 8]],
      [byTarget, `${e.to} ${e.verb}`, [x2 - 2 * half - 14, y2 - 8]],
    ] as const) {
      if ((many.get(key) ?? 0) < 2) continue;
      at = labelled.has(key) ? null : [pos[0], pos[1]];
      labelled.add(key);
      break;
    }
    if (at) out.push(t(at[0], at[1], e.verb, 12, "lm-t lm-halo"));
  }

  // chips
  for (const p of L.placed.values()) {
    const { item, x, y } = p;
    const cls = `lm-chip lm-k-${item.kind}${item.fail ? " lm-fail" : ""}`;
    out.push(`<g class="lm-item"><rect class="${cls}" x="${x}" y="${y}" width="${CHIP_W}" height="${CHIP_H}" rx="6" style="--i:${at.get(item.col)}"/>`);
    out.push(glyph(item.kind, x + 15, y + 17));
    out.push(t(x + 28, y + 22, must(item.label, 14, CHIP_W - 22), 14, "lm-t", ' font-weight="600"'));
    out.push(t(x + 28, y + 41, must(item.role, 12, CHIP_W - 22), 12, "lm-m"));
    p.notes.forEach((n, i) => out.push(t(x + 2, y + CHIP_H + 18 + i * NOTE, n, 12, "lm-note")));
    out.push(`</g>`);
  }

  // numbered callouts
  const anchor = (at: string): [number, number] => {
    if (at.startsWith("lane:")) { const ln = L.lanes.find((l) => l.id === at.slice(5))!; return [HEAD_W - 30, ln.y + 30]; }
    if (at.startsWith("step:")) { const s = stepOf.get(at.slice(5) as Col)!; return [L.colX[s.step.col] + L.colW[s.step.col] - 26, s.top + 4]; }
    const p = L.placed.get(at)!;
    return [p.x + CHIP_W - 4, p.y + 2];
  };
  for (const c of map.callouts) {
    const [cx, cy] = anchor(c.at);
    out.push(`<g class="lm-callout"><circle class="lm-call" cx="${cx}" cy="${cy}" r="14"/>${t(cx, cy + 5, String(c.n), 14, "lm-call-n", ' font-weight="700" text-anchor="middle"')}</g>`);
  }

  // panels: what stops to ask, what it writes, and the callout key
  const PANEL_W = 1240;
  const panelList: { title: string; lines: { a: string; b: string[] }[] }[] = [
    ...panels(map).map((p) => ({ title: p.title, lines: p.rows.map(([a, b]) => ({ a, b: wrap(b, 13, PANEL_W - 440) })) })),
    { title: "Special cases", lines: map.callouts.map((c) => ({ a: String(c.n), b: wrap(c.text, 13, PANEL_W - 80) })) },
  ];
  let maxPanel = 0;
  panelList.forEach((pn, i) => {
    const px = 24 + i * (PANEL_W + 32);
    let py = L.panelsY + 40;
    out.push(t(px, L.panelsY, must(pn.title, 20, PANEL_W), 20, "lm-t", ' font-weight="700"'));
    for (const ln of pn.lines) {
      const key = pn.title === "Special cases" ? ln.a : ln.a;
      const keyW = pn.title === "Special cases" ? 40 : 400;
      out.push(t(px, py, must(key, 13, keyW), 13, "lm-t", ' font-weight="600"'));
      ln.b.forEach((b, j) => out.push(t(px + keyW, py + j * 18, b, 13, "lm-m")));
      py += Math.max(1, ln.b.length) * 18 + 8;
    }
    maxPanel = Math.max(maxPanel, py - L.panelsY);
  });

  const width = Math.max(L.width, 24 + panelList.length * (PANEL_W + 32));
  const height = L.panelsY + maxPanel + 24;
  const defs = `<defs><marker id="lm-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="lm-head" d="M0 0L10 5L0 10z"/></marker></defs>`;
  const described = opts.describedBy ? ` aria-describedby="${opts.describedBy}"` : "";
  return `<svg class="lm" viewBox="0 0 ${width} ${height}" width="${width}" style="--n:${map.steps.length}" role="img" aria-label="${esc(map.title)}: Claude Code's agent loop, with every AI Coach plugin at the step where it acts"${described}>${defs}${out.join("")}</svg>`;
}

// ── the brief: the home page's version of the same map ─────────────────────────────────────────
// Four rows (how a thing enters) by seven loop steps, one chip per coach per cell: the coach's
// short name, then the names of what it brings to that step. Drawn at 1:1 for the page's
// own width, no pan or zoom. The permission column holds nothing, and turn end, compaction and
// session end share one column; what lives across sessions belongs to the full map.
const BRIEF_COLS: { title: string; cols: Col[] }[] = [
  { title: "Session start", cols: ["start"] },
  { title: "Your prompt", cols: ["prompt"] },
  { title: "Model turn", cols: ["model"] },
  { title: "Pre-tool", cols: ["pre"] },
  { title: "Tool runs", cols: ["tool"] },
  { title: "Post-tool", cols: ["post"] },
  { title: "Turn and session end", cols: ["end", "compact", "sessend"] },
];
const BRIEF_ROWS: { title: string; kinds: Kind[]; glyph: Kind }[] = [
  { title: "On its own", kinds: ["hook"], glyph: "hook" },
  { title: "You type it", kinds: ["typed", "cmd"], glyph: "typed" },
  { title: "Claude calls it", kinds: ["model"], glyph: "model" },
  { title: "A subagent", kinds: ["agent"], glyph: "agent" },
];
export const shortLane = (id: string) =>
  id === "ai-coach-core" ? "engine" : id === "ai-coach" ? "bundle" : id.replace(/-coach$/, "");
export const shortItem = (i: Item) =>
  i.kind === "hook" ? i.label.replace(/\.js( · FAIL)?$/, (_, f) => (f ? " (fail)" : "")) : i.kind === "agent" ? i.id.split(":")[1] : i.label;

export function renderBriefSvg(map: LoopMap, opts: { describedBy?: string } = {}): string {
  const W = 1152, HEAD = 150, COL = (W - HEAD) / BRIEF_COLS.length, CW = COL - 10, PAD = 10, LINE = 16;
  const out: string[] = [];
  // spine
  const spineTop = 48, spineH = 50;
  BRIEF_COLS.forEach((c, i) => {
    const x = HEAD + i * COL + 4;
    out.push(`<rect class="lm-step" x="${x}" y="${spineTop}" width="${CW + 2}" height="${spineH}" rx="6" style="--i:${i}"/>`);
    wrap(c.title, 14, CW).forEach((line, j, all) =>
      out.push(t(x + 10, spineTop + (all.length > 1 ? 21 : 30) + j * 18, line, 14, "lm-t", ' font-weight="700"')));
    if (i < BRIEF_COLS.length - 1) {
      out.push(`<line class="lm-flow" x1="${x + CW + 2}" y1="${spineTop + 25}" x2="${x + COL}" y2="${spineTop + 25}" marker-end="url(#lm-ah)"/>`);
    }
  });
  // the loop: the result returns to the model turn
  const midOf = (title: string) => HEAD + BRIEF_COLS.findIndex((c) => c.title === title) * COL + COL / 2;
  const loopY = 22;
  out.push(`<path class="lm-arc" d="M${midOf("Post-tool")} ${spineTop} V${loopY} H${midOf("Model turn")} V${spineTop - 2}" marker-end="url(#lm-ah)"/>`);
  out.push(t(midOf("Model turn") + 14, loopY - 6, must("the result returns to the model: the loop", 12, midOf("Post-tool") - midOf("Model turn")), 12, "lm-t", ' font-weight="600"'));

  // rows
  let y = spineTop + spineH + 16;
  BRIEF_ROWS.forEach((row, r) => {
    const cells = BRIEF_COLS.map((c) => {
      const here = map.items.filter((i) => row.kinds.includes(i.kind) && c.cols.includes(i.col));
      const lanes = [...new Set(here.map((i) => i.lane))];
      return lanes.map((lane) => {
        const its = here.filter((i) => i.lane === lane);
        const head = shortLane(lane);
        return { head: must(head, 12, CW), names: wrap(its.map(shortItem).join(", "), 12, CW), kind: its[0].kind };
      });
    });
    const chipH = (n: number) => 22 + n * LINE;
    // Place chips. A row whose chips all enter at one step (every typed skill enters at the
    // prompt) flows rightward from that step instead of stacking a tall column beside empty ones;
    // its header says where they all enter. A row spread across steps keeps one column per step.
    type Chip = (typeof cells)[number][number];
    const placed: { c: Chip; x: number; dy: number; i: number }[] = [];
    const used = cells.flatMap((cs, i) => (cs.length ? [i] : []));
    let contentH = 0;
    if (used.length === 1) {
      const s = used[0], perLine = BRIEF_COLS.length - s, chips = cells[s];
      for (let k = 0, dy = 0; k < chips.length; k += perLine) {
        const line = chips.slice(k, k + perLine);
        line.forEach((c, j) => placed.push({ c, x: HEAD + (s + j) * COL + 5, dy, i: s }));
        dy += Math.max(...line.map((c) => chipH(c.names.length))) + 6;
        contentH = dy - 6;
      }
    } else {
      cells.forEach((cs, i) => {
        let dy = 0;
        for (const c of cs) {
          placed.push({ c, x: HEAD + i * COL + 5, dy, i });
          dy += chipH(c.names.length) + 6;
        }
        contentH = Math.max(contentH, dy - 6);
      });
    }
    const title = wrap(row.title, 13, HEAD - 34);
    const where = used.length === 1 ? wrap(`all at ${BRIEF_COLS[used[0]].title.toLowerCase()}`, 12, HEAD - 34) : [];
    const rowH = Math.max(52, contentH, 20 + title.length * 17 + where.length * 16) + PAD * 2;
    out.push(`<rect class="lm-lane ${r % 2 ? "lm-lane-b" : "lm-lane-a"}" x="0" y="${y}" width="${W}" height="${rowH}"/>`);
    out.push(glyph(row.glyph, 16, y + PAD + 14));
    title.forEach((line, j) => out.push(t(28, y + PAD + 19 + j * 17, line, 13, "lm-t", ' font-weight="700"')));
    where.forEach((line, j) => out.push(t(28, y + PAD + 19 + title.length * 17 + j * 16, line, 12, "lm-m")));
    // A flowed row is one group entering at one step: outline it from that step to the edge, so a
    // chip that lands under a later column is not read as entering there.
    if (used.length === 1) {
      const gx = HEAD + used[0] * COL + 1;
      out.push(`<rect class="lm-group" x="${gx}" y="${y + PAD - 5}" width="${W - gx - 3}" height="${contentH + 10}" rx="8"/>`);
    }
    for (const { c, x, dy, i } of placed) {
      const cy = y + PAD + dy;
      out.push(`<rect class="lm-chip lm-k-${c.kind}" x="${x}" y="${cy}" width="${CW}" height="${chipH(c.names.length)}" rx="5" style="--i:${i}"/>`);
      out.push(t(x + 8, cy + 17, c.head, 12, "lm-t", ' font-weight="700"'));
      c.names.forEach((n, j) => out.push(t(x + 8, cy + 17 + (j + 1) * LINE, n, 12, "lm-m")));
    }
    y += rowH;
  });
  const defs = `<defs><marker id="lm-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="lm-head" d="M0 0L10 5L0 10z"/></marker></defs>`;
  const described = opts.describedBy ? ` aria-describedby="${opts.describedBy}"` : "";
  return `<svg class="lm lm-brief" viewBox="0 0 ${W} ${y + 4}" style="--n:${BRIEF_COLS.length}" role="img" aria-label="${esc(map.title)}, in brief: which coaches act at each step of Claude Code's agent loop, and how each one enters it"${described}>${defs}${out.join("")}</svg>`;
}

// ── the text twin: the same map for screen readers, crawlers and phones ───────────────────────
export const srcHref = (src: string) => {
  if (/^https?:/.test(src)) return src;
  const [file, line] = src.split(":");
  return REPO_BLOB + file + (line ? `#L${line}` : "");
};
const srcLink = (src: string) =>
  `<a href="${esc(srcHref(src))}">${esc(/^https?:/.test(src) ? "Claude Code docs" : src)}</a>`;
const entry = (i: Item, steps: Step[]) =>
  i.kind === "hook" ? `fires at ${steps.find((s) => s.col === i.col)!.title.toLowerCase()}` : KIND_TEXT[i.kind];

export function renderTwin(map: LoopMap, opts: { id?: string } = {}): string {
  const laneTitle = new Map(map.lanes.map((l) => [l.id, l.title]));
  const name = (i: Item) => (i.id.startsWith("/") ? i.id : i.label);
  const itemLine = (i: Item, withLane: boolean) =>
    `<li><code>${esc(name(i))}</code>${withLane ? ` (${esc(laneTitle.get(i.lane)!)})` : ""}: ${esc(i.role)}` +
    `${i.notes?.length ? `. ${esc(i.notes.join("; "))}` : ""}` +
    `${i.gate ? `. <strong>Asks:</strong> ${esc(i.gate)}` : ""}${i.writes ? `. <strong>Writes:</strong> ${esc(i.writes)}` : ""}` +
    `. ${srcLink(i.src)}</li>`;
  const steps = map.steps
    .map((s) => {
      const here = map.items.filter((i) => i.col === s.col);
      return `<li><strong>${esc(s.title)}.</strong> ${esc(s.sub.join(" "))} ${srcLink(s.src)}` +
        (here.length ? `<ul>${here.map((i) => itemLine(i, true)).join("")}</ul>` : "") + `</li>`;
    })
    .join("");
  const lanes = map.lanes
    .map((l) => {
      const its = map.items.filter((i) => i.lane === l.id);
      const kinds = [...new Set(its.map((i) => i.kind))].map((k) => KIND_TEXT[k]).join(", ");
      return `<h4>${esc(l.title)}</h4><p>${esc(l.line)} <em>${esc(kinds)}.</em></p><ul>` +
        its.map((i) => itemLine(i, false).replace("</code>:", `</code> (${esc(entry(i, map.steps))}):`)).join("") + `</ul>`;
    })
    .join("");
  const calls = map.callouts.map((c: Callout) => `<li>${esc(c.text)} ${srcLink(c.src)}</li>`).join("");
  return `<section class="lm-twin" id="${opts.id ?? "how-text"}"><h2>The same map, as text</h2>` +
    `<h3>The loop, step by step</h3><ol>${steps}</ol>` +
    `<h3>Every coach, beside its skills</h3>${lanes}` +
    `<h3>Special cases</h3><ol>${calls}</ol></section>`;
}

// ── the check: the map and the catalog must agree, both ways ──────────────────────────────────
export function checkMap(map: LoopMap, catalog: Catalog): string[] {
  const problems: string[] = [];
  const known = new Map<string, Kind>();
  for (const p of [catalog.engine, ...catalog.coaches]) {
    for (const s of p.skills) known.set(s.invocation, s.modelInvocable ? "model" : "typed");
    for (const a of p.agents) known.set(a.invocation, "agent");
  }
  for (const c of catalog.commands) known.set(c.invocation, "cmd");
  for (const h of catalog.hooks) known.set(h.id, "hook");

  const ids = new Set<string>();
  const lanes = new Set(map.lanes.map((l) => l.id));
  const cols = new Map(map.steps.map((s) => [s.col, s]));
  for (const i of map.items) {
    if (ids.has(i.id)) problems.push(`${i.id}: drawn twice`);
    ids.add(i.id);
    if (!lanes.has(i.lane)) problems.push(`${i.id}: no lane "${i.lane}"`);
    if (!cols.get(i.col)?.slots) problems.push(`${i.id}: column "${i.col}" holds no chips`);
    if (i.kind === "store") continue;
    const want = known.get(i.id);
    if (!want) { problems.push(`${i.id}: not in the catalog (renamed or removed?)`); continue; }
    if (want !== i.kind) problems.push(`${i.id}: drawn as ${i.kind}, the catalog says ${want}`);
    const col = i.kind === "hook" ? HOOK_COL[i.id.split(":")[1]] : KIND_COL[i.kind];
    if (col && col !== i.col) problems.push(`${i.id}: belongs in column "${col}", drawn in "${i.col}"`);
  }
  for (const id of known.keys()) if (!ids.has(id)) problems.push(`${id}: in the catalog but missing from the diagram`);
  for (const e of map.edges) for (const end of [e.from, e.to]) if (!ids.has(end)) problems.push(`edge ${e.from} → ${e.to}: no item ${end}`);
  for (const c of map.callouts) {
    const ok = c.at.startsWith("lane:") ? lanes.has(c.at.slice(5)) : c.at.startsWith("step:") ? cols.has(c.at.slice(5) as Col) : ids.has(c.at);
    if (!ok) problems.push(`callout ${c.n}: nothing at "${c.at}"`);
  }
  return problems;
}
