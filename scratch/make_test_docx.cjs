const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require("docx");

const doc = new Document({
  sections: [{
    children: [
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Imported Title")] }),
      new Paragraph({ children: [new TextRun("Plain text with "), new TextRun({ text: "bold", bold: true }), new TextRun(" and "), new TextRun({ text: "italic", italics: true }), new TextRun(" words.")] }),
      new Paragraph({ text: "First bullet", bullet: { level: 0 } }),
      new Paragraph({ text: "Second bullet", bullet: { level: 0 } }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(__dirname + "/test-import.docx", buf);
  console.log("wrote test-import.docx", buf.length, "bytes");
});
