import { notFound } from "next/navigation";
import { ItemEditor } from "@/components/item-editor";
import { getItem } from "@/lib/content";
import { getCategoryMeta } from "@/lib/categories";

type PageProps = {
  params: Promise<{ category: string; slug: string }>;
};

export default async function ItemDetailPage({ params }: PageProps) {
  const { category, slug } = await params;
  const item = getItem(category, slug);

  if (!item) {
    notFound();
  }

  const meta = getCategoryMeta(category);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-muted-foreground">
          {meta?.label ?? category}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {item.title}
        </h1>
      </div>
      <ItemEditor item={item} />
    </div>
  );
}
