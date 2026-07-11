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
};

const CONTENT_DIR = path.join(process.cwd(), "content");

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
  };
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
  const filePath = path.join(CONTENT_DIR, category, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Content item not found: ${category}/${slug}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data: existingFrontmatter, content: existingBody } = matter(raw);

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
  };

  const nextBody = data.body !== undefined ? data.body : existingBody;

  const fileContents = matter.stringify(nextBody.trim() + "\n", nextFrontmatter);

  fs.writeFileSync(filePath, fileContents, "utf-8");
}
