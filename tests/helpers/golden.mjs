import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import * as expression from '../../js/math/expression.mjs';

// Characterization of a math module while it is split: every export is
// replayed over a recorded corpus and must reproduce the stored output
// exactly. Regenerate only with GOLDEN_WRITE=1, and only when a behavior
// change is intended.
const SAMPLE_POINTS = [-2.5, -1, -0.5, 0, 0.5, 1, 2, 3.7];

function encode(value, depth = 0) {
  if (depth > 60) return { $deep: true };
  if (typeof value === 'function') return { $fn: sampleFunction(value) };
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return { $num: 'NaN' };
    if (!Number.isFinite(value)) return { $num: String(value) };
    if (Object.is(value, -0)) return { $num: '-0' };
    return value;
  }
  if (typeof value === 'bigint') return { $bigint: String(value) };
  if (value === undefined) return { $undefined: true };
  if (Array.isArray(value)) return value.map(item => encode(item, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).map(key => [key, encode(value[key], depth + 1)]));
  }
  return value;
}

function sampleFunction(fn) {
  const points = fn.length >= 2
    ? SAMPLE_POINTS.flatMap(x => [[x, 0.75], [x, -1.5]])
    : SAMPLE_POINTS.map(x => [x]);
  return points.map(args => run(() => fn(...args)));
}

function run(call) {
  try {
    return { value: encode(call()) };
  } catch (error) {
    return { throws: [error?.name, error?.message] };
  }
}

function decode(value) {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') {
    if ('$expr' in value) return expression.calcParse(value.$expr, value.$var ?? 'x');
    if ('$num' in value) return Number(value.$num);
    if ('$undefined' in value) return undefined;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decode(item)]));
  }
  return value;
}

function replay(module, { name, args }) {
  const decoded = decode(args);
  const before = JSON.stringify(encode(decoded));
  const result = run(() => module[name](...decoded));
  const after = JSON.stringify(encode(decoded));
  return after === before ? result : { ...result, mutatedArgs: JSON.parse(after) };
}

export function goldenSuite({ label, module, fixtureUrl, reexports = {}, exportCount }) {
  const fixture = JSON.parse(readFileSync(fixtureUrl, 'utf8'));
  if (process.env.GOLDEN_WRITE) {
    for (const entry of fixture.cases) entry.expected = replay(module, entry);
    writeFileSync(fixtureUrl, `${JSON.stringify(fixture)}\n`);
  }

  test(`el corpus cubre todas las exportaciones de ${label}`, () => {
    const covered = new Set(fixture.cases.map(entry => entry.name));
    const exported = Object.keys(module).filter(name => !(name in reexports));
    assert.deepEqual([...covered].sort(), exported.sort());
    assert.equal(Object.keys(module).length, exportCount);
    for (const [name, source] of Object.entries(reexports)) assert.equal(module[name], source[name], name);
  });

  test(`cada exportación de ${label} reproduce su salida registrada`, () => {
    const mismatches = [];
    for (const entry of fixture.cases) {
      const actual = JSON.parse(JSON.stringify(replay(module, entry)));
      try {
        assert.deepEqual(actual, entry.expected);
      } catch {
        mismatches.push(`${entry.name}(${JSON.stringify(entry.args).slice(0, 160)})`);
      }
    }
    assert.deepEqual(mismatches, [], `${mismatches.length} salidas distintas`);
  });
}
