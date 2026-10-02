import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createAppHarness } from './helpers/app-harness.mjs';

// Every study mode, run with the default values its form renders, must keep
// producing the recorded result (and error) markup. Regenerate only with
// GOLDEN_WRITE=1 when a behavior change is intended.
const fixtureUrl = new URL('./fixtures/golden/study-modes.json', import.meta.url);
const GROUPS = ['differential', 'integral', 'multivariable', 'ode'];

// Mirror the rendered form: copy each field's default into its element.
function applyDefaults(harness) {
  const markup = harness.getElementById('study-fields').innerHTML;
  for (const match of markup.matchAll(/<(input|textarea|select)\s+id="study-([^"]+)"([^>]*)>([\s\S]*?)(?=<\/label>)/g)) {
    const [, tag, key, attributes, rest] = match;
    let value;
    if (tag === 'input') value = /\bvalue="([^"]*)"/.exec(attributes)?.[1] ?? '';
    else if (tag === 'textarea') value = rest.slice(0, rest.indexOf('</textarea>'));
    else value = /<option value="([^"]*)"/.exec(rest)?.[1] ?? '';
    harness.getElementById(`study-${key}`).value = value;
  }
}

async function runAllModes() {
  const harness = await createAppHarness();
  const results = {};
  for (const group of GROUPS) {
    harness.actions.studyOpenPanel(group);
    const modes = [...harness.getElementById('study-mode').innerHTML.matchAll(/<option value="([^"]+)">/g)].map(match => match[1]);
    results[`${group}:order`] = modes.join(',');
    for (const mode of modes) {
      harness.getElementById('study-mode').value = mode;
      harness.actions.studySelect();
      const variants = mode === 'exactode' ? ['given', 'search'] : [null];
      for (const variant of variants) {
        applyDefaults(harness);
        if (variant) harness.getElementById('study-factorMode').value = variant;
        harness.actions.studyCalculate();
        const result = harness.getElementById('study-result');
        results[variant ? `${mode}:${variant}` : mode] = { html: result.innerHTML, text: result.textContent };
      }
    }
  }
  return results;
}

test('cada modo de estudio conserva su resultado con los valores por defecto', async () => {
  const actual = JSON.parse(JSON.stringify(await runAllModes()));
  if (process.env.GOLDEN_WRITE) writeFileSync(fixtureUrl, `${JSON.stringify(actual)}\n`);
  const expected = JSON.parse(readFileSync(fixtureUrl, 'utf8'));
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort());
  const differing = Object.keys(expected).filter(key => JSON.stringify(actual[key]) !== JSON.stringify(expected[key]));
  assert.deepEqual(differing, []);
});
