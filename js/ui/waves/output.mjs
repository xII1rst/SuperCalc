import { beats, lissajous } from '../../math/waves.mjs';
import { physicsOutputControls } from '../physics-output.mjs';

export const fmt=value=>value===Infinity?'∞':Number.isFinite(value)?(value===0?'0':String(Number(value.toPrecision(10)))):'—';
export const unitFactors={
  length:{m:1,cm:0.01,mm:0.001,km:1000,µm:1e-6,nm:1e-9,ft:0.3048,in:0.0254},
  speed:{'m/s':1,'km/h':1/3.6,mph:0.44704,'ft/s':0.3048},
  frequency:{Hz:1,kHz:1000,MHz:1e6,GHz:1e9},
  mass:{kg:1,g:.001},force:{N:1,kN:1000},stiffness:{'N/m':1,'kN/m':1000},
  damping:{'kg/s':1,'g/s':.001},linearDensity:{'kg/m':1,'g/m':.001},
  density:{'kg/m³':1,'g/cm³':1000},modulus:{Pa:1,kPa:1000,MPa:1e6,GPa:1e9},
  inductance:{H:1,mH:.001,µH:1e-6},capacitance:{F:1,mF:.001,µF:1e-6,nF:1e-9,pF:1e-12},
  charge:{C:1,mC:.001,µC:1e-6,nC:1e-9},time:{s:1,ms:.001,µs:1e-6},
  angle:{rad:1,'°':Math.PI/180},angularFrequency:{'rad/s':1,'krad/s':1000},
  waveNumber:{'rad/m':1,'rad/cm':100},moment:{'kg·m²':1,'g·cm²':1e-7},
  intensity:{'W/m²':1,'mW/m²':.001,'µW/m²':1e-6},power:{W:1,mW:.001,kW:1000},
  electric:{'V/m':1,'kV/m':1000},temperature:{K:1,'°C':1},molar:{'kg/mol':1,'g/mol':.001},
};
export const unitsByMode={
  harmonic:{a:'length'},pendulum:{length:'length',distance:'length'},rod:{length:'length'},beats:{f1:'frequency',f2:'frequency'},
  decay:{initial:'length',final:'length'},relation:{speed:'speed',frequency:'frequency',lambda:'length'},
  emrelation:{frequency:'frequency',lambda:'length'},mach:{source:'speed',speed:'speed'},
  traveling:{a:'length',x:'length'},string:{length:'length',speed:'speed'},tube:{length:'length',speed:'speed'},
  standing:{a:'length',length:'length'},dispersion:{lambda:'length'},stringpower:{a:'length',speed:'speed'},
  sound:{distance:'length'},doppler:{frequency:'frequency',speed:'speed',source:'speed',observer:'speed',wall:'speed'},
  material:{source:'speed'},refraction:{lambda:'length'},young:{lambda:'length',separation:'length',screen:'length',thickness:'length'},
  film:{thickness:'length',minimum:'length',maximum:'length'},rings:{radius:'length',lambda:'length'},
  multislit:{separation:'length',lambda:'length'},grating:{separation:'length',lambda:'length',minimum:'length',maximum:'length'},
};
const additionalUnits={
  harmonic:{w:'angularFrequency',phase:'angle',time:'time',k:'stiffness'},
  spring:{m:'mass',k:'stiffness',b:'damping',force:'force',drive:'angularFrequency'},
  pendulum:{moment:'moment',mass:'mass'},decay:{period:'time'},
  lc:{l:'inductance',c:'capacitance',q:'charge',time:'time'},
  lissajous:{wx:'angularFrequency',wy:'angularFrequency',phase:'angle',time:'time'},
  traveling:{k:'waveNumber',w:'angularFrequency',time:'time'},string:{tension:'force',density:'linearDensity',mass:'mass'},
  standing:{k:'waveNumber',w:'angularFrequency'},stringpower:{density:'linearDensity',w:'angularFrequency'},
  sound:{power:'power'},intensity:{intensity:'intensity',reference:'intensity'},boundary:{tension:'force',mu1:'linearDensity',mu2:'linearDensity'},
  material:{modulus:'modulus',density:'density',temperature:'temperature',molar:'molar'},
  em:{electric:'electric'},polarizers:{intensity:'intensity'},
};
for(const [mode,fields] of Object.entries(additionalUnits))unitsByMode[mode]={...unitsByMode[mode],...fields};
export function read(key) {return document.getElementById(`waves-${key}`).value.trim();}
export function number(key,optional=false) {
  const raw=read(key);
  if (!raw&&optional) return null;
  if (!raw||!Number.isFinite(Number(raw))) throw new RangeError(`${key}: introduce un número finito`);
  const mode=document.getElementById('waves-mode').value;
  const unitType=unitsByMode[mode]?.[key];
  const selected=unitType?document.getElementById(`waves-${key}-unit`)?.value:null;
  const factor=unitType?(unitFactors[unitType][selected]??1):1;
  const converted=Number(raw)*factor+(unitType==='temperature'&&selected==='°C'?273.15:0);
  if(!Number.isFinite(converted)) throw new RangeError(`${key}: conversión fuera de rango`);
  return converted;
}
export function numbers(key) {
  const parts=read(key).split(/[,;\s]+/).filter(Boolean);
  if (!parts.length||parts.length>100||parts.some(part=>!Number.isFinite(Number(part)))) throw new RangeError(`${key}: lista numérica inválida`);
  return parts.map(Number);
}
export const values=list=>list.map(fmt).join(', ');
export function result(title,lines,data={}) {
  const target=document.getElementById('waves-result');
  target.classList.remove('tool-error');
  target.innerHTML=`<div class="tool-result-title">${title}</div><ol class="geom-steps">${lines.map(line=>`<li>${line}</li>`).join('')}</ol>${physicsOutputControls('waves',waveOutputEntries(data,document.getElementById('waves-mode').value))}`;
}

const waveOutputUnits={amplitude:'m',omega:'rad/s',omega0:'rad/s',frequency:'Hz',period:'s',phase:'rad',time:'s',position:'m',velocity:'m/s',acceleration:'m/s²',maxSpeed:'m/s',maxAcceleration:'m/s²',energy:'J',gamma:'s⁻¹',dampedOmega:'rad/s',criticalDamping:'kg/s',bandwidth:'rad/s',resonanceOmega:'rad/s',phaseLag:'rad',averagePower:'W',powerPeak:'W',powerPeakOmega:'rad/s',powerPeakAmplitude:'m',lowerHalfPower:'rad/s',upperHalfPower:'rad/s',beatFrequency:'Hz',carrierFrequency:'Hz',wavelength:'m',waveNumber:'rad/m',speed:'m/s',charge:'C',current:'A',capacitorEnergy:'J',inductorEnergy:'J',totalEnergy:'J',windowTime:'s',displacement:'m',transverseVelocity:'m/s',transverseAcceleration:'m/s²',maxTransverseVelocity:'m/s',fundamental:'Hz',harmonics:'Hz',nodes:'m',antinodes:'m',componentAmplitude:'m',phaseSpeed:'m/s',groupSpeed:'m/s',intensity:'W/m²',sourceIntensity:'W/m²',targetIntensity:'W/m²',distance:'m',angleDegrees:'°',observed:'Hz',echoFrequency:'Hz',firstImpedance:'kg/s',secondImpedance:'kg/s',materialSpeed:'m/s',gasSpeed:'m/s',magneticPeak:'T',peakPoynting:'W/m²',averageIntensity:'W/m²',absorbingPressure:'Pa',reflectingPressure:'Pa',after:'W/m²',final:'W/m²',spacing:'m',bright:'m',dark:'m',filmShift:'m',radius:'m',darkRadius:'m',brightRadius:'m',wavelengthRange:'m'};
const waveOutputLabels={amplitude:'Amplitud',omega:'Frecuencia angular',omega0:'Frecuencia angular natural',frequency:'Frecuencia',period:'Período',phase:'Fase',time:'Tiempo',position:'Posición',velocity:'Velocidad',acceleration:'Aceleración',maxSpeed:'Rapidez máxima',maxAcceleration:'Aceleración máxima',energy:'Energía',gamma:'Decaimiento',dampedOmega:'Frecuencia amortiguada',criticalDamping:'Amortiguamiento crítico',bandwidth:'Ancho de banda',resonanceOmega:'Frecuencia de resonancia',phaseLag:'Desfase',averagePower:'Potencia media',powerPeak:'Potencia máxima',powerPeakOmega:'Frecuencia de máxima potencia',powerPeakAmplitude:'Amplitud a máxima potencia',lowerHalfPower:'Frecuencia inferior de media potencia',upperHalfPower:'Frecuencia superior de media potencia',beatFrequency:'Frecuencia de pulsación',carrierFrequency:'Frecuencia portadora',wavelength:'Longitud de onda',waveNumber:'Número de onda',speed:'Rapidez',charge:'Carga',current:'Corriente',capacitorEnergy:'Energía del capacitor',inductorEnergy:'Energía de bobina',totalEnergy:'Energía total',windowTime:'Ventana de tiempo',displacement:'Desplazamiento',transverseVelocity:'Velocidad transversal',transverseAcceleration:'Aceleración transversal',maxTransverseVelocity:'Rapidez transversal máxima',fundamental:'Frecuencia fundamental',harmonics:'Armónicos',nodes:'Nodos',antinodes:'Antinodos',componentAmplitude:'Amplitud de componentes',phaseSpeed:'Velocidad de fase',groupSpeed:'Velocidad de grupo',intensity:'Intensidad',sourceIntensity:'Intensidad de la fuente',targetIntensity:'Intensidad objetivo',distance:'Distancia',angleDegrees:'Ángulo',observed:'Frecuencia observada',echoFrequency:'Frecuencia del eco',firstImpedance:'Impedancia de cuerda 1',secondImpedance:'Impedancia de cuerda 2',materialSpeed:'Rapidez en material',gasSpeed:'Rapidez en gas',magneticPeak:'Campo B máximo',peakPoynting:'Poynting máximo',averageIntensity:'Intensidad media',after:'Intensidad tras polarizadores',final:'Intensidad final',spacing:'Separación de franjas',bright:'Posición brillante',dark:'Posición oscura',filmShift:'Corrimiento por película',radius:'Radio',darkRadius:'Radio oscuro',brightRadius:'Radio brillante',wavelengthRange:'Banda de longitudes de onda',absorbingPressure:'Presión absorbente',reflectingPressure:'Presión reflectora'};
function waveOutputEntries(data,mode,prefix=''){
 return Object.entries(data||{}).flatMap(([key,value])=>{
  if(key==='points'||key==='ellipse'||(mode==='phasors'&&key==='amplitude'))return [];
  const label=prefix+(waveOutputLabels[key]||key),unit=waveOutputUnits[key];
  if(unit&&(typeof value==='number'||Array.isArray(value)&&value.every(v=>typeof v==='number')))return [{label,value,unit}];
  if(value&&typeof value==='object')return Array.isArray(value)?value.flatMap((item,i)=>item&&typeof item==='object'?waveOutputEntries(item,mode,`${label} ${i+1}: `):[]):waveOutputEntries(value,mode,label+': ');
  return [];
 });
}
