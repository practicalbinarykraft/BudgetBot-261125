/**
 * Lightweight markdown-to-HTML renderer for AI chat messages
 * Supports: **bold**, *italic*, numbered/bulleted lists, line breaks
 * Security: Escapes HTML to prevent XSS
 */

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Apply inline formatting (**bold**, *italic*) to a single line
 */
function applyInlineFormatting(line: string): string {
  // Convert **bold** to <strong>
  line = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Convert *italic* to <em> (but not if part of **)
  line = line.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  return line;
}

/**
 * Convert markdown to safe HTML
 * Supports:
 * - **bold text** → <strong>bold text</strong>
 * - *italic text* → <em>italic text</em>
 * - - list item / * list item → <ul><li>
 * - 1. numbered item → <ol><li>
 * - Line breaks preserved
 */
export function markdownToHtml(markdown: string): string {
  // First escape all HTML
  const html = escapeHtml(markdown);

  // Process line by line: structure (lists) first, then inline formatting per line
  const lines = html.split('\n');
  let listType: 'ul' | 'ol' | null = null;
  const processedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const unorderedMatch = /^[\-\*]\s(.*)/.exec(line);
    const orderedMatch = /^\d+\.\s(.*)/.exec(line);

    if (unorderedMatch) {
      if (listType !== 'ul') {
        if (listType) processedLines.push(`</${listType}>`);
        processedLines.push('<ul class="list-disc list-inside space-y-1 my-2">');
        listType = 'ul';
      }
      processedLines.push(`<li>${applyInlineFormatting(unorderedMatch[1])}</li>`);
    } else if (orderedMatch) {
      if (listType !== 'ol') {
        if (listType) processedLines.push(`</${listType}>`);
        processedLines.push('<ol class="list-decimal list-inside space-y-1 my-2">');
        listType = 'ol';
      }
      processedLines.push(`<li>${applyInlineFormatting(orderedMatch[1])}</li>`);
    } else {
      if (listType) {
        processedLines.push(`</${listType}>`);
        listType = null;
      }
      processedLines.push(applyInlineFormatting(line));
    }
  }

  // Close list if still open
  if (listType) {
    processedLines.push(`</${listType}>`);
  }

  let result = processedLines.join('\n');

  // Convert line breaks to <br> (except in lists)
  result = result.replace(/\n(?!<li|<\/ul|<ul|<\/ol|<ol)/g, '<br>');

  return result;
}
