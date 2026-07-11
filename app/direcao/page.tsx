import { PageHeader } from "@/components/page-header";
import { CardCollection } from "@/components/card-collection";
import { getCategoryItems } from "@/lib/content";
import { getCategoryMeta } from "@/lib/categories";

export default function DirecaoPage() {
  const meta = getCategoryMeta("direcao");
  const items = getCategoryItems("direcao");

  return (
    <div>
      <PageHeader title={meta?.label ?? "Direção"} subtitle={meta?.description} />
      <CardCollection items={items} category="direcao" />
    </div>
  );
}
