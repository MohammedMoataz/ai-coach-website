"use client";

import { useState } from "react";
import { TabPanel, TabView } from "primereact/tabview";
import { InstallBlock } from "./InstallBlock";

// $(pwd) expands in bash, zsh and PowerShell alike, so the copied line carries a real absolute
// path as long as it runs where the repo was cloned.
const MCP = 'node "$(pwd)/ai-coach/adapters/mcp/server.js"';

export function InstallTabs({ bundle, coaches, repo }: { bundle: string[]; coaches: string[]; repo: string }) {
  const [coach, setCoach] = useState(coaches[0]);
  // renderActiveOnly={false}: every panel is in the server HTML, so crawlers see all three.
  return (
    <TabView scrollable renderActiveOnly={false}>
      <TabPanel header="Everything">
        <p className="prose">
          The bundle installs the engine, every coach, and the three cross-coach commands. This is the one to pick.
        </p>
        <InstallBlock lines={bundle} />
      </TabPanel>
      <TabPanel header="One coach">
        <p className="prose">
          Each coach installs alone and pulls the engine (<code>ai-coach-core</code>) with it.
        </p>
        <label className="coach-pick">
          Coach
          <select value={coach} onChange={(e) => setCoach(e.target.value)}>
            {coaches.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <InstallBlock lines={[bundle[0], `claude plugin install ${coach}@ai-coach`]} label={coach} />
      </TabPanel>
      <TabPanel header="Other harnesses">
        <p className="prose">
          Cursor, Windsurf, Antigravity, opencode, Codex CLI and anything that speaks MCP get the memory through an MCP
          server and the workflows as compiled rules. Set up once:
        </p>
        <InstallBlock
          lines={[`git clone ${repo}`, "node ai-coach/plugins/ai-coach-core/hooks/engine.js bootstrap"]}
          label="once, any harness"
        />
        <p className="prose" style={{ marginTop: 20 }}>
          Then, from the same directory, point your harness at the MCP server. For example, Codex CLI:
        </p>
        <InstallBlock lines={[`codex mcp add ai-coach -- ${MCP}`]} label="codex" />
        <p className="prose" style={{ marginTop: 20 }}>
          Per-harness snippets (Cursor, opencode, Windsurf, Antigravity) and what ports versus what stays Claude
          Code&apos;s are in the <a href={`${repo}/blob/main/adapters/README.md`}>adapters guide</a>.
        </p>
      </TabPanel>
    </TabView>
  );
}
