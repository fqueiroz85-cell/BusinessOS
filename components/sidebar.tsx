"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Visão Geral" },
  { href: "/founder", label: "Founder" },
  { href: "/direcao", label: "Direção" },
  { href: "/validacao", label: "Validação" },
  { href: "/caixa", label: "Caixa" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-4 flex h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-3xl bg-sidebar px-4 py-6">
      <div className="flex items-center gap-2 px-3 pb-8">
        <span className="size-2.5 shrink-0 rounded-full bg-primary" />
        <span className="font-heading text-lg font-bold tracking-tight text-sidebar-foreground">
          BusinessOS
        </span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
