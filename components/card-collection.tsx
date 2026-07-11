"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/item-card";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";
import type { ContentItem } from "@/lib/content";
import { cn } from "@/lib/utils";

type CardCollectionProps = {
  items: ContentItem[];
  category: string;
};

const STORAGE_KEY_PREFIX = "businessos:view:";

export function CardCollection({ items, category }: CardCollectionProps) {
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    const stored = window.localStorage.getItem(
      `${STORAGE_KEY_PREFIX}${category}`
    );
    if (stored === "grid" || stored === "list") {
      setView(stored);
    }
  }, [category]);

  function handleChange(next: ViewMode) {
    setView(next);
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${category}`, next);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <ViewToggle value={view} onChange={handleChange} />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum item encontrado nesta seção.
        </p>
      ) : (
        <div
          className={cn(
            view === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          )}
        >
          {items.map((item) => (
            <ItemCard key={item.slug} item={item} variant={view} />
          ))}
        </div>
      )}
    </div>
  );
}
