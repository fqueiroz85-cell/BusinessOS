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
};

const CONTENT_DIR = path.join(process.cwd(), "content");

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
  };
}

function readRaw(
  category: string,
  slug: string
): { filePath: string; frontmatter: Record<string, unknown>; body: string } {
  const filePath = path.join(CONTENT_DIR, category, `${slug}.md`);

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
  const filePath = path.join(CONTENT_DIR, category, `${slug}.md`);

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

  const nextFrontmatter = {
    ...existingFrontmatter,
    title: data.title ?? existingFrontmatter.title,
    slug: data.slug ?? existingFrontmatter.slug ?? slug,
    category: data.category ?? existingFrontmatter.category ?? category,
    order:
      data.order !== undefined ? data.order : existingFrontmatter.order,
    summary: data.summary ?? existingFrontmatter.summary,
    status: data.status ?? existingFrontmatter.status,
    updatedAt: data.updatedAt ?? new Date().toISOString().slice(0, 10),
    answers: data.answers ?? existingFrontmatter.answers,
  };

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
