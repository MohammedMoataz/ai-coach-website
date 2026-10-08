import Link from "next/link";
import { getCatalog } from "@/lib/coaches";
import { SITE_URL, pageMeta, title } from "@/lib/site";
import { INSTALL, REPO_URL, automatic, evidence, harnesses, hero, pitch, problem } from "@/content/copy";
import { InstallBlock } from "@/components/InstallBlock";
import { Reveal } from "@/components/Reveal";
import { TeamGraph } from "@/components/TeamGraph";
import { JsonLd } from "@/components/JsonLd";

export const metadata = pageMeta({
  description:
    "AI Coach is a free, open-source coaching harness for Claude Code: team memory that survives the session, prompt coaching, injection defense, onboarding docs and verified research. Install with two commands.",
  path: "/",
});

function Head({ eyebrow, h, lede }: { eyebrow: string; h: string; lede?: string }) {
  return (
    <Reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="h2">{h}</h2>
      {lede && <p className="lead">{lede}</p>}
    </Reveal>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function Home() {
  const c = await getCatalog();
  const [before, after] = hero.title.split("normal");

  return (
    <>
      <JsonLd
        data={{
          "@graph": [
            { "@type": "WebSite", name: "AI Coach", url: SITE_URL },
            {
              "@type": "SoftwareApplication",
              name: "AI Coach",
              description: hero.lede,
              url: SITE_URL,
              applicationCategory: "DeveloperApplication",
              applicationSubCategory: "Claude Code plugin",
              operatingSystem: "Windows, macOS, Linux",
              softwareVersion: c.version,
              softwareRequirements: "Claude Code; Node.js 22.16+ or 24+",
              license: "https://opensource.org/licenses/MIT",
              isAccessibleForFree: true,
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              installUrl: `${SITE_URL}/install`,
              sameAs: [REPO_URL],
              author: { "@type": "Person", name: "Mohammed Moataz", url: "https://github.com/MohammedMoataz" },
              featureList: c.coaches.map((p) => `${title(p.slug)}: ${pitch[p.slug] ?? p.description}`),
            },
          ],
        }}
      />
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1>
              {before}
              <em>normal</em>
              {after}
            </h1>
            <p className="lead">{hero.lede}</p>
            <InstallBlock lines={INSTALL} />
            <p className="hero-fine">{hero.fine}</p>
          </div>
          <TeamGraph />
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <Head eyebrow={problem.eyebrow} h={problem.title} />
          <div className="grid">
            {problem.beats.map((b) => (
              <Reveal key={b.title}>
                <div className="card">
                  <span className="card-icon">
                    <i className={`pi ${b.icon}`} aria-hidden />
                  </span>
                  <h3>{b.title}</h3>
                  <p>{b.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="engine">
        <div className="wrap">
          <Head eyebrow={automatic.eyebrow} h={automatic.title} lede={automatic.lede} />
          <div className="grid">
            {automatic.items.map((it) => (
              <Reveal key={it.title}>
                <div className="card">
                  <span className="card-icon">
                    <i className={`pi ${it.icon}`} aria-hidden />
                  </span>
                  <h3>{it.title}</h3>
                  <p>{it.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p style={{ marginTop: 28 }}>
              <Link href="/engine">
                Inside the engine <i className="pi pi-arrow-right" aria-hidden style={{ fontSize: 12 }} />
              </Link>
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section section-alt" id="coaches">
        <div className="wrap">
          <Head
            eyebrow="The coaches"
            h={`${c.counts.coaches} coaches, one install.`}
            lede={`${c.counts.skills} skills you call and ${plural(c.counts.agents, "agent")} they spawn, each coach with one focus. The bundle installs every one of them with the engine.`}
          />
          <div className="grid">
            {c.coaches.map((p) => (
              <Reveal key={p.slug}>
                <Link href={`/coaches/${p.slug}`} className="card coach-card">
                  <h3>
                    {title(p.slug)}
                    <i className="pi pi-arrow-right muted" aria-hidden style={{ fontSize: 13 }} />
                  </h3>
                  <p>{pitch[p.slug] ?? p.description}</p>
                  <div className="chips">
                    {p.skills.map((s) => (
                      <span key={s.name} className="chip">
                        /{s.name}
                      </span>
                    ))}
                  </div>
                  <span className="meta">
                    {plural(p.skills.length, "skill")}
                    {p.agents.length > 0 && ` · ${plural(p.agents.length, "agent")}`}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <Head eyebrow={evidence.eyebrow} h={evidence.title} lede={evidence.lede} />
          <div className="evidence">
            <Reveal>
              <ul className="ticks">
                {evidence.points.map((p) => (
                  <li key={p}>
                    <i className="pi pi-check-circle" aria-hidden />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal>
              <div className="card">
                <div className="stat">{evidence.cost.value}</div>
                <p style={{ color: "var(--text)", fontWeight: 500 }}>{evidence.cost.label}</p>
                <p className="muted" style={{ fontSize: 14 }}>
                  {evidence.cost.note}
                </p>
                <div className="stats">
                  {(
                    [
                      [c.counts.skills, "skills"],
                      [c.counts.modelInvocable, "model-invocable"],
                      [c.counts.agents, "agents"],
                      [c.counts.commands, "commands"],
                    ] as const
                  ).map(([n, l]) => (
                    <div key={l} className="card">
                      <strong>{n}</strong>
                      <span>{l}</span>
                    </div>
                  ))}
                </div>
                <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                  Counted from the repo at build time, not typed in.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="wrap">
          <Head eyebrow={harnesses.eyebrow} h={harnesses.title} lede={harnesses.lede} />
          <div className="grid">
            {harnesses.items.map((h, i) => (
              <Reveal key={h.name}>
                <div className={`card harness${i === 0 ? " native" : ""}`}>
                  <h3>{h.name}</h3>
                  <p>{h.how}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="caveat">
              <i className="pi pi-info-circle" aria-hidden style={{ color: "var(--warn)", marginRight: 8 }} />
              {harnesses.caveat}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" id="commands">
        <div className="wrap">
          <Head
            eyebrow="Commands"
            h="The sequences that span the coaches, typed once."
            lede={
              c.commands.every((cmd) => !cmd.modelInvocable)
                ? "User-only: they cost nothing until you type them."
                : "They ship in the bundle, because only the bundle knows every coach exists."
            }
          />
          <div className="grid">
            {c.commands.map((cmd) => (
              <Reveal key={cmd.name}>
                <div className="card">
                  <code className="invoke">{cmd.invocation}</code>
                  <p>{cmd.description}</p>
                  {cmd.argumentHint && <code className="hint">{cmd.argumentHint}</code>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt cta">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow">Get started</p>
            <h2 className="h2">Two commands. Then your next session starts warm.</h2>
            <InstallBlock lines={INSTALL} />
            <p className="lead">
              Want only part of it? <Link href="/install">Install a single coach</Link>, or read the source on{" "}
              <a href={REPO_URL}>GitHub</a>.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
