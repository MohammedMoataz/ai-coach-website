// One workflow strip per coach, keyed by marketplace slug. Each step is grounded in the
// ai-coach repo (sources in the comment above each flow, paths on main). The `skill` on a step
// must exist in the catalog: components/Workflow.tsx throws at build otherwise, so a renamed
// skill fails CI instead of leaving a stale diagram behind.

export type StepKind = "you" | "auto" | "agent" | "gate" | "output";
export type Step = { kind: StepKind; label: string; detail: string; skill?: string };
export type Workflow = { title: string; steps: Step[]; next?: string };

export const KINDS: Record<StepKind, string> = {
  you: "You",
  auto: "Automatic",
  agent: "Agent",
  gate: "Check or approval",
  output: "Result",
};

export const workflows: Record<string, Workflow> = {
  // hooks.json; session-start.js; prompt.js; guard.js; spotlight.js; observe.js; precompact.js;
  // session-end.js; README "What happens on its own"
  "ai-coach-core": {
    title: "One session, start to finish",
    steps: [
      { kind: "auto", label: "Brief at session start", detail: "A ranked memory brief enters context, each line saying why it is there." },
      { kind: "auto", label: "Prompt hints", detail: "Nine detectors check what you type. At most two hints, shown to you, never the model." },
      { kind: "gate", label: "Guard and injection check", detail: "Opt-in guard blocks real credentials. Fetched content is scanned for injection, warn-only." },
      { kind: "auto", label: "Work recorded", detail: "Every Edit, Write and Bash becomes a one-line observation; failures are marked." },
      { kind: "auto", label: "Snapshot before compaction", detail: "Files you were in and what broke, handed back once by the next start." },
      { kind: "output", label: "Session distilled", detail: "One Haiku call at session end writes a summary and 0–3 learnings." },
    ],
  },

  // README "What happens on its own", "What a teammate actually receives"; session-start.js;
  // memory-coach skills recall, debrief, handoff
  "memory-coach": {
    title: "From your first session to a teammate's machine",
    steps: [
      { kind: "auto", label: "Session 1 recorded", detail: "Edits, failures and corrections are kept, then distilled into learnings at session end." },
      { kind: "auto", label: "Session 2 opens warm", detail: "A ranked brief: branch, global, distilled, or from a teammate, with the reason shown." },
      { kind: "you", label: "Recall what's known", detail: "Search project and global memory, then debriefs. Claude can also reach for it unprompted.", skill: "/memory-coach:recall" },
      { kind: "gate", label: "Approve the debrief", detail: "Business outcome, decision, evidence, unknowns. Published only after you approve the draft.", skill: "/memory-coach:debrief" },
      { kind: "gate", label: "Approve the handoff", detail: "Shows what will travel and waits for yes. Writes a seed file you commit.", skill: "/memory-coach:handoff" },
      { kind: "output", label: "Teammate imports it", detail: "Their next session points at the seed; debriefs and memories arrive marked imported." },
    ],
    next: "/ai-coach:wrap runs roster, debrief and handoff as one command.",
  },

  // prompt.js; prompt-coach skills prompt, scope; README "When planning is done"
  "prompt-coach": {
    title: "From a vague ask to a prompt a fresh session can run",
    steps: [
      { kind: "auto", label: "Hint on a weak prompt", detail: "Detectors flag a draft as you type. Exploratory questions are exempt." },
      { kind: "you", label: "Review the draft", detail: "Prompt-check, at most three questions with example answers, then exactly one rewrite.", skill: "/prompt-coach:prompt" },
      { kind: "you", label: "Scope a big ask", detail: "Small work goes back to /prompt. Otherwise it reads memory and docs before asking.", skill: "/prompt-coach:scope" },
      { kind: "you", label: "Answer the dimensions", detail: "A coverage table shows where each answer came from; guesses are marked ASSUMED." },
      { kind: "gate", label: "Planning-done gate", detail: "Seven rows. Any failure stops the walk and emits nothing." },
      { kind: "output", label: "One executable prompt", detail: "Written to the dispatch rules and re-checked. Printed in the session, no file written." },
    ],
    next: "Needs a committed spec: /strategy-coach:feature. Requirements still argued: /analysis-coach:elicit.",
  },

  // security-coach skills audit, triage
  "security-coach": {
    title: "From scanner output to a tracked, retested finding",
    steps: [
      { kind: "you", label: "Run the audit", detail: "Uses the SAST, dependency and secrets scanners you have. Missing ones get a hint, not an install.", skill: "/security-coach:audit" },
      { kind: "output", label: "Prioritised report", detail: "Ranked KEV, then EPSS, then CVSS. New findings come before the backlog." },
      { kind: "gate", label: "Choose what to track", detail: "Nothing is ingested automatically, and .ai-coach/security/ must be gitignored first." },
      { kind: "output", label: "Findings table", detail: "Validated findings recorded with their source in .ai-coach/security/findings.md." },
      { kind: "you", label: "Fix, then retest", detail: "Fixed is not closed until retested. Accepted risk needs a named sign-off.", skill: "/security-coach:triage" },
      { kind: "output", label: "Team report", detail: "A timestamped report diffed against the last one, shared outside git." },
    ],
    next: "Suspect content instead of code? /security-coach:scan reads it in the quarantined examiner agent.",
  },

  // harness-coach skill partners; session-start.js partners nudge
  "harness-coach": {
    title: "From a one-time nudge to tools your brief remembers",
    steps: [
      { kind: "auto", label: "One-time nudge", detail: "A single session-start line points at /partners, then never again." },
      { kind: "you", label: "Detect installed tools", detail: "Checks binaries, the plugin list and the MCP list in batches.", skill: "/harness-coach:partners" },
      { kind: "output", label: "Verdict table", detail: "Each partner: installed or not, and a one-line verdict with its caveat." },
      { kind: "gate", label: "You pick, or none", detail: "One multi-select over the missing tools. Nothing installs without your pick." },
      { kind: "you", label: "Install and verify", detail: "Each pick is installed and re-checked. Interactive setup is handed to you." },
      { kind: "output", label: "Remembered", detail: "Verified installs become a memory, so the next brief knows what you have." },
    ],
    next: "Session feeling heavy? /harness-coach:context itemizes what is filling it.",
  },

  // investigation-coach skills onboard (--tour), map, study; agents/scout.md
  "investigation-coach": {
    title: "From an unknown repo to a docs vault",
    steps: [
      { kind: "you", label: "Start the tour", detail: "Onboard, then map, then study. States the cost first; stop after any step.", skill: "/investigation-coach:onboard" },
      { kind: "agent", label: "Scouts sweep the code", detail: "One scout per area, every claim file:line or INFERRED. Hand-written docs are never overwritten." },
      { kind: "output", label: "docs/onboarding/", detail: "Start-here, stack, decisions and patterns, written and remembered." },
      { kind: "agent", label: "Map traces the calls", detail: "Reuses the stack notes and sweeps only who-calls-whom, each edge cited.", skill: "/investigation-coach:map" },
      { kind: "output", label: "Architecture views", detail: "An artifact page, one Obsidian note per component, and a canvas." },
      { kind: "output", label: "docs/study/", detail: "The why behind each pattern, with one proving instance each.", skill: "/investigation-coach:study" },
    ],
    next: "Open docs/ in Obsidian. /strategy-coach:blueprint builds on what this wrote.",
  },

  // atlas-coach skill research; agents researcher, verifier
  "atlas-coach": {
    title: "From a question to findings that survived a refutation attempt",
    steps: [
      { kind: "you", label: "Ask, choose a tier", detail: "Seeds from memory and docs, then splits into 3, 5 or 7 sub-questions.", skill: "/atlas-coach:research" },
      { kind: "agent", label: "Researchers fan out", detail: "One per sub-question, in parallel. Each returns a cited brief of 600 words or less." },
      { kind: "auto", label: "Fetched pages scanned", detail: "Every fetched page is checked for injection and treated as data." },
      { kind: "gate", label: "Verifier tries to refute", detail: "Refuted claims are dropped and counted. Plausible ones are marked unverified." },
      { kind: "output", label: "research/<slug>.md", detail: "Findings first, what was dropped, and what could not be determined." },
    ],
    next: "Keep a source: /atlas-coach:ingest. Turn a doc into code: /atlas-coach:translate.",
  },

  // strategy-coach skills blueprint, feature; agents scout, critic
  "strategy-coach": {
    title: "From the business on paper to a plan a cheap model can run",
    steps: [
      { kind: "you", label: "Scaffold the vault", detail: "Creates docs/business and docs/features, confirming the domain in one sentence first.", skill: "/strategy-coach:blueprint" },
      { kind: "agent", label: "Scouts map processes", detail: "You answer what code can't. Each step cited, INFERRED or NOT IN CODE." },
      { kind: "agent", label: "Critic scores the notes", detail: "A fresh-context critic grades five dimensions; anything below 3 is revised." },
      { kind: "you", label: "Specify a feature", detail: "Four questions: outcome, observable success, out of scope, what was tried.", skill: "/strategy-coach:feature" },
      { kind: "gate", label: "Sign off the spec", detail: "Every definition-of-done row is checkable. No plan until you answer." },
      { kind: "output", label: "plan.md", detail: "Self-contained for a fresh session on a cheap model, indexed in docs/features." },
    ],
    next: "Gaps marked NOT IN CODE: /atlas-coach:market. Work done: /memory-coach:debrief.",
  },

  // analysis-coach skills insight, story; agents/critic.md
  "analysis-coach": {
    title: "From a dataset to the version an executive reads",
    steps: [
      { kind: "you", label: "Name the decision", detail: "No decision depends on it? You get a plain description instead.", skill: "/analysis-coach:insight" },
      { kind: "output", label: "Three readings", detail: "Gaps and nulls first, then at least three distinct readings with numbers." },
      { kind: "agent", label: "Critic attacks them", detail: "Sees the readings, not the reasoning. They are revised against its critique." },
      { kind: "output", label: "docs/analysis/<slug>.md", detail: "Surviving findings, dropped readings with reasons, optional chart specs." },
      { kind: "you", label: "Name the audience", detail: "One question after a full read: who decides what.", skill: "/analysis-coach:story" },
      { kind: "output", label: "Executive summary", detail: "Answer first, three evidenced points, the ask, and the caveats that matter." },
    ],
    next: "Requirements first: /analysis-coach:elicit, then /strategy-coach:feature once agreed.",
  },

  // design-coach skill artifact-style; hooks artifact-nudge.js, artifact-lint.js
  "design-coach": {
    title: "From a native design skill to a page that passes lint",
    steps: [
      { kind: "auto", label: "Nudge on design skills", detail: "When a native design skill loads, a hook reminds Claude to add artifact-style." },
      { kind: "you", label: "Detect the design system", detail: "At most six file reads for fonts and palette, each cited.", skill: "/design-coach:artifact-style" },
      { kind: "output", label: "Page from the skeleton", detail: "Built with the project's tokens; every diagram in a zoomable figure." },
      { kind: "gate", label: "Lint and overflow probe", detail: "Every lint error fixed; with a browser, overflow is probed and fixed." },
      { kind: "gate", label: "Pre-publish check", detail: "A hook re-lints before publishing and asks if anything still fails." },
      { kind: "output", label: "Published page", detail: "A stable path on re-runs, with the design brief in the reply." },
    ],
    next: "/investigation-coach:map and /strategy-coach:blueprint chain it before they publish.",
  },
};

// Strip arguments: "/memory-coach:handoff import" -> "/memory-coach:handoff".
export const invocationOf = (skill: string) => skill.split(" ")[0];
