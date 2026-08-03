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

// Teto para não deixar a requisição pendurada se o CLI travar ou ficar
// esperando input interativo que nunca vem.
const CLAUDE_CLI_TIMEOUT_MS = 120_000;

// No Windows o `claude` é um shim .cmd, o que obriga `shell: true` — e aí o
// Node concatena os argumentos sem escape, fazendo uma string vazia sumir do
// comando. `--tools ""` virava `--tools --model`, ou seja: `--tools` engolia o
// `--model`, o modelo escolhido nunca era aplicado (rodava no modelo padrão,
// gastando mais cota) e as ferramentas não eram desligadas. Aspas literais
// sobrevivem à concatenação e chegam ao CLI como string vazia.
const USA_SHELL = process.platform === "win32";
const SEM_FERRAMENTAS = USA_SHELL ? '""' : "";

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
    // Como os argumentos passam pelo parser do cmd.exe (ver USA_SHELL acima),
    // nenhum texto livre — prompt do sistema, respostas do founder — vai em
    // argv: tudo segue por stdin, onde não há quoting para quebrar.
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
        CLAUDE_CLI_MODEL,
      ],
      {
        cwd: os.tmpdir(),
        shell: USA_SHELL,
      }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    function fail(message: string) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill();
      reject(new Error(message));
    }

    function succeed(text: string) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(text);
    }

    const timer = setTimeout(() => {
      fail(
        `O Claude Code CLI não respondeu em ${Math.round(CLAUDE_CLI_TIMEOUT_MS / 1000)}s e foi interrompido. Tente novamente.`
      );
    }, CLAUDE_CLI_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      fail(
        `Não foi possível executar o Claude Code CLI ("claude"). Verifique se ele está instalado e logado (rode "claude auth status"). Detalhe: ${err.message}`
      );
    });

    // Sem este handler, um EPIPE ao escrever para um processo que já morreu
    // vira exceção não capturada e derruba o processo Node inteiro — no dev
    // do Next isso mata o worker de render e a rota passa a dar 500.
    child.stdin.on("error", () => {
      fail(
        'Não foi possível enviar o prompt ao Claude Code CLI (o processo encerrou antes de recebê-lo). Rode "claude auth status" para verificar o login.'
      );
    });

    child.on("close", (code) => {
      if (settled) return;

      if (code !== 0) {
        fail(
          `Claude Code CLI encerrou com código ${code}. ${stderr.trim() || "Sem detalhes adicionais."}`
        );
        return;
      }

      let payload: ClaudeCliResult;
      try {
        payload = JSON.parse(stdout);
      } catch {
        fail("O Claude Code CLI retornou uma resposta que não é JSON válido.");
        return;
      }

      if (payload.is_error || !payload.result) {
        fail(
          `Claude Code CLI retornou um erro (${payload.subtype ?? "desconhecido"}).`
        );
        return;
      }

      succeed(payload.result.trim());
    });

    child.stdin.end(`${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`);
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

  // As três, como nas outras rotas de escrita: a listagem da categoria e a home
  // são estáticas (ver saída do `next build`) e mostram resumo/status do item,
  // então revalidar só a página de detalhe deixava as duas desatualizadas.
  revalidatePath(`/${category}/${slug}`);
  revalidatePath(`/${category}`);
  revalidatePath("/");

  return NextResponse.json({ success: true, item: updatedItem });
}
