"""Add missing PDF language from matching HTML without regenerating pages.

Outputs go to a new directory outside the repository. Full PDF object graphs,
metadata and every rendered page are compared before accepting each file.
This adds language metadata only; it does not tag or certify a document.
"""
from pathlib import Path
from html.parser import HTMLParser
from collections.abc import Mapping
import argparse, hashlib, json
import fitz
from pypdf import PdfReader, PdfWriter
from pypdf.generic import IndirectObject, StreamObject, NameObject, TextStringObject

ROOT = Path(__file__).resolve().parents[1]

def sha(data):
    return hashlib.sha256(data).hexdigest()

class LanguageParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.languages = []
    def handle_starttag(self, tag, attrs):
        if tag == 'html': self.languages.append(dict(attrs).get('lang'))

def compare_graphs(old, new):
    pairs = {}; reverse = {}
    def compare(a, b, path, root=False):
        if isinstance(a, IndirectObject):
            if not isinstance(b, IndirectObject):
                raise ValueError('Indirect reference changed at ' + path)
            ka=(a.idnum,a.generation); kb=(b.idnum,b.generation)
            if ka in pairs:
                if pairs[ka] != kb: raise ValueError('Shared object changed at ' + path)
                return
            if kb in reverse and reverse[kb] != ka:
                raise ValueError('Object alias changed at ' + path)
            pairs[ka]=kb; reverse[kb]=ka
            a=a.get_object(); b=b.get_object()
        elif isinstance(b, IndirectObject):
            raise ValueError('Direct reference changed at ' + path)
        if isinstance(a, Mapping):
            if not isinstance(b, Mapping): raise ValueError('Object type changed at ' + path)
            ak=set(a); bk=set(b)
            if root: bk.discard('/Lang')
            if ak != bk: raise ValueError('Dictionary changed at ' + path)
            if isinstance(a, StreamObject):
                if not isinstance(b, StreamObject) or a.get_data()!=b.get_data():
                    raise ValueError('Stream changed at ' + path)
            for k in ak: compare(a.raw_get(k),b.raw_get(k),path+'/'+str(k))
        elif isinstance(a,(list,tuple)):
            if not isinstance(b,(list,tuple)) or len(a)!=len(b):
                raise ValueError('Array changed at ' + path)
            for i,(x,y) in enumerate(zip(a,b)): compare(x,y,path+'/'+str(i))
        elif a != b:
            raise ValueError('Value changed at ' + path)
    compare(old.trailer.raw_get('/Root'),new.trailer.raw_get('/Root'),'Root',True)
    if '/Info' in old.trailer:
        compare(old.trailer.raw_get('/Info'),new.trailer.raw_get('/Info'),'Info')

def main():
    if not __debug__: raise SystemExit('STOP: validation requires normal Python mode.')
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output_directory',type=Path)
    out=parser.parse_args().output_directory.resolve()
    if out.exists() or out==ROOT or ROOT in out.parents:
        raise SystemExit('STOP: choose a new output directory outside the repository.')
    files={str(p.relative_to(ROOT)):sha(p.read_bytes()) for p in ROOT.rglob('*') if p.is_file()}
    out.mkdir(parents=True)
    report={'result':'STOP','scope':'Document language only; no page regeneration or publication','accepted':[],'parked':[]}
    try:
        for path in sorted(ROOT.rglob('*.pdf')):
            relative=str(path.relative_to(ROOT)); reader=PdfReader(path)
            catalog=reader.trailer['/Root']
            if catalog.get('/Lang'): continue
            html=path.with_suffix('.html')
            if not html.is_file():
                report['parked'].append({'path':relative,'reason':'No matching HTML source'}); continue
            lp=LanguageParser(); lp.feed(html.read_text(encoding='utf-8'))
            if len(lp.languages)!=1 or lp.languages[0] not in ('en','da'):
                report['parked'].append({'path':relative,'reason':'Language requires review'}); continue
            lang=lp.languages[0]
            if reader.is_encrypted or '/Perms' in catalog or any(
                field.get('/FT') == '/Sig' for field in (reader.get_fields() or {}).values()
            ):
                report['parked'].append({'path':relative,'reason':'Encrypted or protected document'}); continue
            dest=out/relative; dest.parent.mkdir(parents=True,exist_ok=True)
            try:
                writer=PdfWriter(path, incremental=True)
                writer.root_object[NameObject('/Lang')]=TextStringObject(lang)
                with dest.open('xb') as f: writer.write(f)
                if not dest.read_bytes().startswith(path.read_bytes()):
                    raise ValueError('Original PDF bytes changed')
                if not dest.read_bytes().rstrip().endswith(b'%%EOF'):
                    raise ValueError('Incomplete PDF')
                changed=PdfReader(dest,strict=True)
                if changed.trailer['/Root'].get('/Lang')!=lang:
                    raise ValueError('Language not preserved')
                compare_graphs(reader,changed)
                if len(reader.pages)!=len(changed.pages): raise ValueError('Page count differs')
                with fitz.open(path) as a,fitz.open(dest) as b:
                    for i in range(len(a)):
                        old=a[i].get_pixmap(alpha=False); new=b[i].get_pixmap(alpha=False)
                        if (old.width,old.height,old.samples)!=(new.width,new.height,new.samples):
                            raise ValueError('Rendered page differs: '+str(i+1))
                        if a[i].get_text()!=b[i].get_text():
                            raise ValueError('Extracted text differs: '+str(i+1))
                report['accepted'].append({'path':relative,'language':lang,'pages':len(reader.pages),
                    'input_sha256':files[relative],'output_sha256':sha(dest.read_bytes()),
                    'html_sha256':files[str(html.relative_to(ROOT))],
                    'original_bytes_preserved_as_prefix':True,
                    'object_graph_identical_except_root_lang':True,'all_page_pixels_and_text_identical':True})
                print('PASS:',relative,lang,len(reader.pages),'pages',flush=True)
            except Exception as error:
                dest.unlink(missing_ok=True)
                report['parked'].append({'path':relative,'reason':str(error)})
                print('PARK:',relative,str(error),flush=True)
        if not all(sha((ROOT/n).read_bytes())==h for n,h in files.items()):
            raise ValueError('Repository input changed')
        report['result']='PASS'
    finally:
        (out/'RESULT.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('Accepted:',len(report['accepted']),'Parked:',len(report['parked']),flush=True)

if __name__=='__main__': main()
