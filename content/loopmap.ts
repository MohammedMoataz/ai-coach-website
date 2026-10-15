// The agent loop with every AI Coach plugin placed at the step where it acts. One source for the
// /how-it-works page and the landing artifact's "How it works" tab (artifact/build.mjs).
// Every item names its source: a repo path (`file:line`) in MohammedMoataz/ai-coach, or a URL.
// checkMap() in lib/loopmap.ts fails the build if the catalog and this map disagree in either
// direction, so a skill can't be added, renamed or removed without this page following.
//
// Erasable TypeScript only (types, no enums): Node runs this file directly for the artifact build.

export type Col = "start" | "prompt" | "model" | "pre" | "perm" | "tool" | "post" | "end" | "compact" | "sessend" | "across";
export type Kind = "typed" | "cmd" | "model" | "agent" | "hook" | "store";

export type Step = { col: Col; title: string; slots: number; sub: string[]; src: string };
export type Lane = { id: string; title: string; line: string };
export type Item = {
  id: string; // catalog id: "/plugin:skill", "plugin:agent", "plugin:Event:script.js"; or "store:<name>"
  lane: string;
  col: Col;
  kind: Kind;
  label: string; // chip line 1
  role: string; // chip line 2
  notes?: string[]; // drawn under the chip: the special cases
  fail?: boolean; // the PostToolUseFailure sub-row
  gate?: string; // where it stops to ask, if it does
  writes?: string; // what it writes, if anything
  src: string;
};
export type Edge = { from: string; to: string; verb: string };
export type Callout = { n: number; at: string; text: string; src: string };
export type LoopMap = { title: string; steps: Step[]; lanes: Lane[]; items: Item[]; edges: Edge[]; callouts: Callout[] };

const HOOKS_DOC = "https://code.claude.com/docs/en/hooks";

export const loopmap: LoopMap = {
  title: "How a turn runs with AI Coach",

  steps: [
    { col: "start", title: "Session start", slots: 1, src: HOOKS_DOC,
      sub: ["startup · resume · clear · compact", "Hook context reaches the model before the first prompt."] },
    { col: "prompt", title: "Your prompt", slots: 3, src: HOOKS_DOC,
      sub: ["UserPromptSubmit: hooks add context beside it.", "A /plugin:skill you type loads that skill.", "A systemMessage reaches only you."] },
    { col: "model", title: "Model turn", slots: 2, src: HOOKS_DOC,
      sub: ["Answers in text, or calls tools: Skill, Agent, Read, Edit, Bash, WebFetch, Artifact.", "11 skill descriptions are always in context."] },
    { col: "pre", title: "Pre-tool", slots: 1, src: HOOKS_DOC,
      sub: ["PreToolUse runs before every call, permission or not.", "deny > defer > ask > allow."] },
    { col: "perm", title: "Permission", slots: 0, src: HOOKS_DOC,
      sub: ["Deny and ask rules still apply.", "A hook's ask shows here."] },
    { col: "tool", title: "Tool runs", slots: 2, src: HOOKS_DOC,
      sub: ["Skill: its body loads.", "Agent: a subagent runs its own loop in its own context and returns only its report.", "Its tool calls fire the same hooks."] },
    { col: "post", title: "Post-tool", slots: 1, src: HOOKS_DOC,
      sub: ["The result returns to the model.", "PostToolUse can add context; it can't undo the call.", "A failure fires PostToolUseFailure."] },
    { col: "end", title: "Turn ends · Notification", slots: 1, src: HOOKS_DOC,
      sub: ["No tool call: the turn ends and waits for you.", "Notification: a permission prompt (~6 s) or idle (~60 s). Can't block."] },
    { col: "compact", title: "Compaction", slots: 1, src: HOOKS_DOC,
      sub: ["PreCompact, then the context is summarized.", "The session resumes as SessionStart:compact."] },
    { col: "sessend", title: "Session end", slots: 1, src: HOOKS_DOC,
      sub: ["SessionEnd: the last hook before the process exits."] },
    { col: "across", title: "Across sessions", slots: 1, src: "README.md",
      sub: ["What this session leaves for the next one, and for teammates."] },
  ],

  lanes: [
    { id: "ai-coach-core", title: "ai-coach-core", line: "The engine. Hooks and memory; runs without being asked." },
    { id: "ai-coach", title: "ai-coach (bundle)", line: "Three commands that tie the coaches together." },
    { id: "memory-coach", title: "memory-coach", line: "Search memory, publish conclusions, hand them to a teammate." },
    { id: "investigation-coach", title: "investigation-coach", line: "Onboarding docs, architecture maps, study material." },
    { id: "strategy-coach", title: "strategy-coach", line: "The business as a vault, and feature specs." },
    { id: "analysis-coach", title: "analysis-coach", line: "Requirements, critiqued analysis, executive write-ups." },
    { id: "atlas-coach", title: "atlas-coach", line: "Everything outside the repo: research, ingestion, markets." },
    { id: "security-coach", title: "security-coach", line: "Injection scans, OWASP audits, pentest triage." },
    { id: "prompt-coach", title: "prompt-coach", line: "Prompts that land, and briefs for a subagent." },
    { id: "harness-coach", title: "harness-coach", line: "What is installed, and what fills this session." },
    { id: "design-coach", title: "design-coach", line: "Published pages made checkable, linted before publish." },
    { id: "pair-coach", title: "pair-coach", line: "Talk to Claude through @claude comments in the code." },
    { id: "ship-coach", title: "ship-coach", line: "Commit, branch and PR on Haiku, after one look." },
  ],

  items: [
    // ── ai-coach-core: the twelve hook bindings start here ──────────────────────────────────
    { id: "ai-coach-core:SessionStart:session-start.js", lane: "ai-coach-core", col: "start", kind: "hook",
      label: "session-start.js", role: "injects the brief",
      notes: ["brief ≤ 4,000 chars", "settable 500–16,000", "compact: 1,000 + snapshot", "branch/seed/partner nudges"],
      writes: "the session row", src: "plugins/ai-coach-core/hooks/session-start.js:44" },
    { id: "ai-coach-core:UserPromptSubmit:prompt.js", lane: "ai-coach-core", col: "prompt", kind: "hook",
      label: "prompt.js", role: "records · hints to you",
      notes: ["skips < 25 chars, / and !", "hints: systemMessage only", "never shown to the model", "plan mode: a Haiku review"],
      writes: "first prompt (scrubbed), signal ids", src: "plugins/ai-coach-core/hooks/prompt.js:34" },
    { id: "ai-coach-core:PreToolUse:guard.js", lane: "ai-coach-core", col: "pre", kind: "hook",
      label: "guard.js", role: "blocks or asks: secrets",
      notes: ["off by default", "blocks real credentials", "asks: secret out, key read", "only hook that can block"],
      gate: "asks before a secret-looking payload leaves, or a credential file is read", src: "plugins/ai-coach-core/hooks/guard.js:44" },
    { id: "ai-coach-core:PostToolUse:observe.js", lane: "ai-coach-core", col: "post", kind: "hook",
      label: "observe.js", role: "records the action",
      notes: ["Edit · Write · Bash", "<private> stripped first"],
      writes: "one observation per action", src: "plugins/ai-coach-core/hooks/observe.js:15" },
    { id: "ai-coach-core:PostToolUse:spotlight.js", lane: "ai-coach-core", col: "post", kind: "hook",
      label: "spotlight.js", role: "warns: injection",
      notes: ["WebFetch, WebSearch, Read", "Read outside the repo only", "in full once per session", "never blocks"],
      src: "plugins/ai-coach-core/hooks/spotlight.js:8" },
    { id: "ai-coach-core:PostToolUseFailure:observe.js", lane: "ai-coach-core", col: "post", kind: "hook", fail: true,
      label: "observe.js · FAIL", role: "records the failure",
      notes: ["feeds the snapshot", "and the distillation"],
      writes: "a FAIL observation", src: "plugins/ai-coach-core/hooks/observe.js:21" },
    { id: "ai-coach-core:Notification:notice.js", lane: "ai-coach-core", col: "end", kind: "hook",
      label: "notice.js", role: "records a correction",
      notes: ["on error, failed, wrong…", "prints nothing"],
      writes: "a correction", src: "plugins/ai-coach-core/hooks/notice.js:30" },
    { id: "ai-coach-core:PreCompact:precompact.js", lane: "ai-coach-core", col: "compact", kind: "hook",
      label: "precompact.js", role: "saves where you were",
      notes: ["branch, ≤ 8 files touched", "last fail, ≤ 3 corrections", "handed back once, deleted"],
      writes: "a working-state snapshot", src: "plugins/ai-coach-core/hooks/engine.js:1546" },
    { id: "ai-coach-core:SessionEnd:session-end.js", lane: "ai-coach-core", col: "sessend", kind: "hook",
      label: "session-end.js", role: "distils on Haiku",
      notes: ["≤ 3 learnings, 'distilled'", "AICOACH_LEARN=off skips it", "prunes at 30 and 90 days", "never exports a seed"],
      writes: "a summary and up to 3 learnings", src: "plugins/ai-coach-core/hooks/session-end.js:37" },
    { id: "store:memory-db", lane: "ai-coach-core", col: "across", kind: "store",
      label: "~/.ai-coach", role: "your memory database",
      notes: ["next session's brief", "survives uninstalling"], src: "README.md" },

    // ── the bundle's commands: typed, and they chain skills ─────────────────────────────────
    { id: "/ai-coach:start", lane: "ai-coach", col: "prompt", kind: "cmd", label: "/start", role: "day one, --run chains",
      gate: "says what --run costs, once, and asks", src: "plugins/ai-coach/commands/start.md:59" },
    { id: "/ai-coach:wrap", lane: "ai-coach", col: "prompt", kind: "cmd", label: "/wrap", role: "one question, publish",
      gate: "one question for every identity gap", src: "plugins/ai-coach/commands/wrap.md:16" },
    { id: "/ai-coach:sitrep", lane: "ai-coach", col: "prompt", kind: "cmd", label: "/sitrep", role: "read-only morning read",
      src: "plugins/ai-coach/commands/sitrep.md:7" },

    // ── memory-coach ────────────────────────────────────────────────────────────────────────
    { id: "/memory-coach:recall", lane: "memory-coach", col: "model", kind: "model", label: "recall", role: "searches memory",
      src: "plugins/memory-coach/skills/recall/SKILL.md:61" },
    { id: "/memory-coach:debrief", lane: "memory-coach", col: "model", kind: "model", label: "debrief", role: "publishes conclusions",
      gate: "shows the draft, then publishes", writes: "a debrief", src: "plugins/memory-coach/skills/debrief/SKILL.md:35" },
    { id: "/memory-coach:handoff", lane: "memory-coach", col: "model", kind: "model", label: "handoff", role: "exports the team seed",
      gate: "exports only on a yes", writes: ".ai-coach/team-seed.jsonl", src: "plugins/memory-coach/skills/handoff/SKILL.md:59" },
    { id: "/memory-coach:roster", lane: "memory-coach", col: "model", kind: "model", label: "roster", role: "who is on the team",
      gate: "asks for your role", writes: ".ai-coach/team.md", src: "plugins/memory-coach/skills/roster/SKILL.md:31" },
    { id: "store:team-seed", lane: "memory-coach", col: "across", kind: "store", label: "team-seed.jsonl", role: "carried by git",
      notes: ["teammates import it", "nothing leaves on its own"], src: "plugins/memory-coach/skills/handoff/SKILL.md:59" },

    // ── investigation-coach ─────────────────────────────────────────────────────────────────
    { id: "/investigation-coach:onboard", lane: "investigation-coach", col: "model", kind: "model", label: "onboard", role: "onboarding docs",
      gate: "states the cost before starting", writes: "docs/onboarding/", src: "plugins/investigation-coach/skills/onboard/SKILL.md:46" },
    { id: "/investigation-coach:map", lane: "investigation-coach", col: "model", kind: "model", label: "map", role: "maps → artifact-style",
      writes: "docs/onboarding/components/, an Artifact", src: "plugins/investigation-coach/skills/map/SKILL.md:34" },
    { id: "/investigation-coach:study", lane: "investigation-coach", col: "model", kind: "model", label: "study", role: "study material",
      writes: "docs/study/", src: "plugins/investigation-coach/skills/study/SKILL.md:11" },
    { id: "investigation-coach:scout", lane: "investigation-coach", col: "tool", kind: "agent", label: "scout · sonnet", role: "read-only repo sweep",
      notes: ["Read · Grep · Glob · Bash", "≤ 500 words, file:line"], src: "plugins/investigation-coach/agents/scout.md:4" },

    // ── strategy-coach ──────────────────────────────────────────────────────────────────────
    { id: "/strategy-coach:feature", lane: "strategy-coach", col: "prompt", kind: "typed", label: "feature", role: "spec, then plan",
      gate: "no plan.md until you answer", writes: "docs/features/<slug>/", src: "plugins/strategy-coach/skills/feature/SKILL.md:53" },
    { id: "/strategy-coach:blueprint", lane: "strategy-coach", col: "model", kind: "model", label: "blueprint", role: "the business vault",
      gate: "you correct the domain first", writes: "docs/business/, an Artifact", src: "plugins/strategy-coach/skills/blueprint/SKILL.md:65" },

    // ── analysis-coach ──────────────────────────────────────────────────────────────────────
    { id: "/analysis-coach:elicit", lane: "analysis-coach", col: "prompt", kind: "typed", label: "elicit", role: "requirements",
      writes: "docs/requirements/", src: "plugins/analysis-coach/skills/elicit/SKILL.md:2" },
    { id: "/analysis-coach:insight", lane: "analysis-coach", col: "prompt", kind: "typed", label: "insight", role: "analysis, critiqued",
      writes: "docs/analysis/", src: "plugins/analysis-coach/skills/insight/SKILL.md:49" },
    { id: "/analysis-coach:story", lane: "analysis-coach", col: "prompt", kind: "typed", label: "story", role: "executive write-up",
      src: "plugins/analysis-coach/skills/story/SKILL.md:2" },
    { id: "analysis-coach:critic", lane: "analysis-coach", col: "tool", kind: "agent", label: "critic", role: "unanchored review",
      notes: ["Read · Grep · Glob · Bash", "never sees the reasoning"], src: "plugins/analysis-coach/agents/critic.md:2" },

    // ── atlas-coach ─────────────────────────────────────────────────────────────────────────
    { id: "/atlas-coach:research", lane: "atlas-coach", col: "prompt", kind: "typed", label: "research", role: "verified web research",
      writes: "research/<slug>.md", src: "plugins/atlas-coach/skills/research/SKILL.md:10" },
    { id: "/atlas-coach:market", lane: "atlas-coach", col: "prompt", kind: "typed", label: "market", role: "competitor analysis",
      writes: "docs/market/", src: "plugins/atlas-coach/skills/market/SKILL.md:61" },
    { id: "/atlas-coach:ingest", lane: "atlas-coach", col: "prompt", kind: "typed", label: "ingest", role: "docs in · Haiku",
      gate: "stops on a spotlight warning", writes: "docs/<slug>.md", src: "plugins/atlas-coach/skills/ingest/SKILL.md:34" },
    { id: "/atlas-coach:translate", lane: "atlas-coach", col: "prompt", kind: "typed", label: "translate", role: "docs to code",
      src: "plugins/atlas-coach/skills/translate/SKILL.md:28" },
    { id: "atlas-coach:researcher", lane: "atlas-coach", col: "tool", kind: "agent", label: "researcher · sonnet", role: "cited brief",
      notes: ["WebFetch · WebSearch", "≤ 600 words, UNVERIFIED"], src: "plugins/atlas-coach/agents/researcher.md:4" },
    { id: "atlas-coach:verifier", lane: "atlas-coach", col: "tool", kind: "agent", label: "verifier", role: "tries to refute",
      notes: ["WebFetch · WebSearch"], src: "plugins/atlas-coach/agents/verifier.md:2" },
    { id: "atlas-coach:reader", lane: "atlas-coach", col: "tool", kind: "agent", label: "reader · haiku", role: "PDF, 20 pages a call",
      notes: ["Read · Write · Bash"], src: "plugins/atlas-coach/agents/reader.md:4" },

    // ── security-coach ──────────────────────────────────────────────────────────────────────
    { id: "/security-coach:scan", lane: "security-coach", col: "prompt", kind: "typed", label: "scan", role: "injection scan · Haiku",
      src: "plugins/security-coach/skills/scan/SKILL.md:28" },
    { id: "/security-coach:audit", lane: "security-coach", col: "prompt", kind: "typed", label: "audit", role: "OWASP audit · Haiku",
      gate: "--triage asks before recording", writes: "findings", src: "plugins/security-coach/skills/audit/SKILL.md:67" },
    { id: "/security-coach:triage", lane: "security-coach", col: "prompt", kind: "typed", label: "triage", role: "pentest report · Haiku",
      writes: "findings, .ai-coach/security/", src: "plugins/security-coach/skills/triage/SKILL.md:41" },
    { id: "security-coach:examiner", lane: "security-coach", col: "tool", kind: "agent", label: "examiner", role: "quarantine reader",
      notes: ["Read · Grep only", "no shell, no network"], src: "plugins/security-coach/agents/examiner.md:2" },

    // ── prompt-coach ────────────────────────────────────────────────────────────────────────
    { id: "/prompt-coach:prompt", lane: "prompt-coach", col: "prompt", kind: "typed", label: "prompt", role: "a prompt that lands",
      src: "plugins/prompt-coach/skills/prompt/SKILL.md:2" },
    { id: "/prompt-coach:scope", lane: "prompt-coach", col: "prompt", kind: "typed", label: "scope", role: "shape a big ask",
      gate: "any FAIL stops the walk", src: "plugins/prompt-coach/skills/scope/SKILL.md:66" },
    { id: "/prompt-coach:prompt-stats", lane: "prompt-coach", col: "prompt", kind: "typed", label: "prompt-stats", role: "habits that cost you",
      src: "plugins/prompt-coach/skills/prompt-stats/SKILL.md:2" },
    { id: "/prompt-coach:dispatch", lane: "prompt-coach", col: "model", kind: "model", label: "dispatch", role: "brief a subagent",
      src: "plugins/prompt-coach/skills/dispatch/SKILL.md:86" },

    // ── harness-coach ───────────────────────────────────────────────────────────────────────
    { id: "/harness-coach:context", lane: "harness-coach", col: "prompt", kind: "typed", label: "context", role: "what fills the session",
      src: "plugins/harness-coach/skills/context/SKILL.md:66" },
    { id: "/harness-coach:partners", lane: "harness-coach", col: "prompt", kind: "typed", label: "partners", role: "partner tools · Haiku",
      gate: "installs only what you pick", src: "plugins/harness-coach/skills/partners/SKILL.md:12" },

    // ── design-coach ────────────────────────────────────────────────────────────────────────
    { id: "/design-coach:artifact-style", lane: "design-coach", col: "model", kind: "model", label: "artifact-style", role: "checkable pages",
      writes: "an Artifact page", src: "plugins/design-coach/skills/artifact-style/SKILL.md:38" },
    { id: "design-coach:PreToolUse:artifact-lint.js", lane: "design-coach", col: "pre", kind: "hook", label: "artifact-lint.js", role: "asks on lint errors",
      notes: ["Artifact .html publish", "never denies"], gate: "asks before a page that fails the lint is published",
      src: "plugins/design-coach/hooks/artifact-lint.js:29" },
    { id: "design-coach:PostToolUse:artifact-nudge.js", lane: "design-coach", col: "post", kind: "hook", label: "artifact-nudge.js", role: "loads artifact-style",
      notes: ["after native design skills"], src: "plugins/design-coach/hooks/artifact-nudge.js:9" },

    // ── pair-coach ──────────────────────────────────────────────────────────────────────────
    { id: "pair-coach:UserPromptSubmit:mentions-nudge.js", lane: "pair-coach", col: "prompt", kind: "hook", label: "mentions-nudge.js", role: "names open threads",
      notes: ["your uncommitted lines", "≤ 5 locations"], src: "plugins/pair-coach/hooks/mentions-nudge.js:15" },
    { id: "/pair-coach:pair", lane: "pair-coach", col: "prompt", kind: "typed", label: "pair", role: "1–3 stubs for you",
      writes: "code, tests, stubs that throw", src: "plugins/pair-coach/skills/pair/SKILL.md:23" },
    { id: "/pair-coach:mentions", lane: "pair-coach", col: "model", kind: "model", label: "mentions", role: "answers @claude inline",
      gate: "asks about lines someone else committed", writes: "replies and changes in the code", src: "plugins/pair-coach/skills/mentions/SKILL.md:40" },

    // ── ship-coach ──────────────────────────────────────────────────────────────────────────
    { id: "/ship-coach:commit", lane: "ship-coach", col: "prompt", kind: "typed", label: "commit", role: "Haiku · low effort",
      gate: "one look at the whole plan", writes: "a commit, a branch, a PR", src: "plugins/ship-coach/skills/commit/SKILL.md:43" },
  ],

  edges: [
    { from: "/ai-coach:start", to: "/investigation-coach:onboard", verb: "--run chains" },
    { from: "/ai-coach:start", to: "/strategy-coach:blueprint", verb: "--with-blueprint" },
    { from: "/ai-coach:wrap", to: "/memory-coach:roster", verb: "chains" },
    { from: "/ai-coach:wrap", to: "/memory-coach:debrief", verb: "chains" },
    { from: "/ai-coach:wrap", to: "/memory-coach:handoff", verb: "chains" },
    { from: "/investigation-coach:onboard", to: "investigation-coach:scout", verb: "spawns" },
    { from: "/investigation-coach:map", to: "investigation-coach:scout", verb: "spawns" },
    { from: "/investigation-coach:study", to: "investigation-coach:scout", verb: "spawns" },
    { from: "/strategy-coach:blueprint", to: "investigation-coach:scout", verb: "spawns" },
    { from: "/strategy-coach:blueprint", to: "analysis-coach:critic", verb: "spawns" },
    { from: "/strategy-coach:feature", to: "atlas-coach:researcher", verb: "--prior-art" },
    { from: "/analysis-coach:insight", to: "analysis-coach:critic", verb: "spawns" },
    { from: "/atlas-coach:research", to: "atlas-coach:researcher", verb: "spawns" },
    { from: "/atlas-coach:research", to: "atlas-coach:verifier", verb: "gates claims" },
    { from: "/atlas-coach:market", to: "atlas-coach:researcher", verb: "spawns" },
    { from: "/atlas-coach:ingest", to: "atlas-coach:reader", verb: "spawns" },
    { from: "/atlas-coach:translate", to: "investigation-coach:scout", verb: "spawns" },
    { from: "/security-coach:scan", to: "security-coach:examiner", verb: "quarantines" },
    { from: "/memory-coach:handoff", to: "store:team-seed", verb: "exports" },
    { from: "ai-coach-core:SessionEnd:session-end.js", to: "store:memory-db", verb: "learns" },
  ],

  callouts: [
    { n: 1, at: "lane:ai-coach-core", text: "Every hook fails open: a crash is logged and the session goes on. Only guard.js can stop a call.",
      src: "plugins/ai-coach-core/hooks/guard.js:4" },
    { n: 2, at: "ai-coach-core:SessionEnd:session-end.js", text: "The engine's own claude -p runs set AICOACH_INNER, so every hook skips them: no recursion.",
      src: "plugins/ai-coach-core/hooks/engine.js:448" },
    { n: 3, at: "ai-coach-core:UserPromptSubmit:prompt.js", text: "Hook context goes to the model. Prompt hints go only to you, as a systemMessage.",
      src: "plugins/ai-coach-core/hooks/prompt.js:10" },
    { n: 4, at: "step:tool", text: "Inside a subagent, every tool call still passes guard, observe and spotlight; the parent gets only the report.",
      src: HOOKS_DOC },
    { n: 5, at: "ai-coach-core:PostToolUse:observe.js", text: "Anything between <private> tags is stripped before a single byte is written.",
      src: "plugins/ai-coach-core/hooks/observe.js:15" },
    { n: 6, at: "store:memory-db", text: "What a model wrote is stamped distilled, and nothing ever promotes it to a person's word.",
      src: "plugins/ai-coach-core/hooks/session-end.js:43" },
    { n: 7, at: "store:team-seed", text: "Nothing leaves your machine on its own: the seed is exported only when you say yes.",
      src: "plugins/ai-coach-core/hooks/session-end.js:58" },
    { n: 8, at: "/ship-coach:commit", text: "Small models where a summary is the job: distillation, plan review, commit, reader, and skills pinned to Haiku.",
      src: "plugins/ship-coach/skills/commit/SKILL.md:5" },
    { n: 9, at: "step:end", text: "AI Coach binds no Stop, SubagentStart or SubagentStop hook: a turn always ends when Claude is done.",
      src: "plugins/ai-coach-core/hooks/hooks.json:1" },
  ],
};
