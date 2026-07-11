import { PageHeader } from "@/components/page-header";
import { CardCollection } from "@/components/card-collection";
import { getCategoryItems } from "@/lib/content";
import { getCategoryMeta } from "@/lib/categories";

export default function CaixaPage() {
  const meta = getCategoryMeta("caixa");
  const items = getCategoryItems("caixa");

  return (
    <div>
      <PageHeader title={meta?.label ?? "Caixa"} subtitle={meta?.description} />
      <CardCollection items={items} category="caixa" />
    </div>
  );
}
