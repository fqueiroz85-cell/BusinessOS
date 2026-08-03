import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/status";
import type { ContentItem } from "@/lib/content";

type ItemCardProps = {
  item: ContentItem;
  variant?: "grid" | "list";
};

export function ItemCard({ item, variant = "grid" }: ItemCardProps) {
  const href = `/${item.category}/${item.slug}`;
  const statusBadgeVariant = item.status === "done" ? "default" : "secondary";

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "h-full transition-colors hover:bg-muted/60",
          variant === "list" && "flex-row items-center gap-5"
        )}
      >
        <CardHeader
          className={cn(
            variant === "list" && "flex-1 grid-cols-[1fr_auto] gap-2"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <CardTitle>{item.title}</CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              {item.reviewStatus === "proposed" ? (
                <Badge variant="outline">Proposta pendente</Badge>
              ) : null}
              <Badge variant={statusBadgeVariant}>
                {STATUS_LABELS[item.status]}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent
          className={cn(
            "flex flex-col gap-2.5",
            variant === "list" && "flex-1 py-0"
          )}
        >
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.summary}
          </p>
          <p className="text-xs text-muted-foreground">
            Atualizado em {item.updatedAt}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
