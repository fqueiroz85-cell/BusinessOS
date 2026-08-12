"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Question } from "@/lib/questions";

type ItemQuestionsProps = {
  questions: Question[];
  answers: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
};

export function ItemQuestions({
  questions,
  answers,
  onChange,
}: ItemQuestionsProps) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question) => (
        <div key={question.id} className="flex flex-col gap-2">
          <Label htmlFor={`question-${question.id}`}>{question.label}</Label>
          <Textarea
            id={`question-${question.id}`}
            value={answers[question.id] ?? ""}
            placeholder={question.placeholder}
            onChange={(e) => onChange(question.id, e.target.value)}
            className="min-h-24"
          />
          {question.hint ? (
            <p className="text-xs text-muted-foreground">{question.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
