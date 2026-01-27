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
   - Generated via Playwright (print_new_pdfs.mjs)  
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
