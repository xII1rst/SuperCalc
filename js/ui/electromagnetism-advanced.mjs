import {
  pointChargeSystem, equivalentComponents, capacitorState, resistiveWire, dielectricPlate,
  nodalCircuit, magneticGeometries, magneticForceWire, hallEffect, motionalEmf,
  rlTransient, seriesRlcAc, displacementCurrent, poissonOneDimensional,
  chargedRingAxis, infiniteChargedPlane, conductingSphere, uniformSolidSphere,
  longCurrentCable, coaxialCapacitor, layeredPlateCapacitor,
} from '../math/electromagnetism-advanced.mjs';

const fields={
  charges:[['charges','Carga (C), x, y, z (m); una por línea','0.000001, -1, 0, 0\n0.000001, 1, 0, 0','textarea'],['point','Punto x, y, z (m)','0, 0, 1']],
  equivalent:[['values','Valores separados por coma (Ω o F)','2, 3, 6'],['kind','Tipo: resistor o capacitor','resistor','select','resistor,capacitor'],['connection','Conexión: series o parallel','series','select','series,parallel']],
  capacitor:[['capacitance','Capacitancia (F)','0.000002'],['voltage','Voltaje (V)','10']],
  wire:[['resistivity','Resistividad (Ω·m)','1.7e-8'],['length','Longitud (m)','10'],['area','Sección (m²)','1e-6'],['voltage','Voltaje (V, opcional)','12']],
  dielectric:[['area','Área de placas (m²)','0.01'],['distance','Separación (m)','0.001'],['er','Permitividad relativa εr','4'],['voltage','Voltaje antes de insertar (V)','12'],['connected','Estado: isolated o connected','isolated','select','isolated,connected']],
  ring:[['charge','Carga total Q (C)','1e-8'],['radius','Radio del anillo (m)','0.1'],['position','Posición axial z (m)','0.2']],
  plane:[['density','Densidad superficial σ (C/m²)','3e-6'],['paired','Configuración','un plano','select','un plano,dos planos']],
  conductingsphere:[['charge','Carga total Q (C)','5e-9'],['radius','Radio de la esfera (m)','0.2'],['position','Distancia al centro r (m)','0.1']],
  solidsphere:[['density','Densidad volumétrica ρ (C/m³)','2e-6'],['radius','Radio de la esfera (m)','0.1'],['position','Distancia al centro r (m)','0.05']],
  coaxial:[['inner','Radio interior a (m)','0.001'],['outer','Radio exterior b (m)','0.004'],['length','Longitud L (m)','0.5'],['er','Permitividad relativa κ','1'],['voltage','Voltaje (V)','100']],
  layered:[['area','Área de placas A (m²)','0.01'],['layers','Capas: espesor (m), κ; una por línea','0.001, 2\n0.002, 4','textarea'],['voltage','Voltaje (V)','100']],
  nodal:[['nodes','Número de nodos (0 = tierra)','3'],['resistors','Resistores: nodo a, nodo b, ohmios; una por línea','1, 2, 1000\n2, 0, 1000','textarea'],['fixed','Potenciales fijos: nodo, V; una por línea','0, 0\n1, 10','textarea'],['injections','Corrientes inyectadas: nodo, A; opcional','','textarea']],
  magnetic:[['shape','Geometría: loop, solenoid, toroid','loop','select','loop,solenoid,toroid'],['current','Corriente (A)','2'],['turns','Vueltas N','100'],['size','Radio R o longitud L (m)','0.2'],['position','Radio de observación en toroide (m)','0.1']],
  cable:[['current','Corriente I (A)','8'],['radius','Radio del cable R (m)','0.002'],['position','Distancia al eje r (m)','0.001']],
  magneticforce:[['current','Corriente (A)','2'],['length','Longitud (m)','0.5'],['field','Campo magnético (T)','0.1'],['angle','Ángulo I-B (°)','90']],
  hall:[['current','Corriente (A)','1'],['field','Campo (T)','0.5'],['density','Densidad de portadores (m⁻³)','1e20'],['charge','Carga por portador (C)','-1.6e-19'],['thickness','Espesor (m)','0.001']],
  motional:[['field','Campo B (T)','0.5'],['length','Longitud de barra (m)','0.2'],['speed','Rapidez (m/s)','10'],['angle','Ángulo (°)','90']],
  rl:[['resistance','Resistencia (Ω)','10'],['inductance','Inductancia (H)','2'],['voltage','Escalón de voltaje (V)','20'],['time','Tiempo (s)','0.2']],
  rlc:[['resistance','Resistencia serie (Ω)','10'],['inductance','Inductancia (H)','0.1'],['capacitance','Capacitancia (F)','0.0001'],['frequency','Frecuencia (Hz)','50'],['voltage','Voltaje RMS (V)','120']],
  displacement:[['area','Área (m²)','2'],['rate','dE/dt (V/m/s)','100'],['er','Permitividad relativa','1']],
  poisson:[['length','Dominio L (m)','1'],['left','Potencial V(0) (V)','0'],['right','Potencial V(L) (V)','10'],['rho','Carga uniforme ρ (C/m³)','1e-11'],['position','Posición x (m)','0.5']],
};
const modes={
  charges:['electrostatics','Superposición de cargas','E(P) = Σ kqᵢ(P−rᵢ)/|P−rᵢ|³; V(P) = Σ kqᵢ/|P−rᵢ|'],
  equivalent:['circuits','Componentes equivalentes','Serie: ΣR o (Σ1/C)⁻¹; paralelo: (Σ1/R)⁻¹ o ΣC'],
  capacitor:['electrostatics','Carga y energía de capacitor','Q = CV; U = ½CV²'],
  wire:['circuits','Resistividad de un conductor','R = ρL/A; I = V/R; P = V²/R'],
  dielectric:['electrostatics','Dieléctrico en placas','C = εr ε₀A/d; aislado conserva Q; conectado conserva V'],
  ring:['electrostatics','Anillo cargado: campo axial','Ez = kQz/(R²+z²)^(3/2); V = kQ/√(R²+z²)'],
  plane:['electrostatics','Plano infinito cargado','E = σ/(2ε₀); entre planos ±σ: E = σ/ε₀'],
  conductingsphere:['electrostatics','Esfera conductora','Interior E = 0, V = kQ/R; exterior E = kQ/r², V = kQ/r'],
  solidsphere:['electrostatics','Esfera aislante uniforme','Interior E = ρr/(3ε₀); exterior E = kQ/r²'],
  coaxial:['electrostatics','Capacitor cilíndrico','C = 2πε₀κL/ln(b/a); U = ½CV²'],
  layered:['electrostatics','Capacitor de capas','C = ε₀A/Σ(dᵢ/κᵢ); Eᵢ = Q/(ε₀κᵢA)'],
  nodal:['circuits','Circuito por nodos','KCL en cada nodo desconocido: Σ(Vn−Vm)/R = Iinyectada'],
  magnetic:['magnetism','Campo de espira, solenoide o toroide','Biot–Savart o Ampère bajo la geometría ideal indicada'],
  cable:['magnetism','Cable con corriente uniforme','r ≤ R: B = μ₀Ir/(2πR²); r ≥ R: B = μ₀I/(2πr)'],
  magneticforce:['magnetism','Fuerza sobre un conductor','F = ILB sen θ'],
  hall:['magnetism','Efecto Hall','VH = IB/(nqt)'],
  motional:['magnetism','FEM motriz','ε = Bℓv sen θ'],
  rl:['circuits','Circuito RL transitorio','τ = L/R; I(t) = (V/R)(1−e^(−t/τ))'],
  rlc:['circuits','Circuito RLC serie en AC','Z = √[R²+(ωL−1/ωC)²]; Irms = Vrms/Z; P = I²R'],
  displacement:['magnetism','Corriente de desplazamiento','Id = ε A dE/dt para campo uniforme'],
  poisson:['electrostatics','Poisson 1D con fronteras','V″ = −ρ/ε₀ y V(0), V(L) fijos; E = −V′'],
};
const groupNames={electrostatics:'Electrostática y dieléctricos',circuits:'Circuitos y AC',magnetism:'Magnetismo e inducción'};
const read=key=>document.getElementById(`emplus-${key}`).value.trim();
function number(key,optional=false) {
  const value=read(key);
  if(optional&&value==='') return null;
  if(value===''||!Number.isFinite(Number(value))) throw new RangeError(`${key}: introduce un número finito`);
  return Number(value);
}
function rows(key,width,optional=false) {
  const lines=read(key).split(/[\n;]+/).map(line=>line.trim()).filter(Boolean);
  if(!lines.length&&optional) return [];
  if(!lines.length||lines.length>100) throw new RangeError(`${key}: introduce entre 1 y 100 filas`);
  return lines.map(line=>{
    const values=line.split(/[,\s]+/).filter(Boolean).map(Number);
    if(values.length!==width||values.some(value=>!Number.isFinite(value))) throw new RangeError(`${key}: cada fila requiere ${width} números`);
    return values;
  });
}
function list(key) {
  const raw=read(key).split(/[,\s]+/).filter(Boolean).map(Number);
  if(!raw.length||raw.length>100||raw.some(value=>!Number.isFinite(value))) throw new RangeError(`${key}: lista numérica inválida`);
  return raw;
}
function solve(mode) {
  if(mode==='charges') {
    const points=list('point');if(points.length!==3) throw new RangeError('Punto: se requieren x, y, z');
    return pointChargeSystem(rows('charges',4).map(([charge,x,y,z])=>({charge,position:[x,y,z]})),points);
  }
  if(mode==='equivalent') return equivalentComponents(list('values'),read('kind'),read('connection'));
  if(mode==='capacitor') return capacitorState(number('capacitance'),number('voltage'));
  if(mode==='wire') return resistiveWire(number('resistivity'),number('length'),number('area'),number('voltage',true));
  if(mode==='dielectric') return dielectricPlate(number('area'),number('distance'),number('er'),number('voltage'),read('connected')==='connected');
  if(mode==='ring') return chargedRingAxis(number('charge'),number('radius'),number('position'));
  if(mode==='plane') return infiniteChargedPlane(number('density'),read('paired')==='dos planos');
  if(mode==='conductingsphere') return conductingSphere(number('charge'),number('radius'),number('position'));
  if(mode==='solidsphere') return uniformSolidSphere(number('density'),number('radius'),number('position'));
  if(mode==='coaxial') return coaxialCapacitor(number('inner'),number('outer'),number('length'),number('er'),number('voltage'));
  if(mode==='layered') return layeredPlateCapacitor(number('area'),rows('layers',2).map(([thickness,relativePermittivity])=>({thickness,relativePermittivity})),number('voltage'));
  if(mode==='nodal') return nodalCircuit(number('nodes'),rows('resistors',3).map(([a,b,resistance])=>({a,b,resistance})),
    rows('fixed',2).map(([node,voltage])=>({node,voltage})),rows('injections',2,true).map(([node,current])=>({node,current})));
  if(mode==='magnetic') return magneticGeometries(read('shape'),number('current'),number('turns'),number('size'),read('shape')==='toroid'?number('position'):null);
  if(mode==='cable') return longCurrentCable(number('current'),number('radius'),number('position'));
  if(mode==='magneticforce') return magneticForceWire(number('current'),number('length'),number('field'),number('angle'));
  if(mode==='hall') return hallEffect(number('current'),number('field'),number('density'),number('charge'),number('thickness'));
  if(mode==='motional') return motionalEmf(number('field'),number('length'),number('speed'),number('angle'));
  if(mode==='rl') return rlTransient(number('resistance'),number('inductance'),number('voltage'),number('time'));
  if(mode==='rlc') return seriesRlcAc(number('resistance'),number('inductance'),number('capacitance'),number('frequency'),number('voltage'));
  if(mode==='displacement') return displacementCurrent(number('area'),number('rate'),number('er'));
  if(mode==='poisson') return poissonOneDimensional(number('length'),number('left'),number('right'),number('rho'),number('position'));
  throw new RangeError('Problema no disponible');
}
const labels={field:'Campo E (N/C) o B (T)',magnitude:'Magnitud',potential:'Potencial (V)',equivalent:'Equivalente (Ω o F)',charge:'Carga (C)',energy:'Energía (J)',voltage:'Voltaje (V)',resistance:'Resistencia (Ω)',current:'Corriente (A)',power:'Potencia (W)',initialCapacitance:'Capacitancia inicial (F)',capacitance:'Capacitancia (F)',initialCharge:'Carga inicial (C)',connection:'Condición',voltages:'Potenciales de nodos (V)',branchCurrents:'Corrientes de ramas (A)',kclResiduals:'Residuos KCL (A)',signedForce:'Fuerza con signo (N)',hallVoltage:'Voltaje Hall (V)',emf:'FEM (V)',tau:'Constante de tiempo (s)',growingCurrent:'Corriente de subida (A)',decayingCurrent:'Corriente de bajada (A)',growingInductorVoltage:'Voltaje de bobina (V)',reactanceInductive:'XL (Ω)',reactanceCapacitive:'XC (Ω)',reactance:'Reactancia neta (Ω)',impedance:'Impedancia (Ω)',phaseRadians:'Fase (rad)',powerFactor:'Factor de potencia',averagePower:'Potencia media (W)',resonanceFrequency:'Frecuencia de resonancia (Hz)',quality:'Factor Q',bandwidthHz:'Ancho de banda (Hz)',layerFields:'Campos por capa (N/C)',formula:'Fórmula',assumption:'Hipótesis',convention:'Convención'};
const fmt=item=>item===null?'—':typeof item==='number'?(Number.isFinite(item)?String(Number(item.toPrecision(10))):'∞'):Array.isArray(item)?`(${item.map(fmt).join(', ')})`:String(item);
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
  document.getElementById('emplus-fields').innerHTML=fields[mode].map(([key,label,defaultValue,type,options])=>
    `<label class="linear-field" for="emplus-${key}"><span>${label}</span>${type==='textarea'?`<textarea id="emplus-${key}" class="tool-textarea" rows="4">${defaultValue}</textarea>`:
      type==='select'?`<select id="emplus-${key}" class="tool-input">${options.split(',').map(option=>`<option value="${option}">${option}</option>`).join('')}</select>`:
        `<input id="emplus-${key}" class="tool-input" type="${key==='values'||key==='point'?'text':'number'}" step="any" value="${defaultValue}">`}</label>`).join('');
  document.getElementById('emplus-result').textContent='';
}
export function emPlusCalculate() {
  const mode=document.getElementById('emplus-mode').value,target=document.getElementById('emplus-result');
  try {
    const data=solve(mode);
    target.classList.remove('tool-error');
    target.innerHTML=`<div class="tool-result-title">${modes[mode][1]}</div><p>${modes[mode][2]}</p><dl class="mechplus-results">${Object.entries(data).map(([key,item])=>`<dt>${labels[key]||key}</dt><dd>${fmt(item)}</dd>`).join('')}</dl>`;
  } catch(error) {target.classList.add('tool-error');target.textContent=error.message;}
}
