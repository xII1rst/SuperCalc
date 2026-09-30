import test from 'node:test';
import assert from 'node:assert/strict';
import {separablePower,linearFirstOrder,linearPowerCoefficient,bernoulliConstant,bernoulliLinearForcing,exactPolynomialForm,logisticGrowth,thermalRelaxation,rlCurrent,orthogonalPowerTrajectories,thirdOrderRepeatedRoot,forcedSecondOrder,linearSystem2D,laplaceSystem2D,symmetricSystemModes,
  laplaceTable,laplaceExponentialPlusTime,inverseLaplaceShiftedPower,inverseLaplaceQuadratic,firstOrderExponentialForcing} from '../js/math/study-ode.mjs';
import {laplaceSecondOrderHarmonic,laplaceRepeatedRootForcing} from '../js/math/study-ode.mjs';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('EDO 1–22 y 45–46: separable, lineal, Bernoulli y logística',()=>{
  const separable=separablePower(2,1,1,0,1,1);
  near(separable.value,Math.E);near(separable.derivative,2*Math.E);
  near(linearFirstOrder(2,6,0,1,1).value,3-2*Math.exp(-2));
  const bernoulli=bernoulliConstant(1,1,2,0,2,0.5);
  near(bernoulli.value,1/(1-0.5*Math.exp(0.5)));
  assert.throws(()=>bernoulliConstant(1,1,2,0,2,1),/rama positiva/);
  const logistic=logisticGrowth(1,10,0,2,Math.log(4));
  near(logistic.value,5);
  assert.throws(()=>separablePower(1,-1,1,-1,1,1),/singularidad/);
});

test('EDO 3–5, 11 y 16: referencias separables con condiciones y dominio',()=>{
  near(separablePower(3,2,0,0,2,2).value,10);
  near(separablePower(2,1,1,0,1,1).value,Math.E);
  near(separablePower(1,-1,1,1,2,3).value,6);
  near(separablePower(1,1,-1,0,2,2).value,Math.sqrt(8));
  near(separablePower(1,0,1,0,5,1).value,5*Math.E);
  assert.throws(()=>separablePower(1,-1,1,1,2,-1),/singularidad/);
});

test('EDO 6, 37 y 38: fuerza exponencial y resonancia',()=>{
  const first=firstOrderExponentialForcing(2,1,-1,0,1);
  near(first.value,Math.exp(-1)-Math.exp(-2));
  near(first.constantValue,-1);
  assert.match(first.generalSolution,/C e\^\(−2t\)/);
  const harmonic=forcedSecondOrder(0,4,1,2,0,0,1);
  assert.equal(harmonic.resonant,true);
  near(harmonic.value,Math.sin(2)/4);
  const repeated=laplaceRepeatedRootForcing(1,1,0,0,0,1);
  near(repeated.value,Math.E/2);
  near(repeated.particular,Math.E/2);
});

test('EDO 12, 19 y 20: potencial exacto y factor integrante monomial',()=>{
  const coefficient=(result,x,y)=>result.potentialTerms.find(term=>term.powers[0]===x&&term.powers[1]===y)?.coefficient||0;
  const simple=exactPolynomialForm([[2,1,0],[1,0,1]],[[1,1,0],[2,0,1]]);
  near(coefficient(simple,2,0),1);near(coefficient(simple,1,1),1);near(coefficient(simple,0,2),1);
  assert.match(simple.implicitSolution,/= C$/);
  const second=exactPolynomialForm([[2,1,1],[3,0,0]],[[1,2,0],[-1,0,0]]);
  near(coefficient(second,2,1),1);near(coefficient(second,1,0),3);near(coefficient(second,0,1),-1);
  const m=[[3,1,1],[1,0,2]],n=[[1,2,0],[1,1,1]];
  assert.throws(()=>exactPolynomialForm(m,n),/no es exacta/);
  const factored=exactPolynomialForm(m,n,1,0);
  near(coefficient(factored,3,1),1);near(coefficient(factored,2,2),0.5);
  assert.equal(factored.factor,'x^1 y^0');
  assert.throws(()=>exactPolynomialForm(m,n,-1,0),/factor integrante/);
});

test('EDO 21–22: factor x^a y sustitución z=1/y',()=>{
  const linear=linearPowerCoefficient(2,1,3,1,0,2);
  near(linear.value,2.625);
  near(linear.derivative,8-2*linear.value/2);
  near(linearPowerCoefficient(2,1,3,1,0,1).value,0);
  assert.equal(linear.integratingFactor,'x^2');
  assert.match(linear.generalSolution,/C x\^\(−2\)/);
  near(linear.constantValue,-1/6);
  const logCase=linearPowerCoefficient(1,2,-2,1,3,Math.E);
  near(logCase.value,5/Math.E);
  assert.match(logCase.solution,/ln/);
  assert.throws(()=>linearPowerCoefficient(2,1,3,-1,0,2),/positivo/);
  const bernoulli=bernoulliLinearForcing(1,1,0,1);
  near(bernoulli.value,1/2);
  near(bernoulli.derivative,-1/4);
  near(bernoulliLinearForcing(0,2,3,1).value,0.5);
  assert.match(bernoulli.formula,/y≡0/);
  assert.throws(()=>bernoulliLinearForcing(0,2,1,1),/denominador/);
});

test('EDO 45–47: enfriamiento, logística y circuito RL con límites',()=>{
  const cooling=thermalRelaxation(20,90,60,10,20);
  near(cooling.value,20+70*(4/7)**2);
  near(thermalRelaxation(20,90,60,10,10).value,60);
  assert.ok(cooling.rate<0);
  assert.throws(()=>thermalRelaxation(20,90,100,10,20),/acercarse/);
  const logistic=logisticGrowth(0.1,500,0,50,10);
  near(logistic.value,500/(1+9*Math.exp(-1)));
  const current=rlCurrent(2,10,12,0,1);
  near(current.value,1.2*(1-Math.exp(-5)));
  near(current.equilibrium,1.2);
  near(current.timeConstant,0.2);
  near(2*current.derivative+10*current.value,12);
  assert.throws(()=>rlCurrent(0,10,12,0,1),/positivo/);
});

test('EDO 49–50: trayectorias ortogonales y raíz triple forzada',()=>{
  const trajectories=orthogonalPowerTrajectories(2,1,1);
  near(trajectories.originalSlope*trajectories.orthogonalSlope,-1);
  near(trajectories.constant,3);
  assert.equal(trajectories.implicitSolution,'x²+(2)y²=C');
  assert.throws(()=>orthogonalPowerTrajectories(2,0,1),/positivo/);
  const third=thirdOrderRepeatedRoot(1,1,0,0,0,1);
  near(third.value,Math.E/6);
  near(third.residual,0);
  assert.match(third.generalSolution,/x³\/6/);
  const other=thirdOrderRepeatedRoot(0,6,1,2,3,2);
  near(other.value,1+4+12+8);
  near(other.thirdDerivative,6);
});

test('EDO 42–43: transformadas del sistema y modos propios simétricos',()=>{
  const laplace=laplaceSystem2D([[2,-1],[1,0]],[1,0],1);
  near(laplace.value[0],2*Math.E);
  near(laplace.value[1],Math.E);
  assert.match(laplace.transformX,/\(\(1\)s\+\(0\)\)/);
  assert.match(laplace.transformY,/\(\(0\)s\+\(1\)\)/);
  assert.match(laplace.expression,/Bu₀=\[1,1\]/);
  const modes=symmetricSystemModes(1,2,[1,0],0.5);
  assert.deepEqual(modes.eigenvalues,[3,-1]);
  assert.deepEqual(modes.eigenvectors,[[1,1],[1,-1]]);
  near(modes.value[0],(Math.exp(1.5)+Math.exp(-0.5))/2);
  near(modes.value[1],(Math.exp(1.5)-Math.exp(-0.5))/2);
});

test('EDO 28 y 35–37: segundo orden forzado e iniciales verificables',()=>{
  const ordinary=forcedSecondOrder(0,4,2,1,1,0,0);
  near(ordinary.value,1);near(ordinary.derivative,0);
  const later=forcedSecondOrder(0,4,2,1,1,0,0.4);
  const h=1e-4;
  const before=forcedSecondOrder(0,4,2,1,1,0,0.4-h).value;
  const after=forcedSecondOrder(0,4,2,1,1,0,0.4+h).value;
  near((after-before)/(2*h),later.derivative,1e-6);
  const resonant=forcedSecondOrder(0,1,2,1,0,0,1);
  assert.equal(resonant.resonant,true);near(resonant.value,Math.sin(1));
});

test('EDO 39–44: sistema 2×2 y transformadas de Laplace acotadas',()=>{
  const diagonal=linearSystem2D([[1,0],[0,-2]],[2,3],1);
  near(diagonal.value[0],2*Math.E);near(diagonal.value[1],3*Math.exp(-2));
  const rotation=linearSystem2D([[0,-1],[1,0]],[1,0],Math.PI/2);
  near(rotation.value[0],0);near(rotation.value[1],1);
  assert.equal(laplaceTable('sine',2).transform,'2/(s²+4)');
});

test('EDO 13–15 y 27, 29–30: transformadas, inversas y PVI',()=>{
  assert.equal(laplaceTable('timeSquared').transform,'2/s³');
  assert.equal(laplaceTable('sine',3).transform,'3/(s²+9)');
  assert.equal(laplaceExponentialPlusTime(2,3).transform,'1/(s−(2)) + (3)/s²');
  near(inverseLaplaceShiftedPower(1,4,1,0.5).value,Math.exp(-2));
  near(inverseLaplaceShiftedPower(6,0,4,2).value,8);
  const inverse=inverseLaplaceQuadratic(1,3,4,13,0.5);
  near(inverse.value,Math.exp(-1)*(Math.cos(1.5)+Math.sin(1.5)/3));
  assert.equal(inverse.regime,'par conjugado');
  assert.equal(laplaceTable('timeSine',2).transform,'4s/(s²+4)²');
  const ode=firstOrderExponentialForcing(-3,1,2,1,1);
  near(ode.value,2*Math.exp(3)-Math.exp(2));
  near(firstOrderExponentialForcing(-3,1,2,1,0).derivative,4);
  near(firstOrderExponentialForcing(-2,3,2,1,1).value,4*Math.exp(2));
  assert.throws(()=>inverseLaplaceShiftedPower(1,0,0,1),/Orden/);
  assert.throws(()=>inverseLaplaceQuadratic(1,3,4,13,-1),/Tiempo/);
});

test('EDO 39–41 y 48: PVI de segundo orden por Laplace',()=>{
  const t=0.7;
  const sine=laplaceSecondOrderHarmonic(0,4,0,1,1,0,0,t);
  near(sine.value,Math.sin(t)/3-Math.sin(2*t)/6);
  near(sine.derivative,Math.cos(t)/3-Math.cos(2*t)/3);
  assert.match(sine.expression,/sen\(2t\)/);
  const homogeneous=laplaceSecondOrderHarmonic(2,2,0,0,1,1,0,t);
  near(homogeneous.value,Math.exp(-t)*(Math.cos(t)+Math.sin(t)));
  near(laplaceSecondOrderHarmonic(2,2,0,0,1,1,0,0).derivative,0);
  const repeated=laplaceRepeatedRootForcing(1,1,1,0,0,t);
  near(repeated.value,Math.exp(t)*t**3/6);
  near(laplaceRepeatedRootForcing(1,1,0,0,0,t).particular,Math.exp(t)*t*t/2);
  const mixed=laplaceSecondOrderHarmonic(2,5,10,0,1,0,0,t);
  near(mixed.value,2*Math.cos(t)+Math.sin(t)+Math.exp(-t)*(-2*Math.cos(2*t)-1.5*Math.sin(2*t)));
  const resonant=laplaceSecondOrderHarmonic(0,1,0,1,1,0,0,t);
  near(resonant.value,(Math.sin(t)-t*Math.cos(t))/2);
  assert.equal(resonant.resonant,true);
  assert.throws(()=>laplaceRepeatedRootForcing(1,1,4,0,0,1),/Potencia/);
});
