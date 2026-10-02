import { EM_EPS0, EM_K, EM_MU0, coulomb, inducedEmf, lorentz, magneticFieldWire, ohmsLaw, parallelPlateCapacitance } from '../math/electromagnetism.mjs';
import { calcParse, collectVariables } from '../math/expression.mjs';
import { capacitorState, chargedParticleOrbit, chargedRingAxis, circularDisplacementField, circularLoopAxis, coaxialCapacitor, conductingSphere, dielectricCapacitor, dielectricPlate, dipoleAxis, displacementCurrent, enclosedChargeFlux, equivalentComponents, hallEffect, infiniteChargedPlane, layeredPlateCapacitor, longCurrentCable, loopTorque, magneticForceWire, magneticGeometries, motionalEmf, nodalCircuit, nodalVoltageSources, pointChargeSystem, poissonOneDimensional, polynomialFieldDivergence, polynomialPotential, radialChargedCylinder, railBarCircuit, rcState, resistiveWire, rlTransient, seriesRlcAc, seriesRlcTransient, sinusoidalFluxEmf, solenoidFieldDensity, solenoidSelfInductance, toroidSelfInductance, uniformElectricFlux, uniformSolidSphere, uniformSphereSelfEnergy } from '../math/electromagnetism-advanced.mjs';
import { circuitDiagram, impedanceDiagram, potentialMapSvg } from '../graphics/physics-diagrams.mjs';
import { dimension, list, number, read, rowDimensions, rows, unitFactors, unitSelector } from './electromagnetism/units.mjs';
import { labelledOutputEntries, physicsOutputControls } from './physics-output.mjs';
import { lcOscillation } from '../math/waves.mjs';
import { poissonRectangle } from '../math/poisson-rectangle.mjs';
import { studyPlotSvg } from '../graphics/study-plot.mjs';
import * as electrostatics from './electromagnetism/electrostatics.mjs';
import * as circuits from './electromagnetism/circuits.mjs';
import * as magnetism from './electromagnetism/magnetism.mjs';
export { physicsOutputUnitChanged } from './physics-output.mjs';

const families=[electrostatics, circuits, magnetism];
const fields=Object.assign({},...families.map(family=>family.fields));
const modes=Object.assign({},...families.map(family=>family.modes));
const solvers=Object.assign({},...families.map(family=>family.solvers));
const groupNames={electrostatics:'Electrostática y dieléctricos',circuits:'Circuitos y AC',magnetism:'Magnetismo e inducción'};
function solve(mode) {
  if(!Object.hasOwn(solvers, mode)) throw new RangeError('Problema no disponible');
  return solvers[mode](mode);
}
const labels={status:'Estado',center:'Potencial del nodo central (V)',centerPoint:'Coordenadas del nodo central (m)',width:'Ancho Lx (m)',height:'Alto Ly (m)',dx:'Δx (m)',dy:'Δy (m)',nx:'Subintervalos x',ny:'Subintervalos y',iterations:'Barridos',change:'Cambio máximo (V)',residual:'Residuo máximo (V/m²)',tolerance:'Tolerancia normalizada (V)',omega:'Factor de relajación',field:'Campo E (N/C) o B (T)',magnitude:'Magnitud',potential:'Potencial (V)',equivalent:'Equivalente',equivalentSI:'Equivalente en SI (Ω o F)',unit:'Unidad del equivalente',charge:'Carga (C)',energy:'Energía (J)',voltage:'Voltaje (V)',resistance:'Resistencia (Ω)',current:'Corriente (A)',power:'Potencia (W)',initialCapacitance:'Capacitancia inicial (F)',capacitance:'Capacitancia (F)',initialCharge:'Carga inicial (C)',connection:'Condición',voltages:'Potenciales de nodos (V)',branchCurrents:'Corrientes de ramas (A)',kclResiduals:'Residuos KCL (A)',signedForce:'Fuerza con signo (N)',hallVoltage:'Voltaje Hall (V)',emf:'FEM (V)',tau:'Constante de tiempo (s)',growingCurrent:'Corriente de subida (A)',decayingCurrent:'Corriente de bajada (A)',growingInductorVoltage:'Voltaje de bobina (V)',reactanceInductive:'XL (Ω)',reactanceCapacitive:'XC (Ω)',reactance:'Reactancia neta (Ω)',impedance:'Impedancia (Ω)',phaseRadians:'Fase (rad)',powerFactor:'Factor de potencia',averagePower:'Potencia media (W)',resonanceFrequency:'Frecuencia de resonancia (Hz)',quality:'Factor Q',bandwidthHz:'Ancho de banda (Hz)',layerFields:'Campos por capa (N/C)',formula:'Fórmula',assumption:'Hipótesis',convention:'Convención'};
Object.assign(labels,{centerField:'B en el centro (T)',axisField:'B en z (T)',area:'Área (m²)',magneticMoment:'Momento magnético (A·m²)',torqueMagnitude:'Torque (N·m)',inductance:'Autoinductancia (H)',fluxLinkage:'Flujo enlazado NΦ (Wb)',emfAmplitude:'FEM máxima (V)',forceMagnitude:'Fuerza magnética (N)',mechanicalPower:'Potencia mecánica (W)',regime:'Régimen',decayRate:'Constante de decaimiento α (s⁻¹)',naturalFrequency:'Frecuencia natural ω₀ (rad/s)',angularFrequency:'Frecuencia amortiguada ω′ (rad/s)',omega:'Frecuencia angular ω (rad/s)',frequency:'Frecuencia (Hz)',period:'Período (s)',capacitorEnergy:'Energía del capacitor (J)',inductorEnergy:'Energía de bobina (J)',totalEnergy:'Energía total (J)',displacementCurrent:'Corriente de desplazamiento (A)',magneticField:'Campo B a radio r (T)'});
Object.assign(labels,{sourceCurrents:'Corrientes de fuentes (A)',voltageResiduals:'Residuos de fuentes (V)'});
Object.assign(labels,{flux:'Flujo eléctrico (N·m²/C)',interaction:'Interacción',forceVector:'Vector fuerza (N)',deltaFlux:'Cambio de flujo por espira (Wb)',
  chargeVoltage:'Voltaje de carga (V)',dischargeVoltage:'Voltaje de descarga (V)',chargeCurrent:'Corriente de carga (A)',dischargeCurrent:'Corriente de descarga (A)',
  chargingCharge:'Carga durante carga (C)',dischargingCharge:'Carga durante descarga (C)',timeToFraction:'Tiempo a fracción residual (s)',dipoleMoment:'Momento dipolar (C·m)',approximatePotential:'Potencial lejano aproximado (V)',
  energyDensity:'Densidad de energía magnética (J/m³)',orbitRadius:'Radio de órbita (m)',fieldExpressions:'Componentes simbólicas de E (N/C)',secondExpressions:'Segundas parciales de V (V/m²)',
  laplacian:'Laplaciano de V (V/m²)',chargeDensity:'Densidad de carga ρ (C/m³)',divergence:'ρ/ε₀ = divergencia (V/m²)',divergenceExpressions:'Términos de divergencia (V/m²)',
  linearCharge:'Carga por longitud (C/m)',finalEnergy:'Energía final de bobina (J)',resonanceCurrent:'Corriente RMS en resonancia (A)',potentialFormula:'Solución V(x) (V)',fieldFormula:'Solución E(x) (N/C)',chargeFormula:'Solución q(t) (C)',currentFormula:'Solución I(t) (A)'});
function resultLabel(mode,key) {
  if(key==='field')return ['wirefield','magnetic','cable','solenoidfield'].includes(mode)?'Campo B (T)':mode==='potentialfield'||mode==='divergence'?'Vector E (N/C)':'Campo E (N/C)';
  if(key==='magnitude')return mode==='magneticforce'?'Magnitud de fuerza (N)':mode==='hall'?'Magnitud de voltaje Hall (V)':'Magnitud de campo E (N/C)';
  if(key==='forceMagnitude'&&['coulomb','lorentz'].includes(mode))return 'Magnitud de fuerza (N)';
  if(key==='angularFrequency'&&mode==='particle')return 'Frecuencia angular ciclotrón (rad/s)';
  if(mode==='poisson2d'&&key==='omega')return 'Factor de relajación SOR';
  if(mode==='poisson2d'&&key==='status')return 'Estado del sistema discreto';
  return labels[key]||key;
}
function validateResult(data,mode) {
  function inspect(item,key) {
    if(Array.isArray(item))item.forEach(value=>inspect(value,key));
    else if(typeof item==='number'&&!Number.isFinite(item)&&!(mode==='rlc'&&key==='quality'&&item===Infinity))
      throw new RangeError('Resultado fuera del rango numérico; revisa los datos y sus unidades.');
  }
  for(const [key,item]of Object.entries(data))inspect(item,key);
}
const fmt=item=>item===null?'—':typeof item==='boolean'?(item?'sí':'no'):typeof item==='number'?(Number.isFinite(item)?String(Number(item.toPrecision(10))):'∞'):Array.isArray(item)?`(${item.map(fmt).join(', ')})`:String(item);
export function emPlusOpenPanel(group) {
  if(!groupNames[group]) return;
  document.getElementById('emplus-title').textContent=groupNames[group];
  document.getElementById('emplus-heading').textContent=groupNames[group];
  document.getElementById('emplus-mode').innerHTML=Object.entries(modes).filter(([,config])=>config[0]===group)
    .map(([key,config])=>`<option value="${key}">${config[1]}</option>`).join('');
  emPlusSelect();
}
export function emPlusSelect() {
  const mode=document.getElementById('emplus-mode').value;
  if(!fields[mode]) return;
  document.getElementById('emplus-fields').innerHTML=fields[mode].map(([key,label,defaultValue,type,options])=>{
    const kind=type==='textarea'||type==='select'?null:dimension(mode,key);
    const dimensions=[...new Set(rowDimensions[mode]?.[key]?.filter(Boolean)||[kind].filter(Boolean))];
    const displayLabel=kind?label.replace(/\s*\(([^)]+)\)/g,(all,inside)=>{const [unit,...hints]=inside.split(',');return Object.hasOwn(unitFactors[kind],unit.trim())?(hints.length?` (${hints.join(',').trim()})`:''):all;}):label;
    return `<label class="linear-field" for="emplus-${key}"><span>${displayLabel}</span>${type==='textarea'?`<textarea id="emplus-${key}" class="tool-textarea" rows="4">${defaultValue}</textarea>`:
      type==='select'?`<select id="emplus-${key}" class="tool-input"${mode==='equivalent'&&key==='kind'?' data-action="emPlusEquivalentKindChanged" data-event="change"':''}>${options.split(',').map(option=>`<option value="${option}">${option}</option>`).join('')}</select>`:
        `<input id="emplus-${key}" class="tool-input" type="${type==='text'||key==='values'||key==='point'?'text':'number'}" step="any" value="${defaultValue}">`}${dimensions.map(dimension=>unitSelector(key,dimension)).join('')}</label>`;
  }).join('')+`<p class="calc-res-hint">${mode==='equivalent'?'La unidad de entrada interpreta toda la lista; el resultado muestra la unidad elegida y su valor en SI.':'Las entradas con selector se convierten a SI; los resultados usan SI.'} Constantes usadas: k=${EM_K} N·m²/C²; ε₀=${EM_EPS0} F/m; μ₀=${EM_MU0} H/m.</p>`;
  document.getElementById('emplus-result').textContent='';
}
export function emPlusEquivalentKindChanged() {
  const unit=document.getElementById('emplus-kind').value==='capacitor'?'F':'Ω';
  document.getElementById('emplus-inputUnit').value=unit;
  document.getElementById('emplus-outputUnit').value=unit;
  document.getElementById('emplus-result').textContent='';
}
export function emPlusUnitChanged(arg) {
  const [key,kind]=arg.split(':'),select=document.getElementById(`emplus-${key}-${kind}-unit`);
  if(!select||!unitFactors[kind]||!Object.hasOwn(unitFactors[kind],select.value)) return;
  const previous=select.dataset.previous||Object.keys(unitFactors[kind])[0];
  const input=document.getElementById(`emplus-${key}`),raw=input.value.trim();
  const ratio=(unitFactors[kind][previous]??Object.values(unitFactors[kind])[0])/unitFactors[kind][select.value];
  if(raw&&Number.isFinite(ratio)) {
    const columns=rowDimensions[document.getElementById('emplus-mode').value]?.[key];
    if(columns) input.value=raw.split(/[\n;]+/).map(line=>line.split(/[,\s]+/).filter(Boolean).map((value,i)=>{
      const converted=Number(value)*ratio;
      return columns[i]===kind&&Number.isFinite(converted)?String(Number(converted.toPrecision(12))):value;
    }).join(', ')).join('\n');
    else if(Number.isFinite(Number(raw))) {
      const converted=Number(raw)*ratio;
      if(Number.isFinite(converted)) input.value=String(Number(converted.toPrecision(12)));
    }
  }
  select.dataset.previous=select.value;
}
export function emPlusCalculate() {
  const mode=document.getElementById('emplus-mode').value,target=document.getElementById('emplus-result');
  try {
    const data=solve(mode);
    validateResult(data,mode);
    const display=mode==='poisson2d'?Object.fromEntries(Object.entries(data).filter(([key])=>!['grid','history'].includes(key)).map(([key,value])=>[key,key==='status'?(value==='converged'?'Convergió':'Límite de barridos: no convergió'):value])):data;
    target.classList.remove('tool-error');
    target.innerHTML=`<div class="tool-result-title">${modes[mode][1]}</div><p>${modes[mode][2]}</p><dl class="mechplus-results">${Object.entries(display).map(([key,item])=>`<dt>${resultLabel(mode,key)}</dt><dd>${fmt(item)}</dd>`).join('')}</dl>${physicsOutputControls('emplus',labelledOutputEntries(data,key=>resultLabel(mode,key)))}${emVisual(mode,data)}`;
  } catch(error) {target.classList.add('tool-error');target.textContent=error.message;}
}

function emVisual(mode,data){
 if(mode==='poisson2d')return potentialMapSvg(data)+`<details><summary>Valores de potencial (V) en la malla</summary><div class="num-table-wrap"><table class="num-table"><thead><tr><th>y / x (m)</th>${data.grid[0].map((_,i)=>`<th>${fmt(i*data.dx)}</th>`).join('')}</tr></thead><tbody>${data.grid.map((row,j)=>`<tr><th>${fmt(j*data.dy)}</th>${row.map(v=>`<td>${fmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details><details><summary>Historial de convergencia</summary><p>Iteración; cambio (V); residuo (V/m²)</p>${data.history.map(row=>`<p>${row.iteration}; ${fmt(row.change)}; ${fmt(row.residual)}</p>`).join('')}</details>`;

 if(mode==='nodalfloating')return circuitDiagram(number('nodes'),rows('resistors',3,true),rows('sources',3,true),data.voltages);
 if(mode==='nodal')return circuitDiagram(number('nodes'),rows('resistors',3),rows('fixed',2).filter(([node])=>node!==0).map(([node,voltage])=>[node,0,voltage]),data.voltages);
 if(['rc','rl','lc','rlctransient'].includes(mode)){
  const end=Math.max(number('time'),mode==='rc'||mode==='rl'?5*data.tau:2*data.period||1e-2),points=Array.from({length:81},(_,i)=>{
   const t=end*i/80;if(mode==='rc'){const r=rcState(number('resistance'),number('capacitance'),number('voltage'),t,number('fraction'));return [t,r.chargeVoltage];}
   if(mode==='rl'){const r=rlTransient(number('resistance'),number('inductance'),number('voltage'),t);return [t,r.growingCurrent];}
   if(mode==='lc'){const r=lcOscillation(number('inductance'),number('capacitance'),number('charge'),t);return [t,r.charge];}
   const r=seriesRlcTransient(number('resistance'),number('inductance'),number('capacitance'),number('charge'),number('current'),t);return [t,r.charge];
  });return studyPlotSvg([{label:mode==='rc'?'Voltaje de carga':mode==='rl'?'Corriente de subida':'Carga del capacitor',points}],{title:'Evolución del circuito ideal',xLabel:'t (s)',yLabel:mode==='rc'?'V (V)':mode==='rl'?'I (A)':'q (C)'});
 }
 if(mode==='rlc')return impedanceDiagram(number('resistance'),data.reactance);
 if(mode==='poisson'){
  const length=number('length'),points=Array.from({length:81},(_,i)=>{const x=length*i/80;return [x,poissonOneDimensional(length,number('left'),number('right'),number('rho'),x).potential];});
  return studyPlotSvg([{label:'V(x)',points}],{title:'Potencial con fronteras 1D',xLabel:'x (m)',yLabel:'V (V)'});
 }
 return '';
}
