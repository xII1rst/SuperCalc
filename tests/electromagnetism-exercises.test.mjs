import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../js/math/electromagnetism-advanced.mjs';
import { coulomb, lorentz, parallelPlateCapacitance, magneticFieldWire, ohmsLaw, inducedEmf } from '../js/math/electromagnetism.mjs';
import { lcOscillation } from '../js/math/waves.mjs';
const k=8.9875e9,eps=8.854e-12,mu=4*Math.PI*1e-7,pi=Math.PI,qProton=1.602176634e-19,mProton=1.67262192369e-27;
const near=(a,b)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-10*Math.max(1e-20,Math.abs(b)),`${a} ≠ ${b}`);
const vec=(a,b)=>a.forEach((x,i)=>near(x,b[i]));
const ac=()=>e.seriesRlcAc(50,.2,20e-6,60,120);
const checks={
  1(){const r=coulomb(2e-6,-3e-6,[0,0,0],[.1,0,0]);near(r.F,k*6e-12/.01);assert.equal(r.sign,'Atractiva');},
  2(){near(e.pointChargeSystem([{charge:5e-9,position:[0,0,0]}],[.5,0,0]).magnitude,k*5e-9/.25);},
  3(){near(e.pointChargeSystem([{charge:-4e-9,position:[0,0,0]}],[2,0,0]).potential,-k*4e-9/2);},
  4(){near(e.uniformElectricFlux(200,.5).flux,100);},
  5(){near(e.enclosedChargeFlux(8.85e-9).flux,8.85e-9/eps);},
  6(){near(parallelPlateCapacitance(.02,.001),eps*20);},
  7(){near(e.capacitorState(10e-6,12).energy,.00072);},
  8(){near(e.equivalentComponents([4e-6,6e-6],'capacitor','series').equivalent,2.4e-6);near(e.equivalentComponents([4e-6,6e-6],'capacitor','parallel').equivalent,10e-6);},
  9(){const r=ohmsLaw({voltage:9,resistance:12});near(r.current,.75);near(r.power,6.75);},
  10(){near(e.equivalentComponents([10,20,30],'resistor','series').equivalent,60);near(e.equivalentComponents([10,20,30],'resistor','parallel').equivalent,60/11);},
  11(){near(e.resistiveWire(1.7e-8,50,pi*(.001/2)**2).resistance,3.4/pi);},
  12(){const r=lorentz(1.6e-19,[3e6,0,0],[0,0,0],[0,0,.5]);near(r.Fmag,2.4e-13);near(r.Fy,-2.4e-13);},
  13(){near(magneticFieldWire(10,.05),4e-5);},
  14(){near(e.magneticForceWire(5,.2,.4,90).magnitude,.4);},
  15(){near(inducedEmf(100,.02,.05,.1).emf,-30);},
  16(){near(e.rcState(2000,5e-6,1,0).tau,.01);},
  17(){const r=e.seriesRlcAc(1,.2,10e-6,60,1);near(r.reactanceInductive,24*pi);near(r.reactanceCapacitive,1/(.0012*pi));},
  18(){near(e.chargedRingAxis(10e-9,.1,.2).field,k*10e-9*.2/(.05**1.5));},
  19(){near(e.infiniteChargedPlane(3e-6).field,3e-6/(2*eps));near(e.infiniteChargedPlane(3e-6,true).field,3e-6/eps);},
  20(){near(e.conductingSphere(5e-9,.2,.1).field,0);near(e.conductingSphere(5e-9,.2,.3).field,k*5e-9/.09);near(e.conductingSphere(5e-9,.2,.2).potential,k*5e-9/.2);},
  21(){const r=e.dipoleAxis(2e-9,.01,.5);near(r.dipoleMoment,2e-11);near(r.potential,k*2e-11/(.25-.005**2));near(r.approximatePotential,k*2e-11/.25);},
  22(){// Ejemplos de dos polaridades; no se atribuye ninguna al enunciado ambiguo.
    const resistors=[{a:1,b:3,resistance:4},{a:2,b:3,resistance:2},{a:3,b:0,resistance:6}];
    const first=e.nodalVoltageSources(4,resistors,[{a:1,b:0,voltage:12},{a:2,b:0,voltage:6}]);
    const second=e.nodalVoltageSources(4,resistors,[{a:1,b:0,voltage:12},{a:2,b:0,voltage:-6}]);
    vec(first.branchCurrents,[15/11,-3/11,12/11]);vec(second.branchCurrents,[3,-3,0]);
    assert.notDeepEqual(first.branchCurrents,second.branchCurrents);
    first.kclResiduals.forEach(x=>assert.ok(Math.abs(x)<1e-12));second.voltageResiduals.forEach(x=>assert.ok(Math.abs(x)<1e-12));
  },
  23(){const r=e.rcState(1000,10e-6,100,.005);near(r.dischargeVoltage,100*Math.exp(-.5));near(r.timeToFraction,.01*Math.log(10));},
  24(){const r=e.rcState(5000,2e-6,12,.01);near(r.chargingCharge,24e-6*(1-Math.exp(-1)));near(r.chargeCurrent,.0024*Math.exp(-1));},
  25(){const r=e.dielectricCapacitor(5e-6,100,3);near(r.capacitance,15e-6);near(r.voltage,100/3);near(r.energy,.025/3);near(r.charge,.0005);},
  26(){const r=e.solenoidFieldDensity(1000,2);near(r.field,mu*2000);near(r.energyDensity,mu*2e6);},
  27(){near(e.longCurrentCable(8,.002,.001).field,mu*8*.001/(2*pi*.002**2));near(e.longCurrentCable(8,.002,.004).field,mu*8/(2*pi*.004));},
  28(){const r=e.circularLoopAxis(3,1,.05,.1);near(r.centerField,mu*3/.1);near(r.axisField,mu*3*.05**2/(2*(.05**2+.1**2)**1.5));},
  29(){const r=e.chargedParticleOrbit(qProton,mProton,1e6,.2);near(r.orbitRadius,mProton*1e6/(qProton*.2));near(r.period,2*pi*mProton/(qProton*.2));},
  30(){near(e.loopTorque(50,2,.1,.2,.5,30).torqueMagnitude,Math.sqrt(3)/2);},
  31(){near(e.hallEffect(5,.8,8.5e28,-1.602176634e-19,.001).magnitude,4/(8.5e28*qProton*.001));},
  32(){near(e.solenoidSelfInductance(500,.25,4e-4).inductance,mu*400);},
  33(){const r=e.rlTransient(10,.5,20,.1);near(r.growingCurrent,2*(1-Math.exp(-2)));near(r.finalEnergy,1);},
  34(){const r=lcOscillation(.02,5e-6,0,0);near(r.frequency,1/(2*pi*Math.sqrt(1e-7)));near(r.period,2*pi*Math.sqrt(1e-7));},
  35(){const r=e.polynomialPotential('3*x^2*y-z^3',[1,2,1]);vec(r.field,[-12,-3,3]);near(r.laplacian,6);near(r.chargeDensity,-6*eps);},
  36(){const r=e.polynomialFieldDivergence(['2*x','3*y^2','z'],[1,1,1]);near(r.divergence,9);near(r.chargeDensity,9*eps);vec(r.field,[2,3,1]);},
  37(){near(e.uniformSolidSphere(2e-6,.1,.05).field,2e-6*.05/(3*eps));near(e.uniformSolidSphere(2e-6,.1,.2).field,k*(4*pi*.1**3*2e-6/3)/.04);near(e.uniformSolidSphere(2e-6,.1,0).potential,2*pi*k*2e-6*.1**2);},
  38(){const r=e.radialChargedCylinder(1e-6,.1,.05);near(r.field,1e-6*.05**2/(3*eps*.1));near(e.radialChargedCylinder(1e-6,.1,.2).field,1e-6*.1**2/(3*eps*.2));assert.match(r.formula,/ρ₀r²/);},
  39(){near(e.uniformSphereSelfEnergy(2e-9,.05).energy,3*k*4e-18/(5*.05));},
  40(){const r=e.coaxialCapacitor(.001,.004,.5,1,100);near(r.capacitance,pi*eps/Math.log(4));near(r.energy,5000*pi*eps/Math.log(4));near(e.coaxialCapacitor(.001,.004,.5,2.5).capacitance,2.5*pi*eps/Math.log(4));},
  41(){near(e.layeredPlateCapacitor(.01,[{thickness:.001,relativePermittivity:2},{thickness:.002,relativePermittivity:4}]).capacitance,10*eps);},
  42(){const r=e.poissonOneDimensional(.01,0,100,1e-6,.005);near(r.potential,50+1e-6*.01**2/(8*eps));near(r.field,-10000);near(e.poissonOneDimensional(.01,0,100,1e-6,0).potential,0);near(e.poissonOneDimensional(.01,0,100,1e-6,.01).potential,100);assert.match(r.potentialFormula,/V\(x\)/);assert.match(r.fieldFormula,/E\(x\)/);},
  43(){const r=ac(),X=24*pi-1/(.0024*pi);near(r.impedance,Math.hypot(50,X));near(r.current,120/Math.hypot(50,X));near(r.phaseRadians,Math.atan2(X,50));near(r.averagePower,120**2*50/(2500+X**2));near(r.resonanceFrequency,250/pi);},
  44(){const r=ac();near(r.quality,2);near(r.bandwidthHz,125/pi);near(r.resonanceCurrent,2.4);},
  45(){const r=e.sinusoidalFluxEmf(20,.06,.5,100,.01);near(r.emfAmplitude,60);near(r.emf,-60*Math.cos(1));},
  46(){const r=e.railBarCircuit(.3,.5,4,2);near(r.emf,.6);near(r.current,.3);near(r.forceMagnitude,.045);near(r.power,.18);near(r.mechanicalPower,.18);},
  47(){const r=e.toroidSelfInductance(800,.1,2e-4,3);near(r.inductance,.000256);near(r.energy,.001152);},
  48(){const r=lcOscillation(.1,10e-6,100e-6,.001);near(r.charge,100e-6*Math.cos(1));near(r.current,-.1*Math.sin(1));near(r.totalEnergy,.0005);near(r.capacitorEnergy+r.inductorEnergy,r.totalEnergy);},
  49(){const r=e.seriesRlcTransient(20,.5,50e-6,0,0,0);assert.equal(r.regime,'subamortiguado');near(r.decayRate,20);near(r.angularFrequency,Math.sqrt(39600));},
  50(){const r=e.circularDisplacementField(.05,.02,1e12);near(r.displacementCurrent,eps*pi*.05**2*1e12);near(r.magneticField,mu*eps*.02*1e12/2);},
};
for(const[id,check]of Object.entries(checks))test(`EM guía ${id}: ${id==='22'?'ambigüedad de polaridad demostrada':'referencia independiente'}`,check);
test('derivación electrostática declara alcance y rechaza expresiones fuera de la familia',()=>{
  assert.throws(()=>e.polynomialPotential('1/x',[0,0,0]),/Familia/);
  assert.throws(()=>e.polynomialPotential('x+t',[0,0,0]),/Familia/);
  assert.throws(()=>e.polynomialPotential('x^',[0,0,0]),/inválido/);
  assert.throws(()=>e.polynomialFieldDivergence(['x','y'],[1,1,1]),/Ex/);
  const r=e.polynomialPotential('x^2+y^2+z^2',[2,3,4]);vec(r.field,[-4,-6,-8]);near(r.laplacian,6);
});
test('dipolo singular y cilindro continuo respetan geometría y signos',()=>{
  assert.throws(()=>e.dipoleAxis(1e-9,.02,.01),/coincide/);
  near(e.dipoleAxis(1e-9,.02,0).potential,0);
  const a=e.radialChargedCylinder(1e-6,.1,.1),b=e.radialChargedCylinder(-1e-6,.1,.1);
  near(a.field,-b.field);near(a.field*2*pi*.1*eps,a.linearCharge);
  assert.throws(()=>e.radialChargedCylinder(1e-6,.1,-.01),/no negativa/);
});
test('carga/dieléctrico y órbita rechazan datos incompatibles',()=>{
  assert.throws(()=>e.rcState(1,1,1,0,1),/fracción/);
  assert.throws(()=>e.dielectricCapacitor(1,1,.5),/κ/);
  near(e.dielectricCapacitor(5e-6,100,3,true).charge,.0015);
  assert.throws(()=>e.chargedParticleOrbit(0,1,1,1),/no nulos/);
  assert.throws(()=>e.seriesRlcAc(0,.2,20e-6,250/pi,120),/Resonancia ideal/);
});
