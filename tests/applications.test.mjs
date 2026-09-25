import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizeFunction, populationGrowth, motionAt, tangentAt, relatedRates, characteristicRoots } from '../js/math/applications.mjs';

test('optimización conserva extremos globales y críticos',()=>{
  const r=optimizeFunction(x=>-((x-2)**2)+3,0,4);
  assert.ok(Math.abs(r.maxX-2)<0.01);
  assert.ok(Math.abs(r.maxV-3)<1e-9);
  assert.ok(Math.abs(r.minV+1)<1e-9);
});

test('crecimiento, movimiento y tangente son independientes del navegador',()=>{
  const growth=populationGrowth(100,Math.log(2),1);
  assert.ok(Math.abs(growth.Pt-200)<1e-10);
  assert.ok(Math.abs(growth.t2x-1)<1e-10);
  const motion=motionAt(x=>x*x,2);
  assert.ok(Math.abs(motion.vel-4)<1e-6);
  assert.ok(Math.abs(motion.acel-2)<2e-3);
  const tangent=tangentAt(x=>x*x,2);
  assert.ok(Math.abs(tangent.fpx0-4)<1e-6);
  assert.ok(Math.abs(tangent.b+4)<1e-6);
});

test('tasas relacionadas y raíces características',()=>{
  const rates=relatedRates('Esfera',2,3);
  assert.ok(Math.abs(rates.dVdt-48*Math.PI)<1e-9);
  assert.equal(relatedRates('Pitágoras',2,3),null);
  assert.deepEqual(characteristicRoots(1,-3,2),{disc:1,type:'distinct',r1:2,r2:1});
  assert.deepEqual(characteristicRoots(1,2,1),{disc:0,type:'repeated',r:-1});
  const complex=characteristicRoots(1,0,1);
  assert.equal(complex.type,'complex');
  assert.equal(complex.beta,1);
});
