import Link from "next/link";
import { AnalysisNavDropdown } from "./AnalysisNavDropdown";
import { MobileNav } from "./MobileNav";
import { NAV_LINKS } from "./nav-links";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 md:h-14 md:py-0">
        <Link href="/" className="whitespace-nowrap text-2xl font-bold tracking-tight">
          REMDA
        </Link>
        <nav aria-label="メインナビゲーション" className="hidden md:block">
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
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
