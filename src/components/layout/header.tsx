import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/transactions", label: "取引検索" },
  { href: "/areas", label: "エリアランキング" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="whitespace-nowrap font-semibold">
          <span className="hidden sm:inline">
            首都圏不動産マーケットダッシュボード
          </span>
          <span className="sm:hidden">不動産ダッシュボード</span>
        </Link>
        <nav aria-label="メインナビゲーション">
          <ul className="flex gap-4 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
