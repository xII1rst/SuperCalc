import test from 'node:test';
import assert from 'node:assert/strict';
import {poissonRectangle} from '../js/math/poisson-rectangle.mjs';
import {EM_EPS0} from '../js/math/electromagnetism.mjs';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
test('Poisson 2D: solución cuadrática y condición de cada frontera',()=>{
 const r=poissonRectangle({width:1,height:1,rho:-4*EM_EPS0,left:y=>y*y,right:y=>1+y*y,bottom:x=>x*x,top:x=>x*x+1});assert.equal(r.status,'converged');near(r.center,.5);for(let j=0;j<=r.ny;j++)for(let i=0;i<=r.nx;i++)near(r.grid[j][i],(i/r.nx)**2+(j/r.ny)**2);assert.ok(r.residual<1e-5);
});
test('Laplace 2D: potencial afín, esquina incompatible y no convergencia',()=>{
 const config={width:2,height:1,rho:0,left:y=>2*y,right:y=>2+2*y,bottom:x=>x,top:x=>x+2};const r=poissonRectangle(config);near(r.center,2);assert.equal(r.status,'converged');assert.equal(poissonRectangle({...config,rho:EM_EPS0},{maxIterations:1}).status,'max_iterations');
 assert.throws(()=>poissonRectangle({...config,top:()=>0}),/esquina/);assert.throws(()=>poissonRectangle({...config,nx:100}),/mallas/);assert.throws(()=>poissonRectangle({...config,rho:()=>NaN}),/finito/);
});
