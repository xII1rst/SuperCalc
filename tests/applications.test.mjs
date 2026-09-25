import test from 'node:test';
import assert from 'node:assert/strict';
import {
  optimizeFunction, populationGrowth, motionAt, tangentAt, relatedRates, characteristicRoots,
  newtonMethod, linearApproximation, meanValueTheorem, rollesTheorem, checkContinuity,
  hyperbolicValues, inverseHyperbolic, inverseFunctionDerivative, logarithmicDerivative,
} from '../js/math/applications.mjs';

const close = (a, b, tol = 1e-4) => assert.ok(Math.abs(a - b) < tol, `${a} ≠ ${b}`);

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

test('método de Newton-Raphson halla raíces',()=>{
  const r=newtonMethod(x=>x*x-2,1);
  assert.ok(r.converged);
  close(r.root,Math.sqrt(2));
});

test('aproximación lineal L(x)=f(a)+f\'(a)(x−a)',()=>{
  const r=linearApproximation(x=>x*x,1,1.01);
  close(r.fa,1);
  close(r.fpa,2);
  close(r.approx,1.02);
  close(r.exact,1.0201);
});

test('teorema del valor medio',()=>{
  const r=meanValueTheorem(x=>x*x,0,2);
  close(r.slope,2);
  close(r.c,1,1e-2);
});

test('teorema de Rolle',()=>{
  const r=rollesTheorem(x=>x*x-2*x,0,2);
  close(r.fa,0);
  close(r.fb,0);
  close(r.c,1,1e-2);
});

test('análisis de continuidad',()=>{
  assert.equal(checkContinuity(x=>x,0).continuous,true);
  assert.equal(checkContinuity(x=>1/x,0).discontinuityType,'infinita');
  assert.equal(checkContinuity(x=>(x*x-1)/(x-1),1).discontinuityType,'removible');
  assert.equal(checkContinuity(x=>x<0?-1:1,0).discontinuityType,'salto');
});

test('funciones hiperbólicas y sus inversas',()=>{
  const h=hyperbolicValues(0);
  close(h.sinh,0);
  close(h.cosh,1);
  close(h.identity,1);
  close(inverseHyperbolic(0).asinh,0);
  close(inverseHyperbolic(0).atanh,0);
  assert.ok(Number.isNaN(inverseHyperbolic(0).acosh));
});

test('derivada de la función inversa y diferenciación logarítmica',()=>{
  const inv=inverseFunctionDerivative(x=>x*x,2);
  close(inv.y,4);
  close(inv.inverseDerivative,0.25);
  const lg=logarithmicDerivative(x=>x*x,2);
  assert.equal(lg.valid,true);
  close(lg.derivative,4);
});
