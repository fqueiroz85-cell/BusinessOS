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

const AGENT = "agent:analista-caixa";
const log = criarLogger(AGENT);

const SYSTEM_PROMPT = `Você é um analista financeiro que trabalha com founders solo brasileiros em fase inicial, sem sócios e sem equipe.

Seu trabalho é estruturar o raciocínio de caixa do negócio: entradas, saídas, runway e — principalmente — as premissas por trás desses números.

Princípios:
- Premissa explícita vale mais que número preciso. Um founder em fase zero-to-one não tem dados históricos; ele tem hipóteses. Escreva as hipóteses de forma que possam ser conferidas depois.
- Runway é a pergunta central: quantos meses de operação o caixa atual sustenta, e o que muda esse número.
- Conecte o caixa do negócio à vida do founder. Se o estilo de vida desejado exige uma renda X e o negócio não caminha para X, isso é o achado mais importante do documento — diga com clareza.
- Este é um registro textual em Markdown, não uma planilha. Não invente tabelas de projeção com números fabricados.
- Onde faltar informação, faça a pergunta certa em vez de inventar a resposta. Nunca invente valores em reais.
- Escreva em português do Brasil.`;

function escolherAlvo(itens: ContentItem[]): ContentItem {
  const fluxoDeCaixa = itens.find((i) => i.slug === "fluxo-de-caixa");
  const erp = itens.find((i) => i.slug === "erp");

  // Fluxo de caixa antes de ERP: a ferramenta serve ao raciocínio, não o contrário.
  if (fluxoDeCaixa && pareceVazio(fluxoDeCaixa)) return fluxoDeCaixa;
  if (erp && pareceVazio(erp)) return erp;

  const ordenados = [...itens].sort((a, b) =>
    (a.updatedAt || "").localeCompare(b.updatedAt || "")
  );

  return ordenados[0];
}

async function main() {
  log("Buscando contexto em GET /api/context...");
  const context = await fetchContext();
  const caixa = context.categories.caixa;
  const founder = context.categories.founder;

  if (caixa.length === 0) {
    throw new Error("Nenhum item encontrado na categoria 'caixa'.");
  }

  const jaTemProposta = caixa.find((item) => item.reviewStatus === "proposed");

  if (jaTemProposta) {
    log(
      `Já existe uma proposta pendente em caixa/${jaTemProposta.slug} (de ${jaTemProposta.proposedBy}). Revise-a antes de gerar outra.`
    );
    return;
  }

  const estiloDeVida = founder.find((i) => i.slug === "estilo-de-vida");

  if (pareceVazio(estiloDeVida)) {
    log(
      "Aviso: founder/estilo-de-vida está vazio. Sem a renda alvo e o custo de vida desejado, o runway não tem contra o que ser medido — a proposta vai sair mais genérica."
    );
  }

  const alvo = escolherAlvo(caixa);
  const outrosCaixa = caixa.filter((i) => i.slug !== alvo.slug);

  log(
    `Alvo escolhido: caixa/${alvo.slug} ("${alvo.title}", status: ${alvo.status}, atualizado em ${alvo.updatedAt || "nunca"}).`
  );
  log("Contexto cruzado: founder/* (a vida que este caixa precisa sustentar).");

  const userPrompt = `## O que este negócio precisa sustentar (seção Founder)

${formatarItens(founder)}

## Estado atual do Caixa

${outrosCaixa.length > 0 ? formatarItens(outrosCaixa) : "(nenhum outro item preenchido)"}

## Item que você deve escrever agora

${formatarItem(alvo, `caixa/${alvo.slug}`)}

---

Escreva o conteúdo do item "${alvo.title}" da seção Caixa. Cheque explicitamente se o plano de caixa sustenta o objetivo e o estilo de vida descritos acima — se não houver informação suficiente para isso, diga o que precisa ser preenchido.

${FORMATO_JSON}`;

  log("Chamando o Claude Code para gerar a proposta (pode levar um tempo)...");
  const output = await runClaudeForProposal(SYSTEM_PROMPT, userPrompt);

  log(`Proposta gerada (confiança: ${output.confidence ?? "não informada"}).`);

  await proposeWrite({
    category: "caixa",
    slug: alvo.slug,
    agent: AGENT,
    rationale: output.rationale,
    body: output.proposedBody,
    summary: output.proposedSummary,
  });

  log(
    `Concluído. Abra /caixa/${alvo.slug} no BusinessOS para revisar e aceitar ou rejeitar.`
  );
}

main().catch((err) => tratarFalha(AGENT, err));
