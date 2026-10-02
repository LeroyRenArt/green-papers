# PDF document language: preserved-page candidate, 2 October 2026

35 PDFs lacked a document language. This candidate adds `/Lang` from each
matching canonical HTML document: 34 English (`en`), one Danish (`da`).
It changes no wording, page content, fonts, dimensions or layout and does not
regenerate any page. PDFs that already specify a language are untouched.

Base main: `ca374cd4f5e40af7e03923a2bfdcb21e69ff3ca8`.

## Verification

All 35 files passed, covering **367 pages**. Each candidate:

- preserves the entire original PDF byte sequence as its prefix;
- retains the reachable catalog object graph and metadata, except the added `/Lang`;
- has exactly identical rendered pixels at 72 dpi and exact extracted text on every page;
- passes strict parsing, language, EOF and page-count checks.

The PDF update is incremental. A new catalog revision supplies the language;
original page objects and streams remain unchanged. The script compares object
relationships, including shared references and decoded stream bytes. Protected,
encrypted or digitally signed documents are parked. No such file was accepted.
All repository input hashes are checked unchanged after the run.

`pdf-document-languages-20261002.json` records every path, page count,
HTML-source hash, original hash and candidate hash. No file needed parking.

## Reproduce safely

In an isolated Python environment use `scripts/requirements-pdf-languages.txt`:

```sh
python3 scripts/add_pdf_document_languages.py /absolute/path/to/new-output-directory
```

The output directory must be new and outside the repository. The script never
overwrites sources, commits, pushes or deploys. Normal Python mode is required.
Run it against the baseline to reproduce this checkpoint; after merging, PDFs
with languages are skipped.

## Scope and publication

Language metadata helps readers choose the document language. It does not add
structure tags or certify PDF/UA, reading order or accessibility. The existing
Rule of Life structure-tag candidate remains separate in draft PR #61;
semantic and actual screen-reader testing are still pending there. Broad
PDF standardization and other regeneration are parked.

This is a draft GitHub candidate, not a production release. Canonical HTML and
the production branch are unchanged. Publication follows a concrete release
card, the separate `PUBLICÉR NU` gate in Production Protocol v6.0, and live
verification. Lars does not need to review all pages for this language-only
change; page preservation was checked automatically.
