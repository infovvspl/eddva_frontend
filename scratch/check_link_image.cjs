const { chromium } = require("playwright");
const path = require("path");

(async () => {
  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
  const errors = [];
  const pageErrors = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  page.on("pageerror", (err) => pageErrors.push(String(err)));

  await page.goto("http://localhost:8083/__devtest-editor", { waitUntil: "networkidle" });
  await page.waitForSelector(".ProseMirror", { timeout: 15000 });

  // Persistent handler: accept prompts with a test URL, accept confirms (OK to overwrite).
  page.on("dialog", (dialog) => {
    if (dialog.type() === "prompt") dialog.accept("https://example.com/test-link");
    else dialog.accept();
  });

  // ── Link insertion ──
  await page.click(".ProseMirror");
  await page.keyboard.press("Control+End");
  await page.keyboard.type(" Click here");
  await page.keyboard.down("Shift");
  for (let i = 0; i < "Click here".length; i++) await page.keyboard.press("ArrowLeft");
  await page.keyboard.up("Shift");

  await page.click('button[title="Link"]');
  await page.waitForTimeout(300);

  const htmlAfterLink = await page.locator("#html-output").textContent();
  console.log("HTML after inserting link:\n", htmlAfterLink);

  // ── DOCX import (hyperlink + image + heading + bullets) ──
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.click('button[title="Import from Word (.docx)"]');
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.join(__dirname, "test-import2.docx"));
  await page.waitForTimeout(1500);

  const htmlAfterImport = await page.locator("#html-output").textContent();
  console.log("\nHTML after importing docx (link + image + bullets):\n", htmlAfterImport);

  await page.screenshot({ path: "scratch/link_image_after_import.png", fullPage: true });

  // ── DOCX export round trip ──
  const downloadPromise = page.waitForEvent("download");
  await page.click('button[title="Export as Word (.docx)"]');
  const download = await downloadPromise;
  const savePath = path.join(__dirname, "exported-roundtrip.docx");
  await download.saveAs(savePath);
  console.log("\nExported file saved to:", savePath);

  console.log("\nConsole errors:", errors);
  console.log("Page errors:", pageErrors);

  await browser.close();
})();
