// Hand-written marketing copy. Anything countable (skills, agents, coaches) is NOT here:
// it comes from lib/coaches.ts so it cannot drift from the repo.

export const REPO_URL = "https://github.com/MohammedMoataz/ai-coach";
export const INSTALL = [
  "claude plugin marketplace add MohammedMoataz/ai-coach",
  "claude plugin install ai-coach@ai-coach",
];

export const hero = {
  eyebrow: "Harness your team · a coaching harness for Claude Code",
  title: "Your best session should be your normal one.",
  lede:
    "AI Coach keeps what a session learned and puts it in front of you next time, with who learned it. It shapes a vague ask until someone else could act on it, argues with a finding before it reaches you, and tracks a security finding until it is closed.",
  fine: "Node 22.16+ or 24 · MIT · your data lives in ~/.ai-coach/ and survives uninstalling",
};

export const problem = {
  eyebrow: "Why",
  title: "Every session starts cold.",
  beats: [
    { icon: "pi-replay", title: "You re-explain", body: "The same constraint, every session, to a model that knew it yesterday." },
    { icon: "pi-exclamation-triangle", title: "You rediscover", body: "The same trap, hit twice, because the moment it went wrong is the moment nothing recorded." },
    { icon: "pi-users", title: "You lose a teammate's work", body: "Whatever they worked out on the branch you just checked out stays in their head." },
  ],
};

export const automatic = {
  eyebrow: "What happens on its own",
  title: "The engine runs without being asked.",
  lede: "Hooks and a local SQLite database in your home directory. Every coach reads and writes through it.",
  items: [
    { icon: "pi-book", title: "A session brief", body: "Capped and ranked, with the reason each line is there: branch, global, from a teammate, distilled." },
    { icon: "pi-pencil", title: "Corrections recorded", body: "When a failure surfaces, that fact is kept. The richest signal in a session, and the one nothing else captures." },
    { icon: "pi-sparkles", title: "Session-end distillation", body: "One Haiku call turns a session into 0–3 learnings, marked distilled. Unrecalled for 90 days, they are pruned." },
    { icon: "pi-camera", title: "A snapshot before compaction", body: "Which files you were in, what broke last, what is still open — handed back once, then deleted." },
    { icon: "pi-comment", title: "Prompt hints", body: "At most two, shown to you and never to the model. Exploratory questions are exempt." },
    { icon: "pi-shield", title: "Injection check", body: "Fetched pages and outside files are scanned for injection markers. Warn-only, and honest that it is a pre-filter, not a gate." },
    { icon: "pi-lock", title: "Secrets guard — off by default", body: "Turn it on and real credentials are blocked outright. It ships off, so a default install does no credential blocking. Said plainly." },
  ],
};

// One pitch line per coach, keyed by marketplace slug. A coach missing here falls back to its
// marketplace description, so a new coach still renders.
export const pitch: Record<string, string> = {
  "ai-coach-core": "The part that runs without being asked. Every coach reads and writes through it.",
  "memory-coach": "Search what was already learned, publish what you concluded, hand it to a teammate, and say who is on the team.",
  "prompt-coach": "Write prompts that land, shape a big scope before you send it, see which habits cost you, and brief a context that cannot ask you a follow-up.",
  "security-coach": "Injection defence for content you are about to trust, OWASP-grounded audits of code you ship, and pentest findings tracked to closure.",
  "harness-coach": "What is installed next to the coach, and what is filling this session.",
  "investigation-coach": "Onboard anyone onto the project: evidence-cited docs, an architecture map you can open in Obsidian or draw.io, and study material.",
  "atlas-coach": "Everything outside the repo: verified web research, documents in and markdown out, competitor and industry analysis, and docs turned into code in your idiom.",
  "strategy-coach": "Document what the business is, mapped to the code that implements it, and specify what comes next with a checkable definition of done.",
  "analysis-coach": "The business-analyst half: requirements nobody can argue about later, data turned into an analysis that has already been argued with, and the version an executive reads.",
  "design-coach": "How a published page should look, made checkable: text that stays in its box, zoomable diagrams, the project's own fonts and palette, and WCAG contrast in both themes.",
};

export const evidence = {
  eyebrow: "Evidence, not etiquette",
  title: "No claim without the evidence for it.",
  lede: "The house rule, applied to the product as much as to its output.",
  points: [
    "A memory says who wrote it, and whether a person or a model did.",
    "A verdict carries its command output.",
    "A performance number was measured, or it is not printed.",
    "What could not be determined is a required field, not an omission.",
  ],
  cost: {
    value: "~1,900",
    label: "tokens of always-loaded context per session",
    note: "Expected, not re-probed: a live probe measured ~700 before v1.14; the rest is arithmetic on eight new skill descriptions. User-only skills cost nothing until you type them.",
  },
};

export const harnesses = {
  eyebrow: "Beyond Claude Code",
  title: "One memory, whichever harness opened the session.",
  lede: "Live memory travels over MCP and the workflows compile to each harness's own rules format. A Cursor session and a Claude Code session on one machine share one ~/.ai-coach/.",
  items: [
    { name: "Claude Code", how: "Native: plugins, hooks, skills and agents, the full automatic layer." },
    { name: "Cursor", how: "MCP memory, compiled .mdc rules, and a lifecycle shim for recording, the guard and distillation." },
    { name: "Windsurf · Antigravity", how: "MCP memory, rules directory, and the same lifecycle shim in their own hook dialect." },
    { name: "opencode", how: "MCP memory, an AGENTS.md index, and a native plugin for recording and the guard." },
    { name: "Codex CLI · anything MCP", how: "MCP memory, including a memory_brief tool, plus the AGENTS.md workflow index." },
  ],
  caveat:
    "What stays Claude Code's: context injection. No other harness lets a session-start hook hand text to the model, so elsewhere the memory brief is your first move, not automatic.",
};

// Install-page FAQ: rendered as <details> and emitted as FAQPage structured data from this one
// list, so the two cannot disagree. Backticks mark code.
export const faq = [
  {
    q: "Where does my data live?",
    a: "In `~/.ai-coach/` (`%USERPROFILE%\.ai-coach` on Windows), whichever harness opened the session. There is no AI Coach server and no account. Session-end distillation makes one call through `claude` on your PATH when it is there, and quietly skips when it is not.",
  },
  {
    q: "Is the secrets guard on?",
    a: "Not by default. It is the only hook that can stop a tool call, so it ships off. Turn it on with `AICOACH_GUARD=on` or the setting in `/plugin`.",
  },
  {
    q: "How do I uninstall?",
    a: "Run `claude plugin uninstall ai-coach`. Your memory outlives the plugin by design, so reinstalling picks up where you left off. Delete `~/.ai-coach/` to remove it too.",
  },
  {
    q: "Which Node version does it need?",
    a: "Node 22.16+ or 24+: the memory needs `node:sqlite` with FTS5 in its bundled SQLite. The 23.x line ships the module without FTS5 and is not supported.",
  },
  {
    q: "Does it work outside Claude Code?",
    a: "Yes. Cursor, Windsurf, Antigravity, opencode, Codex CLI and anything that speaks MCP get the memory through an MCP server and the workflows as compiled rules. What stays Claude Code's is context injection: elsewhere the memory brief is your first move, not automatic.",
  },
];
