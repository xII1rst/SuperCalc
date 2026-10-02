import test from 'node:test';
import assert from 'node:assert/strict';
import * as differential from '../js/ui/study/differential.mjs';
import * as integral from '../js/ui/study/integral.mjs';
import * as multivariable from '../js/ui/study/multivariable.mjs';
import * as ode from '../js/ui/study/ode.mjs';
import * as electrostatics from '../js/ui/electromagnetism/electrostatics.mjs';
import * as circuits from '../js/ui/electromagnetism/circuits.mjs';
import * as magnetism from '../js/ui/electromagnetism/magnetism.mjs';
import * as forces from '../js/ui/mechanics/forces.mjs';
import * as motion from '../js/ui/mechanics/motion.mjs';
import * as collisions from '../js/ui/mechanics/collisions.mjs';
import * as rotation from '../js/ui/mechanics/rotation.mjs';

// Each tool splits its modes into family registries; together they must
// declare fields, metadata and a solver for exactly the same keys.
const registries = {
  'estudio de cálculo': { families: { differential, integral, multivariable, ode }, total: 81 },
  'electromagnetismo avanzado': { families: { electrostatics, circuits, magnetism }, total: 49 },
  'mecánica avanzada': { families: { forces, motion, collisions, rotation }, total: 33 },
};

for (const [tool, { families, total }] of Object.entries(registries)) {
  test(`${tool}: cada familia declara campos, modo y solucionador para las mismas claves`, () => {
    const seen = new Map();
    for (const [group, family] of Object.entries(families)) {
      // Only the order of `modes` is visible (it fills the selector); the
      // other tables are looked up by key.
      const keys = Object.keys(family.modes);
      assert.deepEqual(Object.keys(family.fields).sort(), [...keys].sort(), `${group}: campos`);
      assert.deepEqual(Object.keys(family.solvers).sort(), [...keys].sort(), `${group}: solucionadores`);
      for (const key of keys) {
        assert.equal(family.modes[key][0], group, `${key}: grupo`);
        assert.equal(typeof family.solvers[key], 'function', `${key}: solucionador`);
        assert.ok(!seen.has(key), `${key} repetido en ${seen.get(key)} y ${group}`);
        seen.set(key, group);
      }
    }
    assert.equal(seen.size, total);
  });
}
