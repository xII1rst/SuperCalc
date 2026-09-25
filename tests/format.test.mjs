import test from 'node:test';
import assert from 'node:assert/strict';

import { fDMS, fN, matFmtNum, emFmt, grafFmt, toFrac, formatMagnitude } from '../js/utils/format.mjs';

test('formato numérico del cálculo y de matrices', () => {
  assert.equal(fN(1.23456789), '1.234568');
  assert.equal(fN(Infinity), '+∞');
  assert.equal(fN(NaN), 'indefinido');
  assert.equal(matFmtNum(1.234567), '1.2346');
  assert.equal(matFmtNum(NaN), '—');
  assert.equal(grafFmt(1.234567), '1.2346');
});

test('grados-minutos-segundos y notación de electromagnetismo', () => {
  assert.equal(fDMS(30.5), '30°30\'00"');
  assert.equal(fDMS(-12.25), '-12°15\'00"');
  assert.equal(emFmt(12345), '1.2345e+4');
  assert.equal(emFmt(0), '0');
});

test('fracciones y radicales vectoriales',()=>{
  assert.equal(toFrac(1.5),'3/2');
  assert.equal(toFrac(-0.25),'-1/4');
  assert.equal(formatMagnitude(Math.sqrt(2)),'√2');
  assert.equal(formatMagnitude(5),'5');
});
