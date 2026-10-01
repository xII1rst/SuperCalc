import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../js/math/multivariable-study.mjs';
import * as C from '../js/math/study-calculus.mjs';
import { multivariableLimit } from '../js/math/multivariable.mjs';
import { vectorApplications } from '../js/math/algebra/linear-spaces.mjs';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
const vector=(a,b,t)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>near(x,b[i],t));};
const D=(f,point,dir=null)=>M.differentialStudy(f,point.length===3?['x','y','z']:['x','y'],point,dir);
const region=(f,a,b,lower,upper)=>C.integrateVariableRegion(f,a,b,lower,upper,200,200).value;
const triple=(f,coordinates,a,b,lo,hi,innerLo,innerHi)=>C.integrateTripleRegion(f,coordinates,a,b,lo,hi,innerLo,innerHi,40).value;
const surface=(r,f,a,b,c,d)=>C.integrateParametricSurface(r,f,a,b,c,d,40).value;
const cases=[
 ()=>{const r=vectorApplications([1,2,3],[4,-1,2]);near(r.dot,8);near(r.norm,Math.sqrt(14));},
 ()=>vector(vectorApplications([1,2,3],[4,-1,2]).cross,[7,10,-9]),
 ()=>near(D('x^2*y-3*y',[2,-1]).value,-1),
 ()=>{const r=D('x^3*y^2-5*x*y+y^4',[2,-1]);vector(r.gradient,[17,-30]);assert.equal(r.partials.length,2);},
 ()=>vector(D('x^2+y^2+z^2',[1,2,2]).gradient,[2,4,4]),
 ()=>near(D('x*y',[1,2],[3,4]).directionalDerivative,2),
 ()=>{const r=multivariableLimit('(x^2+y)/(x+y)',1,2);assert.equal(r.status,'proved');near(r.value,1);},
 ()=>{const r=M.implicitSurfaceStudy('x^2+y^2-z',[1,1,2]);vector(r.normal,[2,2,-1]);near(r.dzdx,2);near(r.dzdy,2);},
 ()=>near(region((x,y)=>x+y,0,1,()=>0,()=>2),3),
 ()=>near(region((x,y)=>y,0,1,()=>0,x=>x),1/6,1e-5),
 ()=>near(M.curveStudy(['cos(t)','sin(t)','t'],0,0,2*Math.PI).length,2*Math.PI*Math.SQRT2),
 ()=>{const r=M.curveStudy(['t^2','t^3','2*t'],1,0,1);vector(r.velocity,[2,3,2]);vector(r.acceleration,[2,6,0]);},
 ()=>near(D('exp(x*y)',[1,2]).hessian[0][1],3*Math.exp(2)),
 ()=>{const r=M.polynomialCriticalStudy('x^2+y^2-4*x+6*y');vector(r.points[0].point,[2,-3]);near(r.points[0].value,-13);assert.equal(r.points[0].type,'mínimo');},
 ()=>{const r=M.planeFromPointNormal([1,0,2],[2,-1,3]);near(r.constant,8);},
 ()=>{const r=vectorApplications([1,2,2],[2,-1,2]);near(r.dot/r.norm/3,4/9);near(Math.acos(r.dot/r.norm/3)*180/Math.PI,63.612200038757,1e-10);},
 ()=>near(M.chainRuleStudy('x^2*y',['t','t^3'],['t'],[1]).derivatives[0],5),
 ()=>assert.equal(multivariableLimit('(x^2-y^2)/(x^2+y^2)',0,0).status,'disproved'),
 ()=>{const r=multivariableLimit('x^2*y/(x^2+y^2)',0,0);assert.equal(r.status,'proved');near(r.value,0);assert.match(r.proof,/Todas las trayectorias/);},
 ()=>{const r=M.polynomialCriticalStudy('x^3-3*x*y+y^3');assert.equal(r.points.length,2);vector(r.points[0].point,[0,0]);near(r.points[0].determinant,-9);assert.equal(r.points[0].type,'silla');vector(r.points[1].point,[1,1]);near(r.points[1].determinant,27);near(r.points[1].value,-1);},
 ()=>{const r=M.constrainedQuadraticStudy('x*y','x+2*y',8);vector(r.points[0].point,[4,2]);near(r.points[0].value,8);near(r.points[0].lambda,2);assert.equal(r.points[0].type,'máximo global');},
 ()=>near(M.implicitSurfaceStudy('x^2+y^2+z^2-3*x*y*z',[1,1,1]).dzdx,-1),
 ()=>{const r=D('x*exp(y*z)',[1,0,2]);vector(r.gradient,[1,2,0]);near(r.maximumRate,Math.sqrt(5));vector(r.maximumDirection,[1/Math.sqrt(5),2/Math.sqrt(5),0]);},
 ()=>near(region((x,y)=>x*y,0,1,x=>x*x,x=>x),1/24,3e-6),
 ()=>near(region((theta,r)=>Math.exp(-r*r)*r,0,2*Math.PI,()=>0,()=>2),Math.PI*(1-Math.exp(-4)),3e-5),
 ()=>near(triple((x,y,z)=>z,'cartesian',0,1,()=>0,x=>1-x,()=>0,(x,y)=>1-x-y),1/24),
 ()=>near(M.lineStudy(['x^2+y^2'],['2*cos(t)','2*sin(t)','0'],0,2*Math.PI).value,16*Math.PI),
 ()=>near(M.lineStudy(['y','x','0'],['t','t^2','0'],0,1,'vector').value,1),
 ()=>{const r=M.polynomialPotentialStudy('2*x*y','x^2',[0,0],[1,2]);assert.equal(r.conservative,true);near(r.value,2);assert.match(r.proof,/Identidad/);},
 ()=>near(M.greenRegionStudy('-y','x',0,2*Math.PI,()=>0,()=>3,200,'polar').value,18*Math.PI),
 ()=>vector(M.implicitSurfaceStudy('x^2+2*y^2+3*z^2-21',[4,-1,1]).normal,[8,-4,6]),
 ()=>{const r=M.constrainedQuadraticStudy('x^2+2*y^2','x^2+y^2',1);assert.equal(r.points.length,4);vector(r.points.map(p=>p.value),[1,1,2,2]);},
 ()=>{const r=M.jacobianStudy(['u^2-v^2','2*u*v'],[1,2]);near(r.determinant,20);vector(r.matrix[0],[2,-4]);vector(r.matrix[1],[4,2]);},
 ()=>near(region(()=>1,-2,2,x=>x*x,()=>4),32/3,2e-5),
 ()=>near(triple(()=>1,'cylindrical',0,2,()=>0,()=>2*Math.PI,()=>0,r=>r*r),8*Math.PI),
 ()=>near(triple(()=>1,'spherical',0,3,()=>0,()=>Math.PI,()=>0,()=>2*Math.PI),36*Math.PI,3e-7),
 ()=>near(triple((x,y,z)=>x*x+y*y+z*z,'spherical',0,2,()=>0,()=>Math.PI,()=>0,()=>2*Math.PI),128*Math.PI/5,1e-6),
 ()=>near(triple(()=>1,'cylindrical',0,3,()=>0,()=>2*Math.PI,r=>r,()=>3),9*Math.PI),
 ()=>{const r=C.laminaProperties((x,y)=>x+y,'cartesian',0,1,()=>0,x=>1-x,200,200);near(r.mass,1/3,3e-6);vector([r.centerX,r.centerY],[3/8,3/8],5e-6);},
 ()=>near(C.laminaProperties(()=>1,'polar',0,2*Math.PI,()=>0,()=>2,200,200).inertiaZ,8*Math.PI,2e-5),
 ()=>near(M.greenRegionStudy('x*y','x^2',0,1,()=>0,x=>2*x,200).value,2/3,5e-6),
 ()=>near(surface((u,v)=>[u*Math.cos(v),u*Math.sin(v),u*u],()=>1,0,2,0,2*Math.PI),Math.PI*(17*Math.sqrt(17)-1)/6,5e-7),
 ()=>near(surface((u,v)=>[2*Math.sin(u)*Math.cos(v),2*Math.sin(u)*Math.sin(v),2*Math.cos(u)],(x,y,z)=>z,0,Math.PI/2,0,2*Math.PI),8*Math.PI,3e-7),
 ()=>near(surface((u,v)=>[Math.sin(u)*Math.cos(v),Math.sin(u)*Math.sin(v),Math.cos(u)],(x,y)=>x*x+y*y,0,Math.PI,0,2*Math.PI),8*Math.PI/3,3e-6),
 ()=>near(surface((u,v)=>[u*Math.cos(v),u*Math.sin(v),v],()=>1,0,1,0,2*Math.PI),Math.PI*(Math.SQRT2+Math.asinh(1)),1e-7),
 ()=>{const r=C.linearObjectiveCylinderPlane(2,[1,0,1,1],[1,1,1]);near(r.minimum.value,1-Math.SQRT2);near(r.maximum.value,1+Math.SQRT2);},
 ()=>{const r=C.minimumNormOnPlane([1,1,1],3);vector(r.minimum.point,[1,1,1]);near(r.minimum.value,3);},
 ()=>{const r=M.chainRuleStudy('x^2+y*z',['u*v','u+v','u-v'],['u','v'],[1,2]);near(r.derivatives[0],10);},
 ()=>{const r=C.logarithmicRadialHarmonic(1,1,2);near(r.laplacian,0);vector(r.secondDerivatives,[3/25,-3/25]);},
 ()=>near(C.trilinearPotentialIntegral(1,[1,1,1],[2,3,4]).lineIntegral,23),
];
assert.equal(cases.length,50);cases.forEach((run,i)=>test(`Multivariable ${i+1}: referencia independiente del enunciado`,run));
test('Regularidad: rechazar punto ajeno, normal cero y dirección cero',()=>{
 assert.throws(()=>M.implicitSurfaceStudy('x^2+y^2+z^2-1',[1,1,1]),/pertenece/);
 assert.throws(()=>M.implicitSurfaceStudy('x^2+y^2+z^2',[0,0,0]),/Gradiente nulo/);
 assert.throws(()=>M.planeFromPointNormal([0,0,0],[0,0,0]),/no nula/);
 assert.throws(()=>D('x*y',[1,2],[0,0]),/cero/);
});
test('Identidad global: igualdad local no demuestra que un campo sea conservativo',()=>{
 const result=M.polynomialPotentialStudy('0','x^2',[0,0],[1,1]);assert.equal(result.conservative,false);assert.match(result.curl,/x/);
 assert.equal(multivariableLimit('x*y^2/(x^2+y^4)',0,0).status,'undetermined');
 assert.throws(()=>M.constrainedQuadraticStudy('x^2','x*y',1),/Restricción admitida/);
});
test('Orientación de Green y restricciones degeneradas',()=>{
 near(M.greenRegionStudy('-y','x',0,2*Math.PI,()=>0,()=>3,40,'polar','negative').value,-18*Math.PI);
 const tied=M.constrainedQuadraticStudy('3*x^2+3*y^2','x^2+y^2',4);assert.equal(tied.allPoints,true);near(tied.value,12);
 assert.throws(()=>M.polynomialCriticalStudy('x^2'),/singular/);
});
test('Stokes: normal, borde y regularidad global de campos polinómicos',()=>{
 const r=M.stokesDiskStudy(['-y','x','z'],3);near(r.value,18*Math.PI);near(r.lineIntegral,18*Math.PI);near(r.agreementDifference,0);assert.match(r.orientation,/normal \+k/);
 const negative=M.stokesDiskStudy(['-y','x','z'],3,200,'negative');near(negative.value,-18*Math.PI);near(negative.lineIntegral,-18*Math.PI);
 assert.throws(()=>M.stokesDiskStudy(['-y','x','sqrt(z)'],1),/regularidad/);
 assert.throws(()=>M.stokesDiskStudy(['-y','x','1/z'],1),/regularidad/);
});
