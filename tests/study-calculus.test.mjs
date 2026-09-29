import test from 'node:test';
import assert from 'node:assert/strict';
import {piecewiseContinuity,parametricDerivatives,implicitSlope,polarAreaBetween,curveArcLength,
  surfaceOfRevolution,integrateVariableRegion,tangentPlane,powerSeriesInterval,telescopingOffset} from '../js/math/study-calculus.mjs';
const near=(actual,expected,tolerance=1e-5)=>assert.ok(Math.abs(actual-expected)<tolerance*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);

test('Diferencial 12, 24, 25 y 33: continuidad y derivadas de curvas',()=>{
  const simple=piecewiseContinuity(['x^2+k','3*x-1'],[2]);
  assert.equal(simple.status,'unique');near(simple.values.k,1);near(simple.checks[0].left,simple.checks[0].right);
  const two=piecewiseContinuity(['x+2*a','3*a*x+b','6*x-2*b'],[-2,1]);
  assert.equal(two.status,'unique');near(two.values.a,4/9);near(two.values.b,14/9);
  const param=parametricDerivatives(t=>t*t-1,t=>t**3+t,1);
  near(param.dydx,2);near(param.d2ydx2,0.5,1e-4);
  const implicit=implicitSlope((x,y)=>x*x+y*y-25,3,4);
  near(implicit.slope,-3/4);near(implicit.residual,0);
  assert.throws(()=>piecewiseContinuity(['a*x','a*a*x'],[1]),/linealmente/);
});

test('Integral 30, 43, 45, 48 y 50: regiones, arco, superficie y series',()=>{
  near(polarAreaBetween(()=>3,()=>1,0,Math.PI).area,4*Math.PI);
  near(curveArcLength(x=>x,0,1).length,Math.SQRT2);
  near(surfaceOfRevolution(x=>x,0,1,'x').area,Math.PI*Math.SQRT2,2e-4);
  near(integrateVariableRegion((x,y)=>y,0,1,()=>0,x=>x,100,100).value,1/6,5e-5);
  const series=powerSeriesInterval(2,2,2);
  assert.equal(series.leftEndpoint.converges,true);assert.equal(series.rightEndpoint.converges,true);
  near(telescopingOffset(2).sum,0.75);
  assert.throws(()=>polarAreaBetween(()=>1,()=>2,0,1),/radio/);
});

test('Multivariable 8 y 31: plano tangente y normal',()=>{
  const plane=tangentPlane((x,y)=>x*x+y*y,1,1);
  near(plane.point[2],2);near(plane.gradient[0],2);near(plane.gradient[1],2);
  near(plane.normal[0],-2);
});
