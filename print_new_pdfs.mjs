import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const slugs = [
  "gold-before-bloom",
  "penguin-economics",
  "meatball-before-symbol",
  "elir-when-love-touches-soil",
  "elia-love-without-capture",
  "nervous-system-love",
  "commons-as-habitat",
  "boundaries-are-not-violence",
  "ritual-after-regulation",
  "holding-the-line",
];

const papersDir = path.join(__dirname, "papers");

const htmlToPdf = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const slug of slugs) {
    const htmlPath = path.join(papersDir, `${slug}.html`);
    const pdfPath  = path.join(papersDir, `${slug}.pdf`);
    const url = `file://${htmlPath}`;

    await page.goto(url, { waitUntil: "networkidle" });

    // Ensure CSS is applied as on screen
    await page.emulateMedia({ media: "screen" });

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
    });

    console.log(`✅ ${slug}.pdf`);
  }

  await browser.close();
};

htmlToPdf().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
