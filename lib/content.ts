import fs from "fs";
import path from "path";
import matter from "gray-matter";

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
  reviewStatus?: "proposed";
  proposedBy?: string;
  proposedAt?: string;
  proposedRationale?: string;
  proposedSummary?: string;
  proposedBody?: string;
  answers?: Record<string, string>;
  briefing?: string;
  briefingGeneratedAt?: string;
  // Rastro de uma proposta de agente já aceita. Sobrevive à aceitação (ao
  // contrário dos PROPOSAL_FIELDS, que são apagados) porque é o único sinal de
  // que o `body` deixou de ser o template inicial e passou a ter conteúdo real.
  acceptedFrom?: string;
  acceptedAt?: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");

/** As 4 categorias fixas da arquitetura de informação (ver docs/prd.md seção 3). */
export const CATEGORIES = ["founder", "direcao", "validacao", "caixa"] as const;

/** Slug de item: minúsculas, dígitos e hífen. Sem ponto, barra ou espaço. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Monta o caminho de um item validando `category`/`slug` antes.
 *
 * Sem isto, `path.join(CONTENT_DIR, category, slug + ".md")` resolve `..` e
 * escreve fora de content/: um `POST /api/content` com `category: ".."` grava
 * na raiz do repositório, e daí em qualquer lugar onde o processo Node tenha
 * permissão de escrita — inclusive por cima do código-fonte. Como o app não tem
 * autenticação nem checagem de origem na v1, qualquer página aberta no
 * navegador consegue fazer esse POST enquanto o dev server está no ar.
 *
 * A validação vive aqui, e não nas rotas, porque este é o único ponto por onde
 * todos os caminhos de leitura e escrita passam — humano (POST /api/content) e
 * agente (POST /api/agent/write). Validar em uma rota só deixaria a outra
 * aberta.
 */
export class InvalidItemPathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidItemPathError";
  }
}

function itemPath(category: string, slug: string): string {
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    throw new InvalidItemPathError(
      `Categoria inválida: "${category}". Esperado uma de: ${CATEGORIES.join(", ")}.`
    );
  }

  if (!SLUG_PATTERN.test(slug)) {
    throw new InvalidItemPathError(
      `Slug inválido: "${slug}". Use apenas minúsculas, dígitos e hífen.`
    );
  }

  return path.join(CONTENT_DIR, category, `${slug}.md`);
}

const PROPOSAL_FIELDS = [
  "reviewStatus",
  "proposedBy",
  "proposedAt",
  "proposedRationale",
  "proposedSummary",
  "proposedBody",
] as const;

function readMarkdownFile(filePath: string): ContentItem {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    title: data.title ?? "",
    slug: data.slug ?? path.basename(filePath, ".md"),
    category: data.category ?? "",
    order: typeof data.order === "number" ? data.order : 0,
    summary: data.summary ?? "",
    status: (data.status as ContentStatus) ?? "not_started",
    updatedAt: data.updatedAt ?? "",
    body: content.trim(),
    reviewStatus: data.reviewStatus,
    proposedBy: data.proposedBy,
    proposedAt: data.proposedAt,
    proposedRationale: data.proposedRationale,
    proposedSummary: data.proposedSummary,
    proposedBody: data.proposedBody,
    answers: data.answers,
    briefing: data.briefing,
    briefingGeneratedAt: data.briefingGeneratedAt,
    acceptedFrom: data.acceptedFrom,
    acceptedAt: data.acceptedAt,
  };
}

function readRaw(
  category: string,
  slug: string
): { filePath: string; frontmatter: Record<string, unknown>; body: string } {
  const filePath = itemPath(category, slug);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Content item not found: ${category}/${slug}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return { filePath, frontmatter: data, body: content };
}

function writeRaw(
  filePath: string,
  frontmatter: Record<string, unknown>,
  body: string
): void {
  const fileContents = matter.stringify(body.trim() + "\n", frontmatter);
  fs.writeFileSync(filePath, fileContents, "utf-8");
}

/**
 * Reads every .md file inside content/<category> and returns
 * them as ContentItem records, sorted by their `order` field.
 */
export function getCategoryItems(category: string): ContentItem[] {
  // Mesma razão de itemPath: sem isto, `category: ".."` lista os .md da raiz do
  // repositório. É só leitura, mas continua sendo conteúdo fora de content/.
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return [];
  }

  const categoryDir = path.join(CONTENT_DIR, category);

  if (!fs.existsSync(categoryDir)) {
    return [];
  }

  const files = fs
    .readdirSync(categoryDir)
    .filter((file) => file.endsWith(".md"));

  const items = files.map((file) =>
    readMarkdownFile(path.join(categoryDir, file))
  );

  return items.sort((a, b) => a.order - b.order);
}

/**
 * Reads a single content item by category + slug.
 * Returns null if the file does not exist.
 */
export function getItem(category: string, slug: string): ContentItem | null {
  let filePath: string;

  try {
    filePath = itemPath(category, slug);
  } catch {
    // Leitura com category/slug inválidos é "não existe", não erro 500 — as
    // páginas do app chamam getItem com params vindos da URL.
    return null;
  }

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return readMarkdownFile(filePath);
}

/**
 * Merges new field values into an existing item's frontmatter/body
 * and rewrites the .md file on disk.
 */
export function saveItem(
  category: string,
  slug: string,
  data: Partial<ContentItem>
): void {
  const { filePath, frontmatter: existingFrontmatter, body: existingBody } =
    readRaw(category, slug);

  const atualizacoes: Record<string, unknown> = {
    title: data.title ?? existingFrontmatter.title,
    slug: data.slug ?? existingFrontmatter.slug ?? slug,
    category: data.category ?? existingFrontmatter.category ?? category,
    order: data.order !== undefined ? data.order : existingFrontmatter.order,
    summary: data.summary ?? existingFrontmatter.summary,
    status: data.status ?? existingFrontmatter.status,
    updatedAt: data.updatedAt ?? new Date().toISOString().slice(0, 10),
    answers: data.answers ?? existingFrontmatter.answers,
  };

  // `matter.stringify` serializa com js-yaml, que **lança** ao encontrar
  // `undefined` ("unacceptable kind of an object to dump"). Escrever a chave
  // com valor indefinido quebrava o salvamento de todo item que ainda não
  // tivesse `answers` no frontmatter — 9 dos 11 itens do scaffold. Só entram
  // no frontmatter as chaves que de fato têm valor.
  const nextFrontmatter: Record<string, unknown> = { ...existingFrontmatter };

  for (const [chave, valor] of Object.entries(atualizacoes)) {
    if (valor !== undefined) nextFrontmatter[chave] = valor;
  }

  const nextBody = data.body !== undefined ? data.body : existingBody;

  writeRaw(filePath, nextFrontmatter, nextBody);
}

export type ProposeChangeInput = {
  agent: string;
  rationale: string;
  body?: string;
  summary?: string;
};

/**
 * Lançado quando um agente tenta propor mudança em um item que já tem proposta
 * aguardando revisão. Tipo próprio para a rota poder responder 409 em vez de
 * confundir com "item não encontrado".
 */
export class ProposalPendingError extends Error {
  constructor(category: string, slug: string, proposedBy: unknown) {
    super(
      `${category}/${slug} já tem uma proposta pendente de ${
        proposedBy ?? "um agente"
      }. Aceite ou rejeite antes de propor outra.`
    );
    this.name = "ProposalPendingError";
  }
}

/**
 * Records a pending proposal from an external agent/skill in the item's
 * frontmatter. Never touches title/summary/status/body/updatedAt directly —
 * the founder must accept the proposal for it to become real content.
 */
export function proposeChange(
  category: string,
  slug: string,
  input: ProposeChangeInput
): ContentItem {
  const { filePath, frontmatter, body } = readRaw(category, slug);

  // Uma proposta pendente não pode ser sobrescrita por outra: o founder perderia
  // silenciosamente a versão que ainda não revisou. Os agentes já checam isso
  // antes de chamar, mas a garantia precisa estar aqui — é o ponto por onde toda
  // proposta passa, inclusive as de agentes escritos por terceiros.
  if (frontmatter.reviewStatus === "proposed") {
    throw new ProposalPendingError(category, slug, frontmatter.proposedBy);
  }

  const nextFrontmatter: Record<string, unknown> = {
    ...frontmatter,
    reviewStatus: "proposed",
    proposedBy: input.agent,
    proposedAt: new Date().toISOString(),
    proposedRationale: input.rationale,
  };

  if (input.body !== undefined) {
    nextFrontmatter.proposedBody = input.body;
  }
  if (input.summary !== undefined) {
    nextFrontmatter.proposedSummary = input.summary;
  }

  writeRaw(filePath, nextFrontmatter, body);

  return readMarkdownFile(filePath);
}

/**
 * Accepts the pending proposal: proposedBody/proposedSummary (if present)
 * become the item's body/summary, updatedAt is refreshed, and all proposal
 * fields are removed from the frontmatter.
 */
export function acceptProposal(category: string, slug: string): ContentItem {
  const { filePath, frontmatter, body } = readRaw(category, slug);

  if (frontmatter.reviewStatus !== "proposed") {
    throw new Error(`No pending proposal for ${category}/${slug}`);
  }

  const nextFrontmatter: Record<string, unknown> = { ...frontmatter };
  const nextBody =
    typeof frontmatter.proposedBody === "string"
      ? frontmatter.proposedBody
      : body;

  if (typeof frontmatter.proposedSummary === "string") {
    nextFrontmatter.summary = frontmatter.proposedSummary;
  }
  nextFrontmatter.updatedAt = new Date().toISOString().slice(0, 10);

  // Marca que o corpo deste item já não é mais o template inicial — os agentes
  // usam isso para não re-atacar eternamente um item que eles mesmos escreveram
  // e o founder aceitou (ver `pareceVazio` em scripts/agents/shared.ts).
  if (typeof frontmatter.proposedBy === "string") {
    nextFrontmatter.acceptedFrom = frontmatter.proposedBy;
  }
  nextFrontmatter.acceptedAt = new Date().toISOString();

  for (const field of PROPOSAL_FIELDS) {
    delete nextFrontmatter[field];
  }

  writeRaw(filePath, nextFrontmatter, nextBody);

  return readMarkdownFile(filePath);
}

/**
 * Discards the pending proposal without touching the item's actual content.
 */
export function rejectProposal(category: string, slug: string): ContentItem {
  const { filePath, frontmatter, body } = readRaw(category, slug);

  if (frontmatter.reviewStatus !== "proposed") {
    throw new Error(`No pending proposal for ${category}/${slug}`);
  }

  const nextFrontmatter: Record<string, unknown> = { ...frontmatter };

  for (const field of PROPOSAL_FIELDS) {
    delete nextFrontmatter[field];
  }

  writeRaw(filePath, nextFrontmatter, body);

  return readMarkdownFile(filePath);
}

/**
 * Saves the founder's raw answers to an item's structured questions
 * (see lib/questions.ts) without touching any other field.
 */
export function saveAnswers(
  category: string,
  slug: string,
  answers: Record<string, string>
): ContentItem {
  const { filePath, frontmatter, body } = readRaw(category, slug);

  const nextFrontmatter: Record<string, unknown> = { ...frontmatter, answers };

  writeRaw(filePath, nextFrontmatter, body);

  return readMarkdownFile(filePath);
}

/**
 * Saves an AI-generated briefing synthesized from an item's answers.
 * Kept separate from `body` so the founder's own notes are never overwritten.
 */
export function saveBriefing(
  category: string,
  slug: string,
  briefing: string
): ContentItem {
  const { filePath, frontmatter, body } = readRaw(category, slug);

  const nextFrontmatter: Record<string, unknown> = {
    ...frontmatter,
    briefing,
    briefingGeneratedAt: new Date().toISOString(),
  };

  writeRaw(filePath, nextFrontmatter, body);

  return readMarkdownFile(filePath);
}
