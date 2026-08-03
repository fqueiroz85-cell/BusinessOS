import fs from "fs";
import path from "path";

/**
 * Permissões declaradas por agente (Fase 3 de docs/agents-integration.md).
 *
 * A validação vive aqui, no lado do BusinessOS, e não nos scripts de agente:
 * um agente externo mal-comportado (ou com um bug de prompt) não deve conseguir
 * escrever fora do escopo que ele mesmo declarou. `POST /api/agent/write` é o
 * único ponto por onde escrita de agente entra, então é onde a checagem roda.
 */
export type AgentPermissions = {
  description: string;
  reads: string[];
  writes: string[];
  writeFields: string[];
};

type AgentsConfig = {
  agents: Record<string, AgentPermissions>;
};

const CONFIG_PATH = path.join(process.cwd(), "agents.config.json");

let cachedConfig: AgentsConfig | null = null;

function loadConfig(): AgentsConfig {
  if (cachedConfig) return cachedConfig;

  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  cachedConfig = JSON.parse(raw) as AgentsConfig;

  return cachedConfig;
}

export function getAgentPermissions(agent: string): AgentPermissions | null {
  return loadConfig().agents[agent] ?? null;
}

/**
 * Um escopo é "categoria/slug" (item específico) ou "categoria/*" (categoria
 * inteira). Não existe curinga global — um agente sempre lista as categorias
 * que toca, mesmo que sejam todas as quatro.
 */
function scopeMatches(scope: string, category: string, slug: string): boolean {
  const [scopeCategory, scopeSlug] = scope.split("/");

  if (scopeCategory !== category) return false;

  return scopeSlug === "*" || scopeSlug === slug;
}

export type PermissionCheck =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * Valida se `agent` pode propor mudança em `category/slug` mexendo nos campos
 * `fields`. Falha fechada: agente não declarado em agents.config.json não
 * escreve em lugar nenhum.
 */
export function canAgentWrite(
  agent: string,
  category: string,
  slug: string,
  fields: string[]
): PermissionCheck {
  const permissions = getAgentPermissions(agent);

  if (!permissions) {
    return {
      allowed: false,
      reason: `Agente "${agent}" não está declarado em agents.config.json. Cadastre-o com seus escopos de leitura/escrita antes de propor mudanças.`,
    };
  }

  const inScope = permissions.writes.some((scope) =>
    scopeMatches(scope, category, slug)
  );

  if (!inScope) {
    return {
      allowed: false,
      reason: `Agente "${agent}" não tem permissão de escrita em ${category}/${slug}. Escopo declarado: ${permissions.writes.join(", ") || "(nenhum)"}.`,
    };
  }

  const forbidden = fields.filter(
    (field) => !permissions.writeFields.includes(field)
  );

  if (forbidden.length > 0) {
    return {
      allowed: false,
      reason: `Agente "${agent}" não pode alterar o campo ${forbidden.join(", ")} de ${category}/${slug}. Campos permitidos: ${permissions.writeFields.join(", ")}.`,
    };
  }

  return { allowed: true };
}
