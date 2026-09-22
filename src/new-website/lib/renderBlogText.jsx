// renderBlogText.jsx — turns a section body string into real paragraphs,
// bullet lists and bold text, instead of one unbroken block.
//
// The admin panel's body textarea is plain text, not a rich-text editor, so
// it needs *some* convention for structure. This supports the minimum that
// actually matters for a blog post:
//   - a blank line starts a new paragraph
//   - a line starting with "- " or "* " becomes a bullet list item
//   - **text** renders bold
// No markdown library — the grammar is small enough to parse by hand, and it
// keeps the admin form a plain textarea rather than pulling in an editor.

const renderInline = (text, keyPrefix) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    ),
  );
};

export default function renderBlogText(body) {
  if (!body) return null;

  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraphLines = [];
  let listItems = [];

  const flushParagraph = () => {
    if (paragraphLines.length) {
      blocks.push({ type: "p", text: paragraphLines.join(" ").trim() });
      paragraphLines = [];
    }
  };
  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: "ul", items: listItems });
      listItems = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)/);
    if (bullet) {
      flushParagraph();
      listItems.push(bullet[1]);
      continue;
    }
    flushList();
    paragraphLines.push(line);
  }
  flushParagraph();
  flushList();

  return blocks.map((block, i) =>
    block.type === "ul" ? (
      <ul className="nw-bpost__list" key={`blk-${i}`}>
        {block.items.map((item, j) => (
          <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
        ))}
      </ul>
    ) : (
      <p className="nw-bpost__p" key={`blk-${i}`}>{renderInline(block.text, `${i}`)}</p>
    ),
  );
}
