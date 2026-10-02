import test from 'node:test';
import assert from 'node:assert/strict';
import { sequenceLimit, radicalRecurrence } from '../js/math/algebra/sequences.mjs';
import { derivativeDetails, computeLimit, implicitCurveAt } from '../js/math/calculus.mjs';
import { piecewiseContinuity } from '../js/math/study-calculus.mjs';
import { tangentDifferential, symbolicParametricDerivatives, rationalFunctionAnalysis, polynomialExponentialAnalysis, positiveReciprocalMinimum, maximalEllipseRectangle, cylinderAreaMinimum, nearestParabolaPoints, stationarySineCoefficient, exponentialLimitCoefficient, theoremCheck, realPolynomialRoots } from '../js/math/differential-applications.mjs';
import { functionAnalysisSvg } from '../js/graphics/function-analysis.mjs';
const pi=Math.PI;
const near=(a,b,tol=1e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
const points=(a,b)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>near(x,b[i]));};
const limit=(expr,to,value)=>{const r=computeLimit(expr,String(to),'both');assert.equal(r.exists,true);near(r.valueNum,value);assert.ok(r.steps.length);};
const seq=(expr,value)=>{const r=sequenceLimit(expr);assert.equal(r.status,'demostrado');near(r.value,value);assert.ok(r.steps.length);};
const deriv=(expr,order,oracle,samples=[.3,1,2])=>{const r=derivativeDetails(expr,order);assert.ok(r);assert.ok(r.rules.length);for(const x of samples){const d=r.evaluate(x);assert.equal(d.status,'evaluated');near(d.value,oracle(x));}};
const checks={
  1:()=>seq('(3n+1)/(n+5)',3),
  2:()=>seq('(2n^2-n)/(n^2+4)',2),
  3:()=>seq('(1+2/n)^n',Math.exp(2)),
  4:()=>limit('(x^2-9)/(x-3)',3,6),
  5:()=>limit('(5*x^2+3*x)/(2*x^2-1)',Infinity,2.5),
  6:()=>deriv('4*x^3-5*x^2+7*x-2',1,x=>12*x*x-10*x+7),
  7:()=>deriv('x^2*sin(x)',1,x=>2*x*Math.sin(x)+x*x*Math.cos(x)),
  8:()=>deriv('ln(3*x^2+1)',1,x=>6*x/(3*x*x+1)),
  9:()=>deriv('(x+1)/(x-1)',1,x=>-2/(x-1)**2,[-2,0,2]),
  10:()=>limit('sin(4*x)/(2*x)',0,2),
  11:()=>{const r=tangentDifferential('x^2+3*x',2);near(r.point[1],10);near(r.slope,7);near(r.intercept,-4);},
  12:()=>near(piecewiseContinuity(['x^2+k','3*x-1'],[2]).values.k,1),
  13:()=>deriv('x^4-3*x^2+2',2,x=>12*x*x-6),
  14:()=>near(implicitCurveAt('x^2+y^2-25',3,4).slope,-.75),
  15:()=>{const r=rationalFunctionAnalysis('x^3-12*x');points(r.criticalPoints.map(p=>p.x),[-2,2]);points(r.criticalPoints.map(p=>p.value),[16,-16]);assert.deepEqual(r.criticalPoints.map(p=>p.type),['máximo local','mínimo local']);},
  16:()=>near(tangentDifferential('sqrt(x^2+1)',1,.1).differential,.1/Math.SQRT2),
  17:()=>deriv('e^(5*x)*cos(x)',1,x=>Math.exp(5*x)*(5*Math.cos(x)-Math.sin(x))),
  18:()=>limit('(1-cos(x))/x^2',0,.5),
  19:()=>limit('sqrt(x^2+3*x)-x',Infinity,1.5),
  20:()=>{limit('(e^x-1-x)/x^2',0,.5);assert.equal(computeLimit('(e^x-1-x)/x^2','0','both').steps.find(s=>s.tipo==='lhopital_simbolico').derivatives.length,2);},
  21:()=>deriv('x^x',1,x=>x**x*(Math.log(x)+1)),
  22:()=>deriv('atan(x^2)',1,x=>2*x/(1+x**4)),
  23:()=>deriv('x^sin(x)',1,x=>x**Math.sin(x)*(Math.cos(x)*Math.log(x)+Math.sin(x)/x)),
  24:()=>{const r=symbolicParametricDerivatives('t^2-1','t^3+t',1);near(r.dydx,2);near(r.d2ydx2,.5);assert.equal(r.firstDerivatives.length,2);},
  25:()=>near(implicitCurveAt('x^3+y^3-6*x*y',3,3).slope,-1),
  26:()=>{const r=rationalFunctionAnalysis('x^3-3*x^2+1',{start:-1,end:3,closedInterval:true}).extrema;points(r.minimum.map(p=>p.x),[-1,2]);points(r.maximum.map(p=>p.x),[0,3]);r.minimum.forEach(p=>near(p.value,-3));r.maximum.forEach(p=>near(p.value,1));assert.equal(r.candidates.length,4);},
  27:()=>{const r=theoremCheck('x^2-4*x+3',1,3,'rolle');near(r.fa,0);near(r.fb,0);points(r.points,[2]);assert.equal(r.status,'hipótesis verificadas');},
  28:()=>{const r=theoremCheck('sqrt(x)',1,9);near(r.slope,.25);points(r.points,[4]);},
  29:()=>{const r=rationalFunctionAnalysis('x^4-4*x^3');points(r.criticalPoints.map(p=>p.x),[0,3]);assert.deepEqual(r.monotonicity.map(p=>p.sign),[-1,-1,1]);assert.deepEqual(r.concavity.map(p=>p.sign),[1,-1,1]);points(r.inflections.map(p=>p.x),[0,2]);points(r.inflections.map(p=>p.value),[0,-16]);near(r.criticalPoints[1].value,-27);assert.equal(r.criticalPoints[0].type,'estacionario sin extremo');},
  30:()=>{const r=tangentDifferential('x^(1/3)',8,.06);near(r.differential,.005);near(r.approximation,2.005);near(r.exact,Math.cbrt(8.06));},
  31:()=>{const r=polynomialExponentialAnalysis('x',-1).criticalPoints;assert.equal(r.length,1);near(r[0].x,1);near(r[0].value,1/Math.E);near(r[0].secondDerivative,-1/Math.E);assert.equal(r[0].type,'máximo local');},
  32:()=>{const r=rationalFunctionAnalysis('(2*x^2+1)/(x-1)');points(r.asymptote,[2,2]);points(r.excluded,[1]);assert.equal(r.discontinuities[0].left,-Infinity);assert.equal(r.discontinuities[0].right,Infinity);},
  33:()=>{const r=piecewiseContinuity(['x+2*a','3*a*x+b','6*x-2*b'],[-2,1]);near(r.values.a,4/9);near(r.values.b,14/9);r.checks.forEach(c=>near(c.left,c.right));},
  34:()=>near(implicitCurveAt('x^2+y^2-25',3,4,{dxdt:2}).rates.dydt,-1.5),
  35:()=>{const r=positiveReciprocalMinimum(1,128);near(r.x,4);near(r.minimum,48);near(r.secondDerivative,6);assert.match(r.steps.join(' '),/mínimo global único/);},
  36:()=>{const r=maximalEllipseRectangle(4,3);near(r.width,4*Math.SQRT2);near(r.height,3*Math.SQRT2);near(r.maximumArea,24);near(r.vertex[0]**2/16+r.vertex[1]**2/9,1);},
  37:()=>{const r=cylinderAreaMinimum(500,2),radius=Math.cbrt(250/pi);near(r.radius,radius);near(r.height,2*radius);near(r.minimumArea,6*pi*radius*radius);near(pi*r.radius**2*r.height,500);assert.match(r.assumption,/2 tapas/);},
  38:()=>{const r=nearestParabolaPoints(1,0,3);points(r.points.map(p=>p.x),[-Math.sqrt(2.5),Math.sqrt(2.5)]);r.points.forEach(p=>{near(p.y,2.5);near(p.distanceSquared,2.75);});near(r.distance,Math.sqrt(11)/2);assert.equal(r.candidates.length,3);},
  39:()=>limit('1/sin(x)-1/x',0,0),
  40:()=>limit('cos(x)^(1/x^2)',0,Math.exp(-.5)),
  41:()=>deriv('x*e^(2*x)',4,x=>(16*x+32)*Math.exp(2*x)),
  42:()=>{const r=rationalFunctionAnalysis('x/(x^2+1)');assert.equal(r.domain,'ℝ');assert.equal(r.symmetry,'impar');points(r.criticalPoints.map(p=>p.x),[-1,1]);points(r.criticalPoints.map(p=>p.value),[-.5,.5]);points(r.inflections.map(p=>p.x),[-Math.sqrt(3),0,Math.sqrt(3)]);points(r.inflections.map(p=>p.value),[-Math.sqrt(3)/4,0,Math.sqrt(3)/4]);points(r.asymptote,[0]);assert.deepEqual(r.monotonicity.map(c=>c.sign),[-1,1,-1]);assert.match(functionAnalysisSvg(r),/role="img"/);},
  43:()=>{const r=rationalFunctionAnalysis('(x^2-4)/(x^2-1)');points(r.excluded,[-1,1]);assert.equal(r.symmetry,'par');points(r.asymptote,[1]);assert.equal(r.inflections.length,0);near(r.criticalPoints[0].x,0);near(r.criticalPoints[0].value,4);assert.deepEqual(r.concavity.map(c=>c.sign),[-1,1,-1]);assert.deepEqual(r.discontinuities.map(p=>[p.left,p.right]),[[-Infinity,Infinity],[Infinity,-Infinity]]);assert.equal((functionAnalysisSvg(r).match(/data-asymptote="vertical"/g)||[]).length,2);},
  44:()=>{const r=radicalRecurrence(2,1,8);near(r.limit,2);assert.equal(r.status,'demostrado');assert.equal(r.direction,'creciente');assert.match(r.steps.join(' '),/inducción/);assert.match(r.steps.join(' '),/convergencia monótona/);},
  45:()=>seq('(1+1/(2n))^(3n)',Math.exp(1.5)),
  46:()=>{seq('(2n+cos(n))/(n+1)',2);assert.match(sequenceLimit('(2n+cos(n))/(n+1)').steps.join(' '),/encaje/);},
  47:()=>near(symbolicParametricDerivatives('e^t*cos(t)','e^t*sin(t)',pi/6).dydx,2+Math.sqrt(3)),
  48:()=>{const r=implicitCurveAt('x^2+x*y+y^2-7',2,1);near(r.slope,-1.25);near(r.intercept,3.5);},
  49:()=>{const r=stationarySineCoefficient(1/3,3,pi/3);near(r.coefficient,2);near(r.secondDerivative,-Math.sqrt(3));assert.equal(r.type,'máximo local');},
  50:()=>{const r=exponentialLimitCoefficient(8);points(r.coefficients,[-4,4]);assert.match(r.steps[0],/dos veces/);},
};
for(const [id,check]of Object.entries(checks))test(`Diferencial guía ${id}: referencia independiente`,check);
test('raíces repetidas, funciones constantes, huecos y polos conservan su significado',()=>{
  points(realPolynomialRoots([1,-4,6,-4,1]),[1]);
  const constant=rationalFunctionAnalysis('0/(x-1)');assert.equal(constant.discontinuities[0].limit,0);assert.ok(constant.monotonicity.every(c=>c.sign===0));
  const hole=rationalFunctionAnalysis('(x^2-1)/(x-1)');assert.equal(hole.discontinuities[0].type,'hueco removible');near(hole.discontinuities[0].limit,2);assert.match(functionAnalysisSvg(hole),/data-hole="true"/);
  assert.match(rationalFunctionAnalysis('1/x',{start:-1,end:1,closedInterval:true}).extrema,/singularidad/);
  assert.equal(theoremCheck('x',0,1,'rolle').status,'no cumple Rolle');
  assert.equal(theoremCheck('1e-12*x',0,1,'rolle').status,'no cumple Rolle');
  assert.match(theoremCheck('4',0,1,'rolle').allPoints,/Todo c/);
  assert.equal(symbolicParametricDerivatives('t^2','t',0).status,'tangente vertical');
  assert.equal(symbolicParametricDerivatives('t^2','t^3',0).status,'punto estacionario; tangente requiere análisis adicional');
});
test('ventana SVG no une ramas a través de polos y rechaza dimensiones inválidas',()=>{
  const r=rationalFunctionAnalysis('(x^2-4)/(x^2-1)'),svg=functionAnalysisSvg(r,{start:-3,end:3,minimum:-10,maximum:10});
  const poles=[52+2/6*648,52+4/6*648];
  for(const match of svg.matchAll(/data-curve="true" d="([^"]+)"/g)){
    const xs=[...match[1].matchAll(/[ML]([\d.]+),/g)].map(m=>Number(m[1]));
    for(const x of poles)assert.ok(Math.max(...xs)<=x||Math.min(...xs)>=x,'Una rama cruza un polo');
  }
  assert.doesNotMatch(svg,/NaN|undefined/);
  assert.throws(()=>functionAnalysisSvg(r,{start:2,end:1}),/Ventana/);
});
test('familias, dominio, dimensiones y rango numérico se validan antes de concluir',()=>{
  assert.throws(()=>rationalFunctionAnalysis('sin(x)'),/Familia/);
  assert.throws(()=>rationalFunctionAnalysis('1/(x-x)'),/denominador/);
  assert.throws(()=>theoremCheck('sqrt(x)',-1,2),/a≥0/);
  const pole=theoremCheck('1/x',-1,1);
  assert.equal(pole.status,'hipótesis no verificadas');assert.match(pole.failure,/continuidad en x = 0/);assert.equal(pole.conclusionHolds,false);
  assert.throws(()=>theoremCheck('sin(x)',0,1),/Familia/);
  assert.throws(()=>tangentDifferential('(x^2-1)/(x-1)',1),/no está definida/);
  assert.throws(()=>positiveReciprocalMinimum(0,128),/positivo/);
  assert.throws(()=>maximalEllipseRectangle(-4,3),/positivo/);
  assert.throws(()=>cylinderAreaMinimum(500,0),/tapas/);
  const open=cylinderAreaMinimum(500,1);near(open.height,open.radius);
  assert.throws(()=>nearestParabolaPoints(0,0,3),/no nulo/);
  assert.deepEqual(exponentialLimitCoefficient(-1).coefficients,[]);
  assert.ok(exponentialLimitCoefficient(1e308).coefficients.every(Number.isFinite));
  assert.throws(()=>realPolynomialRoots([1,NaN]),/finitos/);
});

test('contraejemplos de Rolle y valor medio: hipótesis que fallan y si existe c', async () => {
  const { theoremCase, theoremCurve } = await import('../js/math/differential-applications.mjs');
  const expectations = {
    abs: ['derivabilidad en x = 0', false], cusp: ['derivabilidad en x = 0', false], pole: ['continuidad en x = 0', false],
    cbrt: ['derivabilidad en x = 0', true], jump: ['continuidad en x = 1', false],
  };
  for (const [id, [failure, holds]] of Object.entries(expectations)) {
    const result = theoremCase(id);
    assert.equal(result.status, 'hipótesis no verificadas', id);
    assert.match(result.failure, new RegExp(failure), id);
    assert.equal(result.conclusionHolds, holds, id);
    assert.match(result.lesson, holds ? /suficientes, no necesarias/ : /No existe c/, id);
    assert.ok(theoremCurve(id).pieces[0].length > 50, id);
  }
  const cbrt = theoremCase('cbrt');
  assert.deepEqual(cbrt.points.map(c => Number(Math.abs(c).toFixed(8))), [0.19245009, 0.19245009]);
  assert.match(theoremCase('cusp').failure, /\(2\/3\)·x\^\(−1\/3\)/);
  const ok = theoremCase('ok');
  assert.equal(ok.status, 'hipótesis verificadas'); assert.deepEqual(ok.points, [2]);
  assert.throws(() => theoremCase('desconocido'), /desconocido/);
  // Familias nuevas también desde la entrada libre.
  assert.ok(Math.abs(theoremCheck('x^(4/3)', -1, 8, 'mvt').points[0] - (1.25) ** 3) < 1e-9);
  assert.ok(Math.abs(theoremCheck('1/(x-2)', -1, 1, 'mvt').points[0] - (2 - Math.sqrt(3))) < 1e-9);
  assert.equal(theoremCheck('abs(x-3)', -1, 1, 'mvt').allPoints, 'Todo c en (-1, 1)');
  assert.equal(theoremCheck('abs(x)', -1, 2, 'mvt').conclusionHolds, false);
  assert.throws(() => theoremCheck('x^(1/2)', -1, 1), /x ≥ 0/);
});
