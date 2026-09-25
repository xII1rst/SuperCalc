import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calcParse, symbolicDeriv, computeLimit, basicAntideriv, rk4,
  simpsonIntegral, taylorCoefficients, partialDerivative,
  gradient2D, midpointIntegral2D, implicitDerivative,
  groupPolynomialQuotient, calculateLimitOperation, revolutionVolume,
} from '../js/math/calculus.mjs';
import { parseGraphCoefficient } from '../js/math/graph-types.mjs';

test('el analizador numérico conserva expresiones habituales', () => {
  assert.equal(calcParse('x^2 + 2x')(3, 0), 15);
  assert.equal(calcParse('sin(π/2)')(0, 0), 1);
  assert.equal(calcParse('x^'), null);
  assert.equal(calcParse('t^2+2t','t')(3,0),15);
  assert.equal(calcParse('x^2+y^2')(3,4),25);
  assert.equal(calcParse('t^2','t;alert(1)'),null);
});

test('el cociente polinómico se agrupa sólo en límites ambiguos',()=>{
  assert.equal(groupPolynomialQuotient('4x^2-9/2x-3'),'(4x^2-9)/(2x-3)');
  assert.equal(groupPolynomialQuotient('1+sin(x)/x'),'1+sin(x)/x');
  assert.equal(calcParse('4x^2-9/2x-3')(2,0),4);
  assert.equal(computeLimit('4x^2-9/2x-3','2','both').valueNum,7);
});

test('derivación simbólica sin acceso al navegador', () => {
  assert.equal(symbolicDeriv('x^2'), '2x');
  assert.equal(symbolicDeriv('sin(x)'), 'cos(x)');
});

test('límites directos desde el motor matemático', () => {
  const result = computeLimit('x^2', '2', 'ambos');
  assert.equal(result.valueNum, 4);
  assert.equal(result.exists, true);
  assert.equal(result.tipo, 'directo');
  assert.equal(computeLimit('t^2','3','both','t').valueNum,9);
  const difference=calculateLimitOperation(
    {expr:'1/x^2',point:'0',side:'both'},
    {expr:'1/x^2',point:'0',side:'both'},'−');
  assert.equal(difference.valueNum,0);
  assert.match(difference.reason,/expresión conjunta/);
});

test('antiderivada básica e integración RK4', () => {
  assert.equal(basicAntideriv('x'), '(1/2)x^2');
  assert.equal(basicAntideriv('sin(x)'), '-cos(x)');
  assert.deepEqual(rk4(() => 1, 0, 0, 0.1, 2), [[0, 0], [0.1, 0.1], [0.2, 0.2]]);
});

test('integración y derivadas numéricas no requieren navegador', () => {
  assert.ok(Math.abs(simpsonIntegral(x => x*x,0,1)-1/3)<1e-9);
  assert.deepEqual(taylorCoefficients(() => 3,0,2), [{k:0,coef:3}]);
  assert.ok(Math.abs(partialDerivative((x,y)=>x*x+y,3,4,'x',1)-6)<1e-8);
  assert.ok(Math.abs(partialDerivative((x,y)=>x*x+y,3,4,'y',1)-1)<1e-8);
  const grad=gradient2D((x,y)=>x+y,0,0);
  assert.ok(Math.abs(grad.mag-Math.SQRT2)<1e-8);
  assert.ok(Math.abs(midpointIntegral2D((x,y)=>x+y,0,1,0,1)-1)<1e-12);
  const implicit=implicitDerivative(calcParse('x^2+y^2-25'),3,4);
  assert.ok(Math.abs(implicit.fval)<1e-10);
  assert.ok(Math.abs(implicit.slope+0.75)<1e-7);
});

test('volúmenes de revolución por discos y cascarones', () => {
  assert.ok(Math.abs(revolutionVolume(x=>x,0,1,'x')-Math.PI/3)<1e-9);
  assert.ok(Math.abs(revolutionVolume(x=>x,0,1,'y')-2*Math.PI/3)<1e-9);
  assert.ok(Math.abs(revolutionVolume(x=>-x,0,1,'y')-2*Math.PI/3)<1e-9);
  assert.ok(Math.abs(revolutionVolume(()=>1,-1,0,'y')-Math.PI)<1e-9);
  assert.ok(Math.abs(revolutionVolume(()=>2,0,1,'x')-4*Math.PI)<1e-9);
  assert.throws(()=>revolutionVolume(x=>x,-1,1,'y'),/no puede cruzar/);
  assert.throws(()=>revolutionVolume(()=>Infinity,0,1,'x'),/no es finita/);
  assert.throws(()=>revolutionVolume(x=>x,1,0,'x'),/a < b/);
  assert.throws(()=>revolutionVolume(x=>x,0,1,'z'),/eje/);
  assert.throws(()=>revolutionVolume(x=>x,0,1,'x',3),/par/);
});

test('coeficientes del graficador sin estado del canvas', () => {
  assert.equal(parseGraphCoefficient('2^3'),8);
  assert.equal(parseGraphCoefficient('π'),Math.PI);
  assert.ok(Number.isNaN(parseGraphCoefficient('x+1')));
});
