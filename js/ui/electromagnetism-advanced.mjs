import {
  pointChargeSystem, equivalentComponents, capacitorState, resistiveWire, dielectricPlate,
  nodalCircuit, nodalVoltageSources, magneticGeometries, magneticForceWire, hallEffect, motionalEmf,
  rlTransient, seriesRlcAc, displacementCurrent, poissonOneDimensional,
  chargedRingAxis, infiniteChargedPlane, conductingSphere, uniformSolidSphere,
  longCurrentCable, coaxialCapacitor, layeredPlateCapacitor,
  circularLoopAxis, loopTorque, solenoidSelfInductance, toroidSelfInductance,
  sinusoidalFluxEmf, railBarCircuit, seriesRlcTransient, circularDisplacementField,
} from '../math/electromagnetism-advanced.mjs';
import { lcOscillation } from '../math/waves.mjs';

const fields={
  charges:[['charges','Carga, x, y, z; una por línea','0.000001, -1, 0, 0\n0.000001, 1, 0, 0','textarea'],['point','Punto x, y, z','0, 0, 1']],
  equivalent:[['values','Valores separados por coma','2, 3, 6','text'],['kind','Tipo: resistor o capacitor','resistor','select','resistor,capacitor'],['inputUnit','Unidad de los valores','Ω','select','Ω,kΩ,MΩ,F,mF,µF,nF,pF'],['connection','Conexión: series o parallel','series','select','series,parallel'],['outputUnit','Unidad del resultado','Ω','select','Ω,kΩ,MΩ,F,mF,µF,nF,pF']],
  capacitor:[['capacitance','Capacitancia (F)','0.000002'],['voltage','Voltaje (V)','10']],
  wire:[['resistivity','Resistividad (Ω·m)','1.7e-8'],['length','Longitud (m)','10'],['area','Sección (m²)','1e-6'],['voltage','Voltaje (V, opcional)','12']],
  dielectric:[['area','Área de placas (m²)','0.01'],['distance','Separación (m)','0.001'],['er','Permitividad relativa εr','4'],['voltage','Voltaje antes de insertar (V)','12'],['connected','Estado: isolated o connected','isolated','select','isolated,connected']],
  ring:[['charge','Carga total Q (C)','1e-8'],['radius','Radio del anillo (m)','0.1'],['position','Posición axial z (m)','0.2']],
  plane:[['density','Densidad superficial σ (C/m²)','3e-6'],['paired','Configuración','un plano','select','un plano,dos planos']],
  conductingsphere:[['charge','Carga total Q (C)','5e-9'],['radius','Radio de la esfera (m)','0.2'],['position','Distancia al centro r (m)','0.1']],
  solidsphere:[['density','Densidad volumétrica ρ (C/m³)','2e-6'],['radius','Radio de la esfera (m)','0.1'],['position','Distancia al centro r (m)','0.05']],
  coaxial:[['inner','Radio interior a (m)','0.001'],['outer','Radio exterior b (m)','0.004'],['length','Longitud L (m)','0.5'],['er','Permitividad relativa κ','1'],['voltage','Voltaje (V)','100']],
  layered:[['area','Área de placas A (m²)','0.01'],['layers','Capas: espesor, κ; una por línea','0.001, 2\n0.002, 4','textarea'],['voltage','Voltaje (V)','100']],
  nodal:[['nodes','Número de nodos (0 = tierra)','3'],['resistors','Resistores: nodo a, nodo b, resistencia; una por línea','1, 2, 1000\n2, 0, 1000','textarea'],['fixed','Potenciales fijos: nodo, voltaje; una por línea','0, 0\n1, 10','textarea'],['injections','Corrientes inyectadas: nodo, corriente; opcional','','textarea']],
  nodalfloating:[['nodes','Número de nodos (0 = tierra)','3'],['resistors','Resistores: nodo a, nodo b, resistencia; opcional','2, 0, 2','textarea'],['sources','Fuentes: nodo a, nodo b, V(a)−V(b); una por línea','1, 0, 12\n1, 2, 6','textarea'],['injections','Corrientes inyectadas: nodo, corriente; opcional','','textarea']],
  magnetic:[['shape','Geometría: loop, solenoid, toroid','loop','select','loop,solenoid,toroid'],['current','Corriente (A)','2'],['turns','Vueltas N','100'],['size','Radio R o longitud L (m)','0.2'],['position','Radio de observación en toroide (m)','0.1']],
  loopaxis:[['current','Corriente I (A)','3'],['turns','Espiras N','1'],['radius','Radio R (m)','0.05'],['position','Posición axial z (m)','0.1']],
  looptorque:[['turns','Espiras N','50'],['current','Corriente I (A)','2'],['width','Ancho (m)','0.1'],['height','Alto (m)','0.2'],['field','Campo B (T)','0.5'],['angle','Ángulo entre el plano y B (°)','30']],
  solenoidinductance:[['turns','Espiras N','500'],['length','Longitud l (m)','0.25'],['area','Sección A (m²)','0.0004'],['current','Corriente para energía (A)','0'],['er','Permeabilidad relativa μr','1']],
  toroidinductance:[['turns','Espiras N','800'],['radius','Radio medio (m)','0.1'],['area','Sección A (m²)','0.0002'],['current','Corriente I (A)','3'],['er','Permeabilidad relativa μr','1']],
  cable:[['current','Corriente I (A)','8'],['radius','Radio del cable R (m)','0.002'],['position','Distancia al eje r (m)','0.001']],
  magneticforce:[['current','Corriente (A)','2'],['length','Longitud (m)','0.5'],['field','Campo magnético (T)','0.1'],['angle','Ángulo I-B (°)','90']],
  hall:[['current','Corriente (A)','1'],['field','Campo (T)','0.5'],['density','Densidad de portadores (m⁻³)','1e20'],['charge','Carga por portador (C)','-1.6e-19'],['thickness','Espesor (m)','0.001']],
  motional:[['field','Campo B (T)','0.5'],['length','Longitud de barra (m)','0.2'],['speed','Rapidez (m/s)','10'],['angle','Ángulo (°)','90']],
  rl:[['resistance','Resistencia (Ω)','10'],['inductance','Inductancia (H)','2'],['voltage','Escalón de voltaje (V)','20'],['time','Tiempo (s)','0.2']],
  lc:[['inductance','Inductancia L (H)','0.1'],['capacitance','Capacitancia C (F)','0.00001'],['charge','Carga inicial q₀ (C)','0.0001'],['time','Tiempo t (s)','0.01']],
  rlctransient:[['resistance','Resistencia R (Ω)','20'],['inductance','Inductancia L (H)','0.5'],['capacitance','Capacitancia C (F)','0.00005'],['charge','Carga inicial q₀ (C)','0.0001'],['current','Corriente inicial I₀ (A)','0'],['time','Tiempo t (s)','0.01']],
  rlc:[['resistance','Resistencia serie (Ω)','10'],['inductance','Inductancia (H)','0.1'],['capacitance','Capacitancia (F)','0.0001'],['frequency','Frecuencia (Hz)','50'],['voltage','Voltaje RMS (V)','120']],
  fluxemf:[['turns','Espiras N','20'],['width','Ancho (m)','0.2'],['height','Alto (m)','0.3'],['field','Amplitud B₀ (T)','0.5'],['omega','Frecuencia angular ω (rad/s)','100'],['time','Tiempo t (s)','0.01']],
  railbar:[['field','Campo B (T)','0.3'],['length','Longitud de barra (m)','0.5'],['speed','Velocidad (m/s)','4'],['resistance','Resistencia total (Ω)','2']],
  displacement:[['area','Área (m²)','2'],['rate','dE/dt (V/m/s)','100'],['er','Permitividad relativa','1']],
  displacementplates:[['radius','Radio de placas R (m)','0.05'],['position','Radio de observación r (m)','0.02'],['rate','dE/dt (V/m/s)','1e12']],
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
  nodalfloating:['circuits','Circuito con fuentes de voltaje flotantes','Indica cada conexión y polaridad: V(a)−V(b)=ε; KCL también determina la corriente de fuente.'],
  magnetic:['magnetism','Campo de espira, solenoide o toroide','Biot–Savart o Ampère bajo la geometría ideal indicada'],
  loopaxis:['magnetism','Espira: campo en centro y eje','B(z) = μ₀NI R²/[2(R²+z²)^(3/2)]'],
  looptorque:['magnetism','Torque de una bobina','|τ| = NIAB cos β; β es el ángulo plano-campo'],
  solenoidinductance:['magnetism','Autoinductancia de solenoide','L = μ₀μr N²A/l'],
  toroidinductance:['magnetism','Autoinductancia de toroide','L ≈ μ₀μr N²A/(2πrmedio); U = ½LI²'],
  cable:['magnetism','Cable con corriente uniforme','r ≤ R: B = μ₀Ir/(2πR²); r ≥ R: B = μ₀I/(2πr)'],
  magneticforce:['magnetism','Fuerza sobre un conductor','F = ILB sen θ'],
  hall:['magnetism','Efecto Hall','VH = IB/(nqt)'],
  motional:['magnetism','FEM motriz','ε = Bℓv sen θ'],
  rl:['circuits','Circuito RL transitorio','τ = L/R; I(t) = (V/R)(1−e^(−t/τ))'],
  lc:['circuits','Circuito LC ideal','q(t) = q₀ cos(ωt); I(t) = −q₀ω sen(ωt); ω = 1/√(LC)'],
  rlctransient:['circuits','Circuito RLC libre','Lq″ + Rq′ + q/C = 0; α = R/(2L); ω₀ = 1/√(LC)'],
  rlc:['circuits','Circuito RLC serie en AC','Z = √[R²+(ωL−1/ωC)²]; Irms = Vrms/Z; P = I²R'],
  fluxemf:['magnetism','FEM por flujo sinusoidal','ε = −d(NΦ)/dt; NΦ = NAB₀ sen(ωt)'],
  railbar:['magnetism','Barra móvil sobre rieles','ε = Bℓv; I = ε/R; |F| = |I|ℓ|B|'],
  displacement:['magnetism','Corriente de desplazamiento','Id = ε A dE/dt para campo uniforme'],
  displacementplates:['magnetism','Placas circulares: corriente de desplazamiento y B','Id = ε₀πR² dE/dt; ley de Ampère-Maxwell'],
  poisson:['electrostatics','Poisson 1D con fronteras','V″ = −ρ/ε₀ y V(0), V(L) fijos; E = −V′'],
};
const groupNames={electrostatics:'Electrostática y dieléctricos',circuits:'Circuitos y AC',magnetism:'Magnetismo e inducción'};
const unitFactors={
  length:{m:1,cm:1e-2,mm:1e-3,µm:1e-6},area:{'m²':1,'cm²':1e-4,'mm²':1e-6},
  charge:{C:1,mC:1e-3,µC:1e-6,nC:1e-9,pC:1e-12},current:{A:1,mA:1e-3,µA:1e-6},
  voltage:{V:1,mV:1e-3,kV:1e3},resistance:{Ω:1,kΩ:1e3,MΩ:1e6},
  capacitance:{F:1,mF:1e-3,µF:1e-6,nF:1e-9,pF:1e-12},inductance:{H:1,mH:1e-3,µH:1e-6},
  magneticField:{T:1,mT:1e-3,µT:1e-6,G:1e-4},time:{s:1,ms:1e-3,µs:1e-6},
  frequency:{Hz:1,kHz:1e3},angularFrequency:{'rad/s':1,Hz:2*Math.PI},speed:{'m/s':1,'km/h':1/3.6},
  surfaceDensity:{'C/m²':1,'µC/m²':1e-6,'nC/m²':1e-9},
  volumeDensity:{'C/m³':1,'µC/m³':1e-6,'nC/m³':1e-9},
  resistivity:{'Ω·m':1,'µΩ·cm':1e-8},electricFieldRate:{'V/(m·s)':1,'kV/(m·s)':1e3},
};
const commonDimensions={charge:'charge',radius:'length',position:'length',inner:'length',outer:'length',
  length:'length',distance:'length',thickness:'length',width:'length',height:'length',size:'length',
  area:'area',current:'current',voltage:'voltage',left:'voltage',right:'voltage',resistance:'resistance',
  capacitance:'capacitance',inductance:'inductance',field:'magneticField',time:'time',
  frequency:'frequency',omega:'angularFrequency',speed:'speed',resistivity:'resistivity',rate:'electricFieldRate'};
const rowDimensions={
  charges:{charges:['charge','length','length','length'],point:['length','length','length']},
  layered:{layers:['length',null]},
  nodal:{resistors:[null,null,'resistance'],fixed:[null,'voltage'],injections:[null,'current']},
  nodalfloating:{resistors:[null,null,'resistance'],sources:[null,null,'voltage'],injections:[null,'current']},
};
const unitNames={length:'longitud',area:'área',charge:'carga',current:'corriente',voltage:'voltaje',resistance:'resistencia',
  capacitance:'capacitancia',inductance:'inductancia',magneticField:'campo magnético',time:'tiempo',frequency:'frecuencia',
  angularFrequency:'frecuencia angular',speed:'velocidad',surfaceDensity:'densidad superficial',volumeDensity:'densidad volumétrica',
  resistivity:'resistividad',electricFieldRate:'tasa de campo eléctrico'};
function dimension(mode,key) {
  if(key==='density') return mode==='plane'?'surfaceDensity':mode==='solidsphere'?'volumeDensity':null;
  if(key==='rho'&&mode==='poisson') return 'volumeDensity';
  return commonDimensions[key]||null;
}
const unitSelector=(key,kind)=>`<select id="emplus-${key}-${kind}-unit" class="tool-input" aria-label="Unidad de ${unitNames[kind]} en ${key}" data-action="emPlusUnitChanged" data-event="change" data-arg="${key}:${kind}" data-previous="${Object.keys(unitFactors[kind])[0]}">${Object.keys(unitFactors[kind]).map(unit=>`<option value="${unit}">${unit}</option>`).join('')}</select>`;
const read=key=>document.getElementById(`emplus-${key}`).value.trim();
function number(key,optional=false) {
  const value=read(key);
  if(optional&&value==='') return null;
  if(value===''||!Number.isFinite(Number(value))) throw new RangeError(`${key}: introduce un número finito`);
  const kind=dimension(document.getElementById('emplus-mode').value,key);
  const unit=kind?document.getElementById(`emplus-${key}-${kind}-unit`)?.value:null;
  const converted=Number(value)*(kind?(unitFactors[kind][unit]??1):1);
  if(!Number.isFinite(converted)) throw new RangeError(`${key}: conversión fuera de rango`);
  return converted;
}
function rows(key,width,optional=false) {
  const lines=read(key).split(/[\n;]+/).map(line=>line.trim()).filter(Boolean);
  if(!lines.length&&optional) return [];
  if(!lines.length||lines.length>100) throw new RangeError(`${key}: introduce entre 1 y 100 filas`);
  const dimensions=rowDimensions[document.getElementById('emplus-mode').value]?.[key]||Array(width).fill(null);
  return lines.map(line=>{
    const values=line.split(/[,\s]+/).filter(Boolean).map(Number);
    if(values.length!==width||values.some(value=>!Number.isFinite(value))) throw new RangeError(`${key}: cada fila requiere ${width} números`);
    return values.map((value,i)=>{
      const kind=dimensions[i],unit=kind?document.getElementById(`emplus-${key}-${kind}-unit`)?.value:null;
      const converted=value*(kind?(unitFactors[kind][unit]??1):1);
      if(!Number.isFinite(converted)) throw new RangeError(`${key}: conversión fuera de rango`);
      return converted;
    });
  });
}
function list(key) {
  const raw=read(key).split(/[,\s]+/).filter(Boolean).map(Number);
  if(!raw.length||raw.length>100||raw.some(value=>!Number.isFinite(value))) throw new RangeError(`${key}: lista numérica inválida`);
  const dimensions=rowDimensions[document.getElementById('emplus-mode').value]?.[key];
  return raw.map((value,i)=>{
    const kind=dimensions?.[i],unit=kind?document.getElementById(`emplus-${key}-${kind}-unit`)?.value:null;
    const converted=value*(kind?(unitFactors[kind][unit]??1):1);
    if(!Number.isFinite(converted)) throw new RangeError(`${key}: conversión fuera de rango`);
    return converted;
  });
}
function solve(mode) {
  if(mode==='charges') {
    const points=list('point');if(points.length!==3) throw new RangeError('Punto: se requieren x, y, z');
    return pointChargeSystem(rows('charges',4).map(([charge,x,y,z])=>({charge,position:[x,y,z]})),points);
  }
  if(mode==='equivalent') {
    const kind=read('kind'),dimension=kind==='resistor'?'resistance':kind==='capacitor'?'capacitance':null;
    const inputUnit=read('inputUnit'),outputUnit=read('outputUnit');
    if(!dimension||!Object.hasOwn(unitFactors[dimension],inputUnit)||!Object.hasOwn(unitFactors[dimension],outputUnit))
      throw new RangeError('Las unidades de entrada y salida deben corresponder al tipo de componente');
    const result=equivalentComponents(list('values').map(value=>value*unitFactors[dimension][inputUnit]),kind,read('connection'));
    return {...result,equivalent:result.equivalent/unitFactors[dimension][outputUnit],unit:outputUnit,equivalentSI:result.equivalent};
  }
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
  if(mode==='nodalfloating') return nodalVoltageSources(number('nodes'),rows('resistors',3,true).map(([a,b,resistance])=>({a,b,resistance})),
    rows('sources',3).map(([a,b,voltage])=>({a,b,voltage})),rows('injections',2,true).map(([node,current])=>({node,current})));
  if(mode==='magnetic') return magneticGeometries(read('shape'),number('current'),number('turns'),number('size'),read('shape')==='toroid'?number('position'):null);
  if(mode==='loopaxis') return circularLoopAxis(number('current'),number('turns'),number('radius'),number('position'));
  if(mode==='looptorque') return loopTorque(number('turns'),number('current'),number('width'),number('height'),number('field'),number('angle'));
  if(mode==='solenoidinductance') return solenoidSelfInductance(number('turns'),number('length'),number('area'),number('current'),number('er'));
  if(mode==='toroidinductance') return toroidSelfInductance(number('turns'),number('radius'),number('area'),number('current'),number('er'));
  if(mode==='cable') return longCurrentCable(number('current'),number('radius'),number('position'));
  if(mode==='magneticforce') return magneticForceWire(number('current'),number('length'),number('field'),number('angle'));
  if(mode==='hall') return hallEffect(number('current'),number('field'),number('density'),number('charge'),number('thickness'));
  if(mode==='motional') return motionalEmf(number('field'),number('length'),number('speed'),number('angle'));
  if(mode==='rl') return rlTransient(number('resistance'),number('inductance'),number('voltage'),number('time'));
  if(mode==='lc') return lcOscillation(number('inductance'),number('capacitance'),number('charge'),number('time'));
  if(mode==='rlctransient') return seriesRlcTransient(number('resistance'),number('inductance'),number('capacitance'),number('charge'),number('current'),number('time'));
  if(mode==='rlc') return seriesRlcAc(number('resistance'),number('inductance'),number('capacitance'),number('frequency'),number('voltage'));
  if(mode==='fluxemf') return sinusoidalFluxEmf(number('turns'),number('width')*number('height'),number('field'),number('omega'),number('time'));
  if(mode==='railbar') return railBarCircuit(number('field'),number('length'),number('speed'),number('resistance'));
  if(mode==='displacement') return displacementCurrent(number('area'),number('rate'),number('er'));
  if(mode==='displacementplates') return circularDisplacementField(number('radius'),number('position'),number('rate'));
  if(mode==='poisson') return poissonOneDimensional(number('length'),number('left'),number('right'),number('rho'),number('position'));
  throw new RangeError('Problema no disponible');
}
const labels={field:'Campo E (N/C) o B (T)',magnitude:'Magnitud',potential:'Potencial (V)',equivalent:'Equivalente',equivalentSI:'Equivalente en SI (Ω o F)',unit:'Unidad del equivalente',charge:'Carga (C)',energy:'Energía (J)',voltage:'Voltaje (V)',resistance:'Resistencia (Ω)',current:'Corriente (A)',power:'Potencia (W)',initialCapacitance:'Capacitancia inicial (F)',capacitance:'Capacitancia (F)',initialCharge:'Carga inicial (C)',connection:'Condición',voltages:'Potenciales de nodos (V)',branchCurrents:'Corrientes de ramas (A)',kclResiduals:'Residuos KCL (A)',signedForce:'Fuerza con signo (N)',hallVoltage:'Voltaje Hall (V)',emf:'FEM (V)',tau:'Constante de tiempo (s)',growingCurrent:'Corriente de subida (A)',decayingCurrent:'Corriente de bajada (A)',growingInductorVoltage:'Voltaje de bobina (V)',reactanceInductive:'XL (Ω)',reactanceCapacitive:'XC (Ω)',reactance:'Reactancia neta (Ω)',impedance:'Impedancia (Ω)',phaseRadians:'Fase (rad)',powerFactor:'Factor de potencia',averagePower:'Potencia media (W)',resonanceFrequency:'Frecuencia de resonancia (Hz)',quality:'Factor Q',bandwidthHz:'Ancho de banda (Hz)',layerFields:'Campos por capa (N/C)',formula:'Fórmula',assumption:'Hipótesis',convention:'Convención'};
Object.assign(labels,{centerField:'B en el centro (T)',axisField:'B en z (T)',area:'Área (m²)',magneticMoment:'Momento magnético (A·m²)',torqueMagnitude:'Torque (N·m)',inductance:'Autoinductancia (H)',fluxLinkage:'Flujo enlazado NΦ (Wb)',emfAmplitude:'FEM máxima (V)',forceMagnitude:'Fuerza magnética (N)',mechanicalPower:'Potencia mecánica (W)',regime:'Régimen',decayRate:'Constante de decaimiento α (s⁻¹)',naturalFrequency:'Frecuencia natural ω₀ (rad/s)',angularFrequency:'Frecuencia amortiguada ω′ (rad/s)',omega:'Frecuencia angular ω (rad/s)',frequency:'Frecuencia (Hz)',period:'Período (s)',capacitorEnergy:'Energía del capacitor (J)',inductorEnergy:'Energía de bobina (J)',totalEnergy:'Energía total (J)',displacementCurrent:'Corriente de desplazamiento (A)',magneticField:'Campo B a radio r (T)'});
Object.assign(labels,{sourceCurrents:'Corrientes de fuentes (A)',voltageResiduals:'Residuos de fuentes (V)'});
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
  document.getElementById('emplus-fields').innerHTML=fields[mode].map(([key,label,defaultValue,type,options])=>{
    const kind=type==='textarea'||type==='select'?null:dimension(mode,key);
    const dimensions=[...new Set(rowDimensions[mode]?.[key]?.filter(Boolean)||[kind].filter(Boolean))];
    return `<label class="linear-field" for="emplus-${key}"><span>${kind?label.replace(/\s*\([^)]*\)$/,''):label}</span>${type==='textarea'?`<textarea id="emplus-${key}" class="tool-textarea" rows="4">${defaultValue}</textarea>`:
      type==='select'?`<select id="emplus-${key}" class="tool-input"${mode==='equivalent'&&key==='kind'?' data-action="emPlusEquivalentKindChanged" data-event="change"':''}>${options.split(',').map(option=>`<option value="${option}">${option}</option>`).join('')}</select>`:
        `<input id="emplus-${key}" class="tool-input" type="${key==='values'||key==='point'?'text':'number'}" step="any" value="${defaultValue}">`}${dimensions.map(dimension=>unitSelector(key,dimension)).join('')}</label>`;
  }).join('')+`<p class="calc-res-hint">${mode==='equivalent'?'La unidad de entrada interpreta toda la lista; el resultado muestra la unidad elegida y su valor en SI.':'Las entradas con selector se convierten a SI; los resultados usan SI.'}</p>`;
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
    target.classList.remove('tool-error');
    target.innerHTML=`<div class="tool-result-title">${modes[mode][1]}</div><p>${modes[mode][2]}</p><dl class="mechplus-results">${Object.entries(data).map(([key,item])=>`<dt>${labels[key]||key}</dt><dd>${fmt(item)}</dd>`).join('')}</dl>`;
  } catch(error) {target.classList.add('tool-error');target.textContent=error.message;}
}
