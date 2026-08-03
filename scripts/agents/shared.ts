import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import type { ContentItem } from "../skills/shared";

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
        "",
        "--model",
        AGENT_CLI_MODEL,
        "--system-prompt-file",
        promptFile,
      ],
      {
        cwd: os.tmpdir(),
        shell: process.platform === "win32",
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
function stripCodeFence(text: string): string {
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

const LIMITE_CONTEUDO_VAZIO = 200;

/** Heurística simples: item com corpo muito curto ainda não foi realmente escrito. */
export function pareceVazio(item: ContentItem | undefined): boolean {
  return !item || item.body.trim().length < LIMITE_CONTEUDO_VAZIO;
}

/** Renderiza um item como bloco de texto para entrar no prompt do agente. */
export function formatarItem(item: ContentItem | undefined, rotulo: string): string {
  if (!item) {
    return `### ${rotulo}\n(item não encontrado)\n`;
  }

  const corpo = item.body.trim() || "(vazio)";

  return `### ${rotulo} — ${item.title}
status: ${item.status}
resumo: ${item.summary || "(vazio)"}
atualizado em: ${item.updatedAt || "(nunca)"}

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
