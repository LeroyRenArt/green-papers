import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const args = process.argv.slice(2);

if (args.length < 1 || args.length > 2) {
  console.error(
    "Usage:\n" +
    "  node scripts/print_one_pdf.mjs <html-file>\n" +
    "  node scripts/print_one_pdf.mjs <html-file> <pdf-file>\n\n" +
    "Examples:\n" +
    "  node scripts/print_one_pdf.mjs papers/penguin-dashboard-legibility-as-governance.html\n" +
    "  node scripts/print_one_pdf.mjs papers/penguin-dashboard-legibility-as-governance.html papers/penguin-dashboard.pdf"
  );
  process.exit(1);
}

const htmlArg = args[0];
const pdfArg = args[1];

const htmlPath = path.resolve(htmlArg);

if (!fs.existsSync(htmlPath)) {
  console.error(`HTML file not found: ${htmlPath}`);
  process.exit(1);
}

if (path.extname(htmlPath).toLowerCase() !== ".html") {
  console.error(`Input must be an .html file: ${htmlPath}`);
  process.exit(1);
}

const pdfPath = pdfArg
  ? path.resolve(pdfArg)
  : htmlPath.replace(/\.html$/i, ".pdf");

const pdfDir = path.dirname(pdfPath);
fs.mkdirSync(pdfDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });

try {
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });

  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: {
      top: "18mm",
      right: "18mm",
      bottom: "18mm",
      left: "18mm",
    },
  });

  console.log(`PDF regenerated: ${pdfPath}`);
} catch (err) {
  console.error("Failed to generate PDF.");
  console.error(err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
