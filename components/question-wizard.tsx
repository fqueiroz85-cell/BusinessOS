"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/questions";

type QuestionWizardProps = {
  questions: Question[];
  answers: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
  onAdvance?: () => void;
  onComplete: () => void;
  onSkip: () => void;
};

export function QuestionWizard({
  questions,
  answers,
  onChange,
  onAdvance,
  onComplete,
  onSkip,
}: QuestionWizardProps) {
  const [step, setStep] = useState(0);
  const question = questions[step];
  const isLast = step === questions.length - 1;
  const value = answers[question.id] ?? "";

  function handleNext() {
    onAdvance?.();
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-muted/40 p-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          Pergunta {step + 1} de {questions.length}
        </span>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Ver todas de uma vez
        </button>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((step + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label
          htmlFor={`wizard-${question.id}`}
          className="font-heading text-base font-medium text-foreground"
        >
          {question.label}
        </Label>
        <Textarea
          key={question.id}
          id={`wizard-${question.id}`}
          value={value}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="min-h-32"
          autoFocus
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
          Voltar
        </Button>
        <Button onClick={handleNext}>{isLast ? "Concluir" : "Avançar"}</Button>
      </div>
    </div>
  );
}
