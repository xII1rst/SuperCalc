import test from 'node:test';
import assert from 'node:assert/strict';
import * as O from '../js/math/ode-study.mjs';
import * as S from '../js/math/study-ode.mjs';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
const vector=(a,b)=>{assert.equal(a.length,b.length);a.forEach((v,i)=>near(v,b[i]));};
const h=(a,b,y0=1,v0=0,x=1)=>O.homogeneousSecondOrderStudy(a,b,y0,v0,x);
const potential=r=>r.potentialTerms.map(({coefficient,powers})=>[coefficient,...powers]);
const cases=[
 ()=>{const r=O.odeClassification("(y'')^3+2*y'=x");assert.equal(r.order,2);assert.equal(r.degree,3);assert.equal(r.linear,false);},
 ()=>{const r=O.odeClassification("(y''')^2+(y')^4=exp(x)");assert.equal(r.order,3);assert.equal(r.degree,2);},
 ()=>near(S.separablePower(3,2,0,0,2,2).value,10),
 ()=>{const r=S.separablePower(2,1,1,0,3,1);near(r.value,3*Math.E);assert.match(r.generalSolution,/C exp/);},
 ()=>{near(S.separablePower(1,-1,1,1,2,3).value,6);near(S.separablePower(1,-1,1,-1,2,-3).value,6);},
 ()=>{const r=S.firstOrderExponentialForcing(2,1,-1,0,1);near(r.value,Math.exp(-1)-Math.exp(-2));assert.match(r.generalSolution,/C/);},
 ()=>{const r=h(-5,6);assert.equal(r.roots.type,'distinct');vector([r.roots.r1,r.roots.r2],[3,2]);near(r.value,-2*Math.exp(3)+3*Math.exp(2));},
 ()=>{const r=h(0,4);near(r.value,Math.cos(2));assert.equal(r.roots.beta,2);},
 ()=>{const r=h(0,-9);near(r.value,Math.cosh(3));vector([r.roots.r1,r.roots.r2],[3,-3]);},
 ()=>assert.equal(O.familyEquation('exponential',3).equation,'y′−(3)y=0'),
 ()=>near(S.separablePower(1,1,-1,0,2,2).value,Math.sqrt(8)),
 ()=>assert.deepEqual(potential(S.exactPolynomialForm([[2,1,0],[1,0,1]],[[1,1,0],[2,0,1]])),[[1,2,0],[1,1,1],[1,0,2]]),
 ()=>{assert.equal(S.laplaceTable('timeSquared').transform,'2/s³');assert.equal(S.laplaceTable('sine',3).transform,'3/(s²+9)');},
 ()=>assert.equal(S.laplaceExponentialPlusTime(2,3).transform,'1/(s−(2)) + (3)/s²'),
 ()=>{near(S.inverseLaplaceShiftedPower(1,4,1,1).value,Math.exp(-4));near(S.inverseLaplaceShiftedPower(6,0,4,2).value,8);},
 ()=>near(S.separablePower(1,0,1,0,5,1).value,5*Math.E),
 ()=>{const r=h(2,1);assert.equal(r.roots.r,-1);near(r.value,2/Math.E);assert.match(r.generalSolution,/C₁\+C₂x/);},
 ()=>{const r=S.linearPowerCoefficient(-1,1,0,1,0,2);near(r.value,2*Math.log(2));assert.match(r.generalSolution,/ln\|x\|/);},
 ()=>assert.deepEqual(potential(S.exactPolynomialForm([[2,1,1],[3,0,0]],[[1,2,0],[-1,0,0]])),[[1,2,1],[3,1,0],[-1,0,1]]),
 ()=>assert.deepEqual(potential(S.exactPolynomialForm([[3,1,1],[1,0,2]],[[1,2,0],[1,1,1]],1,0)),[[1,3,1],[.5,2,2]]),
 ()=>near(S.linearPowerCoefficient(2,1,3,1,0,2).value,64/24-1/24),
 ()=>{near(S.bernoulliLinearForcing(1,1,2,1).value,1/(2+2*Math.E));assert.match(S.bernoulliLinearForcing(1,1,0,1).formula,/y≡0/);},
 ()=>{const r=h(-4,4);assert.equal(r.roots.r,2);near(r.value,-Math.exp(2));},
 ()=>{const r=h(2,5);vector([r.roots.alpha,r.roots.beta],[-1,2]);near(r.value,Math.exp(-1)*(Math.cos(2)+.5*Math.sin(2)));},
 ()=>{const r=O.polynomialExponentialSecondOrder(-3,2,0,[0,4],0,0,1);vector(r.particularCoefficients,[3,2]);near(r.residual,0);vector(r.initialCheck,[0,0]);near(r.value,5+Math.exp(2)-4*Math.E);},
 ()=>{const r=O.polynomialExponentialSecondOrder(0,-1,2,[1],0,0,1);vector(r.particularCoefficients,[1/3]);near(r.value,Math.exp(2)/3-Math.E/2+Math.exp(-1)/6);near(r.residual,0);},
 ()=>near(S.inverseLaplaceQuadratic(1,3,4,13,.5).value,Math.exp(-1)*(Math.cos(1.5)+Math.sin(1.5)/3)),
 ()=>{const r=h(1,-6,1,-2);vector(r.constants,[.2,.8]);near(r.value,.2*Math.exp(2)+.8*Math.exp(-3));vector(r.initialCheck,[1,-2]);},
 ()=>assert.equal(S.laplaceTable('timeSine',2).transform,'4s/(s²+4)²'),
 ()=>near(S.firstOrderExponentialForcing(-3,1,2,1,1).value,2*Math.exp(3)-Math.exp(2)),
 ()=>{const r=O.familyEquation('circles',0,[2,1]);assert.equal(r.equation,'2xy y′=y²−x²');near(r.slope,-3/4);},
 ()=>{const r=S.linearSystem2D([[1,2],[3,2]],[1,0],1);vector(r.value,[(2*Math.exp(4)+3*Math.exp(-1))/5,(3*Math.exp(4)-3*Math.exp(-1))/5]);assert.match(r.elimination,/y″−\(3\)y′\+\(-4\)y=0/);},
 ()=>{const r=O.sumSubstitution(1,1,2,-1,1,2);near(r.slope,-4/5);near(r.constant,-5);assert.match(r.equilibrium,/u=2/);},
 ()=>assert.equal(O.familyEquation('repeated',2).equation,'y″−(4)y′+(4)y=0'),
 ()=>{const r=O.variationRepeatedReciprocal(1,1,0,0,2);near(r.value,2*Math.exp(2)*Math.log(2));near(r.residual,0);assert.match(r.steps.join(' '),/W=e/);},
 ()=>{const r=O.variationTangent(1,1,0,0,.5);near(r.value,-Math.cos(.5)*Math.log(1/Math.cos(.5)+Math.tan(.5)));near(r.residual,0);},
 ()=>{const r=S.forcedSecondOrder(0,4,1,2,0,0,1);assert.equal(r.resonant,true);near(r.particular,Math.sin(2)/4);assert.match(r.generalSolution,/C₁/);},
 ()=>{const r=O.polynomialExponentialSecondOrder(-2,1,1,[1],0,0,1);assert.equal(r.resonanceOrder,2);vector(r.particularCoefficients,[0,0,.5]);near(r.value,Math.E/2);},
 ()=>near(S.laplaceSecondOrderHarmonic(0,4,0,1,1,0,0,1).value,Math.sin(1)/3-Math.sin(2)/6),
 ()=>near(S.laplaceSecondOrderHarmonic(2,2,0,0,1,1,0,1).value,Math.exp(-1)*(Math.cos(1)+Math.sin(1))),
 ()=>near(S.laplaceRepeatedRootForcing(1,1,1,0,0,1).value,Math.E/6),
 ()=>vector(S.laplaceSystem2D([[2,-1],[1,0]],[1,0],1).value,[2*Math.E,Math.E]),
 ()=>{const r=S.symmetricSystemModes(1,2,[1,0],1);vector(r.eigenvalues,[3,-1]);assert.deepEqual(r.eigenvectors,[[1,1],[1,-1]]);vector(r.value,[(Math.exp(3)+Math.exp(-1))/2,(Math.exp(3)-Math.exp(-1))/2]);},
 ()=>{const r=O.affineForcedSystem([[3,-1],[1,1]],[1,0],[0,0],[0,0],1);vector(r.particularSlope,[-.25,.25]);vector(r.particularConstant,[0,.25]);vector(r.value,[(Math.exp(2)-1)/4,.5]);assert.match(r.elimination,/y″−\(4\)y′\+\(4\)y=\(1\)t/);},
 ()=>near(S.thermalRelaxation(20,90,60,10,20).value,300/7),
 ()=>{const r=S.logisticGrowth(.1,500,0,50,10);near(r.value,500/(1+9*Math.exp(-1)));},
 ()=>{const r=S.rlCurrent(2,10,12,0,1);near(r.value,1.2*(1-Math.exp(-5)));near(r.equilibrium,1.2);},
 ()=>near(S.laplaceSecondOrderHarmonic(2,5,10,0,1,0,0,1).value,2*Math.cos(1)+Math.sin(1)+Math.exp(-1)*(-2*Math.cos(2)-1.5*Math.sin(2))),
 ()=>{const r=S.orthogonalPowerTrajectories(2,1,1);assert.equal(r.implicitSolution,'x²+(2)y²=C');near(r.originalSlope*r.orthogonalSlope,-1);},
 ()=>{const r=S.thirdOrderRepeatedRoot(1,1,0,0,0,1);near(r.value,Math.E/6);near(r.residual,0);assert.match(r.generalSolution,/C₀\+C₁x\+C₂x²/);},
];
assert.equal(cases.length,50);cases.forEach((run,i)=>test(`EDO ${i+1}: referencia independiente del enunciado`,run));
test('Clasificación, singularidades y ramas fuera de las referencias',()=>{
 assert.equal(O.odeClassification("sqrt(y')=x").degree,null);
 assert.equal(O.odeClassification("y'+sin(y)=0").linear,false);
 assert.equal(O.odeClassification("x*y''+exp(x)*y'=sin(x)").linear,true);
 assert.throws(()=>O.odeClassification("y'''''=x"));
 assert.throws(()=>O.variationRepeatedReciprocal(1,1,0,0,0),/dominio/);
 assert.throws(()=>O.variationTangent(1,1,0,0,Math.PI/2),/Polo/);
 near(O.variationTangent(2,3,1,-2,1.2).residual,0);
 near(O.variationRepeatedReciprocal(1,1,0,0,-2).residual,0);
 near(S.separablePower(2,1,1,0,-1,1).value,-Math.E);
 near(S.separablePower(2,1,1,0,0,1).value,0);
 near(S.separablePower(3,2,0,0,-2,1).value,-1);
 assert.throws(()=>S.separablePower(1,-2,0,-1,1,1),/singularidad/);
 assert.throws(()=>O.affineForcedSystem([[1,2],[2,4]],[1,0],[0,0],[0,0],1));
});
test('Forzamiento polinómico: resonancia simple y condiciones iniciales',()=>{
 for(const x of [0,.5,2]){const r=O.polynomialExponentialSecondOrder(-3,2,2,[1,2,3],4,-2,x);near(r.residual,0);vector(r.initialCheck,[4,-2]);assert.equal(r.resonanceOrder,1);}
 assert.throws(()=>O.polynomialExponentialSecondOrder(0,1,0,[1,2,3,4,5,6],0,0,1),/grado/);
});
test('Factor integrante inferido, ausencia en la familia y equivalencia fuera del eje',()=>{
 const r=S.inferMonomialFactor([[3,1,1],[1,0,2]],[[1,2,0],[1,1,1]]);assert.equal(r.status,'found');assert.deepEqual(r.candidates[0],{a:1,b:0});assert.deepEqual(potential(r),[[1,3,1],[.5,2,2]]);assert.match(r.assumption,/μ≠0/);
 assert.equal(S.inferMonomialFactor([[1,0,1]],[[1,0,0]]).status,'unsupported');
 assert.throws(()=>S.inferMonomialFactor([[1,-1,0]],[[1,0,0]]),/polinómicos/);
});
