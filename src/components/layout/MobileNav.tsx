"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";
import Link from "next/link";
import { ANALYSIS_LINKS, NAV_LINKS } from "./nav-links";

// md未満（モバイル・タブレット幅）でのみ表示するハンバーガーメニュー。md以上ではHeader側の横並びnavが表示される。
export function MobileNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="メニューを開く"
        className="flex size-8 items-center justify-center rounded-full text-foreground hover:bg-accent md:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {NAV_LINKS.map((link) => (
          <DropdownMenuLinkItem key={link.href} closeOnClick render={<Link href={link.href} />}>
            {link.label}
          </DropdownMenuLinkItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>エリア分析</DropdownMenuLabel>
          {ANALYSIS_LINKS.map((link) => (
            <DropdownMenuLinkItem key={link.href} closeOnClick render={<Link href={link.href} />}>
              {link.label}
            </DropdownMenuLinkItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLinkItem closeOnClick render={<Link href="/about" />}>
          About
        </DropdownMenuLinkItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
