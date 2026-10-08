"use client";

import { Accordion, AccordionTab } from "primereact/accordion";
import { TabPanel, TabView } from "primereact/tabview";
import { InstallBlock } from "./InstallBlock";

const MCP = "node /absolute/path/to/ai-coach/adapters/mcp/server.js";

export function InstallTabs({ bundle, coaches, repo }: { bundle: string[]; coaches: string[]; repo: string }) {
  return (
    <>
      <TabView scrollable>
        <TabPanel header="Everything">
          <p className="prose">
            The bundle installs the engine, every coach, and the three cross-coach commands. This is the one to pick.
          </p>
          <InstallBlock lines={bundle} />
        </TabPanel>
        <TabPanel header="One coach">
          <p className="prose">
            Each coach installs alone and pulls the engine (<code>ai-coach-core</code>) with it. Add the marketplace
            first, then any of these.
          </p>
          <InstallBlock
            lines={[bundle[0], ...coaches.map((c) => `claude plugin install ${c}@ai-coach`)]}
            label="pick the lines you want"
          />
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
            Then point your harness at the MCP server, for example Codex CLI:
          </p>
          <InstallBlock lines={[`codex mcp add ai-coach -- ${MCP}`]} label="codex" />
          <p className="prose" style={{ marginTop: 20 }}>
            Per-harness snippets (Cursor, opencode, Windsurf, Antigravity) and what ports versus what stays Claude
            Code&apos;s are in the <a href={`${repo}/blob/main/adapters/README.md`}>adapters guide</a>.
          </p>
        </TabPanel>
      </TabView>

      <h2 className="h2" style={{ marginTop: 56, marginBottom: 20 }}>
        Good to know
      </h2>
      <Accordion multiple>
        <AccordionTab header="Where does my data live?">
          <p className="prose">
            In <code>~/.ai-coach/</code> (<code>%USERPROFILE%\.ai-coach</code> on Windows), whichever harness opened the
            session. There is no AI Coach server and no account. Session-end distillation makes one call through{" "}
            <code>claude</code> on your PATH when it is there, and quietly skips when it is not.
          </p>
        </AccordionTab>
        <AccordionTab header="Is the secrets guard on?">
          <p className="prose">
            Not by default. It is the only hook that can stop a tool call, so it ships off. Turn it on with{" "}
            <code>AICOACH_GUARD=on</code> or the setting in <code>/plugin</code>.
          </p>
        </AccordionTab>
        <AccordionTab header="How do I uninstall?">
          <p className="prose">
            Run <code>claude plugin uninstall ai-coach</code>. Your memory outlives the plugin by design, so reinstalling
            picks up where you left off. Delete <code>~/.ai-coach/</code> to remove it too.
          </p>
        </AccordionTab>
      </Accordion>
    </>
  );
}
