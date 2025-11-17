/**
 * Lightweight markdown-to-HTML renderer for AI chat messages
 * Supports: **bold**, *italic*, lists, line breaks
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
 * Convert markdown to safe HTML
 * Supports:
 * - **bold text** → <strong>bold text</strong>
 * - *italic text* → <em>italic text</em>
 * - - list item → <li>list item</li>
 * - Line breaks preserved
 */
export function markdownToHtml(markdown: string): string {
  // First escape all HTML
  let html = escapeHtml(markdown);
  
  // Convert **bold** to <strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em> (but not if part of **)
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert lists: lines starting with "- " or "* "
  const lines = html.split('\n');
  let inList = false;
  const processedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = /^[\-\*]\s/.test(line);
    
    if (isListItem) {
      if (!inList) {
        processedLines.push('<ul class="list-disc list-inside space-y-1 my-2">');
        inList = true;
      }
      // Remove leading "- " or "* " and wrap in <li>
      const content = line.replace(/^[\-\*]\s/, '');
      processedLines.push(`<li>${content}</li>`);
    } else {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      processedLines.push(line);
    }
  }
  
  // Close list if still open
  if (inList) {
    processedLines.push('</ul>');
  }
  
  html = processedLines.join('\n');
  
  // Convert line breaks to <br> (except in lists)
  html = html.replace(/\n(?!<li|<\/ul|<ul)/g, '<br>');
  
  return html;
}
