#!/usr/bin/env node
// Informe de tamaño del código fuente escrito a mano.
//   node scripts/audit.mjs
// Señala archivos por encima del umbral de revisión y líneas muy largas.
// index.html se informa aparte: es un artefacto generado desde html/.
import { readFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const REVIEW_LINES = { '.mjs': 600, '.js': 600, '.css': 300, '.html': 300 };
// Test suites are reviewed above 600 lines as well (plan target 150–500).
const LONG_LINE = 400;
const list = (dir, ext) => readdirSync(new URL(dir, root), { recursive: true })
  .filter(file => file.endsWith(ext)).map(file => `${dir}${file}`);
const sources = ['app.js', 'sw.js', 'theme.css', 'fonts/fonts.css', ...list('js/', '.mjs'), ...list('styles/', '.css'),
  ...list('html/', '.html'), ...list('scripts/', '.mjs'), ...list('tests/', '.mjs')];

const rows = sources.map(file => {
  const lines = readFileSync(new URL(file, root), 'utf8').split('\n');
  const ext = file.slice(file.lastIndexOf('.'));
  return { file, lines: lines.length - 1, long: lines.filter(line => line.length > LONG_LINE).length, limit: REVIEW_LINES[ext] };
});
const total = rows.reduce((sum, row) => sum + row.lines, 0);
console.log(`${rows.length} archivos fuente, ${total} líneas.`);
console.log('\nPor encima del umbral de revisión:');
for (const row of rows.filter(row => row.lines > row.limit).sort((a, b) => b.lines - a.lines)) console.log(`  ${row.lines}\t${row.file} (umbral ${row.limit})`);
console.log(`\nCon líneas de más de ${LONG_LINE} caracteres (datos o fórmulas compactas):`);
for (const row of rows.filter(row => row.long).sort((a, b) => b.long - a.long)) console.log(`  ${row.long}\t${row.file}`);
const generated = readFileSync(new URL('index.html', root), 'utf8').split('\n').length - 1;
console.log(`\nGenerado: index.html, ${generated} líneas (se edita en html/).`);
