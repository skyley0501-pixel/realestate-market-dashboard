"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

export interface NavDropdownProps {
  label: string;
  links: readonly { href: string; label: string }[];
}

export function NavDropdown({ label, links }: NavDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 outline-none hover:underline aria-expanded:underline">
        {label}
        <ChevronDown className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-max min-w-40">
        {links.map((link) => (
          <DropdownMenuLinkItem key={link.href} closeOnClick render={<Link href={link.href} />}>
            {link.label}
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
