import { fetchContext, proposeWrite, type ContentItem } from "./shared";

const CATEGORY = "direcao";
const SLUG = "tese-de-valor";
const AGENT = "skill:tese-de-valor";

const LIMITE_CONTEUDO_VAZIO = 200;

function pareceNaoPreenchido(item: ContentItem | undefined): boolean {
  return !item || item.body.trim().length < LIMITE_CONTEUDO_VAZIO;
}

function montarProposedBody(): string {
  return `## Hipótese central

- [Preencher] Complete: "Eu acredito que [cliente] vai pagar por [solução] porque [motivo], e eu sou a pessoa certa para entregar isso porque [vantagem]."

## Por que este cliente pagaria

- [Preencher] Qual dor específica (ligada ao Mapa de Problemas) essa solução resolve.
- [Preencher] O que esse cliente faz hoje sem a sua solução, e por que isso não é bom o suficiente.

## Evidência hoje

- [Preencher] Que evidência real (conversas, dados, comportamento observado) já sustenta essa hipótese.
- [Preencher] O que ainda é suposição sua, não evidência coletada.

## Riscos da hipótese

- [Preencher] Qual seria o primeiro sinal concreto de que essa tese está errada.
- [Preencher] O que você faria se esse sinal aparecesse.
`;
}

async function main() {
  console.log(
    `[skill:tese-de-valor] Buscando contexto em GET /api/context...`
  );
  const context = await fetchContext();
  const direcao = context.categories[CATEGORY];

  const teseDeValor = direcao.find((i) => i.slug === SLUG);
  const icp = direcao.find((i) => i.slug === "perfil-ideal-de-cliente");
  const mapaDeProblemas = direcao.find((i) => i.slug === "mapa-de-problemas");

  if (!teseDeValor) {
    throw new Error(
      `Item ${CATEGORY}/${SLUG} não encontrado no contexto retornado por /api/context.`
    );
  }

  console.log(
    `[skill:tese-de-valor] Item atual: "${teseDeValor.title}" (status: ${teseDeValor.status}, updatedAt: ${teseDeValor.updatedAt}).`
  );
  console.log(
    `[skill:tese-de-valor] Lendo contexto cruzado: direcao/perfil-ideal-de-cliente e direcao/mapa-de-problemas (relatedContext, conforme seção 4 de docs/agents-integration.md).`
  );

  const avisos: string[] = [];

  if (pareceNaoPreenchido(icp)) {
    avisos.push(
      "Perfil Ideal de Cliente ainda parece não preenchido — a tese de valor fica mais forte depois de definir o ICP."
    );
  }

  if (pareceNaoPreenchido(mapaDeProblemas)) {
    avisos.push(
      "Mapa de Problemas ainda parece não preenchido — vale mapear os problemas do cliente antes de travar a tese de valor."
    );
  }

  if (avisos.length > 0) {
    console.log(
      `[skill:tese-de-valor] Avisos de contexto cruzado: ${avisos.join(" | ")}`
    );
  }

  const rationaleBase =
    "Proposta de estrutura inicial para a Tese de Valor, com seções-padrão para você preencher com sua hipótese real. Esta skill de referência não gera a tese pronta — apenas organiza o esqueleto, usando o ICP e o Mapa de Problemas como contexto cruzado.";

  const rationale =
    avisos.length > 0 ? `${rationaleBase} ${avisos.join(" ")}` : rationaleBase;

  await proposeWrite({
    category: CATEGORY,
    slug: SLUG,
    agent: AGENT,
    rationale,
    body: montarProposedBody(),
  });

  console.log(
    `[skill:tese-de-valor] Concluído. Abra ${CATEGORY}/${SLUG} no BusinessOS para revisar e aceitar ou rejeitar a proposta.`
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[skill:tese-de-valor] Falhou: ${message}`);
  process.exitCode = 1;
});
