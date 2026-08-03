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

const AGENT = "agent:coach-validacao";
const log = criarLogger(AGENT);

const SYSTEM_PROMPT = `Você é um consultor especializado em validação de mercado para founders solo brasileiros em fase zero-to-one.

Seu trabalho é transformar hipóteses estratégicas em experimentos concretos e organizar o aprendizado real vindo do mercado.

Princípios:
- Um experimento de validação precisa de: o que está sendo testado, com quem, como, e qual resultado faria você mudar de ideia. Sem o critério de falha, não é experimento — é torcida.
- Distinga com rigor o que o founder ACHA do que ele OBSERVOU. Essa é a distinção central da validação.
- "Primeiros clientes" não é um CRM: é registro qualitativo de aprendizado. Não crie listas de contatos nem pipelines de vendas.
- Prefira experimentos que possam rodar em dias, não em meses, e que não exijam construir o produto inteiro antes.
- Onde faltar informação, faça a pergunta certa em vez de inventar a resposta.
- Escreva em português do Brasil.`;

/**
 * Validação depende de Direção: sem uma oferta formulada, não há hipótese para
 * testar. Esse é o gate que o agente aplica antes de decidir agir.
 */
function escolherAlvo(itens: ContentItem[]): ContentItem {
  const oferta = itens.find((i) => i.slug === "oferta");
  const primeirosClientes = itens.find((i) => i.slug === "primeiros-clientes");

  // A oferta validada vem antes: é ela que define o que perguntar aos clientes.
  if (oferta && pareceVazio(oferta)) return oferta;
  if (primeirosClientes && pareceVazio(primeirosClientes)) return primeirosClientes;

  const ordenados = [...itens].sort((a, b) =>
    (a.updatedAt || "").localeCompare(b.updatedAt || "")
  );

  return ordenados[0];
}

async function main() {
  log("Buscando contexto em GET /api/context...");
  const context = await fetchContext();
  const validacao = context.categories.validacao;
  const direcao = context.categories.direcao;

  if (validacao.length === 0) {
    throw new Error("Nenhum item encontrado na categoria 'validacao'.");
  }

  const jaTemProposta = validacao.find((item) => item.reviewStatus === "proposed");

  if (jaTemProposta) {
    log(
      `Já existe uma proposta pendente em validacao/${jaTemProposta.slug} (de ${jaTemProposta.proposedBy}). Revise-a antes de gerar outra.`
    );
    return;
  }

  const ofertaDirecao = direcao.find((i) => i.slug === "oferta");
  const teseDeValor = direcao.find((i) => i.slug === "tese-de-valor");

  // Gate: validar o quê, se não há hipótese formulada?
  if (pareceVazio(ofertaDirecao) && pareceVazio(teseDeValor)) {
    log(
      "Parando: direcao/oferta e direcao/tese-de-valor estão vazias. Sem hipótese formulada não há o que validar — rode `npm run agent:direcao` primeiro."
    );
    return;
  }

  const alvo = escolherAlvo(validacao);

  log(
    `Alvo escolhido: validacao/${alvo.slug} ("${alvo.title}", status: ${alvo.status}, atualizado em ${alvo.updatedAt || "nunca"}).`
  );
  log("Contexto cruzado: direcao/* (as hipóteses que serão testadas).");

  const outrosValidacao = validacao.filter((i) => i.slug !== alvo.slug);

  const userPrompt = `## Hipóteses a validar (seção Direção)

${formatarItens(direcao)}

## Estado atual da Validação

${outrosValidacao.length > 0 ? formatarItens(outrosValidacao) : "(nenhum outro item preenchido)"}

## Item que você deve escrever agora

${formatarItem(alvo, `validacao/${alvo.slug}`)}

---

Escreva o conteúdo do item "${alvo.title}" da seção Validação, testando concretamente as hipóteses da Direção acima.

${FORMATO_JSON}`;

  log("Chamando o Claude Code para gerar a proposta (pode levar um tempo)...");
  const output = await runClaudeForProposal(SYSTEM_PROMPT, userPrompt);

  log(`Proposta gerada (confiança: ${output.confidence ?? "não informada"}).`);

  await proposeWrite({
    category: "validacao",
    slug: alvo.slug,
    agent: AGENT,
    rationale: output.rationale,
    body: output.proposedBody,
    summary: output.proposedSummary,
  });

  log(
    `Concluído. Abra /validacao/${alvo.slug} no BusinessOS para revisar e aceitar ou rejeitar.`
  );
}

main().catch((err) => tratarFalha(AGENT, err));
