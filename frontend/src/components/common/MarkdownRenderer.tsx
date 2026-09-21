import { cn } from "@/utils";

/**
 * Lightweight Markdown renderer for AI study responses.
 * Supports headings, bold, italic, inline code, code blocks,
 * bullet lists, numbered lists, and line breaks.
 * No external dependencies — uses regex-based parsing.
 */

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={cn("markdown-content space-y-2.5 text-sm leading-relaxed", className)}>
      {blocks.map((block, i) => renderBlock(block, i))}
    </div>
  );
}

// ─── Block types ──────────────────────────────────────────────

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "blank" };

function parseBlocks(raw: string): Block[] {
  const lines = raw.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      i++; // skip closing ```
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headingMatch) {
      blocks.push({ type: "heading", level: headingMatch[1].length, text: headingMatch[2] });
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trimStart().startsWith("```") &&
      !/^#{1,4}\s+/.test(lines[i]) &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return blocks;
}

// ─── Render ───────────────────────────────────────────────────

function renderBlock(block: Block, key: number) {
  switch (block.type) {
    case "heading": {
      const Tag = (`h${Math.min(block.level + 1, 6)}` as keyof JSX.IntrinsicElements);
      const sizes: Record<number, string> = {
        1: "text-base font-bold mt-3",
        2: "text-sm font-bold mt-2.5",
        3: "text-sm font-semibold mt-2",
        4: "text-sm font-medium mt-1.5",
      };
      return (
        <Tag key={key} className={cn("text-foreground", sizes[block.level] ?? sizes[4])}>
          {renderInline(block.text)}
        </Tag>
      );
    }

    case "code":
      return (
        <div key={key} className="rounded-lg overflow-hidden border border-border">
          {block.lang && (
            <div className="bg-surface px-3 py-1.5 text-2xs font-mono text-foreground-muted border-b border-border">
              {block.lang}
            </div>
          )}
          <pre className="bg-navy-900 text-neutral-100 px-4 py-3 text-sm font-mono overflow-x-auto whitespace-pre">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "list":
      return block.ordered ? (
        <ol key={key} className="list-decimal list-inside space-y-1 text-foreground pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="text-sm leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      ) : (
        <ul key={key} className="space-y-1 text-foreground pl-1">
          {block.items.map((item, j) => (
            <li key={j} className="text-sm leading-relaxed flex items-start gap-2">
              <span className="text-primary mt-1.5 text-[6px]">●</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );

    case "paragraph":
      return (
        <p key={key} className="text-foreground leading-relaxed">
          {renderInline(block.text)}
        </p>
      );

    default:
      return null;
  }
}

// ─── Inline formatting ────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  // Split on inline code first to avoid processing markdown inside code
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, i) => {
    // Inline code
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-muted text-foreground px-1.5 py-0.5 rounded text-[0.8125rem] font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Process bold and italic in remaining text
    const elements: React.ReactNode[] = [];
    let remaining = part;
    let idx = 0;

    // Bold
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        elements.push(<span key={`${i}-${idx++}`}>{remaining.slice(lastIndex, match.index)}</span>);
      }
      elements.push(
        <strong key={`${i}-${idx++}`} className="font-semibold text-foreground">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < remaining.length) {
      elements.push(<span key={`${i}-${idx++}`}>{remaining.slice(lastIndex)}</span>);
    }

    return elements.length > 0 ? elements : part;
  });
}
