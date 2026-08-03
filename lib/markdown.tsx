import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal markdown-ish renderer for BusinessOS content.
 * Covers only what content/*.md and generated briefings actually use:
 * ## / ### headings, paragraphs, bullet + checkbox lists, tables and
 * inline **bold** — not a general-purpose markdown engine.
 */

export function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== "");
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

type Block =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: { text: string; checked?: boolean }[] }
  | { type: "table"; header: string[]; rows: string[][] };

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes("-");
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "heading", level: 3, text: line.slice(4).trim() });
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "heading", level: 2, text: line.slice(3).trim() });
      i++;
      continue;
    }

    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const header = splitTableRow(tableLines[0]);
      const bodyLines = isTableSeparator(tableLines[1] ?? "")
        ? tableLines.slice(2)
        : tableLines.slice(1);
      const rows = bodyLines
        .map(splitTableRow)
        .filter((row) => row.some((cell) => cell.length > 0));
      blocks.push({ type: "table", header, rows });
      continue;
    }

    if (/^[-*]\s/.test(line.trim())) {
      const items: { text: string; checked?: boolean }[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        const raw = lines[i].trim().replace(/^[-*]\s/, "");
        const checkboxMatch = raw.match(/^\[( |x|X)\]\s*(.*)$/);
        if (checkboxMatch) {
          items.push({
            text: checkboxMatch[2],
            checked: checkboxMatch[1].toLowerCase() === "x",
          });
        } else {
          items.push({ text: raw });
        }
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !/^[-*]\s/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith("|")
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }

  return blocks;
}

type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          if (block.level === 2) {
            return (
              <h3
                key={idx}
                className="font-heading text-base font-semibold text-foreground first:mt-0"
              >
                {renderInline(block.text)}
              </h3>
            );
          }
          return (
            <h4
              key={idx}
              className="font-heading text-sm font-semibold text-foreground"
            >
              {renderInline(block.text)}
            </h4>
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={idx} className="text-sm leading-relaxed text-muted-foreground">
              {renderInline(block.text)}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={idx} className="flex flex-col gap-1.5">
              {block.items.map((item, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  {item.checked !== undefined ? (
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        item.checked
                          ? "border-primary bg-primary/30"
                          : "border-border"
                      )}
                    >
                      {item.checked ? <Check className="size-3" /> : null}
                    </span>
                  ) : (
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground" />
                  )}
                  <span>{renderInline(item.text)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div
            key={idx}
            className="overflow-x-auto rounded-lg border border-border/60"
          >
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {block.header.map((cell, k) => (
                    <th
                      key={k}
                      className="px-3 py-2 font-medium whitespace-nowrap text-foreground"
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-t border-border/60">
                    {row.map((cell, c) => (
                      <td key={c} className="px-3 py-2 text-muted-foreground">
                        {cell || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
