import type { ContentStatus } from "@/lib/content";

export const STATUS_LABELS: Record<ContentStatus, string> = {
  not_started: "Não iniciado",
  in_progress: "Em andamento",
  done: "Concluído",
};

export const STATUS_OPTIONS: { value: ContentStatus; label: string }[] = [
  { value: "not_started", label: STATUS_LABELS.not_started },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "done", label: STATUS_LABELS.done },
];
