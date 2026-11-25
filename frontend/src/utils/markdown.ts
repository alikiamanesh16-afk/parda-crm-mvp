// ─── Tiny safe markdown renderer (no deps, no raw HTML passthrough) ───────────
// Supports: # headings, **bold**, *italic*, `code`, - lists, 1. lists,
// [text](url) links (https only), > quotes, line breaks. Output is built
// purely from our own tags, so nothing user-typed can inject HTML.

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(s: string): string {
  let out = esc(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
  );
  return out;
}

export function renderMarkdown(src: string): string {
  const lines = src.split('\n');
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      closeList();
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      closeList();
      const lvl = h[1].length;
      html.push(`<h${lvl + 3}>${inline(h[2])}</h${lvl + 3}>`); // h4..h6 inside notes
      continue;
    }
    const ul = line.match(/^\s*[-•]\s+(.*)$/);
    if (ul) {
      if (listType !== 'ul') {
        closeList();
        html.push('<ul>');
        listType = 'ul';
      }
      html.push(`<li>${inline(ul[1])}</li>`);
      continue;
    }
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ol) {
      if (listType !== 'ol') {
        closeList();
        html.push('<ol>');
        listType = 'ol';
      }
      html.push(`<li>${inline(ol[1])}</li>`);
      continue;
    }
    const q = line.match(/^>\s?(.*)$/);
    if (q) {
      closeList();
      html.push(`<blockquote>${inline(q[1])}</blockquote>`);
      continue;
    }
    closeList();
    html.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return html.join('\n');
}
