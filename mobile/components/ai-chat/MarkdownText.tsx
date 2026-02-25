/**
 * Lightweight markdown renderer for React Native Text
 * Parses **bold**, *italic* and renders as styled Text segments
 */
import React from "react";
import { Text, type TextStyle } from "react-native";

interface MarkdownTextProps {
  children: string;
  style?: TextStyle;
  color?: string;
}

interface Segment {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

/**
 * Parse markdown string into styled segments
 * Supports **bold** and *italic*
 */
function parseMarkdown(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match **bold** or *italic* (bold first to avoid conflict)
  const regex = /\*\*([\s\S]+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add plain text before this match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // **bold**
      segments.push({ text: match[1], bold: true });
    } else if (match[2] !== undefined) {
      // *italic*
      segments.push({ text: match[2], italic: true });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }

  return segments;
}

export function MarkdownText({ children, style, color }: MarkdownTextProps) {
  const segments = parseMarkdown(children);

  return (
    <Text style={[style, color ? { color } : undefined]}>
      {segments.map((segment, i) => (
        <Text
          key={i}
          style={[
            segment.bold && { fontWeight: "700" as const },
            segment.italic && { fontStyle: "italic" as const },
          ]}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}
