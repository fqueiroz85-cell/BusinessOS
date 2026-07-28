const BASE_URL = process.env.BUSINESSOS_URL ?? "http://localhost:3000";

export type ContentStatus = "not_started" | "in_progress" | "done";

export type ContentItem = {
  title: string;
  slug: string;
  category: string;
  order: number;
  summary: string;
  status: ContentStatus;
  updatedAt: string;
  body: string;
  reviewStatus?: "proposed" | "accepted" | "rejected";
  proposedBy?: string;
  proposedAt?: string;
  proposedRationale?: string;
  proposedSummary?: string;
  proposedBody?: string;
};

export type BusinessContext = {
  generatedAt: string;
  categories: {
    founder: ContentItem[];
    direcao: ContentItem[];
    validacao: ContentItem[];
    caixa: ContentItem[];
  };
};

/**
 * Busca o snapshot completo do contexto de negócio via GET /api/context.
 *
 * Este script roda fora do processo do BusinessOS (simulando um agente/skill
 * externo, conforme docs/agents-integration.md seção 1), então ele consome
 * a API HTTP em vez de importar `lib/content.ts` diretamente.
 */
export async function fetchContext(): Promise<BusinessContext> {
  const response = await fetch(`${BASE_URL}/api/context`);

  if (!response.ok) {
    throw new Error(
      `GET /api/context falhou: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as BusinessContext;
}

export type ProposeWriteInput = {
  category: string;
  slug: string;
  agent: string;
  rationale: string;
  body?: string;
  summary?: string;
};

type AgentWriteResponse =
  | { success: true; item: ContentItem }
  | { success: false; error: string };

/**
 * Propõe uma mudança de conteúdo via POST /api/agent/write.
 *
 * A skill nunca escreve em disco diretamente (contrato da seção 4 do
 * docs/agents-integration.md) — ela apenas envia a proposta para a rota
 * dedicada de escrita por agente, que grava `proposedBody`/`proposedRationale`
 * e marca `reviewStatus: "proposed"`, deixando a decisão final (aceitar ou
 * rejeitar) para Felipe na UI.
 */
export async function proposeWrite(
  input: ProposeWriteInput
): Promise<ContentItem> {
  const response = await fetch(`${BASE_URL}/api/agent/write`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let payload: AgentWriteResponse;

  try {
    payload = (await response.json()) as AgentWriteResponse;
  } catch {
    throw new Error(
      `POST /api/agent/write retornou uma resposta que não é JSON válido (status ${response.status}).`
    );
  }

  if (!response.ok || !payload.success) {
    const message =
      "error" in payload && payload.error
        ? payload.error
        : `POST /api/agent/write falhou com status ${response.status}.`;
    console.error(
      `[proposeWrite] Erro ao propor mudança em ${input.category}/${input.slug} (agent: ${input.agent}): ${message}`
    );
    throw new Error(message);
  }

  console.log(
    `[proposeWrite] Proposta registrada com sucesso em ${input.category}/${input.slug} (agent: ${input.agent}, reviewStatus: ${payload.item.reviewStatus ?? "desconhecido"}).`
  );

  return payload.item;
}
