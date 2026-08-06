import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "ホーム" },
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/transactions", label: "取引検索" },
  { href: "/areas", label: "エリアランキング" },
  { href: "/trends", label: "トレンド分析" },
  { href: "/areas/compare", label: "エリア比較" },
  { href: "/map", label: "マーケットマップ" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <Link href="/" className="whitespace-nowrap font-semibold">
          <span className="hidden sm:inline">
            首都圏不動産マーケットダッシュボード
          </span>
          <span className="sm:hidden">不動産ダッシュボード</span>
        </Link>
        <nav aria-label="メインナビゲーション">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm sm:flex-nowrap">
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
