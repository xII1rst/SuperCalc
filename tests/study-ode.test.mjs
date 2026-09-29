import test from 'node:test';
import assert from 'node:assert/strict';
import {separablePower,linearFirstOrder,bernoulliConstant,logisticGrowth,forcedSecondOrder,linearSystem2D,laplaceTable} from '../js/math/study-ode.mjs';
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
