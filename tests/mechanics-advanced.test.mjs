import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MECH_G, forceSystem2D, twoCableEquilibrium, beamReactions, circularMotion,
  riverCrossing, inclinedPlane, atwood, bankedCurve, verticalLoop,
  collisionOneDimensional, collisionTwoDimensional, centerOfMass,
  kineticDecomposition, standardInertia, circularOrbit, galileanTransform,
  rotatingFrameVelocity, rollingDownIncline, angularMomentumSkater,
  hingedRodDrop, apsisAngularMomentum,
} from '../js/math/mechanics-advanced.mjs';

const close=(actual,expected,tol=1e-8)=>assert.ok(Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected)),`${actual} ≠ ${expected}`);

test('Mecánica 4–5 y 20–21: fuerzas, torque y equilibrio',()=>{
  const forces=forceSystem2D([{force:[0,20],point:[0.4,0]}]);
  close(forces.torque,8);
  const cables=twoCableEquilibrium(100,30,45);
  close(cables.horizontalResidual,0);
  close(cables.verticalResidual,0);
  const beam=beamReactions(6,200,[{weight:300,position:2}]);
  close(beam.left,300);
  close(beam.right,200);
});

test('Mecánica 10, 23–25, 30, 36–37 y 43: movimiento y fuerzas',()=>{
  const circle=circularMotion(0.5,4*Math.PI);
  close(circle.speed,2*Math.PI);
  close(circle.radialAcceleration,8*Math.PI**2);
  const river=riverCrossing(5,3);
  close(river.perpendicularSpeed,4);
  const incline=inclinedPlane(10,30,0.2,4);
  close(incline.acceleration,MECH_G*(0.5-0.2*Math.cos(Math.PI/6)));
  assert.ok(incline.timeFromRest>0);
  const pulley=atwood(4,2,MECH_G,standardInertia('disk',2,0.1).inertia,0.1);
  close(pulley.acceleration,2*MECH_G/7);
  const loop=verticalLoop(5,2);
  assert.equal(loop.contactAtTop,true);
  close(loop.minimumStartHeight,5);
  assert.ok(bankedCurve(80,20,0.3).maxSpeed>20);
});

test('Mecánica 33, 44, 46 y 47: rodadura, momento angular y varilla',()=>{
  const rolling=rollingDownIncline(10,0.2,30,3,'solidCylinder');
  close(rolling.acceleration,MECH_G/3);
  close(rolling.timeFromRest,Math.sqrt(18/MECH_G));
  close(rolling.energyResidual,0);
  assert.throws(()=>rollingDownIncline(10,0.2,30,3,'solidCylinder',0.1),/fricción estática/);
  const skater=angularMomentumSkater(3,2,1.2);
  close(skater.finalOmega,5);
  close(skater.energyChange,9);
  const rod=hingedRodDrop(2,1);
  close(rod.initialAngularAcceleration,1.5*MECH_G);
  close(rod.finalOmega,Math.sqrt(3*MECH_G));
  close(rod.finalKinetic,rod.potentialDrop);
  const orbit=apsisAngularMomentum(1e7,9000,2e7);
  close(orbit.specificAngularMomentum,9e10);
  close(orbit.apoapsisSpeed,4500);
  assert.throws(()=>apsisAngularMomentum(2e7,9000,1e7),/apoapsis/);
});

test('Mecánica 27–28, 31, 40–42 y 50: choques y centro de masa',()=>{
  const inelastic=collisionOneDimensional(3,4,2,0,0);
  close(inelastic.firstFinal,2.4);
  close(inelastic.lostEnergy,9.6);
  const elastic=collisionOneDimensional(2,5,3,-2,1);
  close(elastic.firstFinal,-3.4);
  close(elastic.secondFinal,3.6);
  close(elastic.lostEnergy,0);
  const twoD=collisionTwoDimensional(2,[6,0],1,[0,0],[4*Math.cos(Math.PI/6),4*Math.sin(Math.PI/6)]);
  close(twoD.secondFinal[0],12-8*Math.cos(Math.PI/6));
  const center=centerOfMass([{mass:2,position:[0,0]},{mass:3,position:[4,0]},{mass:5,position:[0,6]}]);
  close(center.position[0],1.2);
  close(center.position[1],3);
  const system=kineticDecomposition([
    {mass:1,position:[0,0],velocity:[2,0]},
    {mass:2,position:[1,0],velocity:[0,3]},
    {mass:3,position:[0,2],velocity:[-1,1]},
  ]);
  close(system.totalKinetic,14);
  close(system.centerKinetic+system.relativeKinetic,system.totalKinetic);
  close(system.angularMomentum,12);
});

test('Mecánica 16, 34, 45, 48–49: inercia, órbita y cambios de marco',()=>{
  close(standardInertia('disk',4,0.3).inertia,0.18);
  close(standardInertia('rodEnd',3,1.2).inertia,1.44);
  const orbit=circularOrbit(5.97e24,7e6);
  close(orbit.period,2*Math.PI*7e6/orbit.speed);
  const rotating=rotatingFrameVelocity([3,4],[1,0],2);
  assert.deepEqual(rotating.relative,[3,2]);
  const galileo=galileanTransform([100,0],[30,10],[20,0],5);
  assert.deepEqual(galileo.position,[0,0]);
  assert.deepEqual(galileo.velocity,[10,10]);
});
