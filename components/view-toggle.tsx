"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ViewMode = "grid" | "list";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

const VIEW_LABELS: Record<ViewMode, string> = {
  grid: "Grade",
  list: "Lista",
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <Select
      items={VIEW_LABELS}
      value={value}
      onValueChange={(next) => {
        if (next === "grid" || next === "list") {
          onChange(next);
        }
      }}
    >
      <SelectTrigger aria-label="Alternar visualização" className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="grid">Grade</SelectItem>
        <SelectItem value="list">Lista</SelectItem>
      </SelectContent>
    </Select>
  );
}
