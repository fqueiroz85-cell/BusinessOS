import { PageHeader } from "@/components/page-header";
import { CardCollection } from "@/components/card-collection";
import { getCategoryItems } from "@/lib/content";
import { getCategoryMeta } from "@/lib/categories";

export default function FounderPage() {
  const meta = getCategoryMeta("founder");
  const items = getCategoryItems("founder");

  return (
    <div>
      <PageHeader title={meta?.label ?? "Founder"} subtitle={meta?.description} />
      <CardCollection items={items} category="founder" />
    </div>
  );
}
