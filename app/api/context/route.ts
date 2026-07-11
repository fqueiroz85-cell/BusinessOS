import { NextResponse } from "next/server";
import { getCategoryItems } from "@/lib/content";
import type { ContentItem } from "@/lib/content";

export type BusinessContext = {
  generatedAt: string;
  categories: {
    founder: ContentItem[];
    direcao: ContentItem[];
    validacao: ContentItem[];
    caixa: ContentItem[];
  };
};

/**
 * GET /api/context
 *
 * Retorna todo o conteúdo estruturado do negócio (as 4 categorias e seus
 * itens, frontmatter + corpo em Markdown) como um único JSON.
 *
 * Este endpoint é o ponto de entrada de leitura para agentes de IA e
 * skills externas: em vez de cada agente ler arquivos .md diretamente do
 * disco, ele consulta esta rota para obter um snapshot completo e
 * atualizado do contexto de negócio. Ver docs/agents-integration.md para
 * o modelo de agentes/skills e o roadmap de fases desta integração.
 *
 * Somente leitura — nenhuma mutação acontece aqui.
 */
export async function GET() {
  const categories = {
    founder: getCategoryItems("founder"),
    direcao: getCategoryItems("direcao"),
    validacao: getCategoryItems("validacao"),
    caixa: getCategoryItems("caixa"),
  };

  const body: BusinessContext = {
    generatedAt: new Date().toISOString(),
    categories,
  };

  return NextResponse.json(body);
}
