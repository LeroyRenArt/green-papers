import { chromium } from "playwright";
import path from "path";

const htmlPath = path.resolve("papers/penguin-dashboard-legibility-as-governance.html");
const pdfPath  = path.resolve("papers/penguin-dashboard.pdf");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });

await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.emulateMedia({ media: "print" });

await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" }
});

await browser.close();
console.log("PDF regenerated:", pdfPath);
