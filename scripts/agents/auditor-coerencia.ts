import {
  fetchContext,
  proposeWrite,
  runClaude,
  formatarItens,
  criarLogger,
  tratarFalha,
  type BusinessContext,
  type ContentItem,
} from "./shared";

const AGENT = "agent:auditor-coerencia";
const log = criarLogger(AGENT);

const SYSTEM_PROMPT = `Você é um auditor de coerência estratégica. Você lê o "sistema operacional" de negócio de um founder solo brasileiro por inteiro e aponta onde as partes se contradizem.

Este é o trabalho que o founder não consegue fazer sozinho: ele escreveu cada seção em um momento diferente, com a cabeça em um lugar diferente, e ninguém além dele lê o negócio inteiro de uma vez.

O que você procura:
- Contradições diretas entre seções (ex.: a oferta desenhada em Direção não é a mesma que está sendo validada; o cliente ideal descrito não é o cliente que de fato apareceu em Primeiros Clientes).
- Premissas de caixa que não sustentam o objetivo e o estilo de vida declarados pelo founder.
- Hipóteses marcadas como concluídas mas sem nenhuma evidência registrada.
- Seções que envelheceram: o founder mudou de direção em um lugar e esqueceu de atualizar o outro.

O que você NÃO faz:
- Não reescreve o conteúdo do founder. Você aponta, ele decide.
- Não inventa contradições para parecer útil. Se o negócio está coerente (ou vazio demais para julgar), diga isso e devolva listas vazias.
- Não confunde "incompleto" com "incoerente". Item vazio não é contradição.

Escreva em português do Brasil.`;

const FORMATO_AUDITORIA = `Responda APENAS com um objeto JSON válido, sem cercas de código e sem texto antes ou depois:

{
  "contradicoes": [
    {
      "gravidade": "alta" | "media" | "baixa",
      "titulo": "resumo da contradição em uma linha",
      "itens": ["categoria/slug", "categoria/slug"],
      "descricao": "o que exatamente se contradiz, citando o que cada item diz",
      "sugestao": "o que o founder deveria decidir ou revisar"
    }
  ],
  "resumosDesatualizados": [
    {
      "item": "categoria/slug",
      "summaryProposto": "novo resumo de 1 linha que reflete o corpo atual do item",
      "motivo": "por que o resumo atual não representa mais o conteúdo"
    }
  ]
}

Em "resumosDesatualizados", inclua apenas itens cujo resumo realmente divergiu do corpo. Se nenhum divergiu, devolva lista vazia.`;

type Contradicao = {
  gravidade: "alta" | "media" | "baixa";
  titulo: string;
  itens: string[];
  descricao: string;
  sugestao: string;
};

type ResumoDesatualizado = {
  item: string;
  summaryProposto: string;
  motivo: string;
};

type Auditoria = {
  contradicoes: Contradicao[];
  resumosDesatualizados: ResumoDesatualizado[];
};

function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  return fenced ? fenced[1].trim() : text.trim();
}

function todosOsItens(context: BusinessContext): ContentItem[] {
  return [
    ...context.categories.founder,
    ...context.categories.direcao,
    ...context.categories.validacao,
    ...context.categories.caixa,
  ];
}

const ORDEM_GRAVIDADE: Record<Contradicao["gravidade"], number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

function imprimirRelatorio(auditoria: Auditoria): void {
  const { contradicoes } = auditoria;

  console.log("");
  console.log("═".repeat(72));
  console.log("  RELATÓRIO DE COERÊNCIA — BusinessOS");
  console.log("═".repeat(72));

  if (contradicoes.length === 0) {
    console.log("");
    console.log("  Nenhuma contradição encontrada entre as seções.");
    console.log("");
    return;
  }

  const ordenadas = [...contradicoes].sort(
    (a, b) => ORDEM_GRAVIDADE[a.gravidade] - ORDEM_GRAVIDADE[b.gravidade]
  );

  for (const c of ordenadas) {
    console.log("");
    console.log(`  [${c.gravidade.toUpperCase()}] ${c.titulo}`);
    console.log(`  Itens: ${c.itens.join("  ↔  ")}`);
    console.log("");
    console.log(`    ${c.descricao}`);
    console.log("");
    console.log(`    → ${c.sugestao}`);
    console.log("");
    console.log("─".repeat(72));
  }

  console.log("");
}

async function main() {
  log("Buscando contexto em GET /api/context...");
  const context = await fetchContext();
  const itens = todosOsItens(context);

  if (itens.length === 0) {
    throw new Error("Nenhum conteúdo encontrado em /api/context.");
  }

  log(`Lendo o negócio inteiro: ${itens.length} itens nas 4 categorias.`);

  const userPrompt = `## Negócio completo

${formatarItens(itens)}

---

Audite a coerência entre as seções acima.

${FORMATO_AUDITORIA}`;

  log("Chamando o Claude Code para auditar (pode levar um tempo)...");
  const raw = await runClaude(SYSTEM_PROMPT, userPrompt);

  let auditoria: Auditoria;

  try {
    auditoria = JSON.parse(stripCodeFence(raw)) as Auditoria;
  } catch {
    throw new Error(
      `A resposta do modelo não é JSON válido. Recebido (primeiros 300 caracteres):\n${stripCodeFence(raw).slice(0, 300)}`
    );
  }

  auditoria.contradicoes ??= [];
  auditoria.resumosDesatualizados ??= [];

  imprimirRelatorio(auditoria);

  // A única escrita que este agente pode fazer é `summary` (agents.config.json
  // declara writeFields: ["summary"]). O corpo do negócio é do founder — o
  // auditor aponta contradições no console, não reescreve conteúdo.
  if (auditoria.resumosDesatualizados.length === 0) {
    log("Nenhum resumo desatualizado. Nada a propor.");
    return;
  }

  const porChave = new Map(
    itens.map((item) => [`${item.category}/${item.slug}`, item])
  );

  let propostas = 0;

  for (const resumo of auditoria.resumosDesatualizados) {
    const item = porChave.get(resumo.item);

    if (!item) {
      log(`Ignorando "${resumo.item}": item não existe no contexto.`);
      continue;
    }

    if (item.reviewStatus === "proposed") {
      log(
        `Ignorando ${resumo.item}: já tem proposta pendente de ${item.proposedBy}.`
      );
      continue;
    }

    await proposeWrite({
      category: item.category,
      slug: item.slug,
      agent: AGENT,
      rationale: `Resumo desatualizado: ${resumo.motivo}`,
      summary: resumo.summaryProposto,
    });

    propostas += 1;
  }

  log(
    propostas > 0
      ? `Concluído. ${propostas} proposta(s) de resumo aguardando sua revisão no BusinessOS.`
      : "Concluído. Nenhuma proposta nova registrada."
  );
}

main().catch((err) => tratarFalha(AGENT, err));
