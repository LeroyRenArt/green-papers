# Green Papers — Publishing Protocol
*A calm, repeatable procedure for publishing Green Papers on a static site.*

---

## Design Intent
This protocol exists to ensure:
- calm process
- no loss of material
- no detective work
- HTML as source of truth
- PDF as derived output
- editorial clarity across series

---

## Core Principles

1. HTML is the source of truth
   - All content lives first in HTML
   - PDFs are always generated from HTML

2. PDFs are derived artifacts
   - Generated via Playwright. Use `scripts/print_one_pdf.mjs` for an individual HTML/PDF pair; use a paper-specific generator only where that exception is explicitly documented
   - Always reproducible

3. Index is a catalogue, not content
   - index.html lists papers
   - No long text lives in the index

4. Work in batches
   - Papers are created and published in batches (typically 10)

---

## Repo Structure

green-papers/
- index.html
- style.css
- papers/
- print_new_pdfs.mjs
- PUBLISHING_PROTOCOL.md

---

## Workflow Summary

1. Create HTML papers
2. Update index.html
3. Generate PDFs
4. Verify locally
5. Commit and push

---

Maintained by
Lars A. Engberg
with Sophia Lumen / AI (ChatGPT v5.2)

---

## Canonical Public Surface and Retirement

The public site is an edited living canon, not a deployment of
every working stage.

1. **Current publications are foregrounded**
   - The index points readers toward the document that should be
     used now.
   - HTML, PDF, version, status, and citation must agree.

2. **Internal sketches remain in history**
   - Superseded sketches and working compilations may be removed
     from the deployed tree.
   - Git history and external backups preserve provenance.

3. **Old public routes retain continuity**
   - A removed legitimate URL receives a permanent redirect to
     its canonical successor where one exists.
   - A redirect must not conceal an unrelated missing page.

4. **The sitemap contains current canonical pages**
   - Retired sketch URLs are excluded.
   - Canonical extensionless HTML routes are preferred.

5. **PDFs follow HTML**
   - HTML remains the source of truth.
   - Any substantive HTML edit requires regeneration and review
     of its public PDF counterpart.

6. **Publication remains guarded**
   - Verify branch, synchronized HEAD, file scope, backups,
     content markers, redirects, live status, and body identity.
   - HTTP 200 alone is not proof of the intended page.
