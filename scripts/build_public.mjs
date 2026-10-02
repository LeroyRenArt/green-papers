import { readFile, mkdir, lstat, rm, copyFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
const files = JSON.parse(await readFile(resolve(root, 'public-files.json'), 'utf8'));
if (!Array.isArray(files) || !files.length || new Set(files).size !== files.length) {
  throw new Error('Public manifest must contain unique file paths.');
}
const inputs = [];
for (const name of files) {
  if (typeof name !== 'string' || !name || name.includes('\\') ||
      name.split('/').some(part => !part || part === '.' || part === '..') ||
      name.startsWith('dist/') || name.startsWith('functions/') ||
      name.startsWith('scripts/') || name.startsWith('sources/') ||
      name.startsWith('docs/') || name.startsWith('.')) {
    throw new Error(`Invalid public file path: ${name}`);
  }
  const input = resolve(root, name);
  if (!input.startsWith(resolve(root) + sep)) throw new Error(`Path escapes source: ${name}`);
  // Validate each parent as well as the file; symlinked directories are not public inputs.
  let current = root;
  for (const part of name.split('/')) {
    current = resolve(current, part);
    if ((await lstat(current)).isSymbolicLink()) throw new Error(`Symlink in public input: ${name}`);
  }
  if (!(await lstat(input)).isFile()) throw new Error(`Missing public file: ${name}`);
  inputs.push([name, input]);
}
// No old output survives a successful build; only the explicit allowlist is copied.
try {
  if ((await lstat(output)).isSymbolicLink()) throw new Error('dist must not be a symlink.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await rm(output, { recursive: true, force: true });
await mkdir(output);
for (const [name, input] of inputs) {
  const destination = resolve(output, name);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(input, destination);
}
console.log(`PASS: ${files.length} public files copied to dist. Source files unchanged.`);
