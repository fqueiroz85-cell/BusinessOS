import {
  criarLogger,
  fetchContext,
  formatarItens,
  proposeWrite,
  runClaude,
  stripCodeFence,
  tratarFalha,
} from "./shared";

const AGENT = "agent:founder-coach";
const log = criarLogger(AGENT);

const SYSTEM_PROMPT = `Você é um coach de founders que trabalha com empreendedores solo brasileiros em fase zero-to-one.

Seu trabalho é a seção Founder: objetivo e estilo de vida. Diferente dos outros agentes, você NÃO escreve no lugar do founder. As respostas dessa seção são dele — são o dado bruto de que todo o resto do negócio depende. Se você as reescrever, o negócio inteiro passa a se apoiar numa invenção sua.

O que você faz:
- Aponta onde a resposta está vaga demais para sustentar decisão. "Quero liberdade" não sustenta nada; "R$ 15 mil de piso e 8h/dia daqui a um ano" sustenta.
- Faz a pergunta seguinte — a que o founder ainda não se fez, e que ele consegue responder em uma frase.
- Aponta tensões internas: metas que brigam entre si, prazos que não cabem no tempo declarado, ambição que não combina com o modelo de negócio pretendido.
- Reconhece o que já está bem definido, e diz por quê. Elogio genérico não ajuda; dizer qual decisão futura aquela resposta já destrava, ajuda.

O que você NÃO faz:
- Não reescreve as respostas do founder nem propõe texto no lugar dele.
- Não inventa metas, números ou motivações que ele não declarou.
- Não trata resposta curta como resposta ruim. Curta e concreta é ótima; longa e vaga não é.

Escreva em português do Brasil, falando diretamente com o founder.`;

const FORMATO_COACH = `Responda APENAS com um objeto JSON válido, sem cercas de código e sem texto antes ou depois:

{
  "itens": [
    {
      "item": "founder/objetivo",
      "solidez": "alta" | "media" | "baixa",
      "oQueEstaClaro": "o que já está definido o suficiente para sustentar decisão, e qual decisão",
      "oQueEstaVago": ["ponto vago 1", "ponto vago 2"],
      "perguntas": ["pergunta de aprofundamento que ele responde em uma frase"],
      "summaryProposto": "resumo de 1 linha do item, só se o resumo atual não refletir mais as respostas"
    }
  ],
  "tensoes": [
    {
      "titulo": "a tensão em uma linha",
      "descricao": "o que briga com o quê, citando o que cada resposta diz",
      "pergunta": "a pergunta que força o founder a resolver a tensão"
    }
  ]
}

Omita "summaryProposto" quando o resumo atual estiver adequado. Devolva listas vazias em vez de inventar conteúdo.`;

type ItemAvaliado = {
  item: string;
  solidez: "alta" | "media" | "baixa";
  oQueEstaClaro: string;
  oQueEstaVago?: string[];
  perguntas?: string[];
  summaryProposto?: string;
};

type Tensao = { titulo: string; descricao: string; pergunta: string };

type Coaching = { itens: ItemAvaliado[]; tensoes: Tensao[] };

function imprimirRelatorio(coaching: Coaching): void {
  console.log("");
  console.log("═".repeat(72));
  console.log("  COACHING DO FOUNDER — BusinessOS");
  console.log("═".repeat(72));

  for (const item of coaching.itens) {
    console.log("");
    console.log(`  ${item.item}  [solidez: ${item.solidez}]`);
    console.log("");
    console.log(`    Claro: ${item.oQueEstaClaro}`);

    if (item.oQueEstaVago?.length) {
      console.log("");
      console.log("    Ainda vago:");
      for (const vago of item.oQueEstaVago) console.log(`      · ${vago}`);
    }

    if (item.perguntas?.length) {
      console.log("");
      console.log("    Responda a seguir:");
      for (const pergunta of item.perguntas) console.log(`      → ${pergunta}`);
    }

    console.log("");
    console.log("─".repeat(72));
  }

  if (coaching.tensoes.length === 0) {
    console.log("");
    console.log("  Nenhuma tensão interna encontrada na seção Founder.");
    console.log("");
    return;
  }

  console.log("");
  console.log("  TENSÕES");

  for (const tensao of coaching.tensoes) {
    console.log("");
    console.log(`  ⚠  ${tensao.titulo}`);
    console.log(`     ${tensao.descricao}`);
    console.log(`     → ${tensao.pergunta}`);
  }

  console.log("");
}

async function main() {
  log("Buscando contexto em GET /api/context...");
  const context = await fetchContext();
  const founder = context.categories.founder;

  if (founder.length === 0) {
    throw new Error("Nenhum item encontrado na categoria 'founder'.");
  }

  const respondidos = founder.filter(
    (item) => Object.keys(item.answers ?? {}).length > 0
  );

  if (respondidos.length === 0) {
    log(
      "Parando: nenhum item da seção Founder foi respondido ainda. Abra /founder no BusinessOS e responda o questionário — não tenho o que aprofundar sem as suas respostas."
    );
    return;
  }

  log(
    `Lendo ${founder.length} item(ns) da seção Founder, ${respondidos.length} com respostas.`
  );

  const userPrompt = `## Seção Founder

${formatarItens(founder)}

---

Analise as respostas acima como coach. Aponte o que já sustenta decisão, o que ainda está vago, e as tensões entre o que ele declarou.

${FORMATO_COACH}`;

  log("Chamando o Claude Code para analisar (pode levar um tempo)...");
  const raw = await runClaude(SYSTEM_PROMPT, userPrompt);

  let coaching: Coaching;

  try {
    coaching = JSON.parse(stripCodeFence(raw)) as Coaching;
  } catch {
    throw new Error(
      `A resposta do modelo não é JSON válido. Recebido (primeiros 300 caracteres):\n${stripCodeFence(raw).slice(0, 300)}`
    );
  }

  coaching.itens ??= [];
  coaching.tensoes ??= [];

  imprimirRelatorio(coaching);

  // Única escrita permitida: `summary` (agents.config.json declara
  // writeFields: ["summary"]). As respostas do founder são dele — este agente
  // pergunta, não responde.
  const porChave = new Map(
    founder.map((item) => [`${item.category}/${item.slug}`, item])
  );

  let propostas = 0;

  for (const avaliado of coaching.itens) {
    if (!avaliado.summaryProposto?.trim()) continue;

    const item = porChave.get(avaliado.item);

    if (!item) {
      log(`Ignorando "${avaliado.item}": item não existe na seção Founder.`);
      continue;
    }

    if (item.reviewStatus === "proposed") {
      log(`Ignorando ${avaliado.item}: já tem proposta pendente de ${item.proposedBy}.`);
      continue;
    }

    await proposeWrite({
      category: item.category,
      slug: item.slug,
      agent: AGENT,
      rationale: `Resumo desatualizado em relação às respostas: ${avaliado.oQueEstaClaro}`,
      summary: avaliado.summaryProposto,
    });

    propostas += 1;
  }

  log(
    propostas > 0
      ? `Concluído. ${propostas} proposta(s) de resumo aguardando sua revisão.`
      : "Concluído. Nenhuma proposta de resumo — as perguntas acima são o produto deste agente."
  );
}

main().catch((err) => tratarFalha(AGENT, err));
