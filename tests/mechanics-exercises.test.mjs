import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../js/math/mechanics-advanced.mjs';
import { solveLinearExercise, solveProjectileExercise, projectileStateAt, solveDynamicsExercise } from '../js/math/mechanics-solver.mjs';
const g=9.80665,G=6.67430e-11,pi=Math.PI;
const close=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
const vector=(a,b)=>a.forEach((v,i)=>close(v,b[i]));
const checks={
  1(){const r=m.vectorPair([3,-2,4],[1,5,-2]);vector(r.sum,[4,3,2]);vector(r.difference,[2,-7,6]);close(r.magnitudeA,Math.sqrt(29));},
  2(){const r=m.vectorPair([2,1,-3],[4,-2,1]);close(r.dot,3);vector(r.cross,[-5,-14,-8]);},
  3(){vector(m.polarForce(50,37).resultant,[50*Math.cos(37*pi/180),50*Math.sin(37*pi/180)]);},
  4(){close(m.forceSystem2D([{force:[0,20],point:[.4,0]}]).torque,8);},
  5(){const r=m.forceSystem2D([{force:[30,0],point:[0,0]},{force:[0,40],point:[0,0]}]);close(r.magnitude,50);close(r.angleDegrees,Math.atan2(40,30)*180/pi);},
  6(){close(solveLinearExercise({x0:20,v0:15,t:12},'mru')[0].values.x,200);},
  7(){const r=solveLinearExercise({x0:0,v0:5,a:2,t:6})[0];close(r.values.v,17);close(r.values.x,66);},
  8(){const r=solveLinearExercise({x0:45,x:0,v0:0,a:-g})[0];close(r.values.t,Math.sqrt(90/g));close(r.values.v,-Math.sqrt(90*g));},
  9(){const r=solveProjectileExercise({speed:20,angle:pi/6,y0:0,yEnd:0,gravity:g})[0].values;close(r.x,400*Math.sin(pi/3)/g);close(r.vy**2/(2*g),50/g);},
  10(){const r=m.circularMotion(.5,4*pi);close(r.finalOmega,4*pi);close(r.speed,2*pi);close(r.radialAcceleration,8*pi**2);},
  11(){close(solveDynamicsExercise({mass:8,force:24}).values.acceleration,3);},
  12(){close(m.workByForce(30,5,60).work,75);},
  13(){close(solveDynamicsExercise({mass:2,speed:6}).values.kinetic,36);},
  14(){close(m.averagePower(5000,20).power,250);},
  15(){const r=m.linearImpulse(1500,20,10);close(r.momentum,30000);close(r.impulse,-15000);},
  16(){close(m.standardInertia('disk',4,.3).inertia,.18);},
  17(){close(m.gravitationalAttraction(5e24,7e22,3.8e8).magnitude,G*5e24*7e22/(3.8e8)**2);},
  18(){close(m.vectorPair([1,2,2],[2,-1,2]).angleDegrees,Math.acos(4/9)*180/pi);},
  19(){close(m.vectorPair([1,2,3],[2,0,1]).parallelogramArea,Math.sqrt(45));},
  20(){const r=m.twoCableEquilibrium(100,30,45);close(r.leftTension,100*Math.cos(pi/4)/Math.sin(5*pi/12));close(r.rightTension,100*Math.cos(pi/6)/Math.sin(5*pi/12));close(r.horizontalResidual,0);close(r.verticalResidual,0);},
  21(){const r=m.beamReactions(6,200,[{weight:300,position:2}]);close(r.left,300);close(r.right,200);},
  22(){const r=m.particleKinematics(['3*t^2','2*t-t^3'],2);vector(r.velocity,[12,-10]);vector(r.acceleration,[6,-12]);close(r.speed,Math.sqrt(244));},
  23(){const r=m.riverCrossing(5,3);close(r.headingDegrees,Math.asin(.6)*180/pi);close(r.perpendicularSpeed,4);},
  24(){const r=m.inclinedPlane(10,30,.2,4),a=g*(.5-.2*Math.sqrt(3)/2);close(r.acceleration,a);close(r.timeFromRest,Math.sqrt(8/a));},
  25(){const r=m.atwood(5,3);close(r.acceleration,g/4);close(r.tensionOne,15*g/4);close(r.tensionTwo,15*g/4);},
  26(){const r=m.tablePulley(4,6,.1);close(r.acceleration,.56*g);close(r.tensionOne,2.64*g);close(r.tensionTwo,2.64*g);},
  27(){const r=m.collisionOneDimensional(3,4,2,0,0);close(r.firstFinal,2.4);close(r.secondFinal,2.4);close(r.lostEnergy,9.6);},
  28(){const r=m.collisionOneDimensional(2,5,3,-2,1);close(r.firstFinal,-3.4);close(r.secondFinal,3.6);close(r.lostEnergy,0);},
  29(){close(m.springLaunch(200,.1,.5).speed,2);},
  30(){const r=m.verticalLoop(5,2);close(r.bottomSpeed,Math.sqrt(10*g));close(r.topSpeed,Math.sqrt(2*g));assert.equal(r.contactAtTop,true);},
  31(){vector(m.centerOfMass([{mass:2,position:[0,0]},{mass:3,position:[4,0]},{mass:5,position:[0,6]}]).position,[1.2,3]);},
  32(){vector(m.angularMomentumVector(2,[3,4,0],[-1,2,0]).angularMomentumVector,[0,0,20]);},
  33(){const r=m.rollingDownIncline(10,.2,30,3,'solidCylinder');close(r.acceleration,g/3);close(r.timeFromRest,Math.sqrt(18/g));close(r.energyResidual,0);},
  34(){const r=m.circularOrbit(5.97e24,7e6);close(r.speed,Math.sqrt(G*5.97e24/7e6));close(r.period,2*pi*Math.sqrt((7e6)**3/(G*5.97e24)));},
  35(){const vy=25*Math.sin(40*pi/180),vx=25*Math.cos(40*pi/180),time=(vy+Math.sqrt(vy**2+40*g))/g;const r=solveProjectileExercise({speed:25,angle:40*pi/180,y0:20,yEnd:0,gravity:g})[0].values;close(r.time,time);close(r.x,vx*time);const impact=projectileStateAt(r,r.time);close(impact.vx,vx);close(impact.vy,-Math.sqrt(vy**2+40*g));close(impact.speed,Math.sqrt(625+40*g));},
  36(){const r=m.circularMotion(.8,2,1.5,4);close(r.angle,20);close(r.tangentialAcceleration,1.2);close(r.radialAcceleration,51.2);close(r.totalAcceleration,Math.hypot(1.2,51.2));},
  37(){const r=m.bankedCurve(80,20,.3),theta=Math.atan(400/(80*g));close(r.angleDegrees,theta*180/pi);close(r.maxSpeed,Math.sqrt(80*g*(Math.tan(theta)+.3)/(1-.3*Math.tan(theta))));},
  38(){close(m.circularOrbit(5.97e24,6.37e6).escapeSpeed,Math.sqrt(2*G*5.97e24/6.37e6));close(m.circularOrbit(5.97e24,1.5e7,500).totalEnergy,-G*5.97e24*500/(3e7));},
  39(){const r=m.potentialEquilibria([1,-6,9,0]);assert.deepEqual(r.equilibria.map(p=>p.position),[1,3]);assert.deepEqual(r.equilibria.map(p=>p.stability),['inestable','estable']);},
  40(){vector(m.collisionTwoDimensional(2,[6,0],1,[0,0],[2*Math.sqrt(3),2]).secondFinal,[12-4*Math.sqrt(3),-4]);},
  41(){const r=m.ballisticPendulum(.02,300,2);close(r.speed,300/101);close(r.height,(300/101)**2/(2*g));},
  42(){const r=m.kineticDecomposition([{mass:2,position:[0,0],velocity:[3,0]},{mass:3,position:[0,0],velocity:[-1,2]}]);vector(r.centerVelocity,[.6,1.2]);close(r.reducedMass,1.2);close(r.relativeKinetic,12);},
  43(){const r=m.atwood(4,2,g,.01,.1);close(r.acceleration,2*g/7);close(r.tensionOne,20*g/7);close(r.tensionTwo,18*g/7);},
  44(){const r=m.angularMomentumSkater(3,2,1.2);close(r.finalOmega,5);close(r.energyChange,9);},
  45(){close(m.standardInertia('rodEnd',3,1.2).inertia,1.44);close(m.standardInertia('rodCenter',3,1.2).inertia,.36);},
  46(){const r=m.hingedRodDrop(2,1);close(r.initialAngularAcceleration,1.5*g);close(r.finalOmega,Math.sqrt(3*g));},
  47(){const r=m.apsisAngularMomentum(1e7,9000,2e7);close(r.specificAngularMomentum,9e10);close(r.apoapsisSpeed,4500);},
  48(){vector(m.rotatingFrameVelocity([3,4],[1,0],2).relative,[3,2]);},
  49(){const r=m.galileanTransform([100,0],[30,10],[20,0],5);vector(r.position,[0,0]);vector(r.velocity,[10,10]);},
  50(){const r=m.kineticDecomposition([{mass:1,position:[0,0],velocity:[2,0]},{mass:2,position:[1,0],velocity:[0,3]},{mass:3,position:[0,2],velocity:[-1,1]}]);close(r.totalKinetic,14);close(r.centerKinetic,41/6);close(r.relativeKinetic,43/6);close(r.angularMomentum,12);},
};
for(const [id,check]of Object.entries(checks))test(`Mecánica guía ${id}: referencia independiente`,check);
test('dominio de movimiento vectorial y equilibrio degenerado',()=>{
  assert.throws(()=>m.particleKinematics(['sqrt(t)','t'],0),/dominio/);
  assert.equal(m.vectorPair([0,0,0],[1,0,0]).angleDegrees,null);
  assert.throws(()=>m.angularMomentumVector(2,[1,2,3],[1,2]),/tres/);
  assert.equal(m.potentialEquilibria([0,0,0,3]).equilibria.length,0);
  assert.match(m.potentialEquilibria([0,0,0,3]).assumption,/todo x/);
  vector(m.potentialEquilibria([1e-15,-6e-15,9e-15,0]).equilibria.map(p=>p.position),[1,3]);
  assert.match(m.potentialEquilibria([1,0,0,0]).equilibria[0].stability,/inflexión/);
});
test('balances de impacto, polea y sistema de partículas',()=>{
  const b=m.ballisticPendulum(.02,300,2);close(.02*300,2.02*b.speed);close(2.02*g*b.height,.5*2.02*b.speed**2);
  const p=m.tablePulley(4,6,.1);close(p.tensionOne-p.friction,4*p.acceleration);close(6*g-p.tensionTwo,6*p.acceleration);
  assert.throws(()=>m.tablePulley(4,6,-.1),/Fricción/);
  assert.throws(()=>m.averagePower(10,0),/positivo/);
  assert.throws(()=>m.springLaunch(200,-.1,.5),/Compresión/);
});
