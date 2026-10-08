"use client";

import { TabPanel, TabView } from "primereact/tabview";
import { Tag } from "primereact/tag";
import { Tooltip } from "primereact/tooltip";
import type { Agent, Skill } from "@/lib/coaches";

const MODEL = "Claude can reach for this one on its own when your question matches its description.";
const USER = "Runs only when you type it. Its description costs no context until then.";

function Skills({ skills }: { skills: Skill[] }) {
  return (
    <div className="grid" style={{ marginTop: 0 }}>
      {skills.map((s) => (
        <article key={s.name} className="card">
            <div className="skill-head">
              <code className="invoke">{s.invocation}</code>
              <span style={{ display: "flex", gap: 6 }}>
                {s.model && <Tag value={s.model} className="tag-user has-tip" data-pr-tooltip={`Pinned to ${s.model}`} />}
                <Tag
                  value={s.modelInvocable ? "model-invocable" : "you invoke"}
                  className={`has-tip ${s.modelInvocable ? "tag-model" : "tag-user"}`}
                  data-pr-tooltip={s.modelInvocable ? MODEL : USER}
                />
              </span>
            </div>
            <p>{s.description}</p>
            {s.argumentHint && <code className="hint">{s.argumentHint}</code>}
        </article>
      ))}
    </div>
  );
}

function Agents({ agents }: { agents: Agent[] }) {
  return (
    <div className="grid" style={{ marginTop: 0 }}>
      {agents.map((a) => (
        <article key={a.name} className="card">
          <code className="invoke">{a.invocation}</code>
          <p>{a.description}</p>
          {a.tools.length > 0 && (
            <div className="chips">
              {a.tools.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export function SkillTabs({ skills, agents }: { skills: Skill[]; agents: Agent[] }) {
  return (
    <>
      <Tooltip target=".has-tip" position="top" style={{ maxWidth: 280 }} />
      {agents.length === 0 ? (
        <Skills skills={skills} />
      ) : (
        <TabView renderActiveOnly={false}>
          <TabPanel header={`Skills (${skills.length})`}>
            <Skills skills={skills} />
          </TabPanel>
          <TabPanel header={`Agents (${agents.length})`}>
            <Agents agents={agents} />
          </TabPanel>
        </TabView>
      )}
    </>
  );
}
