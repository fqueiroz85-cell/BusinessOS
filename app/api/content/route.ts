import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { InvalidItemPathError, saveItem } from "@/lib/content";
import type { ContentStatus } from "@/lib/content";

type ContentPayload = {
  category: string;
  slug: string;
  title?: string;
  summary?: string;
  status?: ContentStatus;
  body?: string;
  answers?: Record<string, string>;
  responsavel?: string;
  tags?: string[];
  order?: number;
};

export async function POST(request: Request) {
  let payload: ContentPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido." },
      { status: 400 }
    );
  }

  const { category, slug, title, summary, status, body, answers, responsavel, tags, order } =
    payload;

  if (!category || !slug) {
    return NextResponse.json(
      { success: false, error: "category e slug são obrigatórios." },
      { status: 400 }
    );
  }

  try {
    saveItem(category, slug, {
      title,
      summary,
      status,
      body,
      answers,
      responsavel,
      tags,
      order,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    // category/slug malformados são erro do cliente (400), não "não existe"
    // (404) — devolver 404 para `category: ".."` mascarava uma tentativa de
    // path traversal como um item ausente qualquer.
    if (err instanceof InvalidItemPathError) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 400 }
      );
    }

    const message = err instanceof Error ? err.message : "Erro ao salvar.";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }

  revalidatePath(`/${category}/${slug}`);
  revalidatePath(`/${category}`);
  revalidatePath("/");

  return NextResponse.json({ success: true });
}
