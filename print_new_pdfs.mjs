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

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const slug of slugs) {
    const htmlPath = path.join(papersDir, `${slug}.html`);
    const pdfPath  = path.join(papersDir, `${slug}.pdf`);
    const url = `file://${htmlPath}`;

    await page.goto(url, { waitUntil: "networkidle" });

    // PRINT mode (this is the key difference)
    await page.emulateMedia({ media: "print" });

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "18mm", right: "18mm", bottom: "18mm", left: "18mm" },
    });

    console.log(`✅ ${slug}.pdf`);
  }

  await browser.close();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
