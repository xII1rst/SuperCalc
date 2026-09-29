import test from 'node:test';
import assert from 'node:assert/strict';
import {luSolve,bairstow,exponentialFit,sinusoidalFit,linearTestStability,finitePrecisionTrace,newtonSystem2D,quadratureWithBound} from '../js/math/numerical-advanced.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('Análisis 21–22 y 38–39: LU con pivoteo, factores y residuo',()=>{
  const a=[[0,2,1],[2,1,-1],[1,1,1]],x=[1,2,-1];
  const b=a.map(row=>row.reduce((sum,value,j)=>sum+value*x[j],0));
  const result=luSolve(a,b);
  result.solution.forEach((v,i)=>near(v,x[i]));near(result.residualInfinity,0);
  const pa=result.permutation.map(i=>a[i]);
  for(let i=0;i<3;i++) for(let j=0;j<3;j++)
    near(pa[i][j],result.lower[i].reduce((sum,value,k)=>sum+value*result.upper[k][j],0));
  assert.throws(()=>luSolve([[1,1],[2,2]],[1,2]),/singular/);
});

test('Análisis 3, 17–18 y 42: precisión por operación, Newton 2D y cotas declaradas',()=>{
  const trace=finitePrecisionTrace([10000,3.14159,10000],['+','-'],4,'round');
  near(trace.approximate,0);near(trace.exact,3.14159);
  assert.equal(trace.history.length,3);
  const roots=newtonSystem2D((x,y)=>x*x+y*y-5,(x,y)=>x-y-1,2.1,0.9);
  assert.equal(roots.status,'converged');near(roots.x,2);near(roots.y,1);
  const area=quadratureWithBound(Math.sin,0,Math.PI,10,'trapezoid',1);
  near(area.bound,Math.PI**3/(12*100));
  assert.ok(Math.abs(area.value-2)<=area.bound);
  const simpson=quadratureWithBound(Math.sin,0,Math.PI,10,'simpson',1);
  assert.ok(Math.abs(simpson.value-2)<=simpson.bound);
});

test('Análisis 23 y 39: Bairstow con raíces reales y conjugadas',()=>{
  const real=bairstow([4,0,-5,0,1],0,1);
  assert.equal(real.status,'converged');
  assert.deepEqual(real.roots.map(root=>Math.round(root.real)).sort((a,b)=>a-b),[-2,-1,1,2]);
  const complex=bairstow([1,0,1],0,-1);
  assert.equal(complex.status,'converged');
  near(Math.abs(complex.roots[0].imaginary),1);
  const limited=bairstow([4,0,-5,0,1],10,10,{maxIterations:1});
  assert.equal(limited.status,'not converged');
});

test('Análisis 44 y 49: ajuste especializado y estabilidad del problema test',()=>{
  const exponential=exponentialFit([[0,2],[1,2*Math.E],[2,2*Math.E**2]]);
  near(exponential.amplitude,2);near(exponential.rate,1);near(exponential.squaredError,0);
  const sinusoidal=sinusoidalFit(Array.from({length:8},(_,i)=>{const x=i*Math.PI/4;return [x,1+3*Math.sin(x)+2*Math.cos(x)];}),1);
  near(sinusoidal.offset,1);near(sinusoidal.sinCoefficient,3);near(sinusoidal.cosCoefficient,2);
  assert.equal(linearTestStability(-1,1,'euler').stable,true);
  assert.equal(linearTestStability(-1,3,'euler').stable,false);
  assert.equal(linearTestStability(-1,1,'rk4').stable,true);
  assert.throws(()=>exponentialFit([[0,1],[1,-1]]),/y > 0/);
});
