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

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <Select
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
