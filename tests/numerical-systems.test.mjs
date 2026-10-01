import test from 'node:test';
import assert from 'node:assert/strict';
import {newtonSystem,systemStability} from '../js/math/numerical-systems.mjs';
import {studyPlotSvg} from '../js/graphics/study-plot.mjs';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t*Math.max(1,Math.abs(b)));
test('Newton 3D: raíz no lineal, orden de variables y residuo original',()=>{
 const r=newtonSystem(['x^2+y^2+z^2-3','x-y','y-z'],['x','y','z'],[1.2,.9,.8]);assert.equal(r.status,'converged');r.solution.forEach(v=>near(v,1));assert.ok(r.residual<1e-9);assert.equal(r.jacobianFormulas[0][2],'2z');
 const reordered=newtonSystem(['z-x','y-z','x+y+z-6'],['z','y','x'],[0,1,3]);reordered.solution.forEach(v=>near(v,2));
});
test('Newton 6D, límite, Jacobiano singular y agujero de dominio',()=>{
 const vars=['x','y','z','u','v','w'];const r=newtonSystem(vars.map((v,i)=>`${v}-${i+1}`),vars,[0,0,0,0,0,0]);assert.equal(r.status,'converged');assert.deepEqual(r.solution,[1,2,3,4,5,6]);
 assert.equal(newtonSystem(['x^2-2','y^2-3'],['x','y'],[1,1],{iterations:1}).status,'max_iterations');
 assert.equal(newtonSystem(['x^2+1','y'],['x','y'],[0,0]).status,'singular_jacobian');
 assert.equal(newtonSystem(['x/x-1','y'],['x','y'],[0,1]).status,'domain_error');
 assert.throws(()=>newtonSystem(['x','y','z'],['x','y'],[1,1]));
});
test('Estabilidad matricial: norma suficiente y espectro triangular para cuatro métodos',()=>{
 for(const method of ['euler','rk2','rk4','ab2']){assert.equal(systemStability([[-2,1],[0,-1]],.2,method).status,'stable');assert.equal(systemStability([[-10,0],[0,-1]],1,method).status,'unstable');}
 assert.equal(systemStability([[-2]],1,'euler').status,'boundary');
 const r=systemStability([[-2,1],[-1,-2]],.1,'euler');assert.equal(r.status,'stable');assert.ok(r.bound<1);assert.equal(r.certificatePower,1);
 // A large one-step norm is compatible with asymptotic stability.
 const transient=systemStability([[-1,20],[0,-1]],.1,'euler');assert.equal(transient.status,'stable');near(transient.spectralRadius,.9);assert.ok(transient.history[0].norm>1);
 assert.equal(systemStability([[0,-1],[1,0]],.1,'euler').status,'inconclusive');
});
test('Curvas con etiquetas accesibles, campo direccional y ramas no finitas separadas',()=>{
 const svg=studyPlotSvg([{label:'<PVI>',points:[[0,1],[1,2],[2,NaN],[3,4],[4,5]]}],{title:'Solución',field:(x,y)=>x===0?Infinity:x+y});assert.match(svg,/role="img"/);assert.match(svg,/&lt;PVI&gt;/);assert.match(svg,/data-direction-field/);assert.equal((svg.match(/data-series="0"/g)||[]).length,2);assert.doesNotMatch(svg,/NaN|Infinity/);
 assert.throws(()=>studyPlotSvg(Array.from({length:7},()=>({points:[]}))));
});
