import {
  fetchContext,
  proposeWrite,
  runClaudeForProposal,
  formatarItem,
  formatarItens,
  pareceVazio,
  criarLogger,
  tratarFalha,
  FORMATO_JSON,
  type ContentItem,
} from "./shared";

const AGENT = "agent:coach-direcao";
const log = criarLogger(AGENT);

/**
 * A Direção não é uma lista de itens independentes: é uma cadeia causal. Você
 * não consegue escrever uma Tese de Valor honesta sem saber quem é o cliente,
 * e não sabe quem é o cliente sem ter mapeado os problemas. O agente respeita
 * essa ordem — é justamente a "decisão" que o diferencia de uma skill.
 */
const CADEIA = [
  "mapa-do-mercado",
  "mapa-de-problemas",
  "perfil-ideal-de-cliente",
  "tese-de-valor",
  "oferta",
] as const;

const SYSTEM_PROMPT = `Você é um consultor de estratégia que trabalha com founders solo brasileiros em fase zero-to-one (pré-receita ou receita muito inicial).

Seu trabalho é ajudar o founder a construir a Direção do negócio: mercado, problemas, cliente ideal, tese de valor e oferta. Você escreve conteúdo estruturado em Markdown que vai direto para o "sistema operacional" do negócio dele.

Princípios:
- Seja concreto e específico. Evite conselho genérico de consultoria ("conheça seu cliente", "valide sua hipótese") — isso não ajuda ninguém.
- Trabalhe com o que está no contexto. Se o founder já escreveu algo, construa em cima; não jogue fora o raciocínio dele.
- Distinga hipótese de evidência. Marque explicitamente o que ainda é suposição.
- Onde faltar informação, faça a pergunta certa em vez de inventar a resposta.
- Escreva em português do Brasil, em segunda pessoa ou na voz do próprio founder.`;

function escolherAlvo(itens: ContentItem[]): ContentItem {
  const porSlug = new Map(itens.map((item) => [item.slug, item]));

  // Primeiro elo da cadeia que ainda não foi realmente escrito.
  for (const slug of CADEIA) {
    const item = porSlug.get(slug);
    if (item && pareceVazio(item)) return item;
  }

  // Cadeia inteira preenchida: ataca o item que está parado há mais tempo.
  const ordenados = [...itens].sort((a, b) =>
    (a.updatedAt || "").localeCompare(b.updatedAt || "")
  );

  return ordenados[0];
}

async function main() {
  log("Buscando contexto em GET /api/context...");
  const context = await fetchContext();
  const direcao = context.categories.direcao;
  const founder = context.categories.founder;

  if (direcao.length === 0) {
    throw new Error("Nenhum item encontrado na categoria 'direcao'.");
  }

  const jaTemProposta = direcao.find((item) => item.reviewStatus === "proposed");

  if (jaTemProposta) {
    log(
      `Já existe uma proposta pendente em direcao/${jaTemProposta.slug} (de ${jaTemProposta.proposedBy}). Revise-a antes de gerar outra — não vou sobrescrever.`
    );
    return;
  }

  const alvo = escolherAlvo(direcao);
  const posicao = CADEIA.indexOf(alvo.slug as (typeof CADEIA)[number]);

  log(
    `Alvo escolhido: direcao/${alvo.slug} ("${alvo.title}", status: ${alvo.status}, atualizado em ${alvo.updatedAt || "nunca"}).`
  );

  // Só os elos anteriores da cadeia entram como contexto — os posteriores
  // dependem deste item, não o contrário.
  const anteriores = direcao.filter((item) => {
    const idx = CADEIA.indexOf(item.slug as (typeof CADEIA)[number]);
    return idx !== -1 && idx < posicao;
  });

  log(
    anteriores.length > 0
      ? `Contexto cruzado: ${anteriores.map((i) => i.slug).join(", ")} + founder/*.`
      : "Primeiro elo da cadeia — sem itens anteriores, usando só o contexto do founder."
  );

  const userPrompt = `## Sobre o founder

${formatarItens(founder)}

## Itens da Direção já construídos (elos anteriores da cadeia)

${anteriores.length > 0 ? formatarItens(anteriores) : "(nenhum ainda — este é o primeiro elo da cadeia)"}

## Item que você deve escrever agora

${formatarItem(alvo, `direcao/${alvo.slug}`)}

---

Escreva o conteúdo do item "${alvo.title}" da seção Direção, coerente com tudo acima.

${FORMATO_JSON}`;

  log("Chamando o Claude Code para gerar a proposta (pode levar um tempo)...");
  const output = await runClaudeForProposal(SYSTEM_PROMPT, userPrompt);

  log(`Proposta gerada (confiança: ${output.confidence ?? "não informada"}).`);

  await proposeWrite({
    category: "direcao",
    slug: alvo.slug,
    agent: AGENT,
    rationale: output.rationale,
    body: output.proposedBody,
    summary: output.proposedSummary,
  });

  log(
    `Concluído. Abra /direcao/${alvo.slug} no BusinessOS para revisar e aceitar ou rejeitar.`
  );
}

main().catch((err) => tratarFalha(AGENT, err));
