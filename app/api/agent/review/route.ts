import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { acceptProposal, rejectProposal } from "@/lib/content";

type AgentReviewPayload = {
  category: string;
  slug: string;
  decision: "accept" | "reject";
};

export async function POST(request: Request) {
  let payload: AgentReviewPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON inválido." },
      { status: 400 }
    );
  }

  const { category, slug, decision } = payload;

  if (!category || !slug || (decision !== "accept" && decision !== "reject")) {
    return NextResponse.json(
      {
        success: false,
        error:
          "category, slug e decision (\"accept\" ou \"reject\") são obrigatórios.",
      },
      { status: 400 }
    );
  }

  let item;

  try {
    item =
      decision === "accept"
        ? acceptProposal(category, slug)
        : rejectProposal(category, slug);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao processar revisão.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  revalidatePath(`/${category}/${slug}`);
  revalidatePath(`/${category}`);
  revalidatePath("/");

  return NextResponse.json({ success: true, item });
}
