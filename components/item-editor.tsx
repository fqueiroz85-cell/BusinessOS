"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuestionWizard } from "@/components/question-wizard";
import { ItemQuestions } from "@/components/item-questions";
import { ItemBriefing } from "@/components/item-briefing";
import { STATUS_LABELS, STATUS_OPTIONS } from "@/lib/status";
import type { ContentItem, ContentStatus } from "@/lib/content";
import { getQuestions } from "@/lib/questions";

type ItemEditorProps = {
  item: ContentItem;
};

function hasAnyAnswer(answers: Record<string, string>) {
  return Object.values(answers).some((value) => value.trim().length > 0);
}

/** Bloco de campo com rótulo em cima e texto de apoio embaixo. */
function Campo({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ItemEditor({ item }: ItemEditorProps) {
  const router = useRouter();
  const questions = getQuestions(item.category, item.slug);

  const [title, setTitle] = useState(item.title);
  const [summary, setSummary] = useState(item.summary);
  const [status, setStatus] = useState<ContentStatus>(item.status);
  const [responsavel, setResponsavel] = useState(item.responsavel ?? "");
  const [tags, setTags] = useState((item.tags ?? []).join(", "));
  const [ordem, setOrdem] = useState(String(item.order));
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
  const [wizardOpen, setWizardOpen] = useState(false);

  const preenchido = hasAnyAnswer(answers);

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
          answers,
          responsavel,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          order: Number(ordem) || item.order,
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao salvar");
      }

      setSavedAt(new Date().toLocaleTimeString("pt-BR"));
      router.refresh();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-4xl font-bold tracking-tight">
            {title || item.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
            <code className="font-mono text-[0.8125rem]">
              {item.category}/{item.slug}
            </code>
            <span aria-hidden>·</span>
            <span>revisão {item.revisao ?? 0}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={
                  preenchido
                    ? "size-1.5 rounded-full bg-primary"
                    : "size-1.5 rounded-full border border-muted-foreground/60"
                }
                aria-hidden
              />
              {preenchido ? STATUS_LABELS[status] : "Vazio"}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="gap-2 bg-card"
          onClick={handleGenerateBriefing}
          disabled={generatingBriefing}
        >
          <Sparkles className="size-4" />
          {generatingBriefing ? "Pedindo..." : "Pedir à IA"}
        </Button>
      </header>

      <section className="flex flex-col gap-5 rounded-3xl bg-card p-6 md:p-8">
        <h2 className="font-heading text-base font-bold">Detalhes do card</h2>

        <Campo label="Título" htmlFor="title">
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Campo>

        <div className="grid gap-5 md:grid-cols-2">
          <Campo label="Status" htmlFor="status">
            <Select
              items={STATUS_LABELS}
              value={status}
              onValueChange={(next) => setStatus(next as ContentStatus)}
            >
              <SelectTrigger id="status" className="w-full">
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
          </Campo>

          <Campo label="Responsável" htmlFor="responsavel">
            <Input
              id="responsavel"
              value={responsavel}
              placeholder="voce@exemplo.com"
              onChange={(e) => setResponsavel(e.target.value)}
            />
          </Campo>
        </div>

        <Campo
          label="Resumo"
          htmlFor="summary"
          hint="Frase curta que aparece no card. A IA pode preencher isto ao gerar o briefing."
        >
          <Input
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </Campo>

        <div className="grid gap-5 md:grid-cols-2">
          <Campo label="Tags" htmlFor="tags" hint="Separe por vírgula.">
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </Campo>

          <Campo label="Ordem" htmlFor="ordem">
            <Input
              id="ordem"
              type="number"
              min={0}
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
            />
          </Campo>
        </div>
      </section>

      {questions.length > 0 ? (
        <section className="flex flex-col gap-6 rounded-3xl bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-base font-bold">Questionário</h2>
              <p className="text-sm text-muted-foreground">
                Revise e edite suas respostas. Ao terminar, gere um briefing com
                IA.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setWizardOpen(true)}
            >
              <Wand2 className="size-4" />
              Responder passo a passo
            </Button>
          </div>

          <ItemQuestions
            questions={questions}
            answers={answers}
            onChange={handleAnswerChange}
          />

          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Terminou? Deixe a IA sintetizar um briefing.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleGenerateBriefing}
              disabled={generatingBriefing}
            >
              <Sparkles className="size-4" />
              {generatingBriefing ? "Gerando..." : "Gerar briefing com IA"}
            </Button>
          </div>

          {briefingError ? (
            <p className="text-sm text-destructive">{briefingError}</p>
          ) : null}
        </section>
      ) : null}

      {briefing ? (
        <ItemBriefing
          briefing={briefing}
          briefingGeneratedAt={briefingGeneratedAt}
          onGenerate={handleGenerateBriefing}
          generating={generatingBriefing}
          error={briefingError}
        />
      ) : null}

      {/* Barra de ações fixa: as duas decisões do editor ficam sempre à mão,
          independente de quanto o questionário cresceu. */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/85 backdrop-blur-sm pl-61">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-4 px-6 py-4 md:px-12">
          {error ? (
            <span className="mr-auto text-sm text-destructive">{error}</span>
          ) : null}
          {savedAt ? (
            <span className="mr-auto text-sm text-muted-foreground">
              Salvo às {savedAt}
            </span>
          ) : null}
          <Button variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="px-6">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
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
                setWizardOpen(false);
              }}
              onSkip={() => setWizardOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
