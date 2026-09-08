import { chromium } from "playwright";

const dir = process.argv[2];
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
page.on("requestfailed", (r) => errors.push("REQFAIL: " + r.url()));

await page.goto("http://localhost:5199/new-website", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2200);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);

const check = await page.evaluate(() => {
  const m = document.querySelector("#nw-partners-marquee");
  const track = m?.querySelector(".nw-marquee__track");
  const groups = m?.querySelectorAll(".nw-marquee__group");
  const tW = track?.getBoundingClientRect().width ?? 0;
  const gW = groups?.[0]?.getBoundingClientRect().width ?? 0;
  return {
    sections: [...document.querySelectorAll("main > section")].map(s => s.id),
    schoolLogoBlocks: document.querySelectorAll(".nw-partners__logo, .nw-schools__logo").length,
    partnersSeamDeltaPx: Math.round((tW / 2 - gW) * 100) / 100,
    partnersAnimation: track ? getComputedStyle(track).animationName : "none",
    servicesHasStakeholders: !!document.querySelector("#nw-solution .nw-services__sh-card"),
    stakeholderCards: document.querySelectorAll(".nw-services__sh-card").length,
  };
});
console.log(JSON.stringify(check, null, 1));

const el = await page.$("#nw-partners");
if (el) await el.screenshot({ path: `${dir}/p-strip.png` });
const sv = await page.$("#nw-solution");
if (sv) await sv.screenshot({ path: `${dir}/p-services.png` });
console.log("errors:", errors.length ? errors : "none");
await browser.close();
