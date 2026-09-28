import test from 'node:test';
import assert from 'node:assert/strict';
import { convertMechanicsUnit, toMechanicsSI } from '../js/math/mechanics-units.mjs';
import { solveLinearExercise, solveProjectileExercise, solveDynamicsExercise, linearStateAt, projectileStateAt } from '../js/math/mechanics-solver.mjs';
import { drawLinearMotion, drawExerciseProjectile } from '../js/graphics/mechanics-trajectory.mjs';

const close = (actual,expected) => assert.ok(Math.abs(actual-expected) < 1e-7*Math.max(1,Math.abs(expected)),`${actual} ≠ ${expected}`);

test('convierte medidas imperiales y angulares para la física sin alterar su significado',() => {
  close(toMechanicsSI(5280,'length','ft'),1609.344);
  close(convertMechanicsUnit(60,'speed','mph','m/s'),26.8224);
  close(toMechanicsSI(12,'speed','in/s'),0.3048);
  close(convertMechanicsUnit(1,'mass','lb','kg'),0.45359237);
  close(toMechanicsSI(180,'angle','°'),Math.PI);
  close(convertMechanicsUnit(10,'force','lbf','N'),44.482216152605);
  assert.throws(() => toMechanicsSI(1,'length','kg'),RangeError);
});

test('MRU y MRUA despejan incógnitas, conservan signos y muestran ambas llegadas',() => {
  const mru = solveLinearExercise({x0:0,x:1609.344,v0:26.8224},'mru')[0];
  close(mru.values.t,60);
  close(mru.values.v,26.8224);
  assert.match(mru.steps.at(-1).formula,/t/);
  const inverse = solveLinearExercise({x0:0,x:75,v0:10,t:5})[0];
  close(inverse.values.a,2);
  close(inverse.values.v,20);
  const roots = solveLinearExercise({x0:0,x:0,v0:10,a:-10});
  assert.deepEqual(roots.map(item => item.values.t),[0,2]);
  const inverseRoots = solveLinearExercise({x0:0,x:0,v:-10,a:-10});
  assert.deepEqual(inverseRoots.map(item => item.values.v0),[10,-10]);
  assert.deepEqual(inverseRoots.map(item => item.values.t),[2,0]);
  close(linearStateAt(roots[1].values,1).velocity,0);
  assert.throws(() => solveLinearExercise({x0:0,x:75,v0:10,a:2,t:5,v:99}),RangeError);
  assert.throws(() => solveLinearExercise({x0:0,x:-10,v0:10},'mru'),RangeError);
});

test('tiro despeja el ángulo a partir del destino y presenta ambas trayectorias posibles',() => {
  const results = solveProjectileExercise({speed:20,x:30,y0:0,yEnd:0,gravity:9.81});
  assert.equal(results.length,2);
  assert.ok(results[0].values.angle > results[1].values.angle);
  for (const result of results) {
    close(result.values.x,30);
    close(projectileStateAt(result.values,result.values.time).y,0);
    assert.ok(result.steps.some(step => step.formula.includes('t⁴')));
  }
});

test('tiro despeja altura inicial, velocidad y ángulo cuando hay tiempo y destino',() => {
  const results = solveProjectileExercise({x:30,time:2,speed:20,yEnd:0,gravity:10});
  assert.equal(results.length,2);
  close(results[0].values.vx,15);
  close(results[0].values.y0,-6.457513110645905);
  close(results[1].values.y0,46.457513110645905);
  const fullyDetermined = solveProjectileExercise({x:30,time:2,y0:0,yEnd:0,gravity:10});
  assert.equal(fullyDetermined.length,1);
  close(fullyDetermined[0].values.speed,Math.hypot(15,10));
  const fromAngle = solveProjectileExercise({time:2,angle:Math.PI/4,y0:0,yEnd:0,gravity:10})[0];
  close(fromAngle.values.speed,Math.hypot(10,10));
  close(fromAngle.values.x,20);
  const gravity = solveProjectileExercise({x:20,time:2,angle:Math.PI/4,y0:0,yEnd:0})[0];
  close(gravity.values.gravity,10);
});

test('tiro calcula vuelo y resuelve velocidad requerida, detectando datos imposibles',() => {
  const flight = solveProjectileExercise({speed:10,angle:Math.PI/4,y0:0,yEnd:0,gravity:10});
  assert.equal(flight.length,1);
  close(flight[0].values.time,Math.SQRT2);
  close(flight[0].values.x,10);
  const required = solveProjectileExercise({x:30,angle:Math.PI/4,y0:0,yEnd:0,gravity:9.81})[0];
  close(required.values.speed,Math.sqrt(30*9.81));
  const components = solveProjectileExercise({vx:10,vy:10,y0:0,yEnd:0,gravity:10})[0];
  close(components.values.speed,Math.hypot(10,10));
  close(components.values.time,2);
  close(components.values.x,20);
  assert.throws(() => solveProjectileExercise({speed:5,x:100,y0:0,yEnd:0,gravity:9.81}),RangeError);
  assert.throws(() => solveProjectileExercise({speed:10,angle:Math.PI/4,x:100,y0:0,yEnd:0,gravity:10}),RangeError);
});

test('fuerza y energía despejan masa, velocidad y altura con procesos',() => {
  const result = solveDynamicsExercise({force:12,acceleration:3,kinetic:32,gravity:10,potential:200});
  close(result.values.mass,4);
  close(result.values.speed,4);
  close(result.values.height,5);
  close(result.values.total,232);
  assert.ok(result.steps.length >= 4);
  assert.throws(() => solveDynamicsExercise({mass:0,force:10}),RangeError);
});

test('los dos gráficos dibujan recorrido y vectores que cambian con el tiempo',() => {
  const calls = [];
  const ctx = new Proxy({}, {
    get(target,key) { return target[key] ?? ((...args) => { calls.push([key,...args]); }); },
    set(target,key,value) { target[key]=value; return true; },
  });
  const canvas = {clientWidth:320,getContext:() => ctx};
  const palette = name => name;
  drawLinearMotion(canvas,{x0:0,v0:10,a:2,t:5},2,'m',palette);
  const first = calls.filter(call => call[0] === 'lineTo').map(call => call.slice(1));
  calls.length = 0;
  drawLinearMotion(canvas,{x0:0,v0:10,a:2,t:5},5,'m',palette);
  assert.notDeepEqual(first,calls.filter(call => call[0] === 'lineTo').map(call => call.slice(1)));
  calls.length = 0;
  drawExerciseProjectile(canvas,{vx:10,vy:10,gravity:10,time:2,y0:0},1,'m','m',palette);
  const mid = calls.filter(call => call[0] === 'lineTo').map(call => call.slice(1));
  calls.length = 0;
  drawExerciseProjectile(canvas,{vx:10,vy:10,gravity:10,time:2,y0:0},2,'m','m',palette);
  assert.notDeepEqual(mid,calls.filter(call => call[0] === 'lineTo').map(call => call.slice(1)));
});
