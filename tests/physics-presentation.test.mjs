import test from 'node:test';
import assert from 'node:assert/strict';
import {convertOutput,outputDimension,OUTPUT_UNITS} from '../js/math/physics-output.mjs';
import {mechanicsDiagram,circuitDiagram,forceDiagram,impedanceDiagram} from '../js/graphics/physics-diagrams.mjs';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)));
test('Unidades de salida: magnitudes vectoriales con signo, ángulos y prefijos',()=>{
 assert.deepEqual(convertOutput([1,-2,0],'A','mA'),[1000,-2000,0]);near(convertOutput(1,'T','µT'),1e6);near(convertOutput(Math.PI,'rad','°'),180);near(convertOutput(36,'km/h','m/s'),10);
 near(convertOutput(1,'g·cm²','kg·m²'),1e-7);near(convertOutput(-2,'N·s','kg·m/s'),-2);
 assert.throws(()=>convertOutput(1,'V','A'),/incompatibles/);assert.throws(()=>convertOutput(Infinity,'V','mV'),/finito/);
 for(const[dimension,units]of Object.entries(OUTPUT_UNITS)){for(const unit of Object.keys(units)){assert.ok(outputDimension(unit));const base=Object.keys(units)[0];near(convertOutput(convertOutput(1,base,unit),unit,base),1);}}
});
test('Fuerzas y circuitos: signos, valores, límites y descripción accesible',()=>{
 const cables=mechanicsDiagram('cables',{weight:100,left:30,right:60},{leftTension:50,rightTension:50*Math.sqrt(3)});assert.match(cables,/role="img"/);assert.match(cables,/T₁ = 50 N/);assert.match(cables,/Peso = 100 N/);assert.match(cables,/ΣFx=0/);assert.doesNotMatch(cables,/NaN|Infinity/);
 const circuit=circuitDiagram(3,[[1,2,4],[2,0,6]],[[1,0,-12]],[0,-12,-7.2]);assert.match(circuit,/V1−V0=-12 V/);assert.match(circuit,/R1–2=4 Ω/);assert.match(circuit,/\(\+\)/);assert.match(circuit,/referencia/);
 assert.match(circuitDiagram(13,[]),/hasta 12 nodos/);assert.throws(()=>forceDiagram('x',[{origin:[0,0],vector:[NaN,1]}]),/finitos/);
});

test('el triángulo de impedancia muestra R, X, |Z| y φ con el signo de la reactancia',()=>{
 const capacitive=impedanceDiagram(50,-57.23089556),inductive=impedanceDiagram(50,62.135);
 for(const svg of [capacitive,inductive]){assert.match(svg,/role="img"/);assert.match(svg,/R = 50 Ω/);assert.match(svg,/\|Z\| = /);assert.match(svg,/φ = /);}
 assert.match(capacitive,/X = -57\.231 Ω/);assert.match(capacitive,/φ = -48\.858°/);assert.match(capacitive,/\|Z\| = 75\.996 Ω/);
 assert.match(inductive,/φ = 51\.17\d°/);
 const resistive=impedanceDiagram(50,0);assert.doesNotMatch(resistive,/paint-order="stroke">X = /);assert.match(resistive,/<desc>[^<]*X = 0 Ω/);
 assert.throws(()=>impedanceDiagram(-1,2),/R ≥ 0/);assert.throws(()=>impedanceDiagram(0,0),/nula/);assert.throws(()=>impedanceDiagram(NaN,1),/finita/);
});
