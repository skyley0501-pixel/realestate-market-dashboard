import Link from "next/link";
import { AnalysisNavDropdown } from "./AnalysisNavDropdown";

const NAV_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/transactions", label: "取引検索" },
] as const;

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:h-14 sm:py-0">
        <Link href="/" className="whitespace-nowrap font-semibold">
          REMDA
        </Link>
        <nav aria-label="メインナビゲーション">
          <ul className="flex items-center gap-4 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <AnalysisNavDropdown />
            </li>
            <li>
              <Link href="/about" className="hover:underline">
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
