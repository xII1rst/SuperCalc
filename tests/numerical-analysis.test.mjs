import test from 'node:test';
import assert from 'node:assert/strict';
import {
  numericError, significantArithmetic, bisection, newtonTrace, iterativeLinearSystem,
  newtonInterpolation, lagrangeInterpolation, interpolationErrorStudy, leastSquaresPolynomial,
  finiteDifference, ivpTrace,
} from '../js/math/numerical-analysis.mjs';

const close=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} ≠ ${expected}`);

test('Análisis 1–4: error, cifras y tres pasos de bisección',()=>{
  close(numericError(Math.PI,22/7).absolute,Math.abs(Math.PI-22/7));
  assert.equal(significantArithmetic(2.718281828,5).rounded,2.7183);
  const result=bisection(x=>x**3-x-2,1,2,{iterations:3});
  assert.equal(result.status,'fixed_steps');
  assert.deepEqual(result.history.map(row=>row.midpoint),[1.5,1.75,1.625]);
  close(result.bound,0.125);
});

test('Análisis 6, 7, 19: Newton y bisección con historial y fallos honestos',()=>{
  const root=newtonTrace(x=>x*x-2,x=>2*x,1.5,{iterations:2});
  close(root.history[0].next,17/12);
  close(root.root,1.4142156862745099);
  assert.equal(newtonTrace(x=>x*x+1,x=>2*x,0,{iterations:3}).status,'zero_derivative');
  assert.throws(()=>bisection(x=>x*x+1,-1,1,{iterations:3}),RangeError);
  const convergence=bisection(x=>Math.exp(-x)-x,0,1,{tolerance:1e-5});
  assert.equal(convergence.status,'converged');
  close(convergence.root,0.56714329,1e-5);
});

test('Análisis 9, 24 y 25: Jacobi y Gauss-Seidel devuelven pasos y residuo',()=>{
  const A=[[4,-1],[-1,4]], rhs=[3,6];
  const jacobi=iterativeLinearSystem(A,rhs,[0,0],{method:'jacobi',iterations:2});
  assert.deepEqual(jacobi.history[0].vector,[0.75,1.5]);
  assert.deepEqual(jacobi.history[1].vector,[1.125,1.6875]);
  const seidel=iterativeLinearSystem(A,rhs,[0,0],{method:'seidel',tolerance:1e-9});
  assert.equal(seidel.status,'converged');
  close(seidel.solution[0],1.2);
  close(seidel.solution[1],1.8);
  assert.throws(()=>iterativeLinearSystem([[0,1],[1,1]],[1,2],[0,0],{iterations:2}),RangeError);
});

test('Análisis 10–12, 27: interpolación y mínimos cuadrados',()=>{
  close(lagrangeInterpolation([[1,2],[3,8]],2).value,5);
  const newton=newtonInterpolation([[0,1],[1,3],[2,7]]);
  assert.deepEqual(newton.coefficients,[1,2,1]);
  close(newton.evaluate(1.5),4.75);
  const fit=leastSquaresPolynomial([[1,2],[2,3],[3,5],[4,4]],1);
  close(fit.coefficients[0],1.5);
  close(fit.coefficients[1],0.8);
  assert.throws(()=>newtonInterpolation([[1,2],[1,3]]),RangeError);
});

test('Análisis 42: cota de interpolación de ln(x) y error real',()=>{
  const points=[1,2,3].map(x=>[x,Math.log(x)]);
  const result=interpolationErrorStudy(points,2.5,2,Math.log);
  close(result.approximation,0.75*Math.log(2)+0.375*Math.log(3));
  close(result.bound,0.125);
  close(result.actualError,Math.abs(Math.log(2.5)-result.approximation));
  assert.ok(result.actualError<result.bound);
  assert.throws(()=>interpolationErrorStudy([[1,0],[2,1],[3,1]],2.5,2,Math.log),/no coinciden/);
  assert.throws(()=>interpolationErrorStudy(points,2.5,-1,Math.log),/no negativa/);
});

test('Análisis 13, 16, 31 y 48: diferencias, Euler, RK4 y AB2',()=>{
  const forward=finiteDifference(Math.exp,0,0.1,'forward').value;
  const central=finiteDifference(Math.exp,0,0.1,'central').value;
  assert.ok(Math.abs(central-1)<Math.abs(forward-1));
  assert.ok(Math.abs(finiteDifference(Math.log,2,0.1,'five').value-0.5)<5e-6);
  const euler=ivpTrace((x,y)=>x+y,0,1,0.1,2,'euler');
  euler.history.forEach((row,i)=>close(row.y,[1,1.1,1.22][i]));
  const rk4=ivpTrace((x,y)=>y,0,1,0.1,5,'rk4');
  assert.ok(Math.abs(rk4.final.y-Math.exp(0.5))<1e-6);
  const ab2=ivpTrace((x,y)=>y,0,1,0.1,5,'ab2');
  assert.equal(ab2.startup,'RK4 en el primer paso');
  assert.equal(ab2.history.length,6);
  const rk2Start=ivpTrace((x,y)=>x-y,0,1,0.1,4,'ab2',{startup:'rk2'});
  assert.equal(rk2Start.startup,'RK2 punto medio en el primer paso');
  [1,0.91,0.8385,0.783225,0.74266625].forEach((value,i)=>close(rk2Start.history[i].y,value));
  assert.throws(()=>ivpTrace((x,y)=>y,0,1,0.1,2,'ab2',{startup:'euler'}),/Arranque/);
  assert.throws(()=>ivpTrace((x,y)=>y,0,1,0,5,'rk4'),RangeError);
});
