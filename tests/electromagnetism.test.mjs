import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EM_K, EM_EPS0, toCartesian, coulomb, gauss,
  potential, lorentz, faraday, maxwell,
  potentialEnergy, parallelPlateCapacitance, magneticFieldWire,
  inductance, ohmsLaw, rcCircuit, inducedEmf,
} from '../js/math/electromagnetism.mjs';

test('coordenadas y fuerza de Coulomb', () => {
  const [x, y, z] = toCartesian(2, 90, 3, 'cyl');
  assert.ok(Math.abs(x) < 1e-12);
  assert.equal(y, 2);
  assert.equal(z, 3);
  const result = coulomb(1e-6, 1e-6, [0, 0, 0], [1, 0, 0]);
  assert.equal(result.F, EM_K * 1e-12);
  assert.equal(result.dist, 1);
  assert.equal(result.attract, false);
  assert.equal(coulomb(1, 1, [0, 0, 0], [0, 0, 0]), null);
});

test('aplicaciones adicionales validan singularidades y resuelven resultados físicos',()=>{
  assert.equal(potentialEnergy(1e-6,-2e-6,2),-EM_K*1e-12);
  assert.equal(potentialEnergy(1,1,0),null);
  assert.equal(parallelPlateCapacitance(2,0.5,3),12*EM_EPS0);
  assert.equal(parallelPlateCapacitance(1,0),null);
  assert.ok(Math.abs(magneticFieldWire(10,0.1)-2e-5)<1e-15);
  assert.equal(inductance(100,0.02,2).energy,2);
  assert.deepEqual(ohmsLaw({voltage:12,current:2,resistance:NaN}),
    {voltage:12,current:2,resistance:6,power:24});
  assert.equal(ohmsLaw({voltage:0,current:0,resistance:NaN}),null);
  const rc=rcCircuit(1000,1e-6,10,0);
  assert.equal(rc.chargeVoltage,0);
  assert.equal(rc.dischargeVoltage,10);
  assert.equal(rc.tau,0.001);
  assert.ok(Math.abs(inducedEmf(20,0.1,0.3,2).emf+2)<1e-12);
});

test('Gauss, potencial, Lorentz, Faraday y Maxwell', () => {
  assert.equal(gauss('sphere', 1e-9, 2, 1).flux, 1e-9 / EM_EPS0);
  assert.equal(potential(1, 1, 2, 1).dV, -EM_K / 2);
  assert.equal(lorentz(1, [1, 0, 0], [0, 0, 0], [0, 0, 2]).Fy, -2);
  assert.equal(faraday(0.5, 0.01, 0, 2, 100).emf, -2);
  const wave = maxwell(1000, 1e9);
  assert.ok(wave.c > 2.9e8 && wave.c < 3.1e8);
  assert.ok(wave.lambda > 0);
});
