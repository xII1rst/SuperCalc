import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pointChargeSystem, equivalentComponents, capacitorState, resistiveWire, dielectricPlate,
  nodalCircuit, magneticGeometries, magneticForceWire, hallEffect, motionalEmf,
  rlTransient, seriesRlcAc, displacementCurrent, poissonOneDimensional,
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
  near(capacitorState(2e-6,10).energy,1e-4);
  near(resistiveWire(1.7e-8,10,1e-6).resistance,0.17);
  const isolated=dielectricPlate(0.01,0.001,4,12,false),connected=dielectricPlate(0.01,0.001,4,12,true);
  near(isolated.voltage,3);near(isolated.charge,isolated.initialCharge);
  near(connected.voltage,12);near(connected.charge,4*connected.initialCharge);
});

test('Electromagnetismo 22: circuito nodal con KCL y topología explícita',()=>{
  const result=nodalCircuit(3,[{a:1,b:2,resistance:1000},{a:2,b:0,resistance:1000}],
    [{node:0,voltage:0},{node:1,voltage:10}]);
  near(result.voltages[2],5);near(result.branchCurrents[0],0.005);near(result.branchCurrents[1],0.005);
  near(result.kclResiduals[0],0);
  assert.throws(()=>nodalCircuit(3,[{a:1,b:2,resistance:1000}], [{node:0,voltage:0}]),/flotante/);
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
