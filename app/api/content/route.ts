import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { saveItem } from "@/lib/content";
import type { ContentStatus } from "@/lib/content";

type ContentPayload = {
  category: string;
  slug: string;
  title?: string;
  summary?: string;
  status?: ContentStatus;
  body?: string;
  answers?: Record<string, string>;
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

  const { category, slug, title, summary, status, body, answers } = payload;

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
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao salvar.";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }

  revalidatePath(`/${category}/${slug}`);
  revalidatePath(`/${category}`);
  revalidatePath("/");

  return NextResponse.json({ success: true });
}
