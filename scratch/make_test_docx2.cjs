const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ExternalHyperlink, ImageRun } = require("docx");

// 2x2 red PNG, hand-built so we don't need any extra deps.
const RED_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFUlEQVR42mNk+M9QzzCKRwWjYGgAAJbDAwMs52BOAAAAAElFTkSuQmCC";
const imageBuffer = Buffer.from(RED_PNG_BASE64, "base64");

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Imported Title")] }),
      new Paragraph({
        children: [
          new TextRun("Visit "),
          new ExternalHyperlink({ link: "https://example.com/docs", children: [new TextRun({ text: "our docs", style: "Hyperlink" })] }),
          new TextRun(" for more."),
        ],
      }),
      new Paragraph({ children: [new ImageRun({ data: imageBuffer, type: "png", transformation: { width: 40, height: 40 } })] }),
      new Paragraph({ text: "First bullet", bullet: { level: 0 } }),
      new Paragraph({ text: "Second bullet", bullet: { level: 0 } }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(__dirname + "/test-import2.docx", buf);
  console.log("wrote test-import2.docx", buf.length, "bytes");
});
