import test from 'node:test';
import assert from 'node:assert/strict';
import { integrate, definiteIntegral, polynomialRevolutionEvaluation } from '../js/math/integration.mjs';
import { calcParse, evalAST, substAST, revolutionVolume, revolutionVolumeAboutLine, simpsonIntegral } from '../js/math/calculus.mjs';
import { riemannSum, trapezoidalRule } from '../js/math/numeric.mjs';
import { areaBetweenCurves } from '../js/math/integral-applications.mjs';
import { polarArea, polarArcLength } from '../js/math/polar.mjs';
import { antiderivativeInitialValue, fundamentalIntegralDerivative, curveMeasureExpression, polarAreaBetween, powerSeriesInterval, rationalSeriesComparison, firstTaylorTerms, sineIntegralLimit, telescopingOffset } from '../js/math/study-calculus.mjs';
import { ratioTest, nthTermTest, taylorSeries } from '../js/math/series.mjs';
const pi=Math.PI;
const near=(a,b,tol=1e-8)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
const evaluate=(node,x)=>evalAST(substAST(node,'x',{type:'num',val:x}));
const primitive=(expression,oracle,points=[.4,1.8,3])=>{
  const result=integrate(expression);assert.ok(result.ast,result.steps.join('; '));assert.ok(result.steps.length);
  for(const x of points) {
    near(evaluate(result.ast,x),oracle(x),2e-8);
    const h=1e-5,derivative=(evaluate(result.ast,x+h)-evaluate(result.ast,x-h))/(2*h);
    near(derivative,calcParse(expression)(x,0),2e-7);
  }
};
const checks={
  1:()=>primitive('6*x^2-4*x+3',x=>2*x**3-2*x**2+3*x),
  2:()=>primitive('1/x+e^x',x=>Math.log(Math.abs(x))+Math.exp(x),[-2,-.4,.4,2]),
  3:()=>primitive('cos(3*x)',x=>Math.sin(3*x)/3),
  4:()=>primitive('x*sqrt(x^2+1)',x=>(x*x+1)**1.5/3),
  5:()=>primitive('2*x*e^(x^2)',x=>Math.exp(x*x),[.2,.5,1]),
  6:()=>near(definiteIntegral('3*x^2+1',0,2).valueNum,10),
  7:()=>near(definiteIntegral('sqrt(x)',1,4).valueNum,14/3),
  8:()=>near(definiteIntegral('sin(x)',0,pi).valueNum,2),
  9:()=>{const r=antiderivativeInitialValue('6*x^2-2',1,4,2);near(r.constantValue,4);near(r.value,16);near(r.initialValue,4);},
  10:()=>near(riemannSum(x=>x*x,0,4,4,'right'),30),
  11:()=>near(definiteIntegral('x^2',0,3).valueNum/3,3),
  12:()=>{for(const x of [.5,1,2])near(fundamentalIntegralDerivative('sin(t)','0','x^2',x).derivative,2*x*Math.sin(x*x));},
  13:()=>primitive('tan(x)',x=>-Math.log(Math.abs(Math.cos(x))),[-1,-.2,.2,1]),
  14:()=>near(definiteIntegral('x/(x^2+1)',0,1).valueNum,Math.log(2)/2),
  15:()=>near(definiteIntegral('x^2',0,3).valueNum,9),
  16:()=>near(trapezoidalRule(x=>1/x,1,3,4),67/60),
  17:()=>primitive('(x^3+2)/x^2',x=>x*x/2-2/x,[-2,-.4,.4,2]),
  18:()=>primitive('x*e^x',x=>(x-1)*Math.exp(x)),
  19:()=>primitive('x^2*ln(x)',x=>x**3*Math.log(x)/3-x**3/9),
  20:()=>primitive('sin(x)^2',x=>x/2-Math.sin(2*x)/4),
  21:()=>primitive('sin(x)^3*cos(x)^2',x=>-(Math.cos(x)**3)/3+Math.cos(x)**5/5),
  22:()=>primitive('(3*x+5)/((x-1)*(x+2))',x=>8*Math.log(Math.abs(x-1))/3+Math.log(Math.abs(x+2))/3,[-3,-.5,.5,2]),
  23:()=>primitive('1/(x^2*sqrt(x^2+4))',x=>-Math.sqrt(x*x+4)/(4*x),[-2,-.4,.4,2]),
  24:()=>primitive('e^x*cos(x)',x=>Math.exp(x)*(Math.cos(x)+Math.sin(x))/2),
  25:()=>{const r=definiteIntegral('1/x^2',1,Infinity);near(r.valueNum,1);assert.equal(r.proof,'analytic');},
  26:()=>{const r=definiteIntegral('1/sqrt(x)',0,1);near(r.valueNum,2);assert.equal(r.improper,true);assert.equal(r.proof,'analytic');},
  27:()=>near(areaBetweenCurves(x=>2*x,x=>x*x,0,2),4/3),
  28:()=>near(revolutionVolume(x=>Math.sqrt(x),0,4),8*pi),
  29:()=>{near(revolutionVolume(x=>x*x,0,2,'y'),8*pi);near(polynomialRevolutionEvaluation('x^2','0',0,2,'y').value,8*pi);},
  30:()=>near(curveMeasureExpression('x^(3/2)',0,4).length,8*(10**1.5-1)/27),
  31:()=>near(polarArea('2*(1+cos(t))',0,2*pi),6*pi),
  32:()=>{const value=simpsonIntegral(x=>1/(1+x*x),0,1,4);near(value,8011/10200);near(Math.abs(value-pi/4),Math.abs(8011/10200-pi/4));},
  33:()=>{const r=powerSeriesInterval(0,3,1);near(r.radius,3);assert.equal(r.leftEndpoint.converges,true);assert.equal(r.rightEndpoint.converges,false);},
  34:()=>{const r=rationalSeriesComparison(2,1,3);assert.equal(r.status,'converge');near(r.comparisonPower,2);assert.match(r.bound,/3\/n\^2/);},
  35:()=>primitive('1/(x^3+x)',x=>Math.log(Math.abs(x))-.5*Math.log(x*x+1),[-2,-.4,.4,2]),
  36:()=>primitive('1/(x^2+4*x+13)',x=>Math.atan((x+2)/3)/3),
  37:()=>primitive('e^(sqrt(x))',x=>2*(Math.sqrt(x)-1)*Math.exp(Math.sqrt(x))),
  38:()=>primitive('x^2*sin(x)',x=>-x*x*Math.cos(x)+2*x*Math.sin(x)+2*Math.cos(x)),
  39:()=>primitive('sec(x)^3',x=>(Math.tan(x)/Math.cos(x)+Math.log(Math.abs(1/Math.cos(x)+Math.tan(x))))/2,[-1,-.2,.2,1]),
  40:()=>{const r=definiteIntegral('x*e^(-x)',0,Infinity);near(r.valueNum,1);assert.equal(r.proof,'analytic');},
  41:()=>{const r=definiteIntegral('ln(x)/x^2',1,Infinity);near(r.valueNum,1);assert.equal(r.proof,'analytic');},
  42:()=>{near(revolutionVolumeAboutLine(x=>x,x=>x*x,0,1,'x',2),8*pi/15);const r=polynomialRevolutionEvaluation('x','x^2',0,1,'x',2);near(r.value,8*pi/15);assert.match(r.evaluation,/8\/15/);},
  43:()=>near(curveMeasureExpression('x^3',0,1,'surface').area,pi*(10**1.5-1)/27),
  44:()=>near(polarArcLength('e^t',0,pi),Math.SQRT2*(Math.exp(pi)-1)),
  45:()=>near(polarAreaBetween(t=>3*Math.cos(t),t=>1+Math.cos(t),-pi/3,pi/3).area,pi),
  46:()=>{const r=firstTaylorTerms('ln(1+x)',0,4,.1);assert.deepEqual(r.terms.map(t=>t.k),[1,2,3,4]);r.terms.forEach((t,i)=>near(t.coef,[1,-.5,1/3,-.25][i]));near(r.value,.1-.1**2/2+.1**3/3-.1**4/4);near(r.absoluteError,Math.log(1.1)-r.value);},
  47:()=>{const r=firstTaylorTerms('cos(x)',pi/3,4,pi/3);r.terms.forEach((t,i)=>near(t.coef,[.5,-Math.sqrt(3)/2,-.25,Math.sqrt(3)/12][i]));},
  48:()=>{const r=powerSeriesInterval(2,2,2);assert.deepEqual(r.openInterval,[0,4]);assert.equal(r.leftEndpoint.absolute,true);assert.equal(r.rightEndpoint.absolute,true);},
  49:()=>near(sineIntegralLimit(1,1,2).limit,1/3),
  50:()=>near(telescopingOffset(2).sum,3/4),
};
for(const[id,check]of Object.entries(checks))test(`Integral guía ${id}: referencia independiente`,check);
test('dominios, polos y argumentos de impropias no se borran al integrar',()=>{
  assert.match(definiteIntegral('1/x^2',-1,1).error,/Singularidad interior/);
  assert.match(definiteIntegral('tan(x)',0,pi).error,/Singularidad interior/);
  assert.equal(definiteIntegral('1/x',0,1).diverges,true);
  assert.equal(definiteIntegral('1/x',1,Infinity).diverges,true);
  assert.match(definiteIntegral('sqrt(x)',-1,1).error,/Singularidad|dominio/);
  assert.match(definiteIntegral('x',NaN,1).error,/límites/);
  assert.ok(integrate('1/x').domain.some(x=>x.includes('≠')));
  assert.equal(integrate('sec(x)*tan(2*x)').result,null);
  assert.throws(()=>antiderivativeInitialValue('1/x',-1,0,1),/Singularidad/);
  assert.throws(()=>fundamentalIntegralDerivative('1/t','-1','x',1),/continuo/);
});
test('el refinamiento no sustituye pruebas y muestras no deciden series',()=>{
  const r=definiteIntegral('e^(-x^2)',0,Infinity);assert.equal(r.proof,'numerical');assert.equal(r.exact,null);assert.equal(r.diverges,false);
  assert.equal(ratioTest('sin(n)').proof,'undetermined');assert.equal(ratioTest('sin(n)').conclusion,'inconcluso');
  assert.equal(nthTermTest('sin(n)').conclusion,'inconcluso');
  assert.equal(ratioTest('n^3/2^n').conclusion,'converge');
  assert.equal(rationalSeriesComparison(2,1,2).status,'diverge');
  assert.equal(rationalSeriesComparison(0,1,2).status,'converge');
  assert.equal(polynomialRevolutionEvaluation('x','-x',-1,1),null);
  assert.throws(()=>curveMeasureExpression('sqrt(x)',0,1),/dominio/);
});
test('Taylor valida órdenes y limita crecimiento del AST',()=>{
  assert.equal(taylorSeries('ln(1+x)',0,16),null);
  assert.equal(taylorSeries('sin(x)',0,-1),null);
  assert.equal(taylorSeries('sin(x)',0,1.5),null);
  assert.throws(()=>firstTaylorTerms('x^2',0,4,1),/suficientes/);
  assert.throws(()=>firstTaylorTerms('ln(x)',0,4,1),/dominio/);
  assert.equal(integrate('1e308*1e308').result,null);
  const highPower=integrate('x^1000000');assert.ok(highPower.result);assert.match(highPower.result,/1000001/);
});
