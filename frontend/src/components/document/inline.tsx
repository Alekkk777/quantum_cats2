/**
 * Tiny markdown-ish inline renderer:
 *   **bold**   → <strong>
 *   *em*       → <em>
 *   `code`     → <code>
 * Just enough for the document fixture; no external dep.
 */
import * as React from 'react';

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;

export function renderInline(text: string): React.ReactNode {
  const parts = text.split(TOKEN);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('*')  && p.endsWith('*'))  return <em key={i}>{p.slice(1, -1)}</em>;
    if (p.startsWith('`')  && p.endsWith('`'))  return <code key={i}>{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}
