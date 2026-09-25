import {
  potentialEnergy, parallelPlateCapacitance, magneticFieldWire,
  inductance, ohmsLaw, rcCircuit, inducedEmf,
} from '../math/electromagnetism.mjs';
import { emFmt } from '../utils/format.mjs';

const fields={
  energy:[['q1','q₁ (C)','1e-6'],['q2','q₂ (C)','-2e-6'],['r','r (m)','0.1']],
  capacitor:[['area','Área A (m²)','0.01'],['distance','Separación d (m)','0.001'],['er','εᵣ','1']],
  wire:[['current','Corriente I (A)','10'],['radius','Distancia r (m)','0.1']],
  inductor:[['turns','Vueltas N','100'],['flux','Flujo por vuelta Φ (Wb)','0.01'],['current','Corriente I (A)','2']],
  ohm:[['voltage','Voltaje V (V)','12'],['current','Corriente I (A)','2'],['resistance','Resistencia R (Ω)','']],
  rc:[['resistance','Resistencia R (Ω)','1000'],['capacitance','Capacitancia C (F)','0.000001'],['voltage','Voltaje inicial V₀ (V)','10'],['time','Tiempo t (s)','0.001']],
  flux:[['turns','Vueltas N','100'],['first','Flujo inicial Φ₁ (Wb)','0.01'],['last','Flujo final Φ₂ (Wb)','0.03'],['time','Δt (s)','2']],
};

const cards=[
  ['energy','Energía potencial entre cargas','emCalcPotentialEnergy'],
  ['capacitor','Capacitancia de placas paralelas','emCalcCapacitance'],
  ['wire','Campo magnético de un hilo largo','emCalcWireField'],
  ['inductor','Inductancia y energía almacenada','emCalcInductance'],
  ['ohm','Ley de Ohm y potencia · deja un campo vacío','emCalcOhm'],
  ['rc','Circuito RC · carga y descarga','emCalcRC'],
  ['flux','Faraday con cambio de flujo','emCalcFluxChange'],
];

export function emRenderExtra(){
  const panel=document.getElementById('em-pExtra');
  if(!panel) return;
  panel.innerHTML=cards.map(([id,title,action])=>`
    <section class="em-extra-card">
      <div class="em-section-title">${title}</div>
      <div class="em-input-row">${fields[id].map(([key,label,value])=>`
        <div class="em-input-group"><label for="em-extra-${id}-${key}">${label}</label>
        <input id="em-extra-${id}-${key}" type="number" step="any" value="${value}"></div>`).join('')}</div>
      <button class="em-action-btn" data-action="${action}">Calcular</button>
      <div id="em-extra-result-${id}" aria-live="polite"></div>
    </section>`).join('');
}

function value(card,key){
  const raw=document.getElementById(`em-extra-${card}-${key}`)?.value.trim();
  return raw===''?NaN:Number(raw);
}
function show(card,values,unit=''){
  const target=document.getElementById(`em-extra-result-${card}`);
  if(!target) return;
  if(values===null || values.some(([,number])=>!Number.isFinite(number))){
    target.textContent='Revisa los datos: no se admiten valores vacíos ni denominadores nulos.';
    return;
  }
  target.innerHTML=`<div class="em-math-grid" style="margin-top:10px">${values.map(([label,number,suffix=unit])=>`
    <div class="em-math-card"><div class="em-math-label">${label}</div>
    <div class="em-math-value">${emFmt(number)} ${suffix}</div></div>`).join('')}</div>`;
}
function valid(...numbers){return numbers.every(Number.isFinite);}

export function emCalcPotentialEnergy(){
  const q1=value('energy','q1'),q2=value('energy','q2'),r=value('energy','r');
  const result=valid(q1,q2,r)?potentialEnergy(q1,q2,r):null;
  show('energy',result===null?null:[['U = kq₁q₂/r',result,'J']]);
}
export function emCalcCapacitance(){
  const area=value('capacitor','area'),distance=value('capacitor','distance'),er=value('capacitor','er');
  const result=parallelPlateCapacitance(area,distance,er);
  show('capacitor',result===null?null:[['C = εᵣε₀A/d',result,'F']]);
}
export function emCalcWireField(){
  const current=value('wire','current'),radius=value('wire','radius');
  const result=valid(current,radius)?magneticFieldWire(current,radius):null;
  show('wire',result===null?null:[['B = μ₀I/(2πr)',result,'T']]);
}
export function emCalcInductance(){
  const turns=value('inductor','turns'),flux=value('inductor','flux'),current=value('inductor','current');
  const result=valid(turns,flux,current)?inductance(turns,flux,current):null;
  show('inductor',result?[['L = NΦ/I',result.L,'H'],['U = ½LI²',result.energy,'J']]:null);
}
export function emCalcOhm(){
  const voltage=value('ohm','voltage'),current=value('ohm','current'),resistance=value('ohm','resistance');
  const result=ohmsLaw({voltage,current,resistance});
  show('ohm',result?[
    ['Voltaje',result.voltage,'V'],['Corriente',result.current,'A'],
    ['Resistencia',result.resistance,'Ω'],['Potencia',result.power,'W'],
  ]:null);
}
export function emCalcRC(){
  const R=value('rc','resistance'),C=value('rc','capacitance');
  const V0=value('rc','voltage'),t=value('rc','time');
  const result=rcCircuit(R,C,V0,t);
  show('rc',result?[
    ['τ = RC',result.tau,'s'],['V carga',result.chargeVoltage,'V'],
    ['V descarga',result.dischargeVoltage,'V'],
    ['I carga',result.chargeCurrent,'A'],['I descarga',result.dischargeCurrent,'A'],
  ]:null);
}
export function emCalcFluxChange(){
  const turns=value('flux','turns'),first=value('flux','first');
  const last=value('flux','last'),time=value('flux','time');
  const result=valid(turns,first,last,time)?inducedEmf(turns,first,last,time):null;
  show('flux',result?[['ΔΦ',result.deltaFlux,'Wb'],['ε = −NΔΦ/Δt',result.emf,'V']]:null);
}
