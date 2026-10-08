"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import type { MenuItem } from "primereact/menuitem";
import { REPO_URL } from "@/content/copy";
import { title } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

export function Nav({ coaches }: { coaches: string[] }) {
  const menu = useRef<Menu>(null);
  const router = useRouter();
  // Real hrefs for crawlers and new-tab clicks; only a plain primary click becomes a client-side
  // navigation, so Ctrl/Cmd/Shift-click and middle-click keep the browser's behaviour.
  const link = (label: string, url: string, icon?: string): MenuItem => ({
    label,
    url,
    icon,
    command: ({ originalEvent: e }) => {
      const m = e as React.MouseEvent;
      if (m.button > 0 || m.ctrlKey || m.metaKey || m.shiftKey || m.altKey) return;
      e.preventDefault();
      router.push(url);
    },
  });
  const items: MenuItem[] = [
    link("The engine", "/engine", "pi pi-bolt"),
    { separator: true },
    ...coaches.map((slug) => link(title(slug), `/coaches/${slug}`)),
  ];

  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Link href="/" className="brand" aria-label="AI Coach home">
          <Image src="/logo.png" alt="" width={28} height={28} priority />
          <span className="brand-text">AI Coach</span>
        </Link>
        <Menu model={items} popup ref={menu} id="coach-menu" />
        <Button
          text
          size="small"
          label="Coaches"
          icon="pi pi-chevron-down"
          iconPos="right"
          aria-controls="coach-menu"
          aria-haspopup
          onClick={(e) => menu.current?.toggle(e)}
        />
        <Link href="/install" className="nav-link nav-hide-sm">
          Install
        </Link>
        <a href={REPO_URL} className="nav-link" aria-label="AI Coach on GitHub">
          <i className="pi pi-github" aria-hidden /> <span className="nav-hide-sm">GitHub</span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
