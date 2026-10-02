import { MECHANICS_UNITS } from '../../math/mechanics-units.mjs';

export const unitSpecs={
  length:MECHANICS_UNITS.length,time:MECHANICS_UNITS.time,speed:MECHANICS_UNITS.speed,
  mass:MECHANICS_UNITS.mass,force:MECHANICS_UNITS.force,
  energy:MECHANICS_UNITS.energy,stiffness:{'N/m':1,'kN/m':1000},
  angle:{'°':1,'rad':180/Math.PI},angularSpeed:{'rad/s':1,'°/s':Math.PI/180,'rpm':2*Math.PI/60},
  angularAcceleration:{'rad/s²':1,'°/s²':Math.PI/180},inertia:{'kg·m²':1,'lb·ft²':0.45359237*0.3048**2},
};
export const scalarDimensions={weight:'force',left:'angle',right:'angle',angle:'angle',length:'length',radius:'length',height:'length',distance:'length',size:'length',time:'time',mass:'mass',m1:'mass',m2:'mass',satellite:'mass',boat:'speed',current:'speed',speed:'speed',v1:'speed',v2:'speed',omega:'angularSpeed',alpha:'angularAcceleration',inertia:'inertia',initialInertia:'inertia',finalInertia:'inertia',initialOmega:'angularSpeed',periapsisRadius:'length',apoapsisRadius:'length',periapsisSpeed:'speed'};
Object.assign(scalarDimensions,{energy:'energy',stiffness:'stiffness',pulleyMass:'mass',vfSpeed:'speed',vfAngle:'angle'});
export const vectorDimensions={vi1:'speed',vi2:'speed',vf1:'speed',position:'length',velocity:'speed',frame:'speed'};
export const rowDimensions={forces:{rows:['force','force','length','length']},beam:{loads:['force','length']},
  center:{particles:['mass','length','length']},kinetic:{particles:['mass','length','length','speed','speed']}};
export const unitOptions=(key,dimension)=>`<select id="mechplus-${key}-${dimension}-unit" class="tool-input" data-action="mechPlusUnitChanged" data-event="change" data-arg="${key}:${dimension}" data-previous="${Object.keys(unitSpecs[dimension])[0]}">${Object.keys(unitSpecs[dimension]).map(unit=>`<option value="${unit}">${unit}</option>`).join('')}</select>`;
function unitFactor(key,dimension) {
  const unit=document.getElementById(`mechplus-${key}-${dimension}-unit`)?.value;
  return unitSpecs[dimension][unit]??Object.values(unitSpecs[dimension])[0];
}
export const value=key=>document.getElementById(`mechplus-${key}`).value.trim();
export function num(key,optional=false) {
  const raw=value(key);
  if (optional&&raw==='') return null;
  if (raw===''||!Number.isFinite(Number(raw))) throw new RangeError(`${key}: introduce un número finito`);
  return Number(raw)*(scalarDimensions[key]?unitFactor(key,scalarDimensions[key]):1);
}
export function rows(key,width) {
  const lines=value(key).split(/[\n;]+/).map(line=>line.trim()).filter(Boolean);
  if (!lines.length||lines.length>100) throw new RangeError(`${key}: introduce entre 1 y 100 filas`);
  const dimensions=rowDimensions[document.getElementById('mechplus-mode').value]?.[key]||Array(width).fill(vectorDimensions[key]||null);
  return lines.map(line=>{
    const cells=line.split(/[,\s]+/).filter(Boolean).map(Number);
    if (cells.length!==width||cells.some(cell=>!Number.isFinite(cell))) throw new RangeError(`${key}: cada fila requiere ${width} números`);
    return cells.map((value,i)=>value*(dimensions[i]?unitFactor(key,dimensions[i]):1));
  });
}
export const vector=key=>{const list=rows(key,2);if(list.length!==1) throw new RangeError(`${key}: introduce un vector de dos componentes`);return list[0];};
export const singleRow=(key,width)=>{const list=rows(key,width);if(list.length!==1)throw new RangeError(`${key}: introduce una sola fila`);return list[0];};
