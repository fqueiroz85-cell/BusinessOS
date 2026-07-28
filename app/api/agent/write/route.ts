import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { proposeChange } from "@/lib/content";

type AgentWritePayload = {
  category: string;
  slug: string;
  agent: string;
  rationale: string;
  body?: string;
  summary?: string;
};

export async function POST(request: Request) {
  let payload: AgentWritePayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido." },
      { status: 400 }
    );
  }

  const { category, slug, agent, rationale, body, summary } = payload;

  if (!category || !slug || !agent || !rationale) {
    return NextResponse.json(
      {
        success: false,
        error: "category, slug, agent e rationale são obrigatórios.",
      },
      { status: 400 }
    );
  }

  let item;

  try {
    item = proposeChange(category, slug, { agent, rationale, body, summary });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao propor mudança.";
    return NextResponse.json({ success: false, error: message }, { status: 404 });
  }

  revalidatePath(`/${category}/${slug}`);
  revalidatePath(`/${category}`);
  revalidatePath("/");

  return NextResponse.json({ success: true, item });
}
