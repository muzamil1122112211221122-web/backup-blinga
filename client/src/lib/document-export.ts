// Polished document export — turns AI-generated Markdown into a richly
// styled, colorful HTML document and offers TXT / PDF downloads.
// Used by the "Create Document" flow (the "+" attach menu's second option).

const ACCENT_CYCLE = ['#4F46E5', '#7C3AED', '#0891B2', '#059669', '#D97706', '#DC2626'];

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Minimal inline-markdown renderer (bold / italic / code / links)
function renderInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code style="background:#f1f0fb;color:#5b21b6;padding:2px 6px;border-radius:5px;font-size:0.9em;">$1</code>');
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#111827;font-weight:700;">$1</strong>');
  out = out.replace(/\*(.+?)\*/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#4F46E5;text-decoration:underline;">$1</a>');
  return out;
}

/**
 * Converts a Markdown document (as produced by our AI "document mode") into a
 * self-contained, polished HTML string: colorful heading accents that cycle
 * per section, zebra-striped tables, callout-style bullets.
 */
export function markdownToPolishedHtml(markdown: string, title?: string): { html: string; bodyHtml: string; title: string } {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let bodyHtml = '';
  let sectionIndex = -1;
  let docTitle = title || 'Document';
  let inList: 'ul' | 'ol' | null = null;
  let tableBuffer: string[] = [];

  const flushList = () => { if (inList) { bodyHtml += `</${inList}>`; inList = null; } };
  const flushTable = () => {
    if (!tableBuffer.length) return;
    const rows = tableBuffer.filter(r => !/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(r));
    const cells = rows.map(r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
    if (cells.length) {
      const [head, ...body] = cells;
      const accent = ACCENT_CYCLE[Math.max(sectionIndex, 0) % ACCENT_CYCLE.length];
      bodyHtml += `<table style="width:100%;border-collapse:collapse;margin:14px 0 20px;font-size:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);border-radius:10px;overflow:hidden;">
        <thead><tr>${head.map(h => `<th style="background:${accent};color:#fff;text-align:left;padding:9px 12px;font-weight:700;">${renderInline(h)}</th>`).join('')}</tr></thead>
        <tbody>${body.map((row, i) => `<tr style="background:${i % 2 ? '#f8f9fc' : '#ffffff'};">${row.map(c => `<td style="padding:8px 12px;border-bottom:1px solid #eef0f5;color:#1f2430;">${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
    }
    tableBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const isTableRow = /^\s*\|.*\|\s*$/.test(line) || (/\|/.test(line) && tableBuffer.length > 0);
    if (isTableRow) { tableBuffer.push(line); continue; }
    flushTable();

    if (!line.trim()) { flushList(); continue; }

    const h1 = line.match(/^#\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const h3 = line.match(/^###\s+(.*)/);
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)/);

    if (h1) {
      flushList();
      docTitle = title || h1[1].trim();
      bodyHtml += `<h1 style="font-size:28px;font-weight:800;letter-spacing:-0.02em;margin:0 0 6px;background:linear-gradient(90deg,#4F46E5,#7C3AED);-webkit-background-clip:text;background-clip:text;color:transparent;">${renderInline(h1[1])}</h1><div style="height:3px;width:64px;border-radius:3px;background:linear-gradient(90deg,#4F46E5,#7C3AED);margin-bottom:18px;"></div>`;
      continue;
    }
    if (h2) {
      flushList();
      sectionIndex++;
      const accent = ACCENT_CYCLE[sectionIndex % ACCENT_CYCLE.length];
      bodyHtml += `<h2 style="font-size:19px;font-weight:800;margin:26px 0 10px;padding-left:12px;border-left:4px solid ${accent};color:${accent};">${renderInline(h2[1])}</h2>`;
      continue;
    }
    if (h3) {
      flushList();
      const accent = ACCENT_CYCLE[Math.max(sectionIndex, 0) % ACCENT_CYCLE.length];
      bodyHtml += `<h3 style="font-size:15.5px;font-weight:700;margin:18px 0 8px;color:${accent};opacity:0.92;">${renderInline(h3[1])}</h3>`;
      continue;
    }
    if (bullet) {
      if (inList !== 'ul') { flushList(); bodyHtml += '<ul style="margin:6px 0 14px;padding-left:0;list-style:none;">'; inList = 'ul'; }
      const accent = ACCENT_CYCLE[Math.max(sectionIndex, 0) % ACCENT_CYCLE.length];
      bodyHtml += `<li style="margin:5px 0;padding-left:20px;position:relative;line-height:1.55;color:#2b2f3a;"><span style="position:absolute;left:0;top:9px;width:6px;height:6px;border-radius:50%;background:${accent};"></span>${renderInline(bullet[1])}</li>`;
      continue;
    }
    if (numbered) {
      if (inList !== 'ol') { flushList(); bodyHtml += '<ol style="margin:6px 0 14px;padding-left:22px;">'; inList = 'ol'; }
      bodyHtml += `<li style="margin:5px 0;line-height:1.55;color:#2b2f3a;">${renderInline(numbered[1])}</li>`;
      continue;
    }
    flushList();
    bodyHtml += `<p style="margin:8px 0;line-height:1.7;color:#333846;">${renderInline(line)}</p>`;
  }
  flushList();
  flushTable();

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(docTitle)}</title></head>
  <body style="font-family:'Segoe UI',system-ui,-apple-system,sans-serif;max-width:760px;margin:0 auto;padding:40px 36px;background:#ffffff;">
    ${bodyHtml}
    <div style="margin-top:34px;padding-top:14px;border-top:1px solid #eef0f5;color:#9aa0ad;font-size:11px;">Generated by Fius Nomad</div>
  </body></html>`;

  return { html, bodyHtml, title: docTitle };
}

export function downloadTxt(markdown: string, title: string) {
  // Strip markdown syntax down to clean readable plain text
  const plain = markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/\|/g, '  ')
    .trim();
  const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${sanitizeFilename(title)}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function sanitizeFilename(s: string): string {
  return (s || 'document').replace(/[^a-z0-9\-_ ]/gi, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'document';
}

export async function downloadPdf(markdown: string, title: string) {
  const { html2pdf } = await loadHtml2Pdf();
  const { bodyHtml, title: docTitle } = markdownToPolishedHtml(markdown, title);
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '700px';
  container.style.background = '#ffffff';
  container.style.fontFamily = "'Segoe UI', system-ui, -apple-system, sans-serif";
  container.style.padding = '36px 40px';
  container.innerHTML = bodyHtml;
  document.body.appendChild(container);
  try {
    await html2pdf()
      .set({
        margin: 0,
        filename: `${sanitizeFilename(docTitle)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(container)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}

async function loadHtml2Pdf(): Promise<{ html2pdf: any }> {
  const mod: any = await import('html2pdf.js');
  return { html2pdf: mod.default || mod };
}
