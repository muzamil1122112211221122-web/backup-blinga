// Professional PPTX generator — embedded real images, quiz shapes, no ph placeholders, no XML comments

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
function u16(v: number) { const b = new Uint8Array(2); b[0] = v & 0xff; b[1] = (v >> 8) & 0xff; return b; }
function u32(v: number) { const b = new Uint8Array(4); b[0] = v & 0xff; b[1] = (v >> 8) & 0xff; b[2] = (v >> 16) & 0xff; b[3] = (v >> 24) & 0xff; return b; }
function cat(...arr: Uint8Array[]) {
  const total = arr.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total); let off = 0;
  for (const a of arr) { out.set(a, off); off += a.length; }
  return out;
}

interface ZFile { name: string; data: Uint8Array }

function buildZip(files: ZFile[]): Uint8Array {
  const locals: Uint8Array[] = [], centrals: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const nm = enc(f.name), crc = crc32(f.data), sz = f.data.length;
    const lh = cat(new Uint8Array([0x50,0x4b,0x03,0x04]),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(sz),u32(sz),u16(nm.length),u16(0),nm,f.data);
    const cd = cat(new Uint8Array([0x50,0x4b,0x01,0x02]),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(sz),u32(sz),u16(nm.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),nm);
    locals.push(lh); centrals.push(cd); offset += lh.length;
  }
  const cdData = cat(...centrals);
  const eocd = cat(new Uint8Array([0x50,0x4b,0x05,0x06]),u16(0),u16(0),u16(files.length),u16(files.length),u32(cdData.length),u32(offset),u16(0));
  return cat(...locals, cdData, eocd);
}

function xEsc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

interface SlideImage { data: Uint8Array; ext: string; mediaName: string }

interface Slide {
  title: string;
  bullets: string[];
  imageQuery?: string;
  quizQuestion?: string;
  image?: SlideImage;
}

const C = {
  navy:    '0F0C29',
  indigo:  '4F46E5',
  purple:  '7C3AED',
  cyan:    '06B6D4',
  emerald: '10B981',
  amber:   'F59E0B',
  rose:    'EF4444',
  white:   'FFFFFF',
  offWht:  'F8F8FF',
  darkTxt: '1E293B',
  muted:   '64748B',
};

const ACCENT = [C.indigo, C.purple, C.cyan, C.emerald, C.amber, C.rose];
const BULLET_COLORS = [C.indigo, C.purple, C.cyan, C.emerald, C.amber, C.rose];

function accent(i: number) { return ACCENT[i % ACCENT.length]; }

// Solid-filled rectangle shape (no text)
function solidShape(id: number, name: string, x: number, y: number, cx: number, cy: number, fill: string): string {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>`;
}

// Text-only shape (transparent background)
function textShape(id: number, name: string, x: number, y: number, cx: number, cy: number, anchorV: string, content: string): string {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr anchor="${anchorV}" wrap="square"><a:normAutofit/></a:bodyPr><a:lstStyle/>${content}</p:txBody></p:sp>`;
}

// Rounded-rect shape with fill + text
function roundedShape(id: number, name: string, x: number, y: number, cx: number, cy: number, fill: string, content: string): string {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 8000"/></a:avLst></a:prstGeom><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr anchor="ctr" wrap="square" lIns="228600" rIns="228600" tIns="114300" bIns="114300"><a:normAutofit/></a:bodyPr><a:lstStyle/>${content}</p:txBody></p:sp>`;
}

// Embedded image shape
function picShape(id: number, name: string, x: number, y: number, cx: number, cy: number, rId: string): string {
  return `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="${name}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
}

function cleanContent(content: string): string {
  return content
    .replace(/\b(as an ai[^.\n]*[.\n]|as a language model[^.\n]*[.\n]|generated by ai[^.\n]*[.\n]|note: i am an ai[^.\n]*[.\n]|disclaimer:[^.\n]*[.\n])/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Lines that should never become bullets (generic placeholders)
const PLACEHOLDER_RE = /^(image|photo|picture|illustration|video|audio|animation|infographic|interactive element|speaker note|note|caption|alt text|figure|diagram|chart|graph|map|table|icon|logo|background|footer|header|source|reference|citation)\s*:/i;

function parseSlides(content: string): Slide[] {
  const cleaned = cleanContent(content);
  const lines = cleaned.split('\n');
  const slides: Slide[] = [];
  let cur: Slide | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const hm = line.match(/^#{1,4}\s+(.+)/);
    if (hm) {
      if (cur && (cur.title || cur.bullets.length || cur.imageQuery || cur.quizQuestion)) slides.push(cur);
      cur = { title: hm[1].replace(/\*\*/g,'').replace(/\*/g,'').trim(), bullets: [] };
      continue;
    }

    if (!cur) cur = { title: '', bullets: [] };

    // ── Check for special markers ANYWHERE in the line (handles "▸ Image: [IMAGE: ...]" etc.) ──

    // [IMAGE: query] found anywhere → real photo to embed
    const imgAnywhere = line.match(/\[IMAGE:\s*(.+?)\]/i);
    if (imgAnywhere) { cur.imageQuery = cur.imageQuery || imgAnywhere[1].trim(); continue; }

    // [VIDEO:] / [AUDIO:] / [ANIMATION:] → drop (can't embed these)
    if (/\[(VIDEO|AUDIO|ANIMATION|INTERACTIVE):/i.test(line)) continue;

    // [QUIZ: question] found anywhere
    const qzAnywhere = line.match(/\[QUIZ:\s*(.+?)\]/i);
    if (qzAnywhere) { cur.quizQuestion = cur.quizQuestion || qzAnywhere[1].trim(); continue; }

    // Strip bullet/number marker to get the content portion
    const stripped = line.replace(/^[-*+•▸►✦\d.]+\s*/,'').trim();

    // Legacy AI output: "Image: description" or "Image: [IMAGE: ...]"
    const legacyImg = stripped.match(/^image\s*:\s*(.+)/i);
    if (legacyImg) {
      // Extract from inner [IMAGE: ...] if present, else use raw text as query
      const inner = legacyImg[1].match(/\[IMAGE:\s*(.+?)\]/i);
      cur.imageQuery = cur.imageQuery || (inner ? inner[1] : legacyImg[1].replace(/\[.*?\]/g,'').trim());
      continue;
    }

    // Legacy AI output: "Interactive element: ..." / "Quiz: ..."
    const legacyQz = stripped.match(/^(interactive element|quiz)\s*:\s*(.+)/i);
    if (legacyQz) {
      // Only keep it if it looks like a question, not a [VIDEO:] placeholder
      const qText = legacyQz[2].replace(/\[.*?\]/g,'').trim();
      if (qText.length > 3) cur.quizQuestion = cur.quizQuestion || qText;
      continue;
    }

    if (PLACEHOLDER_RE.test(stripped)) continue;

    const clean = stripped.replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/`(.*?)`/g,'$1').trim();
    if (clean.length > 2) cur.bullets.push(clean.slice(0, 200));
  }

  if (cur && (cur.title || cur.bullets.length || cur.imageQuery || cur.quizQuestion)) slides.push(cur);

  if (!slides.length) {
    const text = cleaned.replace(/[#*`\[\]]/g,'').trim();
    slides.push({ title: 'Presentation', bullets: text.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 7) });
  }

  const out: Slide[] = [];
  for (const s of slides) {
    if (!s.title && !s.bullets.length && !s.imageQuery && !s.quizQuestion) continue;
    if (s.bullets.length <= 6) { out.push(s); continue; }
    for (let i = 0; i < s.bullets.length; i += 6)
      out.push({ title: s.title + (i ? ' (cont.)' : ''), bullets: s.bullets.slice(i, i + 6), imageQuery: i === 0 ? s.imageQuery : undefined, quizQuestion: i === 0 ? s.quizQuestion : undefined });
  }
  return out.slice(0, 40);
}

// Fetch image from our server proxy (which calls Pollinations.ai)
async function fetchSlideImage(query: string): Promise<SlideImage | null> {
  try {
    const res = await fetch('/api/fetch-image-for-export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.base64) return null;

    const binary = atob(json.base64);
    const data = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);

    const ext = (json.mimeType || '').includes('png') ? 'png' : 'jpg';
    return { data, ext, mediaName: '' }; // mediaName set by caller
  } catch {
    return null;
  }
}

// Title slide (dark navy with indigo/purple bars)
function makeTitleSlide(title: string, subtitle: string): { xml: string; rels: string } {
  const titlePara = `<a:p><a:pPr algn="l"/><a:r><a:rPr lang="en-US" sz="4000" b="1" dirty="0"><a:solidFill><a:srgbClr val="${C.white}"/></a:solidFill><a:latin typeface="Calibri Light"/></a:rPr><a:t>${xEsc(title)}</a:t></a:r></a:p>`;
  const subPara = `<a:p><a:pPr algn="l"/><a:r><a:rPr lang="en-US" sz="1800" dirty="0"><a:solidFill><a:srgbClr val="CBD5E1"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${xEsc(subtitle)}</a:t></a:r></a:p>`;

  const shapes = [
    solidShape(10, 'BG', 0, 0, 9144000, 6858000, C.navy),
    solidShape(11, 'TopBar', 0, 0, 9144000, 190500, C.indigo),
    solidShape(12, 'BottomBar', 0, 6667500, 9144000, 190500, C.purple),
    solidShape(13, 'LeftStripe', 0, 190500, 95250, 6477000, C.indigo),
    solidShape(14, 'AccentBox', 8000000, 400000, 500000, 500000, C.purple),
    solidShape(15, 'AccentBox2', 8200000, 5900000, 300000, 300000, C.cyan),
    solidShape(16, 'TitleUnderline', 685800, 3900000, 3200000, 57150, C.indigo),
    textShape(2, 'TitleBox', 685800, 1700000, 7200000, 2200000, 'ctr', titlePara),
    textShape(3, 'SubBox', 685800, 4000000, 7200000, 600000, 't', subPara),
  ].join('');

  const xml = wrapSlide(`<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${C.navy}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`, shapes);
  const rels = baseSlideRels();
  return { xml, rels };
}

// Content slide — 2-column layout if image, full-width otherwise
function makeContentSlide(slide: Slide, idx: number): { xml: string; rels: string } {
  const headerColor = accent(idx);
  const hasImage = !!slide.image;
  const hasQuiz = !!slide.quizQuestion;
  const hasTitle = !!slide.title;

  // Layout constants
  const HEADER_H = 950000;
  const BODY_Y = hasTitle ? HEADER_H + 50000 : 200000;
  const BODY_H = 6858000 - BODY_Y - 200000;

  // With image: text takes left 53%, image takes right 45%
  const TEXT_X = 200000;
  const TEXT_CX = hasImage ? 4700000 : 8900000;
  const IMG_X = 5050000;
  const IMG_CX = 3900000;
  const IMG_Y = BODY_Y;
  const IMG_CY = hasQuiz ? BODY_H - 900000 : BODY_H;

  // Quiz callout at bottom of image column (or full width if no image)
  const QUIZ_Y = 6858000 - 800000;
  const QUIZ_X = hasImage ? IMG_X : TEXT_X;
  const QUIZ_CX = hasImage ? IMG_CX : 8900000;

  // Bullets
  const bulletParagraphs = slide.bullets.map((b, bi) => {
    const bc = BULLET_COLORS[bi % BULLET_COLORS.length];
    return `<a:p><a:pPr marL="342900" indent="-342900" spcBef="120000"><a:buClr><a:srgbClr val="${bc}"/></a:buClr><a:buFont typeface="Arial" charset="0"/><a:buChar char="&#x25B8;"/></a:pPr><a:r><a:rPr lang="en-US" sz="${hasImage ? '1600' : '1800'}" b="${bi===0?'1':'0'}" dirty="0"><a:solidFill><a:srgbClr val="${C.darkTxt}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${xEsc(b)}</a:t></a:r></a:p>`;
  }).join('');

  const titlePara = hasTitle
    ? `<a:p><a:pPr algn="l"/><a:r><a:rPr lang="en-US" sz="2600" b="1" dirty="0"><a:solidFill><a:srgbClr val="${C.white}"/></a:solidFill><a:latin typeface="Calibri Light"/></a:rPr><a:t>${xEsc(slide.title)}</a:t></a:r></a:p>`
    : '';

  // Quiz shape content
  const quizContent = hasQuiz
    ? `<a:p><a:pPr algn="l"/><a:r><a:rPr lang="en-US" sz="1100" b="1" dirty="0"><a:solidFill><a:srgbClr val="FDE68A"/></a:solidFill></a:rPr><a:t>&#x2753; QUIZ</a:t></a:r></a:p><a:p><a:pPr algn="l"/><a:r><a:rPr lang="en-US" sz="1400" b="1" dirty="0"><a:solidFill><a:srgbClr val="${C.white}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${xEsc(slide.quizQuestion!)}</a:t></a:r></a:p>`
    : '';

  // Build image rId — rId2 is image if present
  const imageRId = 'rId2';

  const shapes = [
    hasTitle ? solidShape(10, 'HeaderBar', 0, 0, 9144000, HEADER_H, headerColor) : '',
    solidShape(11, 'LeftStripe', 0, hasTitle ? HEADER_H : 0, 76200, 6858000 - (hasTitle ? HEADER_H : 0), headerColor),
    solidShape(12, 'BottomLine', 0, 6700800, 9144000, 57150, headerColor),
    hasTitle ? textShape(2, 'TitleBox', 200000, 90000, 8900000, HEADER_H - 100000, 'ctr', titlePara) : '',
    textShape(3, 'BodyBox', TEXT_X, BODY_Y, TEXT_CX, BODY_H - (hasQuiz && !hasImage ? 850000 : 0), 't',
      bulletParagraphs || `<a:p><a:r><a:rPr lang="en-US" sz="1800" dirty="0"><a:solidFill><a:srgbClr val="${C.muted}"/></a:solidFill></a:rPr><a:t></a:t></a:r></a:p>`),
    // Image placeholder frame (always shown in image slot — filled with image if fetched, or accent color if not)
    hasImage
      ? [solidShape(20, 'ImgBorder', IMG_X - 30000, IMG_Y - 30000, IMG_CX + 60000, IMG_CY + 60000, headerColor), picShape(21, 'SlidePhoto', IMG_X, IMG_Y, IMG_CX, IMG_CY, imageRId)].join('')
      : '',
    // Quiz callout box
    hasQuiz ? roundedShape(30, 'QuizBox', QUIZ_X, QUIZ_Y, QUIZ_CX, 780000, C.purple, quizContent) : '',
    // Page number
    `<p:sp><p:nvSpPr><p:cNvPr id="40" name="PageNum"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="8400000" y="6620000"/><a:ext cx="650000" cy="200000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr anchor="ctr"/><a:lstStyle/><a:p><a:pPr algn="r"/><a:r><a:rPr lang="en-US" sz="900" dirty="0"><a:solidFill><a:srgbClr val="${C.muted}"/></a:solidFill></a:rPr><a:t>${idx + 1}</a:t></a:r></a:p></p:txBody></p:sp>`,
  ].filter(Boolean).join('');

  const xml = wrapSlide(`<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${C.offWht}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`, shapes);

  const rels = hasImage
    ? contentSlideRels(slide.image!.mediaName)
    : baseSlideRels();

  return { xml, rels };
}

function wrapSlide(bg: string, shapes: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld>${bg}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function baseSlideRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`;
}

function contentSlideRels(mediaName: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${mediaName}"/></Relationships>`;
}

export async function downloadPptx(content: string, filename = 'fius-presentation') {
  // Step 1 — AI reformats content, preserving [IMAGE:] and [QUIZ:] markers
  let processedContent = content;
  try {
    const res = await fetch('/api/format-for-export', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, type: 'pptx' }),
    });
    if (res.ok) { const d = await res.json(); if (d.formatted) processedContent = d.formatted; }
  } catch { /* use original */ }

  // Step 2 — Parse slides (extracts imageQuery + quizQuestion per slide)
  const slides = parseSlides(processedContent);
  const presentationTitle = slides[0]?.title || filename.replace(/-/g, ' ');

  // Auto-fill imageQuery for every slide that doesn't have one (so every slide gets a photo)
  for (const s of slides) {
    if (!s.imageQuery) {
      const parts = [s.title, s.bullets[0], s.bullets[1]].filter(Boolean);
      s.imageQuery = parts.join(' ').slice(0, 120) || presentationTitle;
    }
  }

  // Step 3 — Fetch images for ALL slides in parallel (pre-assign mediaName by index)
  await Promise.all(slides.map(async (s, i) => {
    const img = await fetchSlideImage(s.imageQuery!);
    if (img) {
      img.mediaName = `slide_img_${i}.${img.ext}`;
      s.image = img;
    }
  }));

  // Step 4 — Build slide entries (title slide + content slides)
  type TitleEntry = { kind: 'title'; title: string; subtitle: string };
  type ContentEntry = { kind: 'content'; slide: Slide; slideIndex: number };
  type SlideEntry = TitleEntry | ContentEntry;

  const allSlides: SlideEntry[] = [
    { kind: 'title', title: presentationTitle, subtitle: slides.length > 1 ? `${slides.length} Sections` : 'Key Insights' },
    ...slides.map((s, i): ContentEntry => ({ kind: 'content', slide: s, slideIndex: i })),
  ];
  const n = allSlides.length;

  // Step 5 — Render slide XML + rels
  const renderedSlides = allSlides.map(entry => {
    if (entry.kind === 'title') return makeTitleSlide(entry.title, entry.subtitle);
    return makeContentSlide(entry.slide, entry.slideIndex);
  });

  // Step 6 — Collect all media files
  const mediaFiles: ZFile[] = slides
    .filter(s => s.image)
    .map(s => ({ name: `ppt/media/${s.image!.mediaName}`, data: s.image!.data }));

  // Collect unique image extensions
  const hasJpg = mediaFiles.some(f => f.name.endsWith('.jpg'));
  const hasPng = mediaFiles.some(f => f.name.endsWith('.png'));

  // Step 7 — Build all static XML parts
  const imageContentTypes = [
    hasJpg ? `<Default Extension="jpg" ContentType="image/jpeg"/>` : '',
    hasJpg ? `<Default Extension="jpeg" ContentType="image/jpeg"/>` : '',
    hasPng ? `<Default Extension="png" ContentType="image/png"/>` : '',
  ].join('');

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${imageContentTypes}<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>${allSlides.map((_,i)=>`<Override PartName="/ppt/slides/slide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`;

  const presentation = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId${n+1}"/></p:sldMasterIdLst><p:sldIdLst>${allSlides.map((_,i)=>`<p:sldId id="${256+i}" r:id="rId${i+1}"/>`).join('')}</p:sldIdLst><p:sldSz cx="9144000" cy="6858000" type="screen4x3"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;

  const presentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${allSlides.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i+1}.xml"/>`).join('')}<Relationship Id="rId${n+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/></Relationships>`;

  const slideMaster = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lstStyle><a:lvl1pPr><a:defRPr lang="en-US" sz="3600" b="1"><a:solidFill><a:srgbClr val="${C.darkTxt}"/></a:solidFill></a:defRPr></a:lvl1pPr></a:lstStyle></p:titleStyle><p:bodyStyle><a:lstStyle><a:lvl1pPr><a:defRPr lang="en-US" sz="1800"><a:solidFill><a:srgbClr val="${C.darkTxt}"/></a:solidFill></a:defRPr></a:lvl1pPr></a:lstStyle></p:bodyStyle></p:txStyles></p:sldMaster>`;

  const slideMasterRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`;

  const slideLayout = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

  const slideLayoutRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;

  const theme = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Fius"><a:themeElements><a:clrScheme name="Fius"><a:dk1><a:srgbClr val="${C.darkTxt}"/></a:dk1><a:lt1><a:srgbClr val="${C.white}"/></a:lt1><a:dk2><a:srgbClr val="${C.navy}"/></a:dk2><a:lt2><a:srgbClr val="${C.offWht}"/></a:lt2><a:accent1><a:srgbClr val="${C.indigo}"/></a:accent1><a:accent2><a:srgbClr val="${C.purple}"/></a:accent2><a:accent3><a:srgbClr val="${C.cyan}"/></a:accent3><a:accent4><a:srgbClr val="${C.emerald}"/></a:accent4><a:accent5><a:srgbClr val="${C.amber}"/></a:accent5><a:accent6><a:srgbClr val="${C.rose}"/></a:accent6><a:hlink><a:srgbClr val="${C.indigo}"/></a:hlink><a:folHlink><a:srgbClr val="${C.purple}"/></a:folHlink></a:clrScheme><a:fontScheme name="Fius"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Fius"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;

  // Step 8 — Assemble all ZIP files
  const files: ZFile[] = [
    { name: '[Content_Types].xml', data: enc(contentTypes) },
    { name: '_rels/.rels', data: enc(rootRels) },
    { name: 'ppt/presentation.xml', data: enc(presentation) },
    { name: 'ppt/_rels/presentation.xml.rels', data: enc(presentationRels) },
    { name: 'ppt/theme/theme1.xml', data: enc(theme) },
    { name: 'ppt/slideMasters/slideMaster1.xml', data: enc(slideMaster) },
    { name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: enc(slideMasterRels) },
    { name: 'ppt/slideLayouts/slideLayout1.xml', data: enc(slideLayout) },
    { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: enc(slideLayoutRels) },
    ...renderedSlides.map((s, i) => ({ name: `ppt/slides/slide${i+1}.xml`, data: enc(s.xml) })),
    ...renderedSlides.map((s, i) => ({ name: `ppt/slides/_rels/slide${i+1}.xml.rels`, data: enc(s.rels) })),
    ...mediaFiles,
  ];

  // Step 9 — Download
  const zip = buildZip(files);
  const blob = new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.pptx`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
