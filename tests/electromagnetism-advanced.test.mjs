import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pointChargeSystem, equivalentComponents, capacitorState, resistiveWire, dielectricPlate,
  nodalCircuit, nodalVoltageSources, magneticGeometries, magneticForceWire, hallEffect, motionalEmf,
  rlTransient, seriesRlcAc, displacementCurrent, poissonOneDimensional,
  chargedRingAxis, infiniteChargedPlane, conductingSphere, uniformSolidSphere,
  longCurrentCable, coaxialCapacitor, layeredPlateCapacitor,
  circularLoopAxis, loopTorque, solenoidSelfInductance, toroidSelfInductance,
  sinusoidalFluxEmf, railBarCircuit, seriesRlcTransient, circularDisplacementField,
} from '../js/math/electromagnetism-advanced.mjs';
import { EM_EPS0, EM_MU0, EM_K } from '../js/math/electromagnetism.mjs';
const near=(actual,expected,tolerance=1e-9)=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1e-12,Math.abs(expected)),`${actual} ≠ ${expected}`);

test('Electromagnetismo 1–11 y 25: superposición, componentes y dieléctrico',()=>{
  const system=pointChargeSystem([{charge:1e-6,position:[-1,0,0]},{charge:1e-6,position:[1,0,0]}],[0,0,0]);
  near(system.magnitude,0);near(system.potential,2*EM_K*1e-6);
  assert.throws(()=>pointChargeSystem([{charge:1,position:[0,0,0]}],[0,0,0]),/singular/);
  near(equivalentComponents([2,3],'resistor','series').equivalent,5);
  near(equivalentComponents([2,3],'resistor','parallel').equivalent,1.2);
  near(equivalentComponents([2,3],'capacitor','series').equivalent,1.2);
  near(equivalentComponents([2,3],'capacitor','parallel').equivalent,5);
  near(equivalentComponents([4e-6,6e-6],'capacitor','series').equivalent,2.4e-6);
  near(equivalentComponents([4e-6,6e-6],'capacitor','parallel').equivalent,10e-6);
  near(equivalentComponents([10,20,30],'resistor','series').equivalent,60);
  near(equivalentComponents([10,20,30],'resistor','parallel').equivalent,60/11);
  near(capacitorState(2e-6,10).energy,1e-4);
  near(resistiveWire(1.7e-8,10,1e-6).resistance,0.17);
  const isolated=dielectricPlate(0.01,0.001,4,12,false),connected=dielectricPlate(0.01,0.001,4,12,true);
  near(isolated.voltage,3);near(isolated.charge,isolated.initialCharge);
  near(connected.voltage,12);near(connected.charge,4*connected.initialCharge);
});

test('Electromagnetismo 28, 30, 32 y 47: espira, torque e inductancia',()=>{
  const loop=circularLoopAxis(3,1,0.05,0.1);
  near(loop.centerField,EM_MU0*3/0.1);
  near(loop.axisField,EM_MU0*3*0.05**2/(2*(0.05**2+0.1**2)**1.5));
  near(circularLoopAxis(3,1,0.05,0).axisField,loop.centerField);
  near(loopTorque(50,2,0.1,0.2,0.5,30).torqueMagnitude,Math.sqrt(3)/2);
  near(loopTorque(1,2,0.1,0.2,0.5,90).torqueMagnitude,0);
  const solenoid=solenoidSelfInductance(500,0.25,4e-4);
  near(solenoid.inductance,EM_MU0*400);
  const toroid=toroidSelfInductance(800,0.1,2e-4,3);
  near(toroid.inductance,EM_MU0*800**2*2e-4/(2*Math.PI*0.1));
  near(toroid.energy,0.5*toroid.inductance*9);
  assert.throws(()=>circularLoopAxis(3,0,0.05,0),/Vueltas/);
  assert.throws(()=>loopTorque(1,2,0.1,0.2,0.5,120),/Ángulo/);
});

test('Electromagnetismo 45–46 y 50: Faraday, barra y Ampère-Maxwell',()=>{
  const induction=sinusoidalFluxEmf(20,0.2*0.3,0.5,100,0.01);
  near(induction.emfAmplitude,60);
  near(induction.emf,-60*Math.cos(1));
  assert.ok(Math.abs(sinusoidalFluxEmf(20,0.06,0.5,100,Math.PI/200).emf)<1e-12);
  const bar=railBarCircuit(0.3,0.5,4,2);
  near(bar.emf,0.6);near(bar.current,0.3);near(bar.forceMagnitude,0.045);
  near(bar.power,0.18);near(bar.mechanicalPower,bar.power);
  const plates=circularDisplacementField(0.05,0.02,1e12);
  near(plates.displacementCurrent,EM_EPS0*Math.PI*0.05**2*1e12);
  near(plates.magneticField,EM_MU0*EM_EPS0*0.02*1e12/2);
  near(circularDisplacementField(0.05,0,1e12).magneticField,0);
  near(circularDisplacementField(0.05,0.1,1e12).magneticField,EM_MU0*EM_EPS0*0.05**2*1e12/(2*0.1));
  assert.throws(()=>railBarCircuit(0.3,0.5,4,0),/positivo/);
});

test('Electromagnetismo 48–49: regímenes de RLC libre y conservación en LC',()=>{
  const under=seriesRlcTransient(20,0.5,50e-6,100e-6,0,0.01);
  assert.equal(under.regime,'subamortiguado');
  near(under.decayRate,20);near(under.angularFrequency,Math.sqrt(40000-400));
  near(under.charge,100e-6*Math.exp(-0.2)*(Math.cos(under.angularFrequency*0.01)+20*Math.sin(under.angularFrequency*0.01)/under.angularFrequency));
  const ideal=seriesRlcTransient(0,0.1,10e-6,100e-6,0,0.01);
  assert.equal(ideal.regime,'sin amortiguamiento');
  near(ideal.energy,100e-6**2/(2*10e-6));
  const critical=seriesRlcTransient(2,1,1,2,3,0);
  assert.equal(critical.regime,'críticamente amortiguado');near(critical.charge,2);near(critical.current,3);
  const over=seriesRlcTransient(4,1,1,2,3,0);
  assert.equal(over.regime,'sobreamortiguado');near(over.charge,2);near(over.current,3);
  assert.throws(()=>seriesRlcTransient(-1,1,1,0,0,0),/no negativa/);
  assert.throws(()=>seriesRlcTransient(1,1,1,0,0,-1),/no negativo/);
});

test('Electromagnetismo 22: circuito nodal con KCL y topología explícita',()=>{
  const result=nodalCircuit(3,[{a:1,b:2,resistance:1000},{a:2,b:0,resistance:1000}],
    [{node:0,voltage:0},{node:1,voltage:10}]);
  near(result.voltages[2],5);near(result.branchCurrents[0],0.005);near(result.branchCurrents[1],0.005);
  near(result.kclResiduals[0],0);
  assert.throws(()=>nodalCircuit(3,[{a:1,b:2,resistance:1000}], [{node:0,voltage:0}]),/flotante/);
});

test('Fuentes de voltaje flotantes: MNA cumple KCL y polaridades explícitas',()=>{
  const circuit=nodalVoltageSources(3,[{a:2,b:0,resistance:2}],
    [{a:1,b:0,voltage:12},{a:1,b:2,voltage:6}]);
  near(circuit.voltages[1],12);near(circuit.voltages[2],6);
  near(circuit.branchCurrents[0],3);
  near(circuit.sourceCurrents[0],-3);near(circuit.sourceCurrents[1],3);
  circuit.kclResiduals.concat(circuit.voltageResiduals).forEach(value=>near(value,0));
  const onlySource=nodalVoltageSources(2,[],[{a:1,b:0,voltage:5}]);
  near(onlySource.voltages[1],5);near(onlySource.sourceCurrents[0],0);
  assert.throws(()=>nodalVoltageSources(3,[],[{a:1,b:2,voltage:6}]),/flotante/);
  assert.throws(()=>nodalVoltageSources(2,[],[{a:1,b:0,voltage:12},{a:1,b:0,voltage:6}]),/flotante/);
});

test('Electromagnetismo 26–34: geometrías B, fuerza, Hall y FEM motriz',()=>{
  near(magneticGeometries('loop',2,10,0.2).field,EM_MU0*50);
  near(magneticGeometries('solenoid',2,1000,0.5).field,EM_MU0*4000);
  near(magneticGeometries('toroid',2,100,0.2,0.1).field,EM_MU0*200/(2*Math.PI*0.1));
  near(magneticForceWire(2,0.5,0.1).magnitude,0.1);
  near(hallEffect(1,0.5,1e20,-1.6e-19,0.001).hallVoltage,-31.25);
  near(motionalEmf(0.5,0.2,10).emf,1);
});

test('Electromagnetismo 38–44 y 50: RL, RLC AC, desplazamiento y Poisson 1D',()=>{
  const rl=rlTransient(10,2,20,0.2);near(rl.tau,0.2);near(rl.growingCurrent,2*(1-Math.exp(-1)));
  const ac=seriesRlcAc(10,0.1,100e-6,50,120);
  near(ac.impedance,Math.hypot(10,2*Math.PI*50*0.1-1/(2*Math.PI*50*100e-6)));
  near(ac.averagePower,ac.current**2*10);
  near(displacementCurrent(2,100).current,200*EM_EPS0);
  const p=poissonOneDimensional(1,0,10,2*EM_EPS0,0.5);
  near(p.potential,5.25);near(p.field,-10);
  near(poissonOneDimensional(1,0,10,2*EM_EPS0,1).potential,10);
});

test('Electromagnetismo 18–20 y 37: campo y potencial en geometrías cargadas',()=>{
  const ring=chargedRingAxis(10e-9,0.1,0.2);
  near(ring.field,EM_K*10e-9*0.2/(0.05**1.5));
  near(chargedRingAxis(10e-9,0.1,0).field,0);
  near(infiniteChargedPlane(3e-6).field,3e-6/(2*EM_EPS0));
  near(infiniteChargedPlane(3e-6,true).field,3e-6/EM_EPS0);
  near(conductingSphere(5e-9,0.2,0.1).field,0);
  near(conductingSphere(5e-9,0.2,0.1).potential,EM_K*5e-9/0.2);
  near(conductingSphere(5e-9,0.2,0.3).field,EM_K*5e-9/0.3**2);
  const sphere=uniformSolidSphere(2e-6,0.1,0.05);
  near(sphere.field,2e-6*0.05/(3*EM_EPS0));
  near(uniformSolidSphere(2e-6,0.1,0).potential,3*EM_K*sphere.charge/(2*0.1));
  near(uniformSolidSphere(2e-6,0.1,0.2).field,EM_K*sphere.charge/0.2**2);
  assert.throws(()=>uniformSolidSphere(2e-6,0.1,-0.01),/no negativa/);
});

test('Electromagnetismo 27 y 40–41: cable y capacitores coaxiales o por capas',()=>{
  near(longCurrentCable(8,0.002,0.001).field,EM_MU0*8*0.001/(2*Math.PI*0.002**2));
  near(longCurrentCable(8,0.002,0.004).field,EM_MU0*8/(2*Math.PI*0.004));
  const coax=coaxialCapacitor(0.001,0.004,0.5,1,100);
  near(coax.capacitance,2*Math.PI*EM_EPS0*0.5/Math.log(4));
  near(coax.energy,0.5*coax.capacitance*10000);
  near(coaxialCapacitor(0.001,0.004,0.5,2.5).capacitance,2.5*coax.capacitance);
  const layered=layeredPlateCapacitor(0.01,[{thickness:0.001,relativePermittivity:2},{thickness:0.002,relativePermittivity:4}],100);
  near(layered.capacitance,EM_EPS0*0.01/(0.001/2+0.002/4));
  near(layered.layerFields[0]*0.001+layered.layerFields[1]*0.002,100);
  assert.throws(()=>coaxialCapacitor(0.004,0.001,0.5),/radio exterior/);
  assert.throws(()=>layeredPlateCapacitor(0.01,[]),/capas/);
});
