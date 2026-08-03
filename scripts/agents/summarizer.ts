import {
  criarLogger,
  fetchContext,
  formatarItens,
  pareceVazio,
  proposeWrite,
  runClaude,
  stripCodeFence,
  todosOsItens,
  tratarFalha,
} from "./shared";

const AGENT = "agent:summarizer";
const log = criarLogger(AGENT);

const SYSTEM_PROMPT = `Você escreve os resumos de uma linha do "sistema operacional" de negócio de um founder solo brasileiro.

O resumo de um item é o que aparece nas listagens e nos cards do BusinessOS: é o que o founder lê quando está decidindo onde mexer. Ele precisa dizer o que aquele item AFIRMA, não sobre o que ele fala.

Ruim:  "Tamanho, dinâmica e concorrência do mercado em que você vai atuar."
Bom:   "Mercado de tráfego pago para infoproduto de baixo ticket, disputado por agências generalistas."

Princípios:
- Uma linha, no máximo ~120 caracteres. Sem ponto final obrigatório, sem "este item descreve".
- Diga a conclusão do item, com os substantivos concretos que aparecem no conteúdo.
- Se o conteúdo ainda é template ou pergunta não respondida, NÃO proponha resumo para ele. Item vazio mantém o resumo genérico que já tem.
- Não invente nada que não esteja no conteúdo do item.
- Escreva em português do Brasil.`;

const FORMATO_RESUMOS = `Responda APENAS com um objeto JSON válido, sem cercas de código e sem texto antes ou depois:

{
  "resumos": [
    {
      "item": "categoria/slug",
      "summaryProposto": "o resumo novo, uma linha",
      "motivo": "por que o resumo atual não serve mais"
    }
  ]
}

Inclua apenas itens cujo resumo atual realmente divergiu do conteúdo. Se nenhum divergiu, devolva "resumos": [].`;

type ResumoProposto = {
  item: string;
  summaryProposto: string;
  motivo: string;
};

async function main() {
  log("Buscando contexto em GET /api/context...");
  const context = await fetchContext();

  // Só itens com conteúdo real: resumir template é resumir o nada, e ainda
  // gastaria cota da assinatura para propor o resumo genérico de volta.
  const itens = todosOsItens(context).filter((item) => !pareceVazio(item));

  if (itens.length === 0) {
    log(
      "Parando: nenhum item tem conteúdo real ainda. Rode `npm run agent:seed` para ver por onde começar."
    );
    return;
  }

  log(`Avaliando os resumos de ${itens.length} item(ns) com conteúdo.`);

  const userPrompt = `## Itens com conteúdo

${formatarItens(itens)}

---

Para cada item acima, compare o resumo atual (campo "resumo") com o conteúdo real. Proponha resumo novo apenas onde o atual não representa mais o que o item afirma.

${FORMATO_RESUMOS}`;

  log("Chamando o Claude Code para avaliar os resumos (pode levar um tempo)...");
  const raw = await runClaude(SYSTEM_PROMPT, userPrompt);

  let payload: { resumos?: ResumoProposto[] };

  try {
    payload = JSON.parse(stripCodeFence(raw)) as { resumos?: ResumoProposto[] };
  } catch {
    throw new Error(
      `A resposta do modelo não é JSON válido. Recebido (primeiros 300 caracteres):\n${stripCodeFence(raw).slice(0, 300)}`
    );
  }

  const resumos = payload.resumos ?? [];

  if (resumos.length === 0) {
    log("Nenhum resumo desatualizado. Nada a propor.");
    return;
  }

  const porChave = new Map(
    itens.map((item) => [`${item.category}/${item.slug}`, item])
  );

  let propostas = 0;

  for (const resumo of resumos) {
    const item = porChave.get(resumo.item);

    if (!item) {
      log(`Ignorando "${resumo.item}": item não existe ou está vazio.`);
      continue;
    }

    if (item.reviewStatus === "proposed") {
      log(`Ignorando ${resumo.item}: já tem proposta pendente de ${item.proposedBy}.`);
      continue;
    }

    if (!resumo.summaryProposto?.trim()) {
      log(`Ignorando ${resumo.item}: resumo proposto vazio.`);
      continue;
    }

    console.log("");
    console.log(`  ${resumo.item}`);
    console.log(`    antes:  ${item.summary || "(vazio)"}`);
    console.log(`    depois: ${resumo.summaryProposto}`);
    console.log(`    motivo: ${resumo.motivo}`);

    await proposeWrite({
      category: item.category,
      slug: item.slug,
      agent: AGENT,
      rationale: `Resumo desatualizado: ${resumo.motivo}`,
      summary: resumo.summaryProposto,
    });

    propostas += 1;
  }

  console.log("");
  log(
    propostas > 0
      ? `Concluído. ${propostas} proposta(s) de resumo aguardando sua revisão.`
      : "Concluído. Nenhuma proposta nova registrada."
  );
}

main().catch((err) => tratarFalha(AGENT, err));
