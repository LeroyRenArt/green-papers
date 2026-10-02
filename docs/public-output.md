# Public build output

Public URLs retain their existing paths. The canonical HTML, PDF and asset
sources remain in their current locations; no publication content is rewritten.

Run `npm run build` before local Pages preview or deployment. It copies only
the explicit paths in `public-files.json` to the generated `dist/` directory.
New public files must be added to that manifest as part of their reviewed change.
Unlisted drafts, development files, notes and credentials are not copied.

Cloudflare Pages runs `npm run build --if-present` with the repository root as
its build root. The optional-script flag supports the earlier main revision
without a build script; this revision runs the required public-output build. `wrangler.toml` selects `dist` as its public output. Verify the
project's actual build configuration and a preview before merging this change.
Do not merge with an empty build command or an unverified production boundary.

The `functions/` directory remains at the repository root. The PDF-download
middleware and its `PDF_DOWNLOADS` binding are preserved. `_headers`,
`_redirects` and `_routes.json` are copied into `dist` unchanged.

Before publication, verify public file hashes, all HTML/PDF paths, redirects,
custom 404, PDF GET/HEAD/conditional responses, and inaccessible project files.

This changes website output only. This is a public GitHub repository: excluded
files and Git history remain visible on GitHub. Keep confidential material in
a private repository or other private storage.

