"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionWizard } from "@/components/question-wizard";
import { ItemQuestions } from "@/components/item-questions";
import { ItemReport } from "@/components/item-report";
import { STATUS_LABELS, STATUS_OPTIONS } from "@/lib/status";
import type { ContentItem, ContentStatus } from "@/lib/content";
import { getQuestions } from "@/lib/questions";

type ItemEditorProps = {
  item: ContentItem;
};

function hasAnyAnswer(answers: Record<string, string>) {
  return Object.values(answers).some((value) => value.trim().length > 0);
}

export function ItemEditor({ item }: ItemEditorProps) {
  const router = useRouter();
  const questions = getQuestions(item.category, item.slug);
  const startsOnboarding =
    questions.length > 0 && !hasAnyAnswer(item.answers ?? {});

  const [title, setTitle] = useState(item.title);
  const [summary, setSummary] = useState(item.summary);
  const [status, setStatus] = useState<ContentStatus>(item.status);
  const [body, setBody] = useState(item.body);
  const [answers, setAnswers] = useState<Record<string, string>>(
    item.answers ?? {}
  );
  const [briefing, setBriefing] = useState(item.briefing);
  const [briefingGeneratedAt, setBriefingGeneratedAt] = useState(
    item.briefingGeneratedAt
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatingBriefing, setGeneratingBriefing] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const [wizardActive, setWizardActive] = useState(startsOnboarding);
  const [editOpen, setEditOpen] = useState(startsOnboarding);

  async function persistAnswers(nextAnswers: Record<string, string>) {
    try {
      await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: item.category,
          slug: item.slug,
          answers: nextAnswers,
        }),
      });
    } catch {
      // autosave é best-effort — o founder ainda pode clicar em "Salvar" depois
    }
  }

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleGenerateBriefing() {
    setGeneratingBriefing(true);
    setBriefingError(null);

    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: item.category,
          slug: item.slug,
          answers,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error ?? "Falha ao gerar briefing");
      }

      setBriefing(payload.item.briefing);
      setBriefingGeneratedAt(payload.item.briefingGeneratedAt);
      router.refresh();
    } catch (err) {
      setBriefingError(
        err instanceof Error
          ? err.message
          : "Não foi possível gerar o briefing. Tente novamente."
      );
    } finally {
      setGeneratingBriefing(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: item.category,
          slug: item.slug,
          title,
          summary,
          status,
          body,
          answers,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao salvar");
      }

      setSavedAt(new Date().toLocaleTimeString("pt-BR"));
      router.refresh();
      setEditOpen(false);
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ItemReport
        status={status}
        summary={summary}
        body={body}
        questions={questions}
        answers={answers}
        briefing={briefing}
        briefingGeneratedAt={briefingGeneratedAt}
        onEdit={() => setEditOpen(true)}
        onAnswerQuestions={() => {
          setWizardActive(true);
          setEditOpen(true);
        }}
        onGenerateBriefing={handleGenerateBriefing}
        generatingBriefing={generatingBriefing}
        briefingError={briefingError}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
          {wizardActive ? (
            <div className="flex flex-col gap-6">
              <DialogHeader>
                <DialogTitle>
                  Vamos preencher {item.title.toLowerCase()} passo a passo
                </DialogTitle>
              </DialogHeader>
              <QuestionWizard
                questions={questions}
                answers={answers}
                onChange={handleAnswerChange}
                onAdvance={() => persistAnswers(answers)}
                onComplete={() => {
                  persistAnswers(answers);
                  setWizardActive(false);
                  setEditOpen(false);
                }}
                onSkip={() => setWizardActive(false)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <DialogHeader>
                <DialogTitle>Editar {item.title}</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="summary">Resumo</Label>
                <Input
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  items={STATUS_LABELS}
                  value={status}
                  onValueChange={(next) => setStatus(next as ContentStatus)}
                >
                  <SelectTrigger id="status" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {questions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-base">Suas respostas</Label>
                    <button
                      type="button"
                      onClick={() => setWizardActive(true)}
                      className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Refazer passo a passo
                    </button>
                  </div>
                  <ItemQuestions
                    questions={questions}
                    answers={answers}
                    onChange={handleAnswerChange}
                  />
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="body">Conteúdo</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-96 font-mono text-sm"
                />
              </div>

              <DialogFooter className="items-center gap-4 sm:justify-start">
                <Button onClick={handleSave} disabled={saving} className="px-6">
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                {savedAt ? (
                  <span className="text-sm text-muted-foreground">
                    Salvo às {savedAt}
                  </span>
                ) : null}
                {error ? (
                  <span className="text-sm text-destructive">{error}</span>
                ) : null}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
