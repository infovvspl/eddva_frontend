const mammoth = require("mammoth");
const fs = require("fs");

mammoth.convertToHtml({ path: __dirname + "/test-import2.docx" }).then((result) => {
  console.log("HTML:\n", result.value);
  console.log("\nMessages:", result.messages);
});
