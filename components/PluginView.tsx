import Link from "next/link";
import type { Plugin } from "@/lib/coaches";
import { title } from "@/lib/site";
import { pitch } from "@/content/copy";
import { InstallBlock } from "./InstallBlock";
import { SkillTabs } from "./SkillTabs";

type Neighbour = { href: string; label: string } | null;

export function PluginView({
  plugin,
  eyebrow,
  prev,
  next,
  children,
}: {
  plugin: Plugin;
  eyebrow: string;
  prev: Neighbour;
  next: Neighbour;
  children?: React.ReactNode;
}) {
  return (
    <>
      <header className="page-head">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> <span className="muted">/</span> <Link href="/#coaches">Coaches</Link>{" "}
            <span className="muted">/</span> <span className="muted">{plugin.slug}</span>
          </nav>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title(plugin.slug)}</h1>
          <p className="lead">{pitch[plugin.slug] ?? plugin.description}</p>
          <div className="chips">
            {plugin.tags.map((t) => (
              <span key={t} className="chip">
                #{t}
              </span>
            ))}
          </div>
          <InstallBlock lines={[`claude plugin install ${plugin.slug}@ai-coach`]} label="install this one alone" />
        </div>
      </header>

      {children}

      {(plugin.skills.length > 0 || plugin.agents.length > 0) && (
        <section className="section-sm">
          <div className="wrap">
            <SkillTabs skills={plugin.skills} agents={plugin.agents} />
          </div>
        </section>
      )}

      <nav className="wrap pager" aria-label="More coaches">
        {prev ? (
          <Link href={prev.href}>
            <i className="pi pi-arrow-left" aria-hidden style={{ fontSize: 12 }} /> {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={next.href}>
            {next.label} <i className="pi pi-arrow-right" aria-hidden style={{ fontSize: 12 }} />
          </Link>
        )}
      </nav>
    </>
  );
}
