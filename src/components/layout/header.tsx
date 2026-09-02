import Link from "next/link";
import { MobileNav } from "./MobileNav";
import { NavDropdown } from "./NavDropdown";
import { ANALYSIS_LINKS, NAV_LINKS, RELATED_INFO_LINKS } from "./nav-links";
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
              <NavDropdown label="エリア分析" links={ANALYSIS_LINKS} />
            </li>
            <li>
              <NavDropdown label="関連情報" links={RELATED_INFO_LINKS} />
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
