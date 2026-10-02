"""Derive the Rule of Life EN/DA PDF pair into a new review directory.

This is the paper-specific WeasyPrint 70 lineage in Production Protocol v6.0
section 19.6. It does not regenerate HTML, overwrite public PDFs, or deploy.
Tags are a structural improvement, not a claim of PDF/UA certification.
"""
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse
import hashlib
import json
import unicodedata
from collections import Counter
import fitz
from pypdf import PdfReader
from weasyprint import CSS, HTML, URLFetcher, __version__

ROOT = Path(__file__).resolve().parents[1]
PAIRS = [('rule-of-life', 'en'), ('rule-of-life-da', 'da')]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def normalized_text(reader):
    text = ''.join(page.extract_text() or '' for page in reader.pages)
    return ''.join(unicodedata.normalize('NFKC', text).replace('\xad', '').split())


def structure_roles(reader):
    roles = Counter()
    seen = set()

    def walk(node):
        if isinstance(node, list):
            for child in node:
                walk(child)
            return
        if hasattr(node, 'idnum'):
            key = (node.idnum, node.generation)
            if key in seen:
                return
            seen.add(key)
        if hasattr(node, 'get_object'):
            node = node.get_object()
        if not isinstance(node, dict):
            return
        if '/S' in node:
            roles[str(node['/S'])] += 1
        if '/K' in node:
            walk(node['/K'])

    walk(reader.trailer['/Root'].get('/StructTreeRoot'))
    return dict(sorted(roles.items()))


def main():
    if not __debug__:
        raise SystemExit('STOP: Python optimization would disable validation.')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output_directory', type=Path,
                        help='A new directory outside the repository; never overwritten.')
    args = parser.parse_args()
    output = args.output_directory.resolve()
    if __version__ != '70.0':
        raise SystemExit('STOP: this lineage requires WeasyPrint 70.0.')
    if output == ROOT or ROOT in output.parents:
        raise SystemExit('STOP: review outputs must be outside the repository.')
    if output.exists():
        raise SystemExit('STOP: output directory already exists.')
    output.mkdir(parents=True)
    denied = []

    class LocalFetcher(URLFetcher):
        def fetch(self, url, headers=None):
            parsed = urlsplit(url)
            if parsed.scheme == 'file' and parsed.netloc in ('', 'localhost'):
                path = Path(unquote(parsed.path)).resolve()
                # Resolve site-root resource references from the local copy.
                # The paper currently links /spiralweb-skiplink.css.
                if path == Path('/spiralweb-skiplink.css'):
                    path = ROOT / 'spiralweb-skiplink.css'
                if path == ROOT or ROOT in path.parents:
                    return super().fetch(path.as_uri(), headers=headers)
            denied.append(url)
            raise ValueError('Only local repository resources may be loaded.')

    local_fetcher = LocalFetcher(fail_on_errors=True)

    print_css = ROOT / 'scripts/rule-of-life-print.css'
    css = CSS(filename=str(print_css), url_fetcher=local_fetcher)
    source_hashes = {str(p.relative_to(ROOT)): digest(p.read_bytes())
                     for p in ROOT.rglob('*') if p.is_file()}
    report = {'generator': 'WeasyPrint ' + __version__,
              'print_css_sha256': digest(print_css.read_bytes()),
              'pdf_ua_certified': False, 'publication_attempts': 0, 'pairs': []}
    try:
        for name, lang in PAIRS:
            html_path = ROOT / 'papers' / (name + '.html')
            original_path = ROOT / 'papers' / (name + '.pdf')
            doc = HTML(filename=str(html_path), url_fetcher=local_fetcher).render(stylesheets=[css])
            if denied:
                raise ValueError('External or out-of-repository resource requested.')
            candidate = output / (name + '.pdf')
            doc.write_pdf(str(candidate), pdf_tags=True)
            if not candidate.read_bytes().rstrip().endswith(b'%%EOF'):
                raise ValueError('Generated PDF is incomplete.')
            original = PdfReader(original_path)
            tagged = PdfReader(candidate, strict=True)
            catalog = tagged.trailer['/Root']
            mark = catalog.get('/MarkInfo', {}).get_object()
            roles = structure_roles(tagged)
            assert catalog.get('/Lang') == lang, 'Document language differs.'
            assert catalog.get('/StructTreeRoot') and mark.get('/Marked'), 'Tags missing.'
            assert roles.get('/H1') and roles.get('/H2') and roles.get('/P'), 'Core roles missing.'
            assert tagged.metadata.title == original.metadata.title, 'Title differs.'
            assert len(tagged.pages) == len(original.pages), 'Page count differs.'
            assert normalized_text(tagged) == normalized_text(original), 'Text differs.'
            # Every rendered page must match the currently tracked PDF, not
            # merely a fresh untagged output from the same new generator run.
            with fitz.open(original_path) as a, fitz.open(candidate) as b:
                for index in range(len(a)):
                    old = a[index].get_pixmap(alpha=False)
                    new = b[index].get_pixmap(alpha=False)
                    assert (old.width, old.height, old.samples) == (new.width, new.height, new.samples), \
                        'Rendered page differs: ' + str(index + 1)
            report['pairs'].append({'name': name, 'language': lang, 'pages': len(tagged.pages),
                'html_sha256': source_hashes[str(html_path.relative_to(ROOT))],
                'original_pdf_sha256': digest(original_path.read_bytes()),
                'candidate_pdf_sha256': digest(candidate.read_bytes()),
                'structure_roles': roles, 'text_parity': True,
                'all_pages_pixel_identical': True})
            print('PASS:', name, len(tagged.pages), 'pages; tags, language, text and layout checked.', flush=True)
        assert all((ROOT / name).is_file() and digest((ROOT / name).read_bytes()) == value
                   for name, value in source_hashes.items()), 'A repository input changed.'
        report['result'] = 'PASS'
    except Exception as error:
        report['result'] = 'STOP'
        report['error'] = str(error)
        raise
    finally:
        (output / 'RESULT.json').write_text(json.dumps(report, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
