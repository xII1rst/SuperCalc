// Additional reference IDs from noCommit/calculo_ejercicios.md, independently
// rederived here. This is a selected regression sample, not a 200-case audit.
import test from 'node:test';
import assert from 'node:assert/strict';
import {symbolicDeriv,calcParse} from '../js/math/calculus.mjs';
import {definiteIntegral} from '../js/math/integration.mjs';
import {differentialStudy,polynomialPotentialStudy,stokesDiskStudy} from '../js/math/multivariable-study.mjs';
import {multivariableLimit} from '../js/math/multivariable.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
const cases=[
 [31,()=>near(calcParse(symbolicDeriv('sin(3*x)'))(.4),3*Math.cos(1.2))],
 [35,()=>near(calcParse(symbolicDeriv('sqrt(x^2+1)'))(2),2/Math.sqrt(5))],
 [40,()=>near(calcParse(symbolicDeriv('x^x'))(2),4*(Math.log(2)+1))],
 [45,()=>near(calcParse(symbolicDeriv('sin(x)',3))(.4),-Math.cos(.4))],
 [81,()=>near(definiteIntegral('x^2',0,1).valueNum,1/3)],
 [82,()=>near(definiteIntegral('sin(x)',0,Math.PI).valueNum,2)],
 [84,()=>near(definiteIntegral('1/x',1,Math.E).valueNum,1)],
 [121,()=>{const r=polynomialPotentialStudy('y^2','2*x*y',[0,0],[2,3]);assert.equal(r.conservative,true);near(r.value,18);}],
 [123,()=>assert.equal(polynomialPotentialStudy('y','-x',[0,0],[1,1]).conservative,false)],
 [125,()=>near(polynomialPotentialStudy('y','x',[0,0],[2,3]).value,6)],
 [136,()=>near(stokesDiskStudy(['-y','x','0'],1).value,2*Math.PI)],
 [153,()=>near(differentialStudy('x^2*y^3',['x','y'],[2,3]).gradient[0],108)],
 [156,()=>near(differentialStudy('exp(x*y)',['x','y'],[1,2]).gradient[1],Math.exp(2))],
 [161,()=>near(differentialStudy('x^3+3*x^2*y+y^3',['x','y'],[2,1]).hessian[0][1],12)],
 [163,()=>{const r=multivariableLimit('x^2*y/(x^2+y^2)',0,0);assert.equal(r.status,'proved');near(r.value,0);}],
 [165,()=>assert.equal(multivariableLimit('(x^2-y^2)/(x^2+y^2)',0,0).status,'disproved')],
];
cases.forEach(([id,run])=>test(`Banco Cálculo ${id}: expectativa revisada`,run));
