"use client";

import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemBriefing } from "@/components/item-briefing";
import { MarkdownContent } from "@/lib/markdown";
import { STATUS_LABELS } from "@/lib/status";
import type { ContentStatus } from "@/lib/content";
import type { Question } from "@/lib/questions";

type ItemReportProps = {
  status: ContentStatus;
  summary: string;
  body: string;
  questions: Question[];
  answers: Record<string, string>;
  briefing?: string;
  briefingGeneratedAt?: string;
  onEdit: () => void;
  onAnswerQuestions: () => void;
  onGenerateBriefing: () => void;
  generatingBriefing: boolean;
  briefingError: string | null;
};

const STATUS_BADGE_VARIANT: Record<
  ContentStatus,
  "default" | "secondary" | "outline"
> = {
  done: "default",
  in_progress: "secondary",
  not_started: "outline",
};

function AnswerProgressRing({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--muted)"
        strokeWidth="6"
      />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="6"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

export function ItemReport({
  status,
  summary,
  body,
  questions,
  answers,
  briefing,
  briefingGeneratedAt,
  onEdit,
  onAnswerQuestions,
  onGenerateBriefing,
  generatingBriefing,
  briefingError,
}: ItemReportProps) {
  const answeredCount = questions.filter(
    (q) => (answers[q.id] ?? "").trim().length > 0
  ).length;
  const hasAnswers = answeredCount > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Badge variant={STATUS_BADGE_VARIANT[status]}>
          {STATUS_LABELS[status]}
        </Badge>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil />
          Editar
        </Button>
      </div>

      {summary ? (
        <p className="max-w-xl text-lg leading-relaxed text-foreground/90">
          {summary}
        </p>
      ) : null}

      {questions.length > 0 ? (
        <div className="flex items-center gap-5 rounded-2xl border border-border/60 bg-muted/40 p-5">
          <div className="relative flex size-16 shrink-0 items-center justify-center">
            <AnswerProgressRing value={answeredCount} max={questions.length} />
            <span className="absolute font-heading text-sm font-semibold text-foreground">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-heading text-sm font-medium text-foreground">
              Perguntas respondidas
            </p>
            <p className="text-sm text-muted-foreground">
              {answeredCount === questions.length
                ? "Todas as perguntas foram respondidas."
                : `Faltam ${questions.length - answeredCount} de ${questions.length} perguntas.`}
            </p>
          </div>
        </div>
      ) : null}

      {questions.length > 0 ? (
        <ItemBriefing
          briefing={briefing}
          briefingGeneratedAt={briefingGeneratedAt}
          onGenerate={onGenerateBriefing}
          generating={generatingBriefing}
          error={briefingError}
        />
      ) : null}

      {questions.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Respostas
          </h2>
          {hasAnswers ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {questions.map((question) => {
                const answer = answers[question.id]?.trim();
                return (
                  <div
                    key={question.id}
                    className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card p-4"
                  >
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {question.label}
                    </p>
                    {answer ? (
                      <p className="text-sm leading-relaxed text-foreground">
                        {answer}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Ainda não respondida.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border p-6">
              <p className="text-sm text-muted-foreground">
                Nenhuma pergunta respondida ainda.
              </p>
              <Button size="sm" onClick={onAnswerQuestions}>
                Responder perguntas
              </Button>
            </div>
          )}
        </div>
      ) : null}

      {body ? (
        <details className="group flex flex-col gap-4 rounded-xl border border-border/60 p-5">
          <summary className="cursor-pointer list-none font-heading text-sm font-medium text-muted-foreground marker:hidden group-open:text-foreground">
            Guia e framework de referência
          </summary>
          <MarkdownContent content={body} className="mt-1" />
        </details>
      ) : null}
    </div>
  );
}
