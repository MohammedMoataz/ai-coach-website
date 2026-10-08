import { KINDS, invocationOf, type StepKind, type Workflow as Flow } from "@/content/workflows";

// A coach's workflow as numbered steps joined by arrows, coloured by who acts. Server-rendered
// and CSS-only (globals.css, .flow). `known` is every invocation in the catalog: a step naming
// one that does not exist fails the build.
export function Workflow({ flow, known }: { flow: Flow; known: Set<string> }) {
  for (const s of flow.steps) {
    if (s.skill && !known.has(invocationOf(s.skill))) throw new Error(`workflow step "${s.label}" names unknown ${s.skill}`);
  }
  const used = Object.keys(KINDS).filter((k) => flow.steps.some((s) => s.kind === k)) as StepKind[];

  return (
    <section className="section-sm flow-section" aria-labelledby="flow-title">
      <div className="wrap">
        <p className="eyebrow">How it flows</p>
        <h2 className="h2" id="flow-title">
          {flow.title}
        </h2>
        <ul className="flow-legend" aria-label="Step types">
          {used.map((k) => (
            <li key={k} data-kind={k}>
              {KINDS[k]}
            </li>
          ))}
        </ul>
        <ol className="flow" style={{ "--n": flow.steps.length } as React.CSSProperties}>
          {flow.steps.map((s, i) => (
            <li key={s.label} className="flow-step" data-kind={s.kind} data-reveal>
              <span className="flow-num" aria-hidden>
                {i + 1}
              </span>
              <span className="flow-kind">{KINDS[s.kind]}</span>
              <strong className="flow-label">{s.label}</strong>
              <span className="flow-detail">{s.detail}</span>
              {s.skill && (
                <code className="flow-skill">
                  {/* break after the namespace colon, never inside "memory-coach" */}
                  <span>{s.skill.split(":")[0]}:</span>
                  <wbr />
                  <span>{s.skill.split(":").slice(1).join(":")}</span>
                </code>
              )}
            </li>
          ))}
        </ol>
        {flow.next && (
          <p className="flow-next">
            <i className="pi pi-arrow-right" aria-hidden /> {flow.next}
          </p>
        )}
      </div>
    </section>
  );
}
