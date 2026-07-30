import fs from "fs";

const mdPath = "sources/rule-of-life.en.md";
const templatePath = "papers/report-06-regenerative-reciprocity.html";
const outPath = "papers/rule-of-life.html";

if (!fs.existsSync(mdPath)) {
  console.error(`Missing markdown source: ${mdPath}`);
  process.exit(1);
}
if (!fs.existsSync(templatePath)) {
  console.error(`Missing template source: ${templatePath}`);
  process.exit(1);
}
if (fs.existsSync(outPath)) {
  console.error(`Refusing to overwrite existing file: ${outPath}`);
  process.exit(1);
}

const md = fs.readFileSync(mdPath, "utf8").replace(/\r\n/g, "\n");
const template = fs.readFileSync(templatePath, "utf8");

const styleMatch = template.match(/<style>[\s\S]*?<\/style>/);
if (!styleMatch) {
  console.error("Could not extract <style> block from Report 06 template.");
  process.exit(1);
}
const style = styleMatch[0];

const logoMatch = template.match(/<img class="logo"[\s\S]*?\/>/);
const logo = logoMatch ? logoMatch[0] : "";

function getLine(prefix) {
  const re = new RegExp("^\\*\\*" + prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ":\\*\\*\\s*(.+)$", "m");
  const m = md.match(re);
  return m ? m[1].trim() : "";
}

const title = (md.match(/^#\s+(.+)$/m)?.[1] || "Rule of Life").trim();
const subtitle = (md.match(/^##\s+(.+)$/m)?.[1] || "Penguin Economics, Regenerative Reciprocity, and the Ledger of the Commons").trim();
const series = getLine("Series") || "Series IV — Field Papers";
const paperType = getLine("Paper type") || "Constitutional Field Paper · Economic Field Paper · Commons Governance Note";
const version = getLine("Version") || "v1.0 · Release candidate";
const date = getLine("Date") || "May 2026";
const author = getLine("Author") || "Lars A. Engberg, PhD — Knowledge Worker";

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', "&quot;");
}
function inlineFormat(s) {
  let out = escapeHtml(s);

  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");

  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    return `<a href="${escapeAttr(url)}">${escapeHtml(text)}</a>`;
  });

  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/_{1}([^_]+)_{1}/g, "<em>$1</em>");

  return out;
}

function isTableStart(lines, i) {
  return (
    i + 1 < lines.length &&
    lines[i].includes("|") &&
    /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])
  );
}

function parseTable(lines, start) {
  const tableLines = [];
  let i = start;
  while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
    tableLines.push(lines[i]);
    i++;
  }

  function cells(row) {
    return row
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map(c => c.trim());
  }

  const headers = cells(tableLines[0]);
  const bodyRows = tableLines.slice(2).map(cells);

  let html = "<table>\n<thead><tr>";
  html += headers.map(h => `<th>${inlineFormat(h)}</th>`).join("");
  html += "</tr></thead>\n<tbody>\n";
  for (const row of bodyRows) {
    html += "<tr>" + row.map(c => `<td>${inlineFormat(c)}</td>`).join("") + "</tr>\n";
  }
  html += "</tbody>\n</table>\n";
  return { html, next: i };
}

function markdownToHtml(input) {
  const lines = input.split("\n");
  const parts = [];
  let i = 0;

  function collectParagraph() {
    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !isTableStart(lines, i)
    ) {
      buf.push(lines[i].trim());
      i++;
    }
    return buf.join(" ");
  }

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    if (isTableStart(lines, i)) {
      const parsed = parseTable(lines, i);
      parts.push(parsed.html);
      i = parsed.next;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 6); // body starts after title, so markdown ## remains h2
      parts.push(`<h${level}>${inlineFormat(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    if (/^\*\*[^*]+?\*\*$/.test(line.trim())) {
      parts.push(`<h3>${inlineFormat(line.trim().replace(/^\*\*|\*\*$/g, ""))}</h3>`);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, "").trim());
        i++;
      }
      parts.push(`<blockquote><p>${inlineFormat(buf.join(" "))}</p></blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, "").trim());
        i++;
      }
      parts.push("<ul>\n" + items.map(x => `<li>${inlineFormat(x)}</li>`).join("\n") + "\n</ul>");
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, "").trim());
        i++;
      }
      parts.push("<ol>\n" + items.map(x => `<li>${inlineFormat(x)}</li>`).join("\n") + "\n</ol>");
      continue;
    }

    const para = collectParagraph();
    if (para) {
      parts.push(`<p>${inlineFormat(para)}</p>`);
      continue;
    }

    i++;
  }

  return parts.join("\n\n");
}

// Remove title/subtitle and compact metadata block from the markdown body.
// Keep Index note, Editorial note, AI disclosure and everything after.
const bodyStart = md.search(/\*\*Index note\*\*/);
if (bodyStart < 0) {
  console.error("Could not find **Index note** marker.");
  process.exit(1);
}
const bodyMd = md.slice(bodyStart).trim();
const bodyHtml = markdownToHtml(bodyMd);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)} — Penguin Economics and the Ledger of the Commons · Green Papers</title>
<meta name="description" content="A Green Paper by Lars A. Engberg on Penguin Economics, Regenerative Reciprocity, PG Ledger, Rule of Life, 13×13 citizen science, AI stewardship, and the foundations of a Planetary Stewardship Economy." />
<meta name="author" content="Lars A. Engberg" />
<link rel="canonical" href="https://papers.spiralweb.earth/papers/rule-of-life" />
<meta property="og:title" content="Rule of Life — Penguin Economics and the Ledger of the Commons" />
<meta property="og:description" content="A constitutional and economic field paper on stewardship, reciprocity, commons governance, AI, citizen science, and life-supporting value." />
<meta property="og:type" content="article" />
${style}
</head>
<body>
<div class="wrap">

<div class="crumb"><a href="../">← Green Papers</a></div>

<div class="header">
  ${logo}
  <div class="meta"><span class="series">Series IV · Field Papers</span></div>
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">${escapeHtml(subtitle)}</p>
  <div class="meta">
    ${escapeHtml(paperType)} · ${escapeHtml(version)} · ${escapeHtml(date)}<br/>
    ${escapeHtml(author)}<br/>
    Green Papers / Spiralweb · Creative Commons Attribution 4.0 International (CC BY 4.0)
  </div>
</div>

${bodyHtml}

<div class="footer">
<p><strong>Series IV · Field Papers</strong></p>
<p>Green Papers / Spiralweb · Roskilde, Denmark</p>
<p>${escapeHtml(version)} · ${escapeHtml(date)} · Creative Commons Attribution 4.0 International (CC BY 4.0)</p>
<p><a href="../">Green Papers index</a> · <a href="https://spiralweb.earth/">spiralweb.earth</a></p>
</div>

</div>
</body>
</html>
`;

fs.writeFileSync(outPath, html, "utf8");
console.log(`Wrote ${outPath}`);
console.log(`${html.split("\n").length} lines`);
