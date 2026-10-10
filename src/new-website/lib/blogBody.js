// blogBody.js — shared between the blog-admin rich-text editor and the
// public post renderer.
//
// Section bodies written before the Tiptap editor was added are plain text
// following the small convention renderBlogText.jsx parses (blank line =
// paragraph, "- " = bullet, **text** = bold). Bodies written with the editor
// are HTML. `isHtmlBody` tells the two apart; `legacyBodyToHtml` upgrades an
// old plain-text body into HTML so the editor has something to load.

export const isHtmlBody = (body) =>
  typeof body === "string" && /<\/?(p|ul|ol|li|strong|em|u|s|del|code|blockquote|h[1-4]|a|img|span|br)[ >]/i.test(body);

const escapeHtml = (str) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const legacyInlineToHtml = (text) =>
  escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

export const legacyBodyToHtml = (body) => {
  if (!body) return "";
  if (isHtmlBody(body)) return body;

  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraphLines = [];
  let listItems = [];

  const flushParagraph = () => {
    if (paragraphLines.length) {
      blocks.push(`<p>${legacyInlineToHtml(paragraphLines.join(" ").trim())}</p>`);
      paragraphLines = [];
    }
  };
  const flushList = () => {
    if (listItems.length) {
      blocks.push(`<ul>${listItems.map((item) => `<li>${legacyInlineToHtml(item)}</li>`).join("")}</ul>`);
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

  return blocks.join("");
};
