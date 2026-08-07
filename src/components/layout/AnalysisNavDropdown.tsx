"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const ANALYSIS_LINKS = [
  { href: "/areas", label: "エリアランキング" },
  { href: "/trends", label: "トレンド分析" },
  { href: "/areas/compare", label: "エリア比較" },
  { href: "/map", label: "マーケットマップ" },
] as const;

export function AnalysisNavDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 outline-none hover:underline aria-expanded:underline">
        エリア分析
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {ANALYSIS_LINKS.map((link) => (
          <DropdownMenuLinkItem key={link.href} closeOnClick render={<Link href={link.href} />}>
            {link.label}
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
