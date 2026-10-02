import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await readFile(new URL('functions/_middleware.js', root), 'utf8');
const { onRequest } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const headers = await readFile(new URL('_headers', root), 'utf8');
assert.equal(headers.split('\n').filter(x => x && !x.startsWith('#')).join('\n'),
  '/*\n  Strict-Transport-Security: max-age=300');
const routes = JSON.parse(await readFile(new URL('_routes.json', root), 'utf8'));
assert.deepEqual(routes, {version: 1, include: ['/papers/*.pdf', '/pdf/*.pdf', '/formats/*.pdf', '/kernel/*.pdf', '/protocols/*.pdf'], exclude: []});

let count = 0;
for (const host of ['papers.spiralweb.earth', 'test.green-papers.pages.dev']) {
  for (const protocol of ['https:', 'http:']) {
    for (const method of ['GET', 'HEAD']) {
      for (const status of [200, 206, 301, 308, 304, 404, 410, 500]) {
        for (const agent of ['Mozilla/5.0', 'curl/8', '']) {
          for (const measurement of ['available', 'absent', 'throws']) {
            const points = [];
            const request = new Request(`${protocol}//${host}/papers/example.pdf`, {
              method, headers: {'user-agent': agent, referer: `${protocol}//${host}/library`}
            });
            const h = {'Content-Type': 'application/pdf', ETag: '"test"',
              'Cache-Control': 'public, max-age=0, must-revalidate',
              'Content-Disposition': 'inline', 'X-Test': 'preserved'};
            if ([301, 308].includes(status)) h.Location = '/papers/current.pdf';
            if (status === 206) h['Content-Range'] = 'bytes 0-3/8';
            const body = method === 'HEAD' || status === 304 ? null : new Uint8Array([0, 255, 37, 80]);
            const original = new Response(body, {status, headers: h});
            const expected = await original.clone().arrayBuffer();
            let nextCalls = 0;
            const env = measurement === 'absent' ? {} : {PDF_DOWNLOADS: {writeDataPoint(point) {
              if (measurement === 'throws') throw Error('test measurement failure');
              points.push(point);
            }}};
            const actual = await onRequest({request, env, next() {nextCalls++; return original;}});
            assert.equal(nextCalls, 1);
            assert.equal(actual.status, status);
            assert.equal(actual.statusText, original.statusText);
            assert.deepEqual(new Uint8Array(await actual.arrayBuffer()), new Uint8Array(expected));
            const expectedHeaders = new Headers(original.headers);
            if (protocol === 'https:') expectedHeaders.set('Strict-Transport-Security', 'max-age=300');
            assert.deepEqual([...actual.headers], [...expectedHeaders]);
            assert.equal(points.length, method === 'GET' && !agent.includes('curl') && measurement === 'available' ? 1 : 0);
            if (points.length) assert.deepEqual(points[0], {indexes: ['/papers/example.pdf'], blobs: ['/papers/example.pdf', '/library'], doubles: [1]});
            count++;
          }
        }
      }
    }
  }
}
// Redirect responses have immutable headers; the middleware must copy them.
const redirect = await onRequest({request: new Request('https://papers.spiralweb.earth/'), env: {},
  next: () => Response.redirect('https://papers.spiralweb.earth/library', 308)});
assert.equal(redirect.headers.get('Strict-Transport-Security'), 'max-age=300');
assert.equal(redirect.headers.get('Location'), 'https://papers.spiralweb.earth/library');
console.log(`PASS: ${count} response/measurement cases and immutable redirect; static rule and routing checked.`);
