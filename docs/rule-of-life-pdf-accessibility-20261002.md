# Rule of Life: tagged PDF candidate, 2 October 2026

The currently tracked Rule of Life EN/DA PDFs have document languages but no
structure tree. This candidate adds PDF structure tags through the established
WeasyPrint 70.0 lineage in Production Protocol v6.0 section 19.6. Canonical
HTML, substantive text, titles, versions, references and layout are unchanged.
This is a paper-specific migration, not a corpus-wide generator replacement.

## Reproduce into a new review directory

Use a separate Python environment with `scripts/requirements-rule-of-life-pdf.txt`.
System Pango/fontconfig and the original fonts are required. The verified font
fallbacks were DejaVu Serif and Nimbus Sans. Different fonts/layout cause STOP.

```sh
python3 scripts/build_rule_of_life_tagged_pdf.py /absolute/path/to/new-review-directory
```

The output directory must not exist and must be outside this repository.
The script reads only the two named HTML/PDF pairs and local repository
resources. It refuses external resource loads, source mutation, missing tags,
wrong language/title, page-count changes, normalized-text differences or any
pixel difference between the candidate and the currently tracked PDF on any
page at 72 dpi. It never overwrites repository PDFs or deploys. Its RESULT.json
records hashes and structure roles. Use this tool specifically for a tags-only
migration; a substantive HTML/PDF edit requires its own reviewed workflow.

The print-only CSS records the exact previously uncommitted v6.0 override.
The site-root skiplink stylesheet is resolved from the local repository.
Tags are generated with `pdf_tags=True`; no PDF/UA certification is claimed.

## Verified checkpoint

Base main: `ca374cd4f5e40af7e03923a2bfdcb21e69ff3ca8`.
All 213 tracked baseline files matched the pinned backup manifest and Git tree.
The generator was run locally with WeasyPrint 70.0. Results:

| Candidate | Pages | Language | Text parity | Pixel comparison to tracked PDF |
| --- | ---: | --- | --- | --- |
| Rule of Life EN | 41 | en | PASS | All 41 pages identical |
| Rule of Life DA | 42 | da | PASS | All 42 pages identical |

Both candidates have Marked=true, a StructTreeRoot and structure entries for
headings, paragraphs, lists, links and the table with header/data cells.
First, middle, references and last pages of both candidates were rendered and
visually reviewed. No new visible layout change was found.

This checks structural presence and preserves the existing visual result. It
is not a complete semantic reading-order audit, VoiceOver test or PDF/UA
validation. Such review remains necessary before describing either PDF as
fully accessible. Existing PDF layout defects, if any, are outside this
metadata-only change. No other PDF is regenerated.

## Candidate hashes

- `rule-of-life.pdf`: `ee55bb4fe8097c22615bce401c4259d691d291ca1f9cca9feac6d0c3b80a86dd`
- `rule-of-life-da.pdf`: `7889677a0a37d011e2e58328b7f1051429b05c265cb72356d12d81acac60a01a`

## Publication boundary

This draft may have a Pages preview. Production main remains unchanged until
an operation-specific release card, Lars' exact PUBLICÉR NU, protected merge,
and independent live closeout. Review the two PDF replacements and the four
new tooling/documentation files; no source HTML or catalogue changes belong
to this candidate.
