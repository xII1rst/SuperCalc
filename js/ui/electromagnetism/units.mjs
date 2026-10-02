import { lorentz } from '../../math/electromagnetism.mjs';

export const unitFactors={
  length:{m:1,cm:1e-2,mm:1e-3,µm:1e-6},area:{'m²':1,'cm²':1e-4,'mm²':1e-6},
  charge:{C:1,mC:1e-3,µC:1e-6,nC:1e-9,pC:1e-12},current:{A:1,mA:1e-3,µA:1e-6},
  voltage:{V:1,mV:1e-3,kV:1e3},resistance:{Ω:1,kΩ:1e3,MΩ:1e6},
  capacitance:{F:1,mF:1e-3,µF:1e-6,nF:1e-9,pF:1e-12},inductance:{H:1,mH:1e-3,µH:1e-6},
  magneticField:{T:1,mT:1e-3,µT:1e-6,G:1e-4},time:{s:1,ms:1e-3,µs:1e-6},
  frequency:{Hz:1,kHz:1e3},angularFrequency:{'rad/s':1,Hz:2*Math.PI},speed:{'m/s':1,'km/h':1/3.6},
  surfaceDensity:{'C/m²':1,'µC/m²':1e-6,'nC/m²':1e-9},
  volumeDensity:{'C/m³':1,'µC/m³':1e-6,'nC/m³':1e-9},
  resistivity:{'Ω·m':1,'µΩ·cm':1e-8},electricFieldRate:{'V/(m·s)':1,'kV/(m·s)':1e3},
  electricField:{'N/C':1,'kV/m':1e3},flux:{Wb:1,mWb:1e-3},angle:{'°':1,rad:180/Math.PI},mass:{kg:1,g:.001},turnDensity:{'m⁻¹':1,'cm⁻¹':100},
};
const commonDimensions={charge:'charge',radius:'length',position:'length',inner:'length',outer:'length',
  length:'length',distance:'length',thickness:'length',width:'length',height:'length',size:'length',
  area:'area',current:'current',voltage:'voltage',left:'voltage',right:'voltage',resistance:'resistance',
  capacitance:'capacitance',inductance:'inductance',field:'magneticField',time:'time',
  frequency:'frequency',omega:'angularFrequency',speed:'speed',resistivity:'resistivity',rate:'electricFieldRate',diameter:'length',electric:'electricField',angle:'angle',mass:'mass',first:'charge',last:'charge',firstFlux:'flux',lastFlux:'flux'};
export const rowDimensions={
  charges:{charges:['charge','length','length','length'],point:['length','length','length']},
  layered:{layers:['length',null]},
  nodal:{resistors:[null,null,'resistance'],fixed:[null,'voltage'],injections:[null,'current']},
  nodalfloating:{resistors:[null,null,'resistance'],sources:[null,null,'voltage'],injections:[null,'current']},
  lorentz:{velocity:['speed','speed','speed'],electricVector:['electricField','electricField','electricField'],magneticVector:['magneticField','magneticField','magneticField']},
  potentialfield:{point:['length','length','length']},divergence:{point:['length','length','length']},
};
const unitNames={length:'longitud',area:'área',charge:'carga',current:'corriente',voltage:'voltaje',resistance:'resistencia',
  capacitance:'capacitancia',inductance:'inductancia',magneticField:'campo magnético',time:'tiempo',frequency:'frecuencia',
  angularFrequency:'frecuencia angular',speed:'velocidad',surfaceDensity:'densidad superficial',volumeDensity:'densidad volumétrica',
  resistivity:'resistividad',electricFieldRate:'tasa de campo eléctrico',electricField:'campo eléctrico',flux:'flujo',angle:'ángulo',mass:'masa',turnDensity:'espiras por longitud'};
export function dimension(mode,key) {
  if(key==='density') return mode==='plane'?'surfaceDensity':mode==='solidsphere'?'volumeDensity':mode==='solenoidfield'?'turnDensity':null;
  if(key==='rho') return 'volumeDensity';
  return commonDimensions[key]||null;
}
export const unitSelector=(key,kind)=>`<select id="emplus-${key}-${kind}-unit" class="tool-input" aria-label="Unidad de ${unitNames[kind]} en ${key}" data-action="emPlusUnitChanged" data-event="change" data-arg="${key}:${kind}" data-previous="${Object.keys(unitFactors[kind])[0]}">${Object.keys(unitFactors[kind]).map(unit=>`<option value="${unit}">${unit}</option>`).join('')}</select>`;
export const read=key=>document.getElementById(`emplus-${key}`).value.trim();
export function number(key,optional=false) {
  const value=read(key);
  if(optional&&value==='') return null;
  if(value===''||!Number.isFinite(Number(value))) throw new RangeError(`${key}: introduce un número finito`);
  const kind=dimension(document.getElementById('emplus-mode').value,key);
  const unit=kind?document.getElementById(`emplus-${key}-${kind}-unit`)?.value:null;
  const converted=Number(value)*(kind?(unitFactors[kind][unit]??1):1);
  if(!Number.isFinite(converted)) throw new RangeError(`${key}: conversión fuera de rango`);
  return converted;
}
export function rows(key,width,optional=false) {
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
export function list(key) {
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
