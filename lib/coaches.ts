// Build-time catalog of AI Coach, read from the ai-coach repo on GitHub.
// Everything the site counts or lists comes from here, so it cannot drift from the repo.
// Any missing or malformed file throws: a failed build keeps the last good deploy live.

const REPO = "MohammedMoataz/ai-coach";
const REF = "main";
const BUNDLE = "ai-coach";
const ENGINE = "ai-coach-core";

export type Skill = {
  name: string;
  invocation: string;
  description: string;
  argumentHint?: string;
  modelInvocable: boolean;
  model?: string;
};
export type Agent = { name: string; invocation: string; description: string; tools: string[] };
export type Plugin = {
  slug: string;
  description: string;
  tags: string[];
  skills: Skill[];
  agents: Agent[];
};
export type Catalog = {
  version: string;
  commit: string;
  engine: Plugin;
  coaches: Plugin[];
  commands: Skill[];
  counts: { coaches: number; skills: number; modelInvocable: number; agents: number; commands: number };
};

type Marketplace = {
  version: string;
  plugins: { name: string; source?: string; description: string; tags?: string[] }[];
};

// Claude Code frontmatter is one `key: value` per line, not strict YAML: an unquoted ": " inside
// a description is legal there and a YAML error everywhere else. Parse the dialect the repo uses.
export function frontmatter(path: string, text: string): Record<string, string | boolean> {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) throw new Error(`${path}: no frontmatter`);
  const data: Record<string, string | boolean> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^".*"$/.test(v)) {
      try {
        v = JSON.parse(v); // unescapes \" inside a double-quoted value
      } catch {
        v = v.slice(1, -1);
      }
    } else if (/^'.*'$/.test(v)) v = v.slice(1, -1);
    data[kv[1]] = v === "true" ? true : v === "false" ? false : v;
  }
  if (typeof data.description !== "string" || !data.description) throw new Error(`${path}: missing description`);
  return data;
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

function toSkill(plugin: string, name: string, path: string, text: string): Skill {
  const fm = frontmatter(path, text);
  return {
    name,
    invocation: `/${plugin}:${name}`,
    description: str(fm.description)!,
    argumentHint: str(fm["argument-hint"]),
    modelInvocable: fm["disable-model-invocation"] !== true,
    model: str(fm.model),
  };
}

// Pure: turns the repo's file list + contents into the catalog. `files` maps repo path to text.
export function buildCatalog(commit: string, paths: string[], files: Record<string, string>): Catalog {
  const market = JSON.parse(files[".claude-plugin/marketplace.json"] ?? "null") as Marketplace | null;
  if (!market?.version || !Array.isArray(market.plugins)) throw new Error("marketplace.json: bad shape");

  const skillDirs = new Set<string>();
  for (const p of paths) {
    const m = /^plugins\/([^/]+)\/skills\/([^/]+)\//.exec(p);
    if (m) skillDirs.add(`${m[1]}/${m[2]}`);
  }
  for (const d of skillDirs) {
    const [plugin, skill] = d.split("/");
    if (!files[`plugins/${plugin}/skills/${skill}/SKILL.md`]) throw new Error(`plugins/${plugin}/skills/${skill}: no SKILL.md`);
  }

  // Group every fetched file by the plugin directory it lives in.
  const byDir = new Map<string, { skills: string[]; agents: string[]; commands: string[] }>();
  for (const path of Object.keys(files).sort()) {
    const m = /^plugins\/([^/]+)\/(skills\/[^/]+\/SKILL|agents\/[^/]+|commands\/[^/]+)\.md$/.exec(path);
    if (!m) continue;
    const entry = byDir.get(m[1]) ?? { skills: [], agents: [], commands: [] };
    entry[m[2].split("/")[0] as "skills" | "agents" | "commands"].push(path);
    byDir.set(m[1], entry);
  }
  // plugins/<dir>/skills/<name>/SKILL.md, plugins/<dir>/agents/<name>.md, plugins/<dir>/commands/<name>.md
  const nameOf = (path: string) => path.split("/")[3].replace(/\.md$/, "");

  const plugins = market.plugins.map((p) => {
    if (!str(p.description)) throw new Error(`marketplace.json: ${p.name} has no description`);
    // A plugin's directory is its marketplace `source`, which need not match its name. Only the
    // in-repo `./plugins/<dir>` form is supported; anything else would silently read as empty.
    const dir = /^\.\/plugins\/([^/]+)\/?$/.exec(p.source ?? "")?.[1];
    if (!dir) throw new Error(`marketplace.json: unsupported source for ${p.name}: ${p.source}`);
    const found = byDir.get(dir) ?? { skills: [], agents: [], commands: [] };
    const skills = found.skills.map((path) => toSkill(p.name, nameOf(path), path, files[path]));
    const agents: Agent[] = found.agents.map((path) => {
      const fm = frontmatter(path, files[path]);
      const name = str(fm.name) ?? nameOf(path);
      return {
        name,
        invocation: `${p.name}:${name}`,
        description: str(fm.description)!,
        tools: (str(fm.tools) ?? "").split(",").map((t) => t.trim()).filter(Boolean),
      };
    });
    const commands = found.commands.map((path) => toSkill(p.name, nameOf(path), path, files[path]));
    const plugin: Plugin = { slug: p.name, description: p.description.trim(), tags: p.tags ?? [], skills, agents };
    return { plugin, commands };
  });

  const engine = plugins.find((p) => p.plugin.slug === ENGINE)?.plugin;
  if (!engine) throw new Error(`marketplace.json: no ${ENGINE}`);
  const coaches = plugins.map((p) => p.plugin).filter((p) => p.slug !== ENGINE && p.slug !== BUNDLE);
  const commands = plugins.find((p) => p.plugin.slug === BUNDLE)?.commands ?? [];

  const all = plugins.map((p) => p.plugin);
  const skills = all.flatMap((p) => p.skills);
  return {
    version: market.version,
    commit,
    engine,
    coaches,
    commands,
    counts: {
      coaches: coaches.length,
      skills: skills.length,
      modelInvocable: skills.filter((s) => s.modelInvocable).length,
      agents: all.reduce((n, p) => n + p.agents.length, 0),
      commands: commands.length,
    },
  };
}

const WANTED = /^(\.claude-plugin\/marketplace\.json|plugins\/[^/]+\/(skills\/[^/]+\/SKILL|agents\/[^/]+|commands\/[^/]+)\.(md|json))$/;

async function get(url: string, api: boolean): Promise<Response> {
  const headers: Record<string, string> = {};
  if (api) headers.Accept = "application/vnd.github+json";
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers, cache: "force-cache" });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res;
}

async function load(): Promise<Catalog> {
  const commit = (await (await get(`https://api.github.com/repos/${REPO}/commits/${REF}`, true)).json()).sha as string;
  const tree = await (await get(`https://api.github.com/repos/${REPO}/git/trees/${commit}?recursive=1`, true)).json();
  if (tree.truncated) throw new Error("git tree truncated");
  const paths = (tree.tree as { path: string; type: string }[]).filter((e) => e.type === "blob").map((e) => e.path);
  const wanted = paths.filter((p) => WANTED.test(p));
  const texts = await Promise.all(
    wanted.map(async (p) => (await get(`https://raw.githubusercontent.com/${REPO}/${commit}/${p}`, false)).text()),
  );
  return buildCatalog(commit, paths, Object.fromEntries(wanted.map((p, i) => [p, texts[i]])));
}

let pending: Promise<Catalog> | undefined;
export const getCatalog = () => (pending ??= load());

export const findPlugin = (c: Catalog, slug: string) =>
  slug === c.engine.slug ? c.engine : c.coaches.find((p) => p.slug === slug);
