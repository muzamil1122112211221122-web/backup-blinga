// Professional DOCX generator using WordprocessingML — real .docx format, no external dependencies

function crc32(data: Uint8Array): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function enc(s: string) { return new TextEncoder().encode(s); }
function u16(v: number) { const b = new Uint8Array(2); b[0]=v&0xff; b[1]=(v>>8)&0xff; return b; }
function u32(v: number) { const b = new Uint8Array(4); b[0]=v&0xff; b[1]=(v>>8)&0xff; b[2]=(v>>16)&0xff; b[3]=(v>>24)&0xff; return b; }
function cat(...arr: Uint8Array[]) {
  const total = arr.reduce((s,a)=>s+a.length,0);
  const out = new Uint8Array(total); let off = 0;
  for (const a of arr) { out.set(a,off); off+=a.length; }
  return out;
}
interface ZFile { name: string; data: Uint8Array }
function buildZip(files: ZFile[]): Uint8Array {
  const locals: Uint8Array[]=[], centrals: Uint8Array[]=[];
  let offset = 0;
  for (const f of files) {
    const nm=enc(f.name), crc=crc32(f.data), sz=f.data.length;
    const lh=cat(new Uint8Array([0x50,0x4b,0x03,0x04]),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(sz),u32(sz),u16(nm.length),u16(0),nm,f.data);
    const cd=cat(new Uint8Array([0x50,0x4b,0x01,0x02]),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(sz),u32(sz),u16(nm.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nm);
    locals.push(lh); centrals.push(cd); offset+=lh.length;
  }
  const cdData=cat(...centrals);
  const eocd=cat(new Uint8Array([0x50,0x4b,0x05,0x06]),u16(0),u16(0),u16(files.length),u16(files.length),u32(cdData.length),u32(offset),u16(0));
  return cat(...locals,cdData,eocd);
}

function wEsc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// WordprocessingML color palette
const D = {
  indigo:  '4F46E5',
  indigoD: '3730A3',
  purple:  '7C3AED',
  cyan:    '06B6D4',
  emerald: '10B981',
  amber:   'F59E0B',
  rose:    'EF4444',
  navy:    '0F0C29',
  white:   'FFFFFF',
  bgLight: 'EEF2FF',
  bgCyan:  'ECFEFF',
  darkTxt: '1E293B',
  muted:   '64748B',
  hr:      'C7D2FE',
};

const BULLET_COLORS = [D.indigo, D.purple, D.cyan, D.emerald, D.amber, D.rose];

// Clean markdown text
function cleanText(s: string): string {
  return s
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

// Inline markup → w:r runs
function inlineRuns(text: string, defaultColor = D.darkTxt, defaultSz = '22'): string {
  const parts: string[] = [];
  const regex = /\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`|(.+?)(?=\*\*|\*|`|$)/gs;
  let lastIdx = 0;

  // Simple approach: split into segments
  const segs: Array<{ bold?: boolean; italic?: boolean; code?: boolean; text: string }> = [];
  let rest = text;

  while (rest.length > 0) {
    const boldM = rest.match(/^\*\*(.*?)\*\*/s);
    const italM = rest.match(/^\*(.*?)\*/s);
    const codeM = rest.match(/^`(.*?)`/s);

    if (boldM && boldM.index === 0) {
      segs.push({ bold: true, text: boldM[1] });
      rest = rest.slice(boldM[0].length);
    } else if (italM && italM.index === 0) {
      segs.push({ italic: true, text: italM[1] });
      rest = rest.slice(italM[0].length);
    } else if (codeM && codeM.index === 0) {
      segs.push({ code: true, text: codeM[1] });
      rest = rest.slice(codeM[0].length);
    } else {
      // Find next special char
      const nextSpec = rest.search(/\*\*|\*|`/);
      if (nextSpec === -1) {
        segs.push({ text: rest });
        rest = '';
      } else {
        segs.push({ text: rest.slice(0, nextSpec) });
        rest = rest.slice(nextSpec);
      }
    }
  }

  for (const seg of segs) {
    if (!seg.text) continue;
    let rPr = `<w:rPr>`;
    if (seg.bold)   rPr += `<w:b/><w:color w:val="${D.indigoD}"/>`;
    else if (seg.italic) rPr += `<w:i/><w:color w:val="${D.muted}"/>`;
    else if (seg.code) rPr += `<w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:color w:val="${D.indigo}"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/>`;
    else rPr += `<w:color w:val="${defaultColor}"/>`;
    rPr += `<w:sz w:val="${defaultSz}"/><w:szCs w:val="${defaultSz}"/></w:rPr>`;
    parts.push(`<w:r>${rPr}<w:t xml:space="preserve">${wEsc(seg.text)}</w:t></w:r>`);
  }
  return parts.join('') || `<w:r><w:rPr><w:color w:val="${defaultColor}"/><w:sz w:val="${defaultSz}"/></w:rPr><w:t xml:space="preserve">${wEsc(text)}</w:t></w:r>`;
}

interface DocParagraph {
  type: 'h1'|'h2'|'h3'|'h4'|'para'|'bullet'|'numbered'|'hr'|'code'|'blank';
  text: string;
  bulletIdx?: number;
}

function parseDoc(content: string): DocParagraph[] {
  const cleaned = content
    .replace(/\b(as an ai[^.\n]*[.\n]|as a language model[^.\n]*[.\n]|generated by ai[^.\n]*[.\n]|note: i am an ai[^.\n]*[.\n]|disclaimer:[^.\n]*[.\n])/gi, '')
    .replace(/\n{3,}/g, '\n\n');

  const lines = cleaned.split('\n');
  const result: DocParagraph[] = [];
  let bulletIdx = 0;
  let inCode = false;
  const codeLines: string[] = [];
  let prevWasBlank = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (inCode) {
      if (line.startsWith('```')) {
        inCode = false;
        result.push({ type: 'code', text: codeLines.join('\n') });
        codeLines.length = 0;
      } else {
        codeLines.push(raw);
      }
      continue;
    }

    if (line.startsWith('```')) { inCode = true; prevWasBlank = false; continue; }

    if (!line) {
      if (!prevWasBlank) result.push({ type: 'blank', text: '' });
      prevWasBlank = true;
      bulletIdx = 0;
      continue;
    }
    prevWasBlank = false;

    const h1 = line.match(/^#\s+(.+)/);
    if (h1) { bulletIdx = 0; result.push({ type: 'h1', text: cleanText(h1[1]) }); continue; }
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) { bulletIdx = 0; result.push({ type: 'h2', text: cleanText(h2[1]) }); continue; }
    const h3 = line.match(/^###\s+(.+)/);
    if (h3) { bulletIdx = 0; result.push({ type: 'h3', text: cleanText(h3[1]) }); continue; }
    const h4 = line.match(/^####\s+(.+)/);
    if (h4) { bulletIdx = 0; result.push({ type: 'h4', text: cleanText(h4[1]) }); continue; }

    if (line.match(/^[-*•▸►]\s+/)) {
      const text = line.replace(/^[-*•▸►]\s+/, '');
      result.push({ type: 'bullet', text, bulletIdx: bulletIdx++ });
      continue;
    }
    const numM = line.match(/^\d+\.\s+(.+)/);
    if (numM) { result.push({ type: 'numbered', text: numM[1], bulletIdx: bulletIdx++ }); continue; }

    if (line.match(/^[-*_]{3,}$/)) { bulletIdx = 0; result.push({ type: 'hr', text: '' }); continue; }

    bulletIdx = 0;
    result.push({ type: 'para', text: line });
  }

  return result;
}

function renderParagraph(p: DocParagraph, docTitle: string): string {
  const bColor = BULLET_COLORS[(p.bulletIdx ?? 0) % BULLET_COLORS.length];

  switch (p.type) {
    case 'blank':
      return `<w:p><w:pPr><w:spacing w:before="60" w:after="60"/></w:pPr></w:p>`;

    case 'hr':
      return `<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="${D.indigo}"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>`;

    case 'h1':
      return `<w:p>
  <w:pPr>
    <w:shd w:val="clear" w:color="auto" w:fill="${D.navy}"/>
    <w:spacing w:before="240" w:after="160"/>
    <w:jc w:val="left"/>
    <w:ind w:left="288" w:right="288"/>
    <w:pBdr><w:left w:val="single" w:sz="48" w:space="4" w:color="${D.indigo}"/></w:pBdr>
  </w:pPr>
  <w:r><w:rPr><w:b/><w:color w:val="${D.white}"/><w:sz w:val="52"/><w:szCs w:val="52"/><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/></w:rPr><w:t xml:space="preserve"> ${wEsc(p.text)}</w:t></w:r>
</w:p>`;

    case 'h2':
      return `<w:p>
  <w:pPr>
    <w:shd w:val="clear" w:color="auto" w:fill="${D.indigo}"/>
    <w:spacing w:before="200" w:after="120"/>
    <w:jc w:val="left"/>
    <w:ind w:left="216" w:right="216"/>
  </w:pPr>
  <w:r><w:rPr><w:b/><w:color w:val="${D.white}"/><w:sz w:val="40"/><w:szCs w:val="40"/><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/></w:rPr><w:t xml:space="preserve"> ${wEsc(p.text)}</w:t></w:r>
</w:p>`;

    case 'h3':
      return `<w:p>
  <w:pPr>
    <w:shd w:val="clear" w:color="auto" w:fill="${D.bgLight}"/>
    <w:spacing w:before="160" w:after="80"/>
    <w:ind w:left="144"/>
    <w:pBdr><w:left w:val="single" w:sz="24" w:space="4" w:color="${D.purple}"/></w:pBdr>
  </w:pPr>
  <w:r><w:rPr><w:b/><w:color w:val="${D.indigoD}"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr><w:t xml:space="preserve"> ${wEsc(p.text)}</w:t></w:r>
</w:p>`;

    case 'h4':
      return `<w:p>
  <w:pPr>
    <w:spacing w:before="120" w:after="60"/>
    <w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="${D.hr}"/></w:pBdr>
  </w:pPr>
  <w:r><w:rPr><w:b/><w:color w:val="${D.indigo}"/><w:sz w:val="26"/><w:szCs w:val="26"/><w:caps/></w:rPr><w:t>${wEsc(p.text)}</w:t></w:r>
</w:p>`;

    case 'bullet': {
      const odd = (p.bulletIdx ?? 0) % 2 === 0;
      return `<w:p>
  <w:pPr>
    ${odd ? `<w:shd w:val="clear" w:color="auto" w:fill="F8FAFF"/>` : ''}
    <w:spacing w:before="60" w:after="60"/>
    <w:ind w:left="576" w:hanging="360"/>
  </w:pPr>
  <w:r><w:rPr><w:b/><w:color w:val="${bColor}"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">&#x25B8; </w:t></w:r>
  ${inlineRuns(p.text, D.darkTxt, '22')}
</w:p>`;
    }

    case 'numbered': {
      const num = (p.bulletIdx ?? 0) + 1;
      return `<w:p>
  <w:pPr>
    <w:spacing w:before="60" w:after="60"/>
    <w:ind w:left="576" w:hanging="360"/>
  </w:pPr>
  <w:r><w:rPr><w:b/><w:color w:val="${D.indigo}"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${num}. </w:t></w:r>
  ${inlineRuns(p.text, D.darkTxt, '22')}
</w:p>`;
    }

    case 'code':
      return `<w:p>
  <w:pPr>
    <w:shd w:val="clear" w:color="auto" w:fill="1E293B"/>
    <w:spacing w:before="80" w:after="80"/>
    <w:ind w:left="216" w:right="216"/>
  </w:pPr>
  ${p.text.split('\n').map((line, li) =>
    li === 0
      ? `<w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:color w:val="E2E8F0"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${wEsc(line)}</w:t></w:r>`
      : `</w:p><w:p><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="1E293B"/><w:spacing w:before="0" w:after="0"/><w:ind w:left="216" w:right="216"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:color w:val="E2E8F0"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${wEsc(line)}</w:t></w:r>`
  ).join('')}
</w:p>`;

    case 'para':
    default:
      return `<w:p>
  <w:pPr><w:spacing w:before="60" w:after="100"/><w:jc w:val="both"/></w:pPr>
  ${inlineRuns(p.text, D.darkTxt, '22')}
</w:p>`;
  }
}

function buildDocumentXml(paragraphs: DocParagraph[], docTitle: string): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const headerBlock = `<w:p>
  <w:pPr>
    <w:shd w:val="clear" w:color="auto" w:fill="${D.navy}"/>
    <w:spacing w:before="0" w:after="0"/>
    <w:ind w:left="216" w:right="216"/>
    <w:pBdr><w:left w:val="single" w:sz="48" w:space="4" w:color="${D.indigo}"/></w:pBdr>
  </w:pPr>
  <w:r><w:rPr><w:b/><w:color w:val="${D.white}"/><w:sz w:val="32"/><w:rFonts w:ascii="Calibri Light" w:hAnsi="Calibri Light"/></w:rPr><w:t xml:space="preserve"> ✦ FIUS — PROFESSIONAL EXPORT</w:t></w:r>
</w:p>
<w:p>
  <w:pPr>
    <w:shd w:val="clear" w:color="auto" w:fill="${D.navy}"/>
    <w:spacing w:before="0" w:after="240"/>
    <w:ind w:left="216" w:right="216"/>
    <w:pBdr><w:left w:val="single" w:sz="48" w:space="4" w:color="${D.indigo}"/></w:pBdr>
  </w:pPr>
  <w:r><w:rPr><w:color w:val="94A3B8"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve"> ${wEsc(date)}</w:t></w:r>
</w:p>`;

  const footerHr = `<w:p>
  <w:pPr>
    <w:pBdr><w:top w:val="single" w:sz="6" w:space="1" w:color="${D.indigo}"/></w:pBdr>
    <w:spacing w:before="240" w:after="60"/>
  </w:pPr>
  <w:r><w:rPr><w:color w:val="${D.muted}"/><w:sz w:val="16"/></w:rPr><w:t>Generated by Fius</w:t></w:r>
  <w:r><w:rPr><w:color w:val="${D.muted}"/><w:sz w:val="16"/></w:rPr><w:tab/><w:t>${wEsc(date)}</w:t></w:r>
</w:p>`;

  const body = paragraphs.map(p => renderParagraph(p, docTitle)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"
  xmlns:cx="http://schemas.microsoft.com/office/drawing/2014/chartex"
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  xmlns:aink="http://schemas.microsoft.com/office/drawing/2016/ink"
  xmlns:am3d="http://schemas.microsoft.com/office/drawing/2017/model3d"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:oel="http://schemas.microsoft.com/office/2019/extlst"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:w10="urn:schemas-microsoft-com:office:word"
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
  xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml"
  xmlns:w16cex="http://schemas.microsoft.com/office/word/2018/wordml/cex"
  xmlns:w16cid="http://schemas.microsoft.com/office/word/2016/wordml/cid"
  xmlns:w16="http://schemas.microsoft.com/office/word/2018/wordml"
  xmlns:w16sdtdh="http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash"
  xmlns:w16se="http://schemas.microsoft.com/office/word/2015/wordml/symex"
  xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup"
  xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"
  xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml"
  xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"
  mc:Ignorable="w14 w15 w16se w16cid w16 w16cex w16sdtdh wp14">
  <w:body>
${headerBlock}
${body}
${footerHr}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1260" w:bottom="1440" w:left="1260" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/><w:szCs w:val="22"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/>
  </w:style>
</w:styles>`;
}

export async function downloadWordDoc(content: string, filename = 'fius-document') {
  let processedContent = content;
  try {
    const res = await fetch('/api/format-for-export', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type: 'docx' }),
    });
    if (res.ok) { const d = await res.json(); if (d.formatted) processedContent = d.formatted; }
  } catch { /* use original */ }

  const paragraphs = parseDoc(processedContent);
  const h1 = paragraphs.find(p => p.type === 'h1');
  const docTitle = h1?.text || filename.replace(/-/g,' ');

  const documentXml = buildDocumentXml(paragraphs, docTitle);
  const stylesXml = buildStylesXml();

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

  const files: ZFile[] = [
    { name: '[Content_Types].xml', data: enc(contentTypes) },
    { name: '_rels/.rels', data: enc(rootRels) },
    { name: 'word/document.xml', data: enc(documentXml) },
    { name: 'word/_rels/document.xml.rels', data: enc(docRels) },
    { name: 'word/styles.xml', data: enc(stylesXml) },
  ];

  const zip = buildZip(files);
  const blob = new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.docx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
