import {
  AGENTE_POR_ITEM,
  criarLogger,
  fetchContext,
  pareceVazio,
  todosOsItens,
  tratarFalha,
  type BusinessContext,
  type ContentItem,
} from "./shared";

const AGENT = "agent:seed-assistant";
const log = criarLogger(AGENT);

/**
 * O assistente inicial: para quem abre o BusinessOS do zero e não sabe por onde
 * começar.
 *
 * É o único agente que NÃO chama o Claude Code CLI — de propósito. Tudo que ele
 * precisa responder ("o que está preenchido, o que vem agora, qual comando
 * rodar") é determinístico, e um agente de orientação que custa cota da
 * assinatura toda vez que você quer se situar não seria usado. Custo zero,
 * resposta instantânea.
 */

const SECOES: {
  chave: keyof BusinessContext["categories"];
  nome: string;
  papel: string;
}[] = [
  {
    chave: "founder",
    nome: "Founder",
    papel: "por que este negócio existe e que vida ele precisa sustentar",
  },
  {
    chave: "direcao",
    nome: "Direção",
    papel: "para quem, com que problema, e o que você vende",
  },
  {
    chave: "validacao",
    nome: "Validação",
    papel: "o que o mercado confirmou, e o que ainda é achismo",
  },
  {
    chave: "caixa",
    nome: "Caixa",
    papel: "se as contas fecham e por quantos meses",
  },
];

function barra(preenchidos: number, total: number): string {
  const largura = 20;
  const cheios = total === 0 ? 0 : Math.round((preenchidos / total) * largura);
  return `${"█".repeat(cheios)}${"░".repeat(largura - cheios)}`;
}

/**
 * O primeiro item vazio na ordem de leitura do negócio. A ordem importa: Founder
 * antes de Direção porque a Direção se apoia no objetivo; Validação depois da
 * Direção porque não se valida o que não foi formulado.
 */
function proximoItem(context: BusinessContext): ContentItem | null {
  for (const secao of SECOES) {
    const vazio = context.categories[secao.chave].find((item) => pareceVazio(item));
    if (vazio) return vazio;
  }
  return null;
}

function itemMaisParado(context: BusinessContext): ContentItem | null {
  const itens = [...todosOsItens(context)].sort((a, b) =>
    (a.updatedAt || "").localeCompare(b.updatedAt || "")
  );
  return itens[0] ?? null;
}

async function main() {
  log("Buscando contexto em GET /api/context...");
  const context = await fetchContext();
  const itens = todosOsItens(context);

  if (itens.length === 0) {
    throw new Error("Nenhum conteúdo encontrado em /api/context.");
  }

  console.log("");
  console.log("═".repeat(72));
  console.log("  POR ONDE COMEÇAR — BusinessOS");
  console.log("═".repeat(72));
  console.log("");

  for (const secao of SECOES) {
    const daSecao = context.categories[secao.chave];
    const preenchidos = daSecao.filter((item) => !pareceVazio(item)).length;

    console.log(
      `  ${secao.nome.padEnd(10)} ${barra(preenchidos, daSecao.length)}  ${preenchidos}/${daSecao.length}`
    );
    console.log(`  ${" ".repeat(10)} ${secao.papel}`);
    console.log("");
  }

  const pendentes = itens.filter((item) => item.reviewStatus === "proposed");

  if (pendentes.length > 0) {
    console.log("─".repeat(72));
    console.log("");
    console.log("  ANTES DE QUALQUER COISA: você tem proposta esperando revisão.");
    console.log("");
    for (const item of pendentes) {
      console.log(
        `    · /${item.category}/${item.slug} — proposta de ${item.proposedBy ?? "agente desconhecido"}`
      );
    }
    console.log("");
    console.log("  Aceite ou rejeite no BusinessOS antes de gerar mais conteúdo:");
    console.log("  proposta em cima de proposta vira fila que ninguém revisa.");
    console.log("");
    return;
  }

  const alvo = proximoItem(context) ?? itemMaisParado(context);

  if (!alvo) {
    log("Nada a sugerir — não consegui identificar um próximo item.");
    return;
  }

  const chave = `${alvo.category}/${alvo.slug}`;
  const responsavel = AGENTE_POR_ITEM[chave];
  const tudoPreenchido = proximoItem(context) === null;

  console.log("─".repeat(72));
  console.log("");

  if (tudoPreenchido) {
    console.log("  Todas as seções têm conteúdo. O próximo passo é manutenção:");
    console.log("");
    console.log(`  Item parado há mais tempo:  ${chave}`);
    console.log(`  Atualizado em:              ${alvo.updatedAt || "nunca"}`);
    console.log("");
    console.log("  Rode a auditoria para achar o que envelheceu ou se contradiz:");
    console.log("");
    console.log("      npm run agent:linter");
    console.log("      npm run agent:summarizer");
  } else {
    console.log(`  PRÓXIMO PASSO:  ${chave}  ("${alvo.title}")`);
    console.log("");
    console.log(`  ${alvo.summary || "(sem resumo)"}`);
    console.log("");
    console.log("  Duas formas de preencher — e a ordem recomendada é essa:");
    console.log("");
    console.log(`  1. Você responde primeiro:  abra /${alvo.category}/${alvo.slug} no`);
    console.log("     BusinessOS e responda o questionário. O que você escreve vale");
    console.log("     mais que o que o agente escreve, porque é o dado real.");
    console.log("");

    if (responsavel) {
      console.log(`  2. Depois chame o agente:   ${responsavel.comando}`);
      console.log(`     (${responsavel.agente} — ele lê o que você respondeu e propõe`);
      console.log("     o conteúdo do item, para você aceitar ou rejeitar.)");
    } else {
      console.log("  2. Nenhum agente registrado para este item — preencha na mão.");
    }
  }

  console.log("");
  console.log("─".repeat(72));
  console.log("");
}

main().catch((err) => tratarFalha(AGENT, err));
