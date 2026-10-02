import test from 'node:test';
import assert from 'node:assert/strict';
import * as differential from '../js/ui/study/differential.mjs';
import * as integral from '../js/ui/study/integral.mjs';
import * as multivariable from '../js/ui/study/multivariable.mjs';
import * as ode from '../js/ui/study/ode.mjs';

const families = { differential, integral, multivariable, ode };

test('cada familia de estudio declara campos, modo y solucionador para las mismas claves', () => {
  const seen = new Map();
  for (const [group, family] of Object.entries(families)) {
    const keys = Object.keys(family.modes);
    assert.deepEqual(Object.keys(family.fields), keys, `${group}: campos`);
    assert.deepEqual(Object.keys(family.solvers), keys, `${group}: solucionadores`);
    for (const key of keys) {
      assert.equal(family.modes[key][0], group, `${key}: grupo`);
      assert.equal(typeof family.solvers[key], 'function', `${key}: solucionador`);
      assert.ok(!seen.has(key), `${key} repetido en ${seen.get(key)} y ${group}`);
      seen.set(key, group);
    }
  }
  assert.equal(seen.size, 81);
});
