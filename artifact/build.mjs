// Builds the AI Coach landing artifact: one tab per coach, plus "How it works", the agent loop
// drawn by lib/loopmap.ts (the same renderer as /how-it-works). Recovered from the throwaway
// generator that built the published page, and byte-identical to it before these changes.
//   node artifact/build.mjs <path to an ai-coach checkout>   ->  artifact/out.html
// Counts come from that checkout's catalog, and the build fails if the loop map disagrees with it.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { coaches, agents, commands, C } from './data.mjs';
import { buildCatalog, WANTED } from '../lib/coaches.ts';
import { loopmap } from '../content/loopmap.ts';
import { renderSvg, renderTwin, checkMap } from '../lib/loopmap.ts';

const __dirname = import.meta.dirname;
const SITE = path.join(__dirname, '..');
const repo = process.argv[2];
if (!repo) { console.error('usage: node artifact/build.mjs <path to an ai-coach checkout>'); process.exit(2); }
const paths = execFileSync('git', ['ls-files'], { cwd: repo, encoding: 'utf8' }).split('\n').filter(Boolean);
const catalog = buildCatalog('local', paths, Object.fromEntries(paths.filter((p) => WANTED.test(p)).map((p) => [p, fs.readFileSync(path.join(repo, p), 'utf8')])));
const problems = checkMap(loopmap, catalog);
if (problems.length) { console.error('content/loopmap.ts disagrees with the catalog:\n- ' + problems.join('\n- ')); process.exit(1); }
const N = catalog.counts;
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
const word = (n) => WORDS[n] ?? String(n);
const ALWAYS_ON = '2,050'; // README "What it costs before you type", v1.18.0

// A hook in the engine points the user at these (brief footer, coach line, session-start notes).
const hookPoints = {
  '/memory-coach:recall': 'The brief footer and the coach line point at it.',
  '/memory-coach:debrief': 'The coach line points at it when work went unrecorded.',
  '/memory-coach:handoff': 'The session-start hook mentions ' + C('handoff import') + ' when a teammate\'s seed is waiting.',
  '/prompt-coach:prompt-stats': '',
  '/security-coach:triage': '',
};
for (const co of coaches) for (const s of co.skills) {
  if (s.slash in hookPoints && !s.kinds.includes('hook')) {
    s.kinds.push('hook');
    if (hookPoints[s.slash]) s.how += ' ' + hookPoints[s.slash];
  }
}

const KIND = {
  manual: ['k-manual', 'you type it'],
  auto: ['k-auto', 'Claude can call it'],
  chained: ['k-chain', 'chained'],
  hook: ['k-hook', 'a hook points at it'],
};
const badge = (k) => `<span class="badge ${KIND[k][0]}">${KIND[k][1]}</span>`;
const badges = (ks) => `<span class="badges">${ks.map(badge).join('')}</span>`;
const table = (cap, head, rows, cls = '') => `<div class="tablewrap"><table class="${cls}"><caption>${cap}</caption><thead><tr>${head.map((h) => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const argTable = (args) => `<div class="tablewrap"><table class="args"><tbody>${args.map(([a, b]) => `<tr><th scope="row"><code>${a.replace(/</g, '&lt;')}</code></th><td>${b}</td></tr>`).join('')}</tbody></table></div>`;
let zid = 0;
const zoom = (caption, label, h, svg) => (zid++, svg = svg.replace(/(id="|#)ah\b/g, "$1ah" + zid), `<figure class="zoomable" style="--zoom-height: ${h}px">
  <figcaption>${caption}</figcaption>
  <div class="zoom-viewport" tabindex="0" aria-label="${label}; pan and zoom">
    <div class="zoom-toolbar" role="group" aria-label="Diagram zoom">
      <button type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out (−)">&minus;</button>
      <button type="button" data-zoom="reset" aria-label="Reset to 100%" title="Reset to 100% (0)">100%</button>
      <button type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in (+)">+</button>
      <button type="button" data-zoom="fit" aria-label="Fit to view" title="Fit to view (f)">&#x2922;</button>
      <button type="button" data-zoom="full" aria-label="Fullscreen" title="Fullscreen">&#x26F6;</button>
    </div>
    <span class="zoom-hint">drag or wheel to move · ctrl+wheel to zoom · double-click fits</span>
    <div class="zoom-stage">${svg}</div>
  </div>
</figure>`);

// ---------- diagrams (inline svg; colours come from page classes, sizes set per <text>) ----------
function box(x, y, w, h, lines, cls = 'd-node') {
  const [title, sub, ...rest] = lines;
  let t = `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`;
  let ty = y + 26;
  t += `<text class="d-t" x="${x + w / 2}" y="${ty}" font-size="15" font-weight="600" text-anchor="middle">${title}</text>`;
  if (sub) { ty += 20; t += `<text class="d-a" x="${x + w / 2}" y="${ty}" font-size="12.5" text-anchor="middle" font-family="IBM Plex Mono, ui-monospace, monospace">${sub}</text>`; }
  for (const r of rest) { ty += 19; t += `<text class="d-m" x="${x + w / 2}" y="${ty}" font-size="13" text-anchor="middle">${r}</text>`; }
  return t;
}
const arrow = (x1, y1, x2, y2, dashed) => `<line class="d-e${dashed ? ' d-dash' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#ah)"/>`;
const label = (x, y, s, anchor = 'middle') => `<text class="d-m" x="${x}" y="${y}" font-size="12.5" text-anchor="${anchor}">${s}</text>`;
const defs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="d-head" d="M0 0L10 5L0 10z"/></marker></defs>`;

function lifecycleSvg() {
  const W = 156, H = 116, Y = 96, G = 22, X0 = 16;
  const xs = Array.from({ length: 7 }, (_, i) => X0 + i * (W + G));
  const nodes = [
    ['SessionStart', 'session-start.js', 'injects the brief', 'adopts session name', 'd-node d-on'],
    ['UserPromptSubmit', 'prompt.js', '9 detectors', 'hints shown to you', 'd-node'],
    ['PreToolUse', 'guard.js', 'blocks credentials', 'off until enabled', 'd-node d-gate'],
    ['PostToolUse', 'observe · spotlight', 'one row per tool', 'warns on injection', 'd-node'],
    ['Notification', 'notice.js', 'error text becomes', 'a correction row', 'd-node'],
    ['PreCompact', 'precompact.js', 'writes where you', 'were, no model', 'd-node'],
    ['SessionEnd', 'session-end.js', 'Haiku distils 0–3', 'learnings, prunes', 'd-node d-on'],
  ];
  let s = `<svg viewBox="0 0 1260 300" role="img" aria-label="One session through the engine's hooks: SessionStart injects the brief; each prompt and tool call passes prompt.js, guard.js and observe/spotlight; failures and compaction are recorded as they happen; SessionEnd distils learnings.">${defs}`;
  nodes.forEach((n, i) => { s += box(xs[i], Y, W, H, n.slice(0, 4), n[4]); });
  for (let i = 0; i < 3; i++) s += arrow(xs[i] + W, Y + H / 2, xs[i + 1] - 2, Y + H / 2);
  for (let i = 3; i < 6; i++) s += arrow(xs[i] + W, Y + H / 2, xs[i + 1] - 2, Y + H / 2, true);
  // per-turn loop from PostToolUse back to UserPromptSubmit
  const a = xs[3] + W / 2, b = xs[1] + W / 2;
  s += `<path class="d-e" d="M${a} ${Y - 2} C ${a} 34, ${b} 34, ${b} ${Y - 4}" fill="none" marker-end="url(#ah)"/>`;
  s += label((a + b) / 2, 34, 'repeats for every prompt and tool call');
  s += label(xs[4] + W + G / 2, Y - 14, 'when they happen');
  s += `<line class="d-rule" x1="${X0}" y1="262" x2="${xs[6] + W}" y2="262"/>`;
  s += label(X0, 286, 'session opens', 'start') + label(xs[6] + W, 286, 'session closes', 'end');
  s += label(xs[2] + W / 2, Y + H + 22, 'the only hook that can stop a call');
  return s + '</svg>';
}

function storageSvg() {
  let s = `<svg viewBox="0 0 1040 400" role="img" aria-label="Hooks and skills call one engine file in your home directory. It writes a per-user database and one database per project. Handoff exports a seed file into the repo, which git carries to a teammate.">${defs}`;
  s += box(20, 40, 220, 92, ['Hooks', 'hooks/*.js', 'fire on session events']);
  s += box(20, 236, 220, 92, ['Skills', 'ENGINE <verb>', 'about 38 CLI verbs']);
  s += box(340, 138, 240, 92, ['engine.js', '~/.ai-coach/bin/', 'one copy, never moves'], 'd-node d-on');
  s += box(680, 20, 320, 112, ['user.db', '~/.ai-coach/user.db', 'trust, authors, project registry,', 'global memories']);
  s += box(680, 152, 320, 112, ['coach.db per project', 'projects/<slug>/coach.db', 'memories, sessions, observations,', 'corrections, findings, debriefs']);
  s += box(680, 284, 320, 92, ['team-seed.jsonl', '.ai-coach/ in the repo', 'committed; git carries it']);
  s += arrow(240, 86, 338, 168) + arrow(240, 282, 338, 200);
  s += arrow(580, 168, 678, 76) + arrow(580, 184, 678, 208);
  s += `<path class="d-e d-dash" d="M580 214 C 630 260, 630 330, 678 330" fill="none" marker-end="url(#ah)"/>`;
  s += label(300, 104, 'stdin JSON') + label(290, 268, 'shell call');
  s += label(620, 322, 'handoff', 'end');
  return s + '</svg>';
}

function startChainSvg() {
  let s = `<svg viewBox="0 0 1100 330" role="img" aria-label="/ai-coach:start --run calls onboard --tour, which runs onboard, map and study in order. With --with-blueprint it also calls blueprint. map and blueprint load artifact-style before they publish a page.">${defs}`;
  s += box(20, 120, 200, 92, ['/ai-coach:start', '--run', 'asks once, then runs'], 'd-node d-on');
  s += box(300, 30, 200, 92, ['onboard', '--tour', 'docs/onboarding/']);
  s += box(580, 30, 200, 92, ['map', 'Artifact + vault', 'components/*.md']);
  s += box(860, 30, 200, 92, ['study', 'docs/study/', 'patterns, the why']);
  s += box(300, 214, 200, 92, ['blueprint', '--with-blueprint', 'docs/business/']);
  s += box(720, 214, 220, 92, ['artifact-style', 'design-coach', 'lint before publish']);
  s += arrow(220, 150, 298, 84) + arrow(500, 76, 578, 76) + arrow(780, 76, 858, 76);
  s += arrow(220, 182, 298, 256) + arrow(680, 122, 760, 212, true) + arrow(500, 260, 718, 260, true);
  s += label(244, 100, 'Skill tool') + label(540, 64, 'then') + label(820, 64, 'then');
  s += label(250, 238, 'flag only') + label(610, 250, 'loads') + label(770, 160, 'loads', 'start');
  return s + '</svg>';
}

function wrapChainSvg() {
  let s = `<svg viewBox="0 0 1120 260" role="img" aria-label="/ai-coach:wrap asks one question for every identity gap, writes the roster, then calls debrief and handoff, each of which stops at its own approval gate. You make the commit.">${defs}`;
  s += box(16, 70, 190, 104, ['/ai-coach:wrap', 'detect gaps', 'one question'], 'd-node d-on');
  s += box(246, 70, 190, 104, ['roster', 'register · declare', 'writes team.md']);
  s += box(476, 70, 190, 104, ['debrief', 'shows the draft', 'waits for yes'], 'd-node d-gate');
  s += box(706, 70, 190, 104, ['handoff', 'says what travels', 'waits for yes'], 'd-node d-gate');
  s += box(936, 70, 170, 104, ['you', 'git commit', 'never automatic']);
  s += arrow(206, 122, 244, 122) + arrow(436, 122, 474, 122) + arrow(666, 122, 704, 122) + arrow(896, 122, 934, 122, true);
  s += label(571, 206, 'a no here ends the run') + label(801, 206, 'writes team-seed.jsonl');
  s += label(341, 46, 'only if a gap exists');
  return s + '</svg>';
}

// ---------- page sections ----------
const engineHooks = [
  ['SessionStart', C('startup|clear|resume|compact'), C('session-start.js'), 'Copies the engine to ' + C('~/.ai-coach/bin/') + ', records the plugin settings it was handed, opens the session row under Claude Code\'s own session name, and injects the brief into Claude\'s context. Adds a branch-convention warning, a team-seed note and the one-time partners note when they apply. After a compaction it injects a smaller brief plus the snapshot, then deletes the snapshot.', 'No', 'brief_chars, partners'],
  ['UserPromptSubmit', 'every prompt', C('prompt.js'), 'Skips prompts under 25 characters or starting with / or !. Runs the nine detectors and records only the flag names. Shows at most two hints to you, never to Claude. Exploratory questions are exempt. In plan mode, one Haiku call scores the prompt.', 'No', 'coach, plan_review'],
  ['PreToolUse', C('Bash|WebFetch|Read|Write|Edit|NotebookEdit'), C('guard.js'), 'Scans the tool input for credentials. Real keys are blocked; secret-looking payloads and credential-file reads ask first.', 'Yes, when on', 'guard (off by default)'],
  ['PostToolUse', C('Edit|Write|Bash'), C('observe.js'), 'One observation row per call: the Bash command (160 chars) or the tool plus the last three path parts. ' + C('&lt;private&gt;…&lt;/private&gt;') + ' is replaced before it is written.', 'No', 'always on'],
  ['PostToolUseFailure', C('Edit|Write|Bash'), C('observe.js'), 'Same row, marked ' + C('FAIL') + '. Failed calls feed prompt-stats and the coach line.', 'No', 'always on'],
  ['PostToolUse', C('WebFetch|WebSearch|Read'), C('spotlight.js'), 'Scans what came back for ten injection markers. Read is scanned only for files outside the project. A hit warns you, reminds Claude to treat the content as data, and records an ' + C('INJ') + ' observation.', 'No (warns)', 'spotlight'],
  ['Notification', 'every notice', C('notice.js'), 'If the message reads like a failure (error, failed, wrong, deprecated, broken…), records a correction. Prints nothing.', 'No', 'corrections'],
  ['PreCompact', 'every compaction', C('precompact.js'), 'Writes a snapshot of where you were: branch, up to eight recent files, the last failure, open corrections. No model call.', 'No', 'always on'],
  ['SessionEnd', 'every exit', C('session-end.js'), 'Closes the session, asks Haiku for a one-line summary and up to three learnings (stored as distilled), then prunes expired rows.', 'No', 'learn'],
];

const settingsRows = [
  [C('brief_chars'), '4000', 'Ceiling on the brief, clamped to 500–16000. Ranking happens first, so raising it shows more without changing what wins.'],
  [C('coach'), 'on', 'The coach line and the prompt hints. Display only: failures and prompt signals are still recorded, and plan-mode review keeps its own switch.'],
  [C('corrections'), 'on', 'Whether failure notices are recorded at all.'],
  [C('learn'), 'on', 'The Haiku distillation at session end.'],
  [C('plan_review'), 'on', 'In plan mode, one Haiku call scores the prompt.'],
  [C('guard'), '<strong>off</strong>', 'The secrets guard. The only hook allowed to stop a call, and the only setting off by default. A default install does no credential blocking.'],
  [C('spotlight'), 'on', 'The injection-marker scan on fetched content.'],
  [C('partners'), 'on', 'The one-time ' + C('/harness-coach:partners') + ' note.'],
  [C('default_trust'), 'full', 'Trust for a teammate you have not rated: full or workspace. Anything else falls back to full.'],
];

const envRows = [
  [C('AICOACH_&lt;SETTING&gt;'), 'Overrides that setting for one shell, e.g. ' + C('AICOACH_GUARD=on') + '. Wins over the plugin setting.'],
  [C('AICOACH_DB'), 'Path to the user database. Everything else lives beside it, so a temp path gives a fully isolated tree.'],
  [C('AICOACH_LOG'), 'Where failures append. Default ' + C('log.jsonl') + ' beside the database, rotated at 512 KB.'],
  [C('AICOACH_MODEL'), 'Model for the two Haiku calls. Default ' + C('claude-haiku-4-5') + '.'],
  [C('AICOACH_LLM_CMD'), 'Replace the model pipeline with any command that reads stdin and prints an answer (' + C('ollama run llama3.2') + ', ' + C('codex exec -') + ').'],
  [C('AICOACH_CLAUDE_BIN'), 'The claude binary to call.'],
  [C('AICOACH_SEED_KEY'), 'Passphrase for an encrypted seed.'],
  [C('AICOACH_AUTHOR') + ' · ' + C('AICOACH_USERNAME') + ' · ' + C('AICOACH_ROLE'), 'Override the identity read from git and the roster.'],
  [C('AICOACH_PROJECT') + ' · ' + C('AICOACH_TASK'), 'Override the project key (which database) and the branch a memory files under.'],
  [C('AICOACH_INNER'), 'Set inside spawned ' + C('claude -p') + ' children so hooks do not recurse.'],
  [C('AICOACH_OFF'), 'Silences the "Node is too old" message. Disables nothing else.'],
];

const detectors = [
  ['deictic-no-path', '"this", "that file" with no path'],
  ['action-no-ref', 'an action verb with nothing to act on'],
  ['no-done-criteria', 'no way to tell when it is finished'],
  ['multi-ask', 'several asks in one prompt'],
  ['hedged-opener', '"maybe", "could you possibly"'],
  ['negative-only', 'only what not to do'],
  ['paste-after-ask', 'a paste dumped after the question'],
  ['caps-emphasis', 'SHOUTING to make it stick'],
  ['no-scope-clause', 'nothing says where to stop'],
];

const verbs = [
  ['Memory', 'add · search · forget · brief · init · bootstrap · prune'],
  ['Sessions', 'session-start · session-end · observe · name · session-digest · stats'],
  ['Corrections', 'corrections · correction-done'],
  ['Prompts', 'prompt-check · prompt-stats'],
  ['Security', 'injection-scan · finding-add · finding-update · findings'],
  ['Debriefs and seeds', 'debrief-publish · debriefs · debrief-show · seed-export · seed-import · summaries · summary-set'],
  ['Team and project', 'whoami · team-list · trust · trust-list · project · repos · projects · rekey'],
  ['Settings', 'config · partners-seen'],
];

const adapters = [
  ['Claude Code', 'native', 'Everything: all hooks, the brief in context, user-only skills enforced, agents, commands.'],
  ['Cursor', 'hooks + rules + MCP', 'Recording and the guard run through a shim; Cursor\'s preToolUse has no ask, so the ask tier denies. ' + N.skills + ' compiled ' + C('.mdc') + ' rules. The brief and hints are not injected; call ' + C('memory_brief') + '.'],
  ['Windsurf', 'hooks + MCP', 'Recording and the guard; ask becomes block (exit codes only). No session start or end, so no distillation.'],
  ['Antigravity', 'hooks + MCP', 'PreToolUse, PostToolUse and Stop through the shim; ask tier supported.'],
  ['Blackbox', 'hooks + MCP', 'The only shim harness where hook output (brief, coach line, spotlight warning) is replayed to the model.'],
  ['opencode', 'native plugin + MCP', 'Session row, guard (needs ' + C('AICOACH_REPO') + '), observations. Idle stamps the session end but does not distil.'],
  ['Codex CLI · Gemini CLI', 'MCP + AGENTS.md', 'No hooks. Memory through seven MCP tools: memory_search, memory_add, memory_brief, debriefs_list, debrief_show, prompt_check, whoami.'],
];

function skillCard(s) {
  const id = 's-' + s.slash.split(':')[1];
  return `<article class="skill" id="${id}">
  <header class="skill-head">
    <h3><code>${s.slash}</code></h3>
    ${badges(s.kinds)}
  </header>
  <p class="lede">${s.lede}</p>
  <div class="howbox"><p class="kicker">How it gets called</p><p>${s.how}</p>
  <p class="triggers">Matches: ${s.triggers.map((t) => `<span class="q">${t}</span>`).join(' ')}</p></div>
  <div class="skill-grid">
    <div><p class="kicker">Arguments</p>${argTable(s.args)}</div>
    <div><p class="kicker">What it does</p><ol class="steps">${s.steps.map((x) => `<li>${x}</li>`).join('')}</ol></div>
  </div>
  <dl class="facts">
    <div><dt>Writes</dt><dd>${s.writes}</dd></div>
    <div><dt>Runs on</dt><dd>${s.model}</dd></div>
    <div><dt>Versus its neighbour</dt><dd>${s.vs}</dd></div>
  </dl>
</article>`;
}

function agentRows(names) {
  return table('The agents this coach spawns. Skills are what you drive; agents are the separate contexts they read or judge in.',
    ['Agent', 'Tools', 'Model', 'Spawned by', 'Returns', 'Why it exists'],
    names.map((n) => { const a = agents[n]; return [C(n), a.tools, a.model, a.by, a.returns, a.why]; }), 'wide');
}

function coachPanel(co) {
  const counts = { manual: 0, auto: 0 };
  co.skills.forEach((s) => { if (s.kinds.includes('manual')) counts.manual++; else counts.auto++; });
  return `<section class="panel" id="p-${co.id}" role="tabpanel" aria-labelledby="t-${co.id}" hidden>
  <div class="panel-head">
    <p class="eyebrow">${co.name}</p>
    <h2>${co.line}</h2>
    <p class="muted prose">${co.ships}</p>
    <div class="row meta">
      <span class="pill num">${co.skills.length} skill${co.skills.length > 1 ? 's' : ''}</span>
      ${counts.manual ? `<span class="pill num">${counts.manual} you type</span>` : ''}
      ${counts.auto ? `<span class="pill num">${counts.auto} Claude can call</span>` : ''}
      ${co.agents ? `<span class="pill num">${co.agents.length} agent${co.agents.length > 1 ? 's' : ''}</span>` : ''}
      ${co.hooks ? `<span class="pill num">${co.hooks.length} hooks</span>` : ''}
    </div>
    <pre class="install"><span class="dim">$ </span>${co.install}</pre>
    <nav class="toc" aria-label="Skills in ${co.name}">${co.skills.map((s) => `<a href="#s-${s.slash.split(':')[1]}" data-jump>${s.slash.split(':')[1]}</a>`).join('')}</nav>
    ${co.note ? `<p class="note">${co.note}</p>` : ''}
  </div>
  ${co.skills.map((s) => skillCard(s)).join('\n')}
  ${co.agents ? `<h3 class="sub">Agents</h3>${agentRows(co.agents)}` : ''}
  ${co.hooks ? `<h3 class="sub">Hooks</h3>${table(`The ${co.hooks.length === 1 ? 'hook' : word(co.hooks.length) + ' hooks'} ${co.name} adds next to the engine's nine.`, ['Event · matcher', 'Script', 'What it does'], co.hooks)}` : ''}
</section>`;
}

function commandsPanel() {
  return `<section class="panel" id="p-commands" role="tabpanel" aria-labelledby="t-commands" hidden>
  <div class="panel-head">
    <p class="eyebrow">ai-coach · the bundle</p>
    <h2>Three commands that span the coaches. Install this plugin and you get the engine and every coach with it.</h2>
    <p class="muted prose">All three are user-only: they cost nothing until you type them. A command cannot see user-only skills in its own context, so each one runs ${C('claude plugin list')} to find out what is installed. What they protect is the decision, not the typing: a role, a project name and a published conclusion are always asked for and confirmed, and nothing is committed to git for you.</p>
    <pre class="install"><span class="dim">$ </span>claude plugin marketplace add MohammedMoataz/ai-coach
<span class="dim">$ </span>claude plugin install ai-coach@ai-coach</pre>
  </div>
  ${commands.map((c) => `<article class="skill" id="s-${c.slash.split(':')[1]}">
    <header class="skill-head"><h3><code>${c.slash}</code></h3>${badges(['manual'])}</header>
    <p class="eyebrow">${c.label}</p>
    <p class="lede">${c.lede}</p>
    <div class="skill-grid">
      <div><p class="kicker">Arguments</p>${argTable(c.args)}<p class="kicker">What it reads first</p><ul class="steps">${c.detects.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div><p class="kicker">What it does</p><ol class="steps">${c.does.map((x) => `<li>${x}</li>`).join('')}</ol></div>
    </div>
  </article>`).join('\n')}
  ${zoom('<code>/ai-coach:start --run</code> chains four documentation skills. It can, because none of them carries the user-only flag.', 'Start chain diagram', 360, startChainSvg())}
  ${zoom('<code>/ai-coach:wrap</code> chains three memory skills. Each publishing step still stops at its own gate, and the commit stays yours.', 'Wrap chain diagram', 300, wrapChainSvg())}
</section>`;
}

function callMapPanel() {
  const rows = [];
  for (const c of commands) rows.push({ slash: c.slash, coach: 'ai-coach', kinds: ['manual'], when: c.label, writes: c.slash === '/ai-coach:sitrep' ? 'Nothing' : (c.slash === '/ai-coach:start' ? 'Docs, via the skills it runs' : 'Roster, debrief, seed (each gated)'), model: 'session', tab: 'commands' });
  for (const co of coaches) for (const s of co.skills) rows.push({ slash: s.slash, coach: co.name, kinds: s.kinds, when: s.triggers.slice(0, 2).map((t) => `“${t}”`).join(', '), writes: s.writes.replace(/<[^>]+>/g, '').split('. ')[0].replace(/\.$/, ''), model: s.model.replace(/, low effort/, ''), tab: co.id });
  const count = (k) => rows.filter((r) => r.kinds.includes(k)).length;
  return `<section class="panel" id="p-callmap" role="tabpanel" aria-labelledby="t-callmap" hidden>
  <div class="panel-head">
    <p class="eyebrow">Who calls what</p>
    <h2>Every skill and command, and the four ways one gets started.</h2>
    <p class="muted prose">One frontmatter line decides most of this. A skill with ${C('disable-model-invocation: true')} can only be started by you typing it: Claude cannot call it through the Skill tool, a command cannot fire it, and its description is not loaded into context at all. A skill without the line has its description loaded every session, and Claude may pick it when your words match it, or another command or skill may call it.</p>
  </div>
  <div class="grid ways">
    <div class="card"><p>${badge('manual')}</p><p class="kpi num">${count('manual')}</p><p>${N.skills - N.modelInvocable} skills and the ${N.commands} commands. You type the slash command. Costs nothing until you do.</p></div>
    <div class="card"><p>${badge('auto')}</p><p class="kpi num">${count('auto')}</p><p>Descriptions loaded every session (about ${ALWAYS_ON} tokens with the ${word(N.agents)} agents). ${C('recall')} and ${C('dispatch')} are meant to fire unprompted. The other eight say "never proactively" and are reachable so they can be chained; that line is a promise in the description, not a lock.</p></div>
    <div class="card"><p>${badge('chained')}</p><p class="kpi num">${count('chained')}</p><p>Called by a command or skill through the Skill tool: ${C('start --run')}, ${C('onboard --tour')}, ${C('wrap')}, and map and blueprint loading artifact-style.</p></div>
    <div class="card"><p>${badge('hook')}</p><p class="kpi num">${count('hook')}</p><p>A hook never starts a skill. It prints a line that points at one: the spotlight warning, the brief footer and coach line, the partners note, the design nudge.</p></div>
  </div>
  <div class="filters" role="group" aria-label="Filter the table">
    <button type="button" class="chip" data-filter="all" aria-pressed="true">All <span class="num">${rows.length}</span></button>
    ${Object.keys(KIND).map((k) => `<button type="button" class="chip" data-filter="${k}" aria-pressed="false">${KIND[k][1]} <span class="num">${count(k)}</span></button>`).join('')}
  </div>
  <div class="tablewrap"><table class="callmap"><caption>Click a name to open its coach.</caption>
    <thead><tr><th scope="col">Command</th><th scope="col">Coach</th><th scope="col">How it gets called</th><th scope="col">Starts on</th><th scope="col">Writes</th><th scope="col">Model</th></tr></thead>
    <tbody>${rows.map((r) => `<tr data-kinds="${r.kinds.join(' ')}"><th scope="row"><a href="#s-${r.slash.split(':')[1]}" data-tab="${r.tab}"><code>${r.slash}</code></a></th><td>${r.coach}</td><td>${badges(r.kinds)}</td><td>${r.when}</td><td>${r.writes}</td><td>${r.model}</td></tr>`).join('')}</tbody>
  </table></div>
  <h3 class="sub">The chains</h3>
  <p class="prose">Only a model-invocable skill can be chained, which is why the documentation and memory skills dropped the user-only flag. The gates moved into the skills themselves: debrief still shows its draft and waits, handoff still says what will travel and waits.</p>
  <ul class="steps prose">
    <li>${C('/ai-coach:start --run')} calls ${C('/investigation-coach:onboard --tour')}, which runs onboard, map, study. ${C('--with-blueprint')} adds ${C('/strategy-coach:blueprint')}.</li>
    <li>${C('/ai-coach:wrap')} calls ${C('roster')} (only to close a gap), ${C('debrief')}, then ${C('handoff')}.</li>
    <li>${C('map')} and ${C('blueprint')} load ${C('/design-coach:artifact-style')} before they publish a page.</li>
    <li>${C('/security-coach:audit --triage')} records confirmed findings the way ${C('triage ingest')} would, with ${C('--source audit')}. Triage is user-only, so audit follows its validation inline rather than calling it.</li>
    <li>${C('/prompt-coach:scope')} and ${C('/prompt-coach:prompt')} only name the next skill (feature, elicit, scope). You type it.</li>
  </ul>
  <h3 class="sub">The six agents</h3>
  ${table('Agents are contexts that skills spawn. Each one exists so reading does not land in your session, so judgement is not anchored, or so suspect content stays in quarantine.', ['Agent', 'Tools', 'Model', 'Spawned by', 'Returns', 'Why it exists'], Object.keys(agents).map((n) => { const a = agents[n]; return [C(n), a.tools, a.model, a.by, a.returns, a.why]; }), 'wide')}
</section>`;
}

function enginePanel() {
  return `<section class="panel" id="p-engine" role="tabpanel" aria-labelledby="t-engine" hidden>
  <div class="panel-head">
    <p class="eyebrow">ai-coach-core · the engine</p>
    <h2>The part that runs without being asked. Every coach reads and writes through it.</h2>
    <p class="muted prose">Nine hook bindings on eight Claude Code events, one ${C('engine.js')} with about 38 command-line verbs, and two SQLite databases in your home directory. No skills. It needs Node 22.16+ or 24 (built-in ${C('node:sqlite')} with FTS5; the 23.x line lacks FTS5) and says so on stderr instead of failing silently. Every hook exits cleanly and logs its own failures; a broken engine never breaks your session.</p>
  </div>
  <div class="grid stats">
    <div class="card"><p class="kpi num">9</p><p class="muted">hook bindings, 8 scripts</p></div>
    <div class="card"><p class="kpi num">1</p><p class="muted">hook that can stop a call, off by default</p></div>
    <div class="card"><p class="kpi num">2</p><p class="muted">model calls, both Haiku: session end and plan-mode review</p></div>
    <div class="card"><p class="kpi num">4,000</p><p class="muted">characters, the default brief ceiling</p></div>
  </div>
  ${zoom('A session through the engine. Three hooks run on every turn; one of them can block; the only model call on a normal day happens at exit.', 'Session lifecycle diagram', 340, lifecycleSvg())}
  <h3 class="sub">The hooks</h3>
  ${table('Each binding in hooks.json, what fires it, and the switch that turns it off.', ['Event', 'Matcher', 'Script', 'What it does', 'Can it stop you?', 'Switch'], engineHooks, 'wide')}

  <h3 class="sub">What it remembers, and where</h3>
  ${zoom('One engine file in your home directory owns two kinds of database. The only thing that leaves your machine is the seed file you choose to commit.', 'Storage diagram', 420, storageSvg())}
  <div class="grid two">
    <div class="card"><h4>Which database</h4><p>The project key picks the database: ${C('AICOACH_PROJECT')}, else ${C('name:')} in the committed ${C('.ai-coach/project.md')}, else the normalised git remote (host/org/repo), else the repo path. Declaring a name late starts an empty memory, which is why ${C('/ai-coach:wrap')} checks first and ${C('rekey')} exists. The branch fills the task column; main, master and HEAD count as no task.</p></div>
    <div class="card"><h4>Who wrote it</h4><p>Every memory carries a provenance: ${C('human')}, ${C('distilled')} (a model wrote it at session end) or ${C('imported')} (a teammate's seed). Nothing promotes one into another. A person is stored once, in ${C('authors')}, so fixing a role in ${C('team.md')} fixes every row they wrote.</p></div>
    <div class="card"><h4>How it ranks</h4><p>${C('confidence × e^(−age/τ) × use bonus')}. τ is 90 days for learnings and patterns, 45 for references, 30 for notes. Use adds at most 20%. In the brief, your own repo and your own branch each count ×1.5. A teammate you trust only at workspace level is capped at 0.3 and left out of the brief.</p></div>
    <div class="card"><h4>What expires</h4><p>Observations and prompt signals: 30 days. A distilled memory nobody recalled in 90 days is pruned. Human and imported memories never expire by age. Exact duplicates are refused across both databases.</p></div>
  </div>
  ${table('Tables in each project database. The user database holds trust, authors, the project registry and global memories.', ['Table', 'Holds'], [
    [C('memories'), 'type (learning, note, reference, pattern), text, confidence, provenance, repo, author, branch, uses. Full-text indexed.'],
    [C('sessions'), 'name, branch, first prompt (300 chars, private parts removed), the distilled one-line summary (travels only once you approve it), outcomes, end time.'],
    [C('observations'), 'one line per Edit, Write or Bash, FAIL rows, INJ rows from the spotlight.'],
    [C('corrections'), 'failure notices: signal, message, prompt excerpt, whether you recorded what you learned.'],
    [C('prompt_signals'), 'length, which detectors fired, whether a hint was shown. Never the prompt text.'],
    [C('findings'), 'security triage rows. Local only, never exported.'],
    [C('debriefs'), 'business, technical, evidence, unknowns, keyed date/author/name.'],
    [C('authors') + ' · ' + C('repos'), 'one row per person and per repo of the project.'],
  ])}

  <h3 class="sub">The session brief</h3>
  <p class="prose">Injected into Claude's context at every session start. It is capped, ranked, and every line says why it is there (${C('branch')}, ${C('global')}, ${C('from sara')}, ${C('distilled')}, ${C('imported')}). When rows are dropped it says how many, so it never truncates silently.</p>
  <ol class="steps prose">
    <li><strong>Last session here</strong>: yours, with its summary.</li>
    <li><strong>Latest debrief</strong>: one line and a pointer.</li>
    <li><strong>Coach line</strong>, at most one: unrecorded corrections first, then open security findings, then "this branch is being worked by others", then a prompt habit with at least five hits and a 1.5× lift.</li>
    <li><strong>On this branch</strong>: debriefs, sessions and memories, held to 40% of the cap.</li>
    <li><strong>Top memories</strong>: project and global, ranked.</li>
  </ol>
  <p class="prose muted">After a compaction the brief shrinks to the smaller of 1,000 characters and a quarter of the cap, and the precompact snapshot rides with it once.</p>

  <div class="grid two">
    <div class="card"><h4>Secrets guard (${C('guard')}, off by default)</h4>
      <p><strong>Blocks</strong> on Bash, WebFetch, Read, Write, Edit, NotebookEdit: PEM private keys, AWS ${C('AKIA')}/${C('ASIA')} keys, ${C('sk-')} keys, GitHub ${C('gh*_')} and ${C('github_pat_')} tokens, Slack tokens and webhooks, Azure ${C('AccountKey=')}.</p>
      <p><strong>Asks first</strong>: secret-looking values or JWTs in a Bash command or fetch, and reads of ${C('.env*')}, ${C('credentials*')}, SSH keys, ${C('*.pem|key|pfx|p12')}, ${C('secrets.*')}. Example and template files are exempt.</p>
      <p class="muted">Fails open and logs. MCP tools are not covered: their names differ per install.</p></div>
    <div class="card"><h4>Injection spotlight (${C('spotlight')}, on)</h4>
      <p>Scans the first 512 KB of what WebFetch, WebSearch and outside-the-repo Reads return, for ten markers: zero-width characters, Unicode tags, bidi overrides, override phrasing, "new instructions", fake roles, fake tool syntax, concealment, hidden HTML, markdown-image exfiltration.</p>
      <p>Warn-only and deterministic, no model call. A pre-filter, not a gate. In-repo reads are never scanned, so a repo whose tests quote attack strings does not trip it. For anything else, ${C('/security-coach:scan')}.</p></div>
  </div>

  <h3 class="sub">The nine prompt detectors</h3>
  <p class="prose">Deterministic, no model call. They run on every prompt you type, record only their names, and back three things: the two hints you see, ${C('/prompt-coach:prompt-stats')}, and the questions ${C('/prompt-coach:prompt')} asks.</p>
  <div class="detectors">${detectors.map(([n, d]) => `<div><code>${n}</code><span class="muted">${d}</span></div>`).join('')}</div>

  <h3 class="sub">Settings</h3>
  <p class="prose">Change one in ${C('/plugin')} → ai-coach-core. Override one for a shell with ${C('AICOACH_&lt;KEY&gt;')}. See every value and who set it with ${C('node ~/.ai-coach/bin/engine.js config')}. Order: environment, then the plugin setting, then the copy the session-start hook saved in ${C('~/.ai-coach/settings.json')} (so skills shelling out see the same value), then the default.</p>
  ${table('The nine settings.', ['Setting', 'Default', 'What it governs'], settingsRows)}
  ${table('Environment variables that are not settings.', ['Variable', 'Effect'], envRows)}

  <h3 class="sub">The engine verbs skills call</h3>
  <p class="prose">Skills write ${C('ENGINE <verb>')}, meaning ${C('node ~/.ai-coach/bin/engine.js <verb>')}. The engine copies itself there because a plugin directory is ephemeral and invisible to sibling plugins.</p>
  ${table('About 38 verbs, grouped.', ['Area', 'Verbs'], verbs.map(([a, b]) => [a, `<code>${b}</code>`]))}

  <h3 class="sub">Outside Claude Code</h3>
  <p class="prose">The memory works anywhere MCP does, from one shared ${C('~/.ai-coach/')}. The ${N.skills} skills compile to Cursor rules and an ${C('AGENTS.md')} index. What does not travel: the brief is not injected (the agent must call ${C('memory_brief')}), user-only becomes a convention rather than a lock, and outside Blackbox the hints and spotlight warnings are recorded but never shown.</p>
  ${table('Per harness.', ['Harness', 'How', 'What works'], adapters)}
</section>`;
}

function overviewPanel() {
  const ways = coaches.map((co) => {
    return `<a class="card coach-card" href="#t-${co.id}" data-tab="${co.id}">
      <p class="eyebrow">${co.name}</p>
      <p class="coach-line">${co.line}</p>
      <p class="chips">${co.skills.map((s) => `<span class="chip-s ${s.kinds.includes('manual') ? 'cs-manual' : 'cs-auto'}">${s.slash.split(':')[1]}</span>`).join('')}</p>
    </a>`;
  }).join('');
  return `<section class="panel" id="p-overview" role="tabpanel" aria-labelledby="t-overview">
  <div class="hero">
    <div>
      <p class="eyebrow">A coaching harness for Claude Code</p>
      <h1>Your best session should be your normal one.</h1>
      <p class="lead">AI Coach keeps what a session learned and puts it in front of you next time, with who learned it. It shapes a vague ask until someone else could act on it, argues with a finding before it reaches you, and tracks a security finding until it is closed. The house rule: no claim without the evidence for it.</p>
      <pre class="install term"><span class="dim">$ </span>claude plugin marketplace add MohammedMoataz/ai-coach
<span class="dim">$ </span>claude plugin install ai-coach@ai-coach</pre>
      <p class="muted small">Node 22.16+ or 24 · MIT · about ${ALWAYS_ON} tokens of always-loaded context · your data lives in ${C('~/.ai-coach/')} and survives uninstalling</p>
    </div>
    <svg class="hero-art" viewBox="0 0 260 160" aria-hidden="true" focusable="false">
      <g class="h-edges"><path d="M65 80 L131 48"/><path d="M65 80 L131 112"/><path d="M149 48 L200 80"/><path d="M149 112 L200 80"/></g>
      <circle class="h-me" cx="50" cy="80" r="15"/><circle class="h-me-dot" cx="50" cy="80" r="4"/>
      <circle class="h-node" cx="140" cy="48" r="13"/><circle class="h-dot" cx="140" cy="48" r="3.5"/>
      <circle class="h-node" cx="140" cy="112" r="13"/><circle class="h-dot" cx="140" cy="112" r="3.5"/>
      <circle class="h-node" cx="212" cy="80" r="13"/><circle class="h-dot" cx="212" cy="80" r="3.5"/>
      <circle class="h-pulse" r="2.6" style="offset-path:path('M65 80 L131 48')"/>
      <circle class="h-pulse" r="2.6" style="offset-path:path('M65 80 L131 112'); animation-delay:1.2s"/>
      <circle class="h-pulse" r="2.6" style="offset-path:path('M149 48 L200 80'); animation-delay:2.4s"/>
      <circle class="h-pulse" r="2.6" style="offset-path:path('M149 112 L200 80'); animation-delay:3.6s"/>
    </svg>
  </div>

  <h2 class="section">How it is built</h2>
  <p class="prose">One engine and ${word(N.coaches)} coaches, installed together by the ${C('ai-coach')} bundle. The engine is hooks and a database; it is what runs on its own. The coaches are skills you call, plus six agents those skills spawn. Each has its own tab.</p>
  <div class="grid">
    <a class="card coach-card engine-card" href="#t-engine" data-tab="engine">
      <p class="eyebrow">ai-coach-core · the engine</p>
      <p class="coach-line">Session memory, the session brief, failure recording, prompt detectors, the secrets guard and the injection spotlight. Nine hooks, no skills.</p>
      <p class="chips"><span class="chip-s cs-hook">SessionStart</span><span class="chip-s cs-hook">UserPromptSubmit</span><span class="chip-s cs-hook">PreToolUse</span><span class="chip-s cs-hook">PostToolUse</span><span class="chip-s cs-hook">SessionEnd</span></p>
    </a>
    <a class="card coach-card" href="#t-commands" data-tab="commands">
      <p class="eyebrow">ai-coach · the bundle</p>
      <p class="coach-line">Installs everything, plus three commands that span the coaches: day one, finishing up, and the morning read.</p>
      <p class="chips">${commands.map((c) => `<span class="chip-s cs-manual">${c.slash.split(':')[1]}</span>`).join('')}</p>
    </a>
    ${ways}
  </div>
  <p class="legend muted small"><span class="chip-s cs-manual">name</span> you type it · <span class="chip-s cs-auto">name</span> Claude can also call it · <span class="chip-s cs-hook">name</span> a hook event. The <a href="#t-callmap" data-tab="callmap">Who calls what</a> tab has the full list.</p>

  <h2 class="section">What changes about your day</h2>
  <div class="grid days">
    <div class="card"><h4>Memory that survives the session</h4><p>Each session opens with what you and your teammates worked out, who learned it, and roughly when. Day two is when you notice you stopped repeating yourself.</p></div>
    <div class="card"><h4>Knowledge that changes hands</h4><p>What a teammate concluded travels in a git commit, reviewable in a pull request before it reaches your machine. No server, no account.</p></div>
    <div class="card"><h4>Coaching that earned its place</h4><p>It records which weaknesses your prompts show (names only, never your words) and joins them to what those sessions cost. One habit, with the evidence.</p></div>
    <div class="card"><h4>Guardrails that fail safe</h4><p>Turn the guard on and real credentials are blocked. Pages and outside files are checked for planted instructions, and a hit is a warning with the evidence, never a silent block.</p></div>
    <div class="card"><h4>Onboarding a newcomer can trust</h4><p>Docs, an architecture map and study material generated from the code that is there, every claim tied to a file and a line.</p></div>
    <div class="card"><h4>Research that survived an attack</h4><p>Findings are attacked by a verifier that never saw the reasoning. What gets refuted is dropped out loud, with the reason.</p></div>
    <div class="card"><h4>The work before the code</h4><p>A big ask is walked through what a fresh session cannot guess, then held at a gate: could someone else run this unattended and stop where you would?</p></div>
    <div class="card"><h4>Knowing what a session costs</h4><p>See what is filling the context window and whether this is a clear-it or a let-it-compact moment.</p></div>
  </div>
</section>`;
}

function loopPanel() {
  return `<section class="panel" id="p-loop" role="tabpanel" aria-labelledby="t-loop" hidden>
  <div class="panel-head">
    <p class="eyebrow">How it works</p>
    <h2>One turn of Claude Code, with every coach at the step where it acts.</h2>
    <p class="muted prose">Columns are the loop's steps, rows are the plugins: ${N.coaches} coaches, the engine's ${catalog.hooks.filter((h) => h.plugin === 'ai-coach-core').length} hook bindings, ${N.skills} skills, ${N.agents} agents and ${N.commands} commands, each where it enters. A chip's outline and mark say how it enters; the numbered circles are the special cases. <a href="#loop-text">Read it as text</a>.</p>
  </div>
  <figure class="zoomable loop-canvas" style="--zoom-height: calc(100vh - 170px)">
  <figcaption>The agent loop and AI Coach. Drag to move, ctrl + wheel to zoom, f to fit, the last button for full screen.</figcaption>
  <div class="zoom-viewport" tabindex="0" aria-label="Agent loop diagram; pan and zoom">
    <div class="zoom-toolbar" role="group" aria-label="Diagram zoom">
      <button type="button" data-zoom="out" aria-label="Zoom out" title="Zoom out (−)">&minus;</button>
      <button type="button" data-zoom="reset" aria-label="Reset to 100%" title="Reset to 100% (0)">100%</button>
      <button type="button" data-zoom="in" aria-label="Zoom in" title="Zoom in (+)">+</button>
      <button type="button" data-zoom="fit" aria-label="Fit to view" title="Fit to view (f)">&#x2922;</button>
      <button type="button" data-zoom="full" aria-label="Fullscreen" title="Fullscreen">&#x26F6;</button>
    </div>
    <span class="zoom-hint">drag or wheel to move · ctrl+wheel to zoom · double-click fits</span>
    <div class="zoom-stage">${renderSvg(loopmap, { describedBy: 'loop-text' })}</div>
  </div>
</figure>
  ${renderTwin(loopmap, { id: 'loop-text' })}
</section>`;
}

const TABS = [
  ['overview', 'Overview'], ['loop', 'How it works'], ['engine', 'Engine'], ['callmap', 'Who calls what'], ['commands', 'Commands'],
  ...coaches.map((c) => [c.id, c.title]),
];

const css = [fs.readFileSync(path.join(__dirname, 'page.css'), 'utf8'), fs.readFileSync(path.join(SITE, 'lib/loopmap.css'), 'utf8'), fs.readFileSync(path.join(__dirname, 'loop-tab.css'), 'utf8')].join('\n');
// The site's copy of design-coach's zoom script, minus its provenance comment, so both hosts run one file.
const zoomScript = fs.readFileSync(path.join(SITE, 'public/zoom.js'), 'utf8').replace(/^\/\*[\s\S]*?\*\/\n/, '');
const pageScript = fs.readFileSync(path.join(__dirname, 'page.js'), 'utf8');
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(SITE, 'public/logo.png')).toString('base64');

const html = `<title>AI Coach</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<style>
${css.replace('__LOGO__', logo)}
</style>

<header class="top">
  <div class="top-in">
    <a class="brand" href="#t-overview" data-tab="overview"><span class="mark" role="img" aria-label="AI Coach"></span><span>ai-coach</span></a>
    <p class="top-meta num">1 engine · ${N.coaches} coaches · ${N.skills} skills · ${N.commands} commands · ${N.agents} agents</p>
  </div>
  <div class="tabbar" role="tablist" aria-label="Sections">
    ${TABS.map(([id, t], i) => `<button type="button" role="tab" id="t-${id}" aria-controls="p-${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-tab="${id}"${coaches.some((c) => c.id === id) ? ' class="coach-tab"' : ''}>${t}</button>`).join('')}
  </div>
</header>

<main class="wrap">
${overviewPanel()}
${loopPanel()}
${enginePanel()}
${callMapPanel()}
${commandsPanel()}
${coaches.map(coachPanel).join('\n')}
<footer class="foot muted small"><p>Read from the repository: plugin manifests, every SKILL.md and agent, the hook scripts and engine.js. Source: <a href="https://github.com/MohammedMoataz/ai-coach">github.com/MohammedMoataz/ai-coach</a>.</p></footer>
</main>

<script>
${pageScript}
</script>
<script>
${zoomScript}
</script>
`;
fs.writeFileSync(path.join(__dirname, 'out.html'), html);
console.log('wrote artifact/out.html', Buffer.byteLength(html), 'bytes ·', N.coaches, 'coaches ·', N.skills, 'skills ·', catalog.hooks.length, 'hook bindings');
