import Link from "next/link";
import { REPO_URL } from "@/content/copy";

export function Footer({ version, commit }: { version: string; commit: string }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <span>
          AI Coach v{version} · MIT · built from{" "}
          <a href={`${REPO_URL}/commit/${commit}`}>
            <code>{commit.slice(0, 7)}</code>
          </a>
        </span>
        <span>
          <Link href="/install">Install</Link> · <a href={REPO_URL}>GitHub</a> ·{" "}
          <a href={`${REPO_URL}/blob/main/CHANGELOG.md`}>Changelog</a>
        </span>
      </div>
    </footer>
  );
}
