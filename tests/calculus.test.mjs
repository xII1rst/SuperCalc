import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calcParse, symbolicDeriv, normalizeExpression, computeLimit, basicAntideriv, rk4, rk4Refinement,
  simpsonIntegral, taylorCoefficients, partialDerivative,
  gradient2D, midpointIntegral2D, implicitDerivative,
  groupPolynomialQuotient, calculateLimitOperation, revolutionVolume,
  revolutionVolumeBetween, revolutionVolumeAboutLine, parseRevolutionFunction, curveIntersections,
} from '../js/math/calculus.mjs';
import { parseGraphCoefficient } from '../js/math/graph-types.mjs';

test('el analizador numérico conserva expresiones habituales', () => {
  assert.equal(calcParse('x^2 + 2x')(3, 0), 15);
  assert.equal(calcParse('sin(π/2)')(0, 0), 1);
  assert.equal(calcParse('x^'), null);
  assert.equal(calcParse('t^2+2t','t')(3,0),15);
  assert.equal(calcParse('x^2+y^2')(3,4),25);
  assert.equal(calcParse('t^2','t;alert(1)'),null);
  assert.equal(normalizeExpression('2·x²−1'),'2*x^2-1');
  assert.ok(Math.abs(calcParse('sen(x²)')(2,0)-Math.sin(4))<1e-12);
  assert.ok(Math.abs(calcParse('ln(x)')(2,0)-Math.log(2))<1e-12);
  assert.ok(Math.abs(calcParse('log(x)')(2,0)-Math.log10(2))<1e-12);
  assert.ok(Math.abs(calcParse('exp(x)')(2,0)-Math.exp(2))<1e-12);
  assert.equal(calcParse('x;globalThis.pwned=1'),null);
  assert.equal(calcParse("'<img src=x>'"),null);
  assert.equal(symbolicDeriv('sen(x²)'),'cos(x^2)*2x');
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

test('RK4 ajusta intervalo, refina la malla y detecta datos inválidos', () => {
  const result=rk4Refinement((x,y)=>y,0,1,1,4);
  assert.equal(result.coarse.length,5);
  assert.equal(result.fine.length,9);
  assert.equal(result.fine.at(-1)[0],1);
  assert.ok(Math.abs(result.fineValue-Math.E)<Math.abs(result.coarseValue-Math.E));
  assert.ok(result.errorEstimate>0);
  assert.throws(()=>rk4Refinement((x,y)=>y,0,1,0,4),RangeError);
  assert.throws(()=>rk4(()=>Infinity,0,1,0.1,2),RangeError);
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

test('volumen entre dos curvas con arandelas, discos y cascarones', () => {
  const square=x=>x*x, root=Math.sqrt;
  assert.ok(Math.abs(revolutionVolumeBetween(square,root,0,1,'x')-3*Math.PI/10)<1e-8);
  assert.ok(Math.abs(revolutionVolumeBetween(square,root,0,1,'y')-3*Math.PI/10)<1e-7);
  assert.ok(Math.abs(revolutionVolumeBetween(()=>3,()=>1,0,1,'x')-8*Math.PI)<1e-9);
  assert.ok(Math.abs(revolutionVolumeBetween(()=>2,()=>-1,0,1,'x')-4*Math.PI)<1e-9);
  assert.ok(Math.abs(revolutionVolumeBetween(x=>x,x=>1-x,0,1,'x')-Math.PI/2)<1e-7);
  assert.throws(()=>revolutionVolumeBetween(square,root,-1,1,'x'),/finitas/);
  assert.throws(()=>revolutionVolumeBetween(square,root,-1,1,'y'),/no puede cruzar/);
});

test('volumen admite y=-mx+b con coeficientes numéricos', () => {
  const line=parseRevolutionFunction('y=-mx+b',{m:1,b:2});
  assert.equal(line(0),2);
  assert.equal(line(1),1);
  assert.equal(parseRevolutionFunction('f(x)=x^2')(3),9);
  assert.equal(parseRevolutionFunction('y=-m*x+b',{m:2,b:1})(3),-5);
  assert.equal(parseRevolutionFunction('y=-mx+z',{m:1,b:2}),null);
  assert.ok(Math.abs(revolutionVolumeBetween(line,()=>1,0,1,'x')-4*Math.PI/3)<1e-8);
});

test('volumen alrededor de rectas desplazadas', () => {
  assert.ok(Math.abs(revolutionVolumeAboutLine(x=>x,x=>x*x,0,1,'x',2)-8*Math.PI/15)<1e-8);
  assert.ok(Math.abs(revolutionVolumeAboutLine(x=>x,null,0,1,'x',2)-5*Math.PI/3)<1e-8);
  assert.ok(Math.abs(revolutionVolumeAboutLine(x=>x,()=>0,0,1,'y',-1)-5*Math.PI/3)<1e-8);
  assert.throws(()=>revolutionVolumeAboutLine(x=>x,()=>0,0,2,'y',1),/no puede cruzar/);
  assert.throws(()=>revolutionVolumeAboutLine(x=>x,()=>0,0,1,'x',NaN),/finito/);
});

test('las intersecciones de x² y √x incluyen ambos extremos del intervalo', () => {
  const crossings=curveIntersections(x=>x*x,Math.sqrt,0,1);
  assert.deepEqual(crossings,[{x:0,y:0},{x:1,y:1}]);
  const middle=curveIntersections(x=>x,x=>1-x,0,1);
  assert.equal(middle.length,1);
  assert.ok(Math.abs(middle[0].x-0.5)<1e-10);
});

test('coeficientes del graficador sin estado del canvas', () => {
  assert.equal(parseGraphCoefficient('2^3'),8);
  assert.equal(parseGraphCoefficient('π'),Math.PI);
  assert.ok(Number.isNaN(parseGraphCoefficient('x+1')));
});
