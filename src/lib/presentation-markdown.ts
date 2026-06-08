/**
 * Parse AI-generated presentation Markdown into discrete slides for a deck view.
 *
 * The AI ("presentation" content type) is asked to emit:
 *   ## Slide N: <title>
 *   - bullet point
 *   - bullet point
 *   IMAGE: <short visual description for one illustrative image>
 *
 * The parser is forgiving: any heading (`#`–`####`) starts a new slide, an
 * optional "Slide N:" prefix is stripped from the title, bullets / numbered
 * lines / plain paragraphs become points, and an `IMAGE:` line (or a markdown
 * `![alt](url)`) becomes the slide's image.
 */

export interface Slide {
  title: string;
  bullets: string[];
  /** Visual description the AI suggested for this slide (drives image generation). */
  imagePrompt?: string;
  /** Explicit image URL if the slide embedded one (markdown image). */
  imageUrl?: string;
}

const clean = (s: string): string =>
  s.replace(/\*\*/g, '').replace(/`/g, '').replace(/^[*_~\s]+|[*_~\s]+$/g, '').trim();

export function presentationMarkdownToSlides(md: string): Slide[] {
  const lines = (md || '').split(/\r?\n/);
  const slides: Slide[] = [];
  let current: Slide | null = null;

  const flush = () => {
    if (current && (current.title || current.bullets.length)) slides.push(current);
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || /^[-=]{3,}$/.test(line)) continue; // skip blanks & horizontal rules

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      flush();
      let title = clean(heading[1]);
      const slideMatch = title.match(/^slide\s*\d+\s*[:\-.]?\s*(.*)$/i);
      if (slideMatch) title = clean(slideMatch[1]) || `Slide ${slides.length + 1}`;
      current = { title: title || `Slide ${slides.length + 1}`, bullets: [] };
      continue;
    }

    if (!current) current = { title: `Slide ${slides.length + 1}`, bullets: [] };

    // Markdown image: ![alt](url)
    const mdImg = line.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
    if (mdImg) {
      current.imageUrl = mdImg[1];
      continue;
    }

    // "IMAGE: <prompt>" / "Image - <prompt>" / "Visual: <prompt>"
    const imgLine = line.match(/^(?:image|visual|picture|illustration)\s*[:\-]\s*(.+)$/i);
    if (imgLine) {
      current.imagePrompt = clean(imgLine[1]);
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(.*)$/) || line.match(/^\d+[).]\s+(.*)$/);
    const text = clean(bullet ? bullet[1] : line);
    if (!text) continue;
    current.bullets.push(text);
  }
  flush();

  return slides;
}

const GENERIC_TITLE = /^(introduction|overview|summary|conclusion|agenda|outline|objectives?|contents?|recap|thank\s*you|questions?)$/i;

/**
 * Build a concept search query for a slide. Uses the slide title (the concept),
 * enriched with the topic/subject context. For generic titles (Introduction,
 * Summary, …) it relies on the context so the image stays on-topic.
 */
export function slideImageQuery(slide: Slide, context = ''): string {
  const title = (slide.title || '').trim();
  const ctx = context.trim();
  const parts = !title || GENERIC_TITLE.test(title) ? [ctx] : [title, ctx];
  return parts.filter(Boolean).join(' ').trim() || ctx || slide.imagePrompt || '';
}

/**
 * Build a content-rich text-to-image prompt for a slide so the generated image
 * actually reflects the slide. Combines the AI's IMAGE description (or title),
 * the slide's key bullet points, and the topic/subject context.
 */
export function slideImagePrompt(slide: Slide, context = ''): string {
  const subject = context.trim();
  const concept = (slide.imagePrompt || slide.title || '').trim();
  const points = (slide.bullets || [])
    .slice(0, 3)
    .map((b) => b.replace(/[*_`#]/g, '').trim())
    .filter(Boolean)
    .join(', ');
  return [
    concept,
    points && `depicting ${points}`,
    subject && `subject: ${subject}`,
  ]
    .filter(Boolean)
    .join(', ')
    .trim() || concept || subject;
}

const imageCache = new Map<string, string | null>();

/**
 * Resolve a relevant, content-matched image for a slide via the Wikipedia
 * page-images API (keyless, CORS-enabled, educational). Searches for the query
 * and returns the lead image of the best-matching article, or null when there's
 * no good match (we prefer no image over an irrelevant one). Results are cached.
 */
export async function fetchSlideImage(query: string): Promise<string | null> {
  const q = query.trim();
  if (!q) return null;
  if (imageCache.has(q)) return imageCache.get(q) ?? null;

  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
    '&prop=pageimages&piprop=thumbnail&pithumbsize=600' +
    `&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=5`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const pages: any[] = data?.query?.pages ? Object.values(data.query.pages) : [];
    pages.sort((a, b) => (a?.index ?? 99) - (b?.index ?? 99));
    const hit = pages.find((p) => p?.thumbnail?.source);
    const thumb: string | null = hit?.thumbnail?.source ?? null;
    imageCache.set(q, thumb);
    return thumb;
  } catch {
    imageCache.set(q, null);
    return null;
  }
}
