import { NextResponse } from "next/server";
import { getCategoryItems } from "@/lib/content";
import { getQuestions } from "@/lib/questions";
import type { ContentItem } from "@/lib/content";
import type { Question } from "@/lib/questions";

/**
 * Item do contexto acrescido do questionário que o originou.
 *
 * Sem as perguntas, um agente vê `answers` como um dicionário de chaves soltas
 * (`porque-agora: "..."`) e não tem como saber **quantas** perguntas o item tem
 * — o que impedia distinguir "respondeu tudo" de "respondeu uma de cinco".
 */
export type ContextItem = ContentItem & { questions: Question[] };

export type BusinessContext = {
  generatedAt: string;
  categories: {
    founder: ContextItem[];
    direcao: ContextItem[];
    validacao: ContextItem[];
    caixa: ContextItem[];
  };
};

function comQuestionario(category: string): ContextItem[] {
  return getCategoryItems(category).map((item) => ({
    ...item,
    questions: getQuestions(item.category, item.slug),
  }));
}

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
    founder: comQuestionario("founder"),
    direcao: comQuestionario("direcao"),
    validacao: comQuestionario("validacao"),
    caixa: comQuestionario("caixa"),
  };

  const body: BusinessContext = {
    generatedAt: new Date().toISOString(),
    categories,
  };

  return NextResponse.json(body);
}
