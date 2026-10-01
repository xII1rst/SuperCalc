import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const theme = await readFile(new URL('../theme.css', import.meta.url), 'utf8');

// Cada bloque de tema se resuelve por separado; var(--x) apunta al mismo bloque.
function themeTokens(name) {
  const selector = name === 'dark' ? /:root\[data-theme="dark"\]\s*\{([^}]*)\}/ : /:root\[data-theme="light"\]\s*\{([^}]*)\}/;
  const body = selector.exec(theme)[1];
  const raw = Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(match => [match[1], match[2].trim()]));
  const resolve = value => {
    const ref = /^var\(--([\w-]+)\)$/.exec(value);
    return ref ? resolve(raw[ref[1]]) : value;
  };
  return token => resolve(raw[token]);
}

function luminance(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map(c => c + c).join('') : value;
  const channel = index => {
    const c = parseInt(full.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ['bg', 'bg-deep', 'chrome', 'surface', 'surface2', 'surface-result', 'surface-raised'];
const TEXT = ['text', 'text-strong', 'text2', 'text3', 'text-soft', 'text-muted', 'text-faint', 'text-mid', 'line-strong',
  'accent', 'gold-text', 'red', 'green', 'blue', 'al', 'fi', 'ca', 'ca2', 'ineq-accent'];

for (const name of ['dark', 'light']) {
  test(`tema ${name}: el texto alcanza 4.5:1 sobre todas sus superficies`, () => {
    const token = themeTokens(name);
    for (const surface of SURFACES) {
      for (const ink of TEXT) {
        const ratio = contrast(token(ink), token(surface));
        assert.ok(ratio >= 4.5, `--${ink} sobre --${surface}: ${ratio.toFixed(2)}:1`);
      }
    }
  });

  test(`tema ${name}: controles, botones primarios y gráficas son legibles`, () => {
    const token = themeTokens(name);
    for (const surface of ['bg', 'surface', 'surface-result']) {
      const ratio = contrast(token('border-control'), token(surface));
      assert.ok(ratio >= 3, `--border-control sobre --${surface}: ${ratio.toFixed(2)}:1`);
    }
    assert.ok(contrast(token('on-accent'), token('accent')) >= 4.5, 'texto sobre botón primario');
    // Botones en degradado: el texto debe leerse en ambos extremos.
    for (const stop of ['grad-a', 'grad-m', 'grad-b']) {
      const ratio = contrast(token('on-grad'), token(stop));
      assert.ok(ratio >= 4.5, `--on-grad sobre --${stop}: ${ratio.toFixed(2)}:1`);
    }
    for (const ink of ['graph-axis', 'graph-text']) {
      const ratio = contrast(token(ink), token('graph-bg'));
      assert.ok(ratio >= 4.5, `--${ink} sobre --graph-bg: ${ratio.toFixed(2)}:1`);
    }
    // Series validadas con dataviz/validate_palette.js; las marcas no textuales piden 3:1.
    for (const ink of ['graph-curve', 'graph-point']) {
      const ratio = contrast(token(ink), token('graph-bg'));
      assert.ok(ratio >= 3, `--${ink} sobre --graph-bg: ${ratio.toFixed(2)}:1`);
    }
  });
}
