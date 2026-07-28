import { fetchContext, proposeWrite } from "./shared";

const CATEGORY = "direcao";
const SLUG = "mapa-do-mercado";
const AGENT = "skill:mapa-do-mercado";

function montarProposedBody(): string {
  return `## Tamanho do mercado

- [Preencher] Estimativa de TAM (mercado total endereçável) — ainda sem dado real.
- [Preencher] Estimativa de SAM (fatia que seu modelo de negócio consegue efetivamente alcançar).
- [Preencher] Estimativa de SOM (fatia realista que você pode capturar nos próximos 12 meses).

## Tendências

- [Preencher] O que está mudando nesse mercado agora (tecnologia, regulação, comportamento do cliente).
- [Preencher] O mercado está crescendo, estável ou encolhendo — com que evidência?

## Concorrentes diretos

- [Preencher] Liste de 3 a 5 concorrentes diretos: quem resolve o mesmo problema, da forma parecida com a sua.
- [Preencher] Para cada um: ponto forte, ponto fraco, faixa de preço aproximada.

## Concorrentes indiretos

- [Preencher] Alternativas "caseiras" que o cliente usa hoje (planilhas, processos manuais, não fazer nada).
- [Preencher] O que faria esse cliente trocar essa alternativa pela sua solução.

## Dinâmica competitiva

- [Preencher] Existem barreiras de entrada relevantes (rede, dados, custo de troca, regulação)?
- [Preencher] Onde você pretende entrar: um nicho desatendido, uma faixa de preço específica, uma geografia?
`;
}

async function main() {
  console.log(
    `[skill:mapa-do-mercado] Buscando contexto em GET /api/context...`
  );
  const context = await fetchContext();
  const item = context.categories[CATEGORY].find((i) => i.slug === SLUG);

  if (!item) {
    throw new Error(
      `Item ${CATEGORY}/${SLUG} não encontrado no contexto retornado por /api/context.`
    );
  }

  console.log(
    `[skill:mapa-do-mercado] Item atual: "${item.title}" (status: ${item.status}, updatedAt: ${item.updatedAt}).`
  );
  console.log(
    `[skill:mapa-do-mercado] Esta skill de referência não pesquisa o mercado de verdade — apenas gera um esqueleto de rascunho para revisão humana.`
  );

  const rationale =
    "Proposta de estrutura inicial para o Mapa do Mercado, com seções-padrão para você preencher com dados reais. Esta skill de referência não pesquisa o mercado — apenas organiza o esqueleto.";

  await proposeWrite({
    category: CATEGORY,
    slug: SLUG,
    agent: AGENT,
    rationale,
    body: montarProposedBody(),
  });

  console.log(
    `[skill:mapa-do-mercado] Concluído. Abra ${CATEGORY}/${SLUG} no BusinessOS para revisar e aceitar ou rejeitar a proposta.`
  );
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[skill:mapa-do-mercado] Falhou: ${message}`);
  process.exitCode = 1;
});
