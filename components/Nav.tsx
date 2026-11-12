"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "ホーム" },
  { href: "/time", label: "勉強時間" },
  { href: "/qassist", label: "Q-Assist" },
  { href: "/qb", label: "QB" },
  { href: "/anki", label: "Anki" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-background pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((t) => (
          <li key={t.href} className="flex-1">
            <Link
              href={t.href}
              className={`block py-3 text-center text-sm ${path === t.href ? "font-semibold text-accent" : "text-muted"}`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
