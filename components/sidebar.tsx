"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, FlaskConical, User, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/founder", label: "Founder", icon: User },
  { href: "/direcao", label: "Direção", icon: Compass },
  { href: "/validacao", label: "Validação", icon: FlaskConical },
  { href: "/caixa", label: "Caixa", icon: Wallet },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-61 flex-col bg-sidebar">
      <Link href="/" className="flex items-center gap-2.5 px-5 pt-6 pb-8">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground">
          B
        </span>
        <span className="font-heading text-lg font-bold tracking-tight text-sidebar-foreground">
          BusinessOS
        </span>
      </Link>

      <p className="px-5 pb-3 text-[0.6875rem] font-medium tracking-widest text-sidebar-foreground/45 uppercase">
        Seções
      </p>

      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-sidebar-border px-5 py-5">
        <p className="font-heading text-sm font-bold text-sidebar-foreground">
          BusinessOS
        </p>
        <p className="text-xs text-sidebar-foreground/45">
          v1.0.0 · conteúdo local
        </p>
      </div>
    </aside>
  );
}
