import test from 'node:test';
import assert from 'node:assert/strict';
import { calcParse, symbolicDeriv, rk4Refinement } from '../js/math/calculus.mjs';
import { riemannSum, trapezoidalRule } from '../js/math/numeric.mjs';
import { multivariableLimit } from '../js/math/multivariable.mjs';
import { solveSecondOrderHomogeneous } from '../js/math/applications.mjs';
import { matGauss } from '../js/math/algebra/matrix.mjs';
import { solveLinearExercise } from '../js/math/mechanics-solver.mjs';
import { maxwell, EM_EPS0 } from '../js/math/electromagnetism.mjs';

const close=(actual,expected,tol=1e-8)=>
  assert.ok(Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected)),`${actual} ≠ ${expected}`);

// Cases and answers are taken from Ejercicios_Ingenieria_Sistemas.md and
// calculated independently. These are acceptance examples, not a 500-case claim.
test('Diferencial 6: derivada de 4x³−5x²+7x−2 en x=2',()=>{
  const derivative=symbolicDeriv('4x³−5x²+7x−2');
  close(calcParse(derivative)(2,0),35);
});

test('Integral 10 y 16: Riemann derecha y trapecio con cuatro subintervalos',()=>{
  close(riemannSum(x=>x*x,0,4,4,'right'),30);
  close(trapezoidalRule(x=>1/x,1,3,4),67/60);
});

test('Multivariable 18 y 19: caminos distintos refutan; caminos iguales no bastan',()=>{
  assert.equal(multivariableLimit('(x²−y²)/(x²+y²)',0,0).status,'disproved');
  assert.equal(multivariableLimit('x²*y/(x²+y²)',0,0).status,'undetermined');
});

test('EDO 28: solución satisface y(0)=1, y\'(0)=−2',()=>{
  const result=solveSecondOrderHomogeneous(1,1,-6,1,-2);
  close(result.c1,0.2);
  close(result.c2,0.8);
  close(result.evaluate(1),0.2*Math.exp(2)+0.8*Math.exp(-3));
});

test('Álgebra lineal 8: sistema 2×2 tiene solución (2,1)',()=>{
  const result=matGauss([[2,1],[1,-1]],[5,1]);
  assert.equal(result.status,'unique');
  assert.deepEqual(result.particular,[2,1]);
});

test('Mecánica 6: MRU desde 20 m a 15 m/s durante 12 s llega a 200 m',()=>{
  const result=solveLinearExercise({x0:20,v0:15,t:12},'mru')[0];
  close(result.values.x,200);
});

test('Ondas 14 y 45: intensidad media es la mitad del flujo pico',()=>{
  const wave=maxwell(100,1e8);
  close(wave.Smean,0.5*EM_EPS0*wave.c*100**2);
  close(wave.Smean,wave.S/2);
});

test('Análisis numérico 48: RK4 refinado aproxima e mejor que la malla gruesa',()=>{
  const result=rk4Refinement((x,y)=>y,0,1,1,4);
  assert.ok(Math.abs(result.fineValue-Math.E)<Math.abs(result.coarseValue-Math.E));
});
