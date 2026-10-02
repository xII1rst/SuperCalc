#!/usr/bin/env node
// Builds index.html from html/shell.html and the fragments it includes.
// A line `<!-- include: path -->` (path relative to html/) is replaced by that
// fragment's content. Edit the fragments, then run:
//   node scripts/assemble-html.mjs
// tests/html-assembly.test.mjs fails while index.html is out of date.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const INCLUDE = /^<!-- include: ([\w./-]+\.html) -->$/;

export function assembleHtml(file = 'shell.html', seen = []) {
  if (seen.includes(file)) throw new Error(`Inclusión cíclica: ${[...seen, file].join(' → ')}`);
  if (file.split('/').includes('..')) throw new Error(`Fragmento fuera de html/: ${file}`);
  const source = readFileSync(new URL(`html/${file}`, root), 'utf8');
  return source.split('\n').map(line => {
    const match = INCLUDE.exec(line);
    return match ? assembleHtml(match[1], [...seen, file]).replace(/\n$/, '') : line;
  }).join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(new URL('index.html', root), assembleHtml());
  console.log('index.html ensamblado desde html/');
}
