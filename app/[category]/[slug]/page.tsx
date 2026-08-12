import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ItemEditor } from "@/components/item-editor";
import { ProposalBanner } from "@/components/proposal-banner";
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
    <div className="flex flex-col gap-6">
      <Link
        href={`/${category}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {meta?.label ?? category}
      </Link>
      {item.reviewStatus === "proposed" ? (
        <ProposalBanner
          category={item.category}
          slug={item.slug}
          proposedBy={item.proposedBy ?? ""}
          proposedAt={item.proposedAt ?? ""}
          proposedRationale={item.proposedRationale ?? ""}
          proposedSummary={item.proposedSummary}
          proposedBody={item.proposedBody}
          currentSummary={item.summary}
          currentBody={item.body}
        />
      ) : null}
      <ItemEditor item={item} />
    </div>
  );
}
