"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProposalBannerProps = {
  category: string;
  slug: string;
  proposedBy: string;
  proposedAt: string;
  proposedRationale: string;
  proposedSummary?: string;
  proposedBody?: string;
  currentSummary: string;
  currentBody: string;
};

export function ProposalBanner({
  category,
  slug,
  proposedBy,
  proposedAt,
  proposedRationale,
  proposedSummary,
  proposedBody,
  currentSummary,
  currentBody,
}: ProposalBannerProps) {
  const router = useRouter();
  const [deciding, setDeciding] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDecision(decision: "accept" | "reject") {
    setDeciding(decision);
    setError(null);

    try {
      const res = await fetch("/api/agent/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, slug, decision }),
      });

      if (!res.ok) {
        throw new Error("Falha ao revisar proposta");
      }

      router.refresh();
    } catch {
      setError("Não foi possível registrar a decisão. Tente novamente.");
    } finally {
      setDeciding(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-muted/40 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Proposta pendente</Badge>
        <span className="text-sm text-muted-foreground">
          Proposto por {proposedBy} em{" "}
          {new Date(proposedAt).toLocaleString("pt-BR")}
        </span>
      </div>

      <p className="text-sm">{proposedRationale}</p>

      {proposedSummary ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Resumo</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Atual</p>
              <p className="rounded-lg border bg-background p-2.5 text-sm">
                {currentSummary}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Proposto</p>
              <p className="rounded-lg border bg-background p-2.5 text-sm">
                {proposedSummary}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {proposedBody ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Conteúdo</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Atual</p>
              <pre className="max-h-64 overflow-auto rounded-lg border bg-background p-2.5 font-mono text-xs whitespace-pre-wrap">
                {currentBody}
              </pre>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Proposto</p>
              <pre className="max-h-64 overflow-auto rounded-lg border bg-background p-2.5 font-mono text-xs whitespace-pre-wrap">
                {proposedBody}
              </pre>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleDecision("accept")}
          disabled={deciding !== null}
        >
          {deciding === "accept" ? "Aceitando..." : "Aceitar"}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleDecision("reject")}
          disabled={deciding !== null}
        >
          {deciding === "reject" ? "Rejeitando..." : "Rejeitar"}
        </Button>
        {error ? (
          <span className="text-sm text-destructive">{error}</span>
        ) : null}
      </div>
    </div>
  );
}
