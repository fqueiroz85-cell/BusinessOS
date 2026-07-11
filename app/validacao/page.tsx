import { PageHeader } from "@/components/page-header";
import { CardCollection } from "@/components/card-collection";
import { getCategoryItems } from "@/lib/content";
import { getCategoryMeta } from "@/lib/categories";

export default function ValidacaoPage() {
  const meta = getCategoryMeta("validacao");
  const items = getCategoryItems("validacao");

  return (
    <div>
      <PageHeader title={meta?.label ?? "Validação"} subtitle={meta?.description} />
      <CardCollection items={items} category="validacao" />
    </div>
  );
}
