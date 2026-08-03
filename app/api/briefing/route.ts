import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { spawn } from "child_process";
import os from "os";
import { getItem, saveAnswers, saveBriefing } from "@/lib/content";
import { getQuestions } from "@/lib/questions";

type BriefingPayload = {
  category: string;
  slug: string;
  answers: Record<string, string>;
};

// "claude-code" usa o Claude Code CLI já logado (sua assinatura Claude,
// sem chave de API paga por token) — ver docs/agents-integration.md.
// "ollama" mantém o modelo local original como alternativa.
const BRIEFING_PROVIDER = process.env.BRIEFING_PROVIDER ?? "claude-code";

const SYSTEM_PROMPT =
  "Você é um consultor que ajuda founders solo brasileiros a transformar respostas soltas em um briefing claro e acionável, em português do Brasil. Seja direto, use subtítulos curtos, e não invente informação que não esteja nas respostas.";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2:3b";

type OllamaChatResponse = {
  message?: { content?: string };
  error?: string;
};

// Modelo usado nas chamadas ao Claude Code CLI. Padrão é Haiku (o mais barato/
// rápido da família Claude) porque essa é uma tarefa curta de síntese de texto,
// chamada repetidamente pelo botão "Gerar briefing" — não vale gastar cota da
// assinatura com um modelo maior para isso.
const CLAUDE_CLI_MODEL = process.env.CLAUDE_CLI_MODEL ?? "haiku";

type ClaudeCliResult = {
  is_error: boolean;
  subtype?: string;
  result?: string;
};

/**
 * Gera o briefing chamando o Claude Code CLI em modo não-interativo
 * (`claude -p`), rodando sob a sessão logada do usuário (assinatura
 * Claude — Free/Pro/Max), não uma chave de API cobrada por token.
 * Roda a partir de um diretório neutro (fora do repo) para não puxar
 * AGENTS.md/CLAUDE.md do BusinessOS para dentro do prompt.
 */
async function generateBriefingWithClaudeCode(
  itemTitle: string,
  qaText: string
): Promise<string> {
  const userPrompt = `Item: "${itemTitle}"\n\n${qaText}\n\nEscreva um briefing curto (até 300 palavras) sintetizando essas respostas.`;

  return new Promise((resolve, reject) => {
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
        CLAUDE_CLI_MODEL,
        "--system-prompt",
        SYSTEM_PROMPT,
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
          `Não foi possível executar o Claude Code CLI ("claude"). Verifique se ele está instalado e logado (rode "claude auth status"). Detalhe: ${err.message}`
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

      let payload: ClaudeCliResult;
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
  });
}

async function generateBriefingWithOllama(
  itemTitle: string,
  qaText: string
): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Item: "${itemTitle}"\n\n${qaText}\n\nEscreva um briefing curto (até 300 palavras) sintetizando essas respostas.`,
          },
        ],
      }),
    });
  } catch {
    throw new Error(
      `Não foi possível conectar ao Ollama em ${OLLAMA_BASE_URL}. Verifique se o Ollama está rodando (abra o app Ollama ou rode "ollama serve").`
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | OllamaChatResponse
    | null;

  if (!response.ok) {
    const message = payload?.error ?? `Ollama respondeu com status ${response.status}.`;
    if (message.toLowerCase().includes("not found")) {
      throw new Error(
        `Modelo "${OLLAMA_MODEL}" não encontrado no Ollama. Rode "ollama pull ${OLLAMA_MODEL}" e tente de novo.`
      );
    }
    throw new Error(message);
  }

  const text = payload?.message?.content?.trim();

  if (!text) {
    throw new Error("O Ollama não retornou nenhum texto.");
  }

  return text;
}

function generateBriefing(itemTitle: string, qaText: string): Promise<string> {
  return BRIEFING_PROVIDER === "ollama"
    ? generateBriefingWithOllama(itemTitle, qaText)
    : generateBriefingWithClaudeCode(itemTitle, qaText);
}

export async function POST(request: Request) {
  let payload: BriefingPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido." },
      { status: 400 }
    );
  }

  const { category, slug, answers } = payload;

  if (!category || !slug || !answers) {
    return NextResponse.json(
      { success: false, error: "category, slug e answers são obrigatórios." },
      { status: 400 }
    );
  }

  const item = getItem(category, slug);

  if (!item) {
    return NextResponse.json(
      { success: false, error: "Item não encontrado." },
      { status: 404 }
    );
  }

  saveAnswers(category, slug, answers);

  const questions = getQuestions(category, slug);
  const qaText = questions
    .map(
      (question) =>
        `Pergunta: ${question.label}\nResposta: ${
          answers[question.id]?.trim() || "(não respondida)"
        }`
    )
    .join("\n\n");

  let briefingText: string;

  try {
    briefingText = await generateBriefing(item.title, qaText);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao gerar briefing.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  }

  const updatedItem = saveBriefing(category, slug, briefingText);

  revalidatePath(`/${category}/${slug}`);

  return NextResponse.json({ success: true, item: updatedItem });
}
