import test from 'node:test';
import assert from 'node:assert/strict';
import {piecewiseContinuity,parametricDerivatives,implicitSlope,polarAreaBetween,curveArcLength,
  surfaceOfRevolution,integrateVariableRegion,integrateTripleRegion,integrateParametricSurface,tangentPlane,powerSeriesInterval,telescopingOffset} from '../js/math/study-calculus.mjs';
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

test('Multivariable 26 y 35–38: tetraedro, cilindro, esfera y cono',()=>{
  const triple=(fn,coords,a,b,mid0,mid1,in0,in1)=>integrateTripleRegion(fn,coords,a,b,mid0,mid1,in0,in1,20);
  near(triple((x,y,z)=>z,'cartesian',0,1,()=>0,x=>1-x,()=>0,(x,y)=>1-x-y).value,1/24);
  near(triple(()=>1,'cylindrical',0,2,()=>0,()=>2*Math.PI,()=>0,r=>r*r).value,8*Math.PI);
  near(triple(()=>1,'spherical',0,3,()=>0,()=>Math.PI,()=>0,()=>2*Math.PI).value,36*Math.PI,1e-4);
  near(triple((x,y,z)=>x*x+y*y+z*z,'spherical',0,2,()=>0,()=>Math.PI,()=>0,()=>2*Math.PI).value,128*Math.PI/5,1e-4);
  near(triple(()=>1,'cylindrical',0,3,()=>0,()=>2*Math.PI,r=>r,()=>3).value,9*Math.PI);
  assert.throws(()=>triple(()=>1,'cylindrical',-1,1,()=>0,()=>2*Math.PI,()=>0,()=>1),/Radio negativo/);
  assert.throws(()=>triple(()=>1,'cartesian',0,1,()=>1,()=>0,()=>0,()=>1),/Límite medio/);
});

test('Multivariable 42–45: integrales escalares sobre superficies paramétricas',()=>{
  const surface=(map,fn,a,b,c,d)=>integrateParametricSurface(map,fn,a,b,c,d,40);
  const paraboloid=surface((u,v)=>[u*Math.cos(v),u*Math.sin(v),u*u],()=>1,0,2,0,2*Math.PI);
  near(paraboloid.area,Math.PI*(17*Math.sqrt(17)-1)/6,1e-5);
  const hemisphere=surface((u,v)=>[2*Math.sin(u)*Math.cos(v),2*Math.sin(u)*Math.sin(v),2*Math.cos(u)],(x,y,z)=>z,0,Math.PI/2,0,2*Math.PI);
  near(hemisphere.value,8*Math.PI,1e-5);
  const sphere=surface((u,v)=>[Math.sin(u)*Math.cos(v),Math.sin(u)*Math.sin(v),Math.cos(u)],(x,y)=>x*x+y*y,0,Math.PI,0,2*Math.PI);
  near(sphere.value,8*Math.PI/3,1e-5);
  const helicoid=surface((u,v)=>[u*Math.cos(v),u*Math.sin(v),v],()=>1,0,1,0,2*Math.PI);
  near(helicoid.area,Math.PI*(Math.sqrt(2)+Math.asinh(1)),1e-5);
  assert.throws(()=>surface(()=>[NaN,0,0],()=>1,0,1,0,1),/fuera de dominio/);
});
