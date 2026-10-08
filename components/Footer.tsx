import Link from "next/link";
import { REPO_URL } from "@/content/copy";
import { title } from "@/lib/site";

// Plain links to every page on every page: the header's coach menu only exists after a click,
// so this is what lets a crawler (or a no-JS reader) reach each coach from anywhere.
export function Footer({ version, commit, coaches }: { version: string; commit: string; coaches: string[] }) {
  return (
    <footer className="footer">
      <nav className="wrap footer-links" aria-label="All pages">
        <Link href="/">Home</Link>
        <Link href="/install">Install</Link>
        <Link href="/engine">The engine</Link>
        {coaches.map((slug) => (
          <Link key={slug} href={`/coaches/${slug}`}>
            {title(slug)}
          </Link>
        ))}
      </nav>
      <div className="wrap">
        <span>
          AI Coach v{version} · MIT · built from{" "}
          <a href={`${REPO_URL}/commit/${commit}`}>
            <code>{commit.slice(0, 7)}</code>
          </a>
        </span>
        <span>
          <a href={REPO_URL}>GitHub</a> · <a href={`${REPO_URL}/blob/main/CHANGELOG.md`}>Changelog</a> ·{" "}
          <a href="/llms.txt">llms.txt</a>
        </span>
      </div>
    </footer>
  );
}
