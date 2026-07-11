export type CategoryKey = "founder" | "direcao" | "validacao" | "caixa";

export type CategoryMeta = {
  key: CategoryKey;
  label: string;
  description: string;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    key: "founder",
    label: "Founder",
    description: "Objetivo e estilo de vida por trás do negócio.",
  },
  {
    key: "direcao",
    label: "Direção",
    description: "Mercado, problema, cliente ideal, tese de valor e oferta.",
  },
  {
    key: "validacao",
    label: "Validação",
    description: "Como a oferta e os primeiros clientes estão validando o negócio.",
  },
  {
    key: "caixa",
    label: "Caixa",
    description: "Fluxo de caixa e os sistemas que sustentam a operação.",
  },
];

export function getCategoryMeta(key: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.key === key);
}
