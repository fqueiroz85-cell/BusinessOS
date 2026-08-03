"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { renderInline } from "@/lib/markdown";

type ItemBriefingProps = {
  briefing?: string;
  briefingGeneratedAt?: string;
  onGenerate: () => void;
  generating?: boolean;
  error?: string | null;
};

export function ItemBriefing({
  briefing,
  briefingGeneratedAt,
  onGenerate,
  generating = false,
  error = null,
}: ItemBriefingProps) {
  const paragraphs = briefing
    ? briefing.split(/\n{2,}/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-muted/40 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="size-3" />
            Briefing gerado por IA
          </Badge>
          {briefingGeneratedAt ? (
            <span className="text-sm text-muted-foreground">
              Gerado em{" "}
              {new Date(briefingGeneratedAt).toLocaleString("pt-BR")}
            </span>
          ) : null}
        </div>
        <Button onClick={onGenerate} disabled={generating} size="sm">
          {generating
            ? "Gerando..."
            : briefing
              ? "Atualizar briefing"
              : "Gerar briefing"}
        </Button>
      </div>
      {briefing ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
          {paragraphs.map((paragraph, idx) => (
            <p
              key={idx}
              className={
                idx === 0
                  ? "text-base leading-relaxed font-medium text-foreground"
                  : "text-sm leading-relaxed text-muted-foreground"
              }
            >
              {renderInline(paragraph)}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum briefing gerado ainda. Responda as perguntas e clique em
          &quot;Gerar briefing&quot;.
        </p>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
