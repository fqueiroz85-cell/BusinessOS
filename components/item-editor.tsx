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
import { STATUS_LABELS, STATUS_OPTIONS } from "@/lib/status";
import type { ContentItem, ContentStatus } from "@/lib/content";

type ItemEditorProps = {
  item: ContentItem;
};

export function ItemEditor({ item }: ItemEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(item.title);
  const [summary, setSummary] = useState(item.summary);
  const [status, setStatus] = useState<ContentStatus>(item.status);
  const [body, setBody] = useState(item.body);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="flex flex-col gap-6">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Conteúdo</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-96 font-mono text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-6"
        >
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
      </div>
    </div>
  );
}
