import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { fetchContext, proposeWrite } from "../skills/shared";
import type { BusinessContext, ContentItem } from "../skills/shared";

export {
  fetchContext,
  proposeWrite,
  type BusinessContext,
  type ContentItem,
  type ContentStatus,
} from "../skills/shared";

/**
 * Modelo usado pelos agentes no Claude Code CLI.
 *
 * Sonnet é o meio-termo escolhido: acima do Haiku do briefing (que é síntese
 * curta e repetida — ver app/api/briefing/route.ts), abaixo do Opus. Cada
 * agente manda o negócio inteiro no prompt, então uma rodada dos agentes de
 * uma vez consome cota de forma perceptível; Sonnet corta bem esse custo sem
 * perder muito neste tipo de tarefa. Suba para "opus" via AGENT_CLI_MODEL
 * quando quiser o máximo de qualidade em um item específico.
 */
const AGENT_CLI_MODEL = process.env.AGENT_CLI_MODEL ?? "sonnet";

// No Windows o `claude` é um shim .cmd, o que obriga `shell: true` — e aí o
// Node concatena os argumentos sem escape, fazendo uma string vazia sumir do
// comando. `--tools ""` virava `--tools --model`, ou seja: `--tools` engolia o
// `--model`, o modelo escolhido nunca era aplicado e as ferramentas não eram
// desligadas. Aspas literais sobrevivem e chegam ao CLI como string vazia.
const USA_SHELL = process.platform === "win32";
const SEM_FERRAMENTAS = USA_SHELL ? '""' : "";

/**
 * Saída de uma skill, conforme o contrato da seção 4 de
 * docs/agents-integration.md. É isso que pedimos ao Claude devolver como JSON.
 */
export type SkillOutput = {
  proposedBody: string;
  proposedSummary?: string;
  rationale: string;
  confidence?: "low" | "medium" | "high";
};

/**
 * Executa o Claude Code CLI em modo não-interativo (`claude -p`), sob a sessão
 * logada do usuário (assinatura Claude), sem chave de API cobrada por token.
 *
 * Detalhes que importam:
 * - `--tools ""` desliga todas as ferramentas: o agente raciocina sobre o
 *   contexto que recebe via stdin e devolve texto. Ele não lê nem escreve
 *   arquivos por conta própria — toda escrita passa por POST /api/agent/write,
 *   que valida permissões (agents.config.json).
 * - `cwd: os.tmpdir()` evita que o AGENTS.md/CLAUDE.md do BusinessOS entre no
 *   prompt do agente, o que contaminaria o raciocínio de negócio com instruções
 *   de desenvolvimento do repositório.
 * - `--no-session-persistence` porque cada execução é stateless (contrato da
 *   seção 4: toda informação necessária vem no input).
 * - O system prompt vai por `--system-prompt-file`, não como argumento: no
 *   Windows o `claude` é um shim .cmd, o que obriga `shell: true`, e aí os
 *   argumentos são concatenados sem escape. Um prompt de várias linhas com
 *   aspas e parênteses quebraria o comando. O user prompt vai por stdin pelo
 *   mesmo motivo.
 */
export function runClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const promptFile = path.join(
    os.tmpdir(),
    `businessos-agent-${process.pid}-${Date.now()}.txt`
  );

  fs.writeFileSync(promptFile, systemPrompt, "utf-8");

  const limpar = () => {
    try {
      fs.unlinkSync(promptFile);
    } catch {
      // Arquivo temporário já removido — não é motivo para falhar a execução.
    }
  };

  return new Promise<string>((resolve, reject) => {
    const child = spawn(
      "claude",
      [
        "-p",
        "--output-format",
        "json",
        "--no-session-persistence",
        "--tools",
        SEM_FERRAMENTAS,
        "--model",
        AGENT_CLI_MODEL,
        "--system-prompt-file",
        promptFile,
      ],
      {
        cwd: os.tmpdir(),
        shell: USA_SHELL,
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      reject(
        new Error(
          `Não foi possível executar o Claude Code CLI ("claude"). Verifique se ele está instalado e logado. Detalhe: ${err.message}`
        )
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Claude Code CLI encerrou com código ${code}. ${stderr.trim() || "Sem detalhes adicionais."}`
          )
        );
        return;
      }

      let payload: { is_error?: boolean; subtype?: string; result?: string };

      try {
        payload = JSON.parse(stdout);
      } catch {
        reject(
          new Error("O Claude Code CLI retornou uma resposta que não é JSON válido.")
        );
        return;
      }

      if (payload.is_error || !payload.result) {
        reject(
          new Error(
            `Claude Code CLI retornou um erro (${payload.subtype ?? "desconhecido"}).`
          )
        );
        return;
      }

      resolve(payload.result.trim());
    });

    child.stdin.write(userPrompt);
    child.stdin.end();
  }).finally(limpar);
}

/**
 * Remove cercas de código markdown que o modelo às vezes coloca em volta do
 * JSON, mesmo quando instruído a devolver JSON puro.
 */
export function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  return fenced ? fenced[1].trim() : text.trim();
}

/**
 * Roda o Claude e faz parse da resposta como `SkillOutput`. Falha de forma
 * explícita se o modelo devolver algo fora do contrato — melhor abortar do que
 * gravar uma proposta malformada no frontmatter de um item.
 */
export async function runClaudeForProposal(
  systemPrompt: string,
  userPrompt: string
): Promise<SkillOutput> {
  const raw = await runClaude(systemPrompt, userPrompt);
  const cleaned = stripCodeFence(raw);

  let parsed: SkillOutput;

  try {
    parsed = JSON.parse(cleaned) as SkillOutput;
  } catch {
    throw new Error(
      `A resposta do modelo não é JSON válido. Recebido (primeiros 300 caracteres):\n${cleaned.slice(0, 300)}`
    );
  }

  if (!parsed.proposedBody?.trim()) {
    throw new Error("A resposta do modelo não contém 'proposedBody'.");
  }

  if (!parsed.rationale?.trim()) {
    throw new Error(
      "A resposta do modelo não contém 'rationale' — obrigatório, porque toda proposta passa por revisão humana."
    );
  }

  return parsed;
}

/**
 * Instrução de formato compartilhada por todos os agentes que propõem conteúdo.
 */
export const FORMATO_JSON = `Responda APENAS com um objeto JSON válido, sem cercas de código e sem texto antes ou depois, com exatamente estas chaves:

{
  "proposedBody": "corpo completo do item em Markdown",
  "proposedSummary": "resumo de 1 linha do item (opcional)",
  "rationale": "explicação em 2-4 frases do que você propôs e por quê, dirigida ao founder que vai revisar",
  "confidence": "low" | "medium" | "high"
}

Regras para "proposedBody":
- Markdown puro, começando por um subtítulo "## ".
- Escreva em português do Brasil, na voz do founder.
- Não invente fatos sobre o negócio que não estejam no contexto fornecido. Onde faltar informação, escreva uma pergunta ou um placeholder explícito "[Preencher: ...]" em vez de inventar.
- "confidence" deve ser "low" quando o contexto disponível for pobre.`;

/** Abaixo disto a resposta é um "sim"/"não sei" — não conta como respondida. */
const LIMITE_RESPOSTA_SUBSTANTIVA = 15;

/**
 * Heurística: o founder ainda não preencheu este item de verdade.
 *
 * Mede `answers` + `briefing`, e deliberadamente ignora `body`. Todo item nasce
 * com ~1.2k caracteres de template de perguntas no corpo, então medir `body`
 * classificava os 11 itens como preenchidos e os agentes nunca achavam o
 * próximo item a atacar. Mesmo raciocínio de `formatarItem`: o conteúdo real
 * mora em `answers`.
 */
export function pareceVazio(item: ContentItem | undefined): boolean {
  if (!item) return true;

  // Proposta de agente já aceita: o corpo é conteúdo real, não o template.
  if (item.acceptedFrom) return false;

  // Briefing só existe depois que o founder respondeu e pediu a síntese.
  if (item.briefing?.trim()) return false;

  const respondidas = Object.values(item.answers ?? {}).filter(
    (valor) => (valor?.trim().length ?? 0) >= LIMITE_RESPOSTA_SUBSTANTIVA
  ).length;

  const totalDePerguntas = item.questions?.length ?? 0;

  // Sem o questionário no contexto (agente externo antigo, ou item sem
  // perguntas), cai para uma regra frouxa: uma resposta só não faz um item.
  if (totalDePerguntas === 0) return respondidas < 2;

  // Metade do questionário. Medir o *volume* das respostas, como esta função
  // fazia antes, deixava uma única resposta longa marcar o item inteiro como
  // preenchido — foi assim que o agente de caixa pulou `fluxo-de-caixa` (1 de 5
  // perguntas respondidas, mas com um texto de 450 caracteres) e foi escrever
  // `erp`. O que importa é a cobertura do questionário, não quantos caracteres
  // o founder digitou.
  return respondidas < Math.ceil(totalDePerguntas / 2);
}

/**
 * Renderiza um item como bloco de texto para entrar no prompt do agente.
 *
 * As respostas do founder (`answers`) e o briefing gerado entram ANTES do
 * corpo, e destacados: `body` costuma ser só o template de perguntas que veio
 * no scaffold do item, enquanto `answers` é o que o founder de fato escreveu.
 * Omitir isso fazia o agente concluir que o item estava vazio mesmo com o
 * questionário todo preenchido.
 */
export function formatarItem(item: ContentItem | undefined, rotulo: string): string {
  if (!item) {
    return `### ${rotulo}\n(item não encontrado)\n`;
  }

  // O enunciado da pergunta, quando o contexto o traz — `porque-agora` sozinho
  // obriga o modelo a adivinhar o que foi perguntado.
  const rotuloDaPergunta = new Map(
    (item.questions ?? []).map((q) => [q.id, q.label])
  );

  const respostas = Object.entries(item.answers ?? {})
    .filter(([, valor]) => valor?.trim())
    .map(
      ([id, valor]) => `- **${rotuloDaPergunta.get(id) ?? id}**\n  ${valor.trim()}`
    )
    .join("\n");

  // Perguntas ainda em branco são informação: dizem ao agente o que falta, em
  // vez de deixá-lo supor que o founder não tinha mais nada a dizer.
  const emBranco = (item.questions ?? [])
    .filter((q) => !(item.answers?.[q.id]?.trim()))
    .map((q) => `- ${q.label}`)
    .join("\n");

  const blocoRespostas = respostas
    ? `RESPOSTAS DO FOUNDER (conteúdo real, escrito por ele — priorize isto):\n${respostas}\n${
        emBranco ? `\nPERGUNTAS AINDA SEM RESPOSTA:\n${emBranco}\n` : ""
      }`
    : "RESPOSTAS DO FOUNDER: (nenhuma ainda)\n";

  const blocoBriefing = item.briefing?.trim()
    ? `\nBRIEFING SINTETIZADO POR IA:\n${item.briefing.trim()}\n`
    : "";

  const corpo = item.body.trim() || "(vazio)";

  const rotuloCorpo = item.acceptedFrom
    ? `CORPO DO ITEM (conteúdo real, escrito por ${item.acceptedFrom} e aceito pelo founder):`
    : "TEMPLATE/NOTAS DO ITEM (pode ser só o scaffold inicial, não confunda com conteúdo do founder):";

  return `### ${rotulo} — ${item.title}
status: ${item.status}
resumo: ${item.summary || "(vazio)"}
atualizado em: ${item.updatedAt || "(nunca)"}

${blocoRespostas}${blocoBriefing}
${rotuloCorpo}
${corpo}
`;
}

/** Renderiza uma lista de itens como contexto para o prompt. */
export function formatarItens(itens: ContentItem[]): string {
  return itens
    .map((item) => formatarItem(item, `${item.category}/${item.slug}`))
    .join("\n---\n\n");
}

/** Logger com prefixo do agente, para deixar claro quem está falando. */
export function criarLogger(agente: string) {
  return (mensagem: string) => console.log(`[${agente}] ${mensagem}`);
}

/** Encerra o script reportando falha de forma consistente. */
export function tratarFalha(agente: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${agente}] Falhou: ${message}`);
  process.exitCode = 1;
}

export type Categoria = keyof BusinessContext["categories"];

/** Junta as 4 categorias em uma lista só, na ordem de leitura do negócio. */
export function todosOsItens(context: BusinessContext): ContentItem[] {
  return [
    ...context.categories.founder,
    ...context.categories.direcao,
    ...context.categories.validacao,
    ...context.categories.caixa,
  ];
}

/** Um bloco rotulado de contexto que entra no prompt antes do item alvo. */
export type BlocoDeContexto = { titulo: string; itens: ContentItem[] };

export type DefinicaoAgente = {
  /** Chave declarada em agents.config.json, ex. "agent:market-map". */
  agente: string;
  categoria: Categoria;
  /**
   * Slugs sob responsabilidade deste agente, em ordem de prioridade. A maioria
   * dos agentes cuida de um item só; alguns (cash-flow, validation-synth)
   * cuidam de dois, e aí a ordem codifica qual vem primeiro.
   */
  alvos: string[];
  systemPrompt: string;
  /** Blocos de contexto cruzado, montados a partir do negócio inteiro. */
  contexto: (context: BusinessContext, alvo: ContentItem) => BlocoDeContexto[];
  /**
   * Pré-requisito. Devolver uma string faz o agente parar e imprimi-la, em vez
   * de propor conteúdo — é como um agente diz "ainda não é a minha vez".
   */
  gate?: (context: BusinessContext) => string | null;
  /** Instrução final, específica do agente, sobre o que produzir. */
  instrucao: (alvo: ContentItem) => string;
};

/**
 * Executa um agente que escreve um item de conteúdo.
 *
 * Os 8 agentes de conteúdo (founder-coach e os que só leem ficam de fora) têm
 * a mesma espinha dorsal: ler o contexto, checar pré-requisito, escolher o
 * alvo, montar o prompt, chamar o Claude e registrar a proposta para revisão
 * humana. O que os diferencia é o system prompt, o contexto cruzado que cada um
 * considera relevante e o gate — e é exatamente isso que a `DefinicaoAgente`
 * pede. Manter a espinha dorsal aqui evita 8 cópias divergindo com o tempo.
 */
export async function rodarAgenteDeItem(def: DefinicaoAgente): Promise<void> {
  const log = criarLogger(def.agente);

  log("Buscando contexto em GET /api/context...");
  const context = await fetchContext();
  const itensDaCategoria = context.categories[def.categoria];

  if (itensDaCategoria.length === 0) {
    throw new Error(`Nenhum item encontrado na categoria '${def.categoria}'.`);
  }

  const bloqueio = def.gate?.(context);

  if (bloqueio) {
    log(`Parando: ${bloqueio}`);
    return;
  }

  const meusItens = def.alvos
    .map((slug) => itensDaCategoria.find((item) => item.slug === slug))
    .filter((item): item is ContentItem => Boolean(item));

  if (meusItens.length === 0) {
    throw new Error(
      `Nenhum dos itens sob responsabilidade deste agente existe em '${def.categoria}': ${def.alvos.join(", ")}.`
    );
  }

  // Não enfileira proposta em cima de proposta: o founder revisa a atual antes.
  const pendente = meusItens.find((item) => item.reviewStatus === "proposed");

  if (pendente) {
    log(
      `Já existe uma proposta pendente em ${def.categoria}/${pendente.slug} (de ${pendente.proposedBy}). Revise-a antes de gerar outra.`
    );
    return;
  }

  // Primeiro item ainda não preenchido; se todos estiverem, o mais parado.
  const alvo =
    meusItens.find((item) => pareceVazio(item)) ??
    [...meusItens].sort((a, b) =>
      (a.updatedAt || "").localeCompare(b.updatedAt || "")
    )[0];

  log(
    `Alvo: ${def.categoria}/${alvo.slug} ("${alvo.title}", status: ${alvo.status}, atualizado em ${alvo.updatedAt || "nunca"}).`
  );

  const blocos = def
    .contexto(context, alvo)
    .map(
      (bloco) =>
        `## ${bloco.titulo}\n\n${
          bloco.itens.length > 0 ? formatarItens(bloco.itens) : "(vazio por enquanto)"
        }`
    )
    .join("\n\n");

  const userPrompt = `${blocos}

## Item que você deve escrever agora

${formatarItem(alvo, `${def.categoria}/${alvo.slug}`)}

---

${def.instrucao(alvo)}

${FORMATO_JSON}`;

  log("Chamando o Claude Code para gerar a proposta (pode levar um tempo)...");
  const output = await runClaudeForProposal(def.systemPrompt, userPrompt);

  log(`Proposta gerada (confiança: ${output.confidence ?? "não informada"}).`);

  await proposeWrite({
    category: def.categoria,
    slug: alvo.slug,
    agent: def.agente,
    rationale: output.rationale,
    body: output.proposedBody,
    summary: output.proposedSummary,
  });

  log(
    `Concluído. Abra /${def.categoria}/${alvo.slug} no BusinessOS para revisar e aceitar ou rejeitar.`
  );
}

/**
 * Qual agente cuida de qual item. O `seed-assistant` usa isso para dizer ao
 * founder exatamente qual comando rodar em seguida, e serve como índice único
 * da correspondência item → agente (agents.config.json guarda as permissões;
 * aqui fica a navegação).
 */
export const AGENTE_POR_ITEM: Record<string, { agente: string; comando: string }> = {
  "founder/objetivo": { agente: "agent:founder-coach", comando: "npm run agent:founder" },
  "founder/estilo-de-vida": { agente: "agent:founder-coach", comando: "npm run agent:founder" },
  "direcao/mapa-do-mercado": { agente: "agent:market-map", comando: "npm run agent:market" },
  "direcao/mapa-de-problemas": { agente: "agent:problem-magnet", comando: "npm run agent:problemas" },
  "direcao/perfil-ideal-de-cliente": { agente: "agent:icp", comando: "npm run agent:icp" },
  "direcao/tese-de-valor": { agente: "agent:value-thesis", comando: "npm run agent:tese" },
  "direcao/oferta": { agente: "agent:offer-strategist", comando: "npm run agent:oferta" },
  "validacao/oferta": { agente: "agent:validation-synth", comando: "npm run agent:validacao" },
  "validacao/primeiros-clientes": { agente: "agent:validation-synth", comando: "npm run agent:validacao" },
  "caixa/fluxo-de-caixa": { agente: "agent:cash-flow", comando: "npm run agent:caixa" },
  "caixa/erp": { agente: "agent:cash-flow", comando: "npm run agent:caixa" },
};

/**
 * A cadeia causal da Direção. Continua existindo mesmo depois de a Direção ter
 * virado 5 agentes independentes: cada um precisa saber quais elos vêm ANTES
 * dele, porque são esses — e só esses — que entram como contexto. Os elos
 * posteriores dependem deste item, não o contrário.
 */
export const CADEIA_DIRECAO = [
  "mapa-do-mercado",
  "mapa-de-problemas",
  "perfil-ideal-de-cliente",
  "tese-de-valor",
  "oferta",
] as const;

/** Elos da cadeia da Direção anteriores a `slug`, na ordem da cadeia. */
export function elosAnteriores(
  context: BusinessContext,
  slug: string
): ContentItem[] {
  const posicao = CADEIA_DIRECAO.indexOf(slug as (typeof CADEIA_DIRECAO)[number]);

  if (posicao <= 0) return [];

  const anteriores = CADEIA_DIRECAO.slice(0, posicao);

  return anteriores
    .map((anterior) =>
      context.categories.direcao.find((item) => item.slug === anterior)
    )
    .filter((item): item is ContentItem => Boolean(item));
}

/**
 * Gate compartilhado pelos agentes da Direção: um elo da cadeia não deve ser
 * escrito antes do elo anterior. Sem o Mapa de Problemas não há como definir o
 * ICP; sem o ICP não há Tese de Valor honesta.
 */
export function gateDaCadeia(slug: string) {
  return (context: BusinessContext): string | null => {
    const anteriores = elosAnteriores(context, slug);
    const vazios = anteriores.filter((item) => pareceVazio(item));

    if (vazios.length === 0) return null;

    return `os elos anteriores da cadeia ainda estão vazios (${vazios
      .map((item) => `direcao/${item.slug}`)
      .join(", ")}). Rode os agentes desses itens primeiro — este item depende deles.`;
  };
}
