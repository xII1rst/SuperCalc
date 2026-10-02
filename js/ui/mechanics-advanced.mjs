import { MECH_BIG_G, MECH_G, angularMomentumSkater, angularMomentumVector, apsisAngularMomentum, atwood, averagePower, ballisticPendulum, bankedCurve, beamReactions, centerOfMass, circularMotion, circularOrbit, collisionOneDimensional, collisionTwoDimensional, forceSystem2D, galileanTransform, gravitationalAttraction, hingedRodDrop, inclinedPlane, kineticDecomposition, linearImpulse, particleKinematics, polarForce, potentialEquilibria, riverCrossing, rollingDownIncline, rotatingFrameVelocity, springLaunch, standardInertia, tablePulley, twoCableEquilibrium, vectorPair, verticalLoop, workByForce } from '../math/mechanics-advanced.mjs';
import { forceDiagram, mechanicsDiagram } from '../graphics/physics-diagrams.mjs';
import { labelledOutputEntries, physicsOutputControls } from './physics-output.mjs';
import { num, rowDimensions, rows, scalarDimensions, singleRow, unitOptions, unitSpecs, value, vector, vectorDimensions } from './mechanics/units.mjs';
import { studyPlotSvg } from '../graphics/study-plot.mjs';
import * as forces from './mechanics/forces.mjs';
import * as motion from './mechanics/motion.mjs';
import * as collisions from './mechanics/collisions.mjs';
import * as rotation from './mechanics/rotation.mjs';
export { physicsOutputUnitChanged } from './physics-output.mjs';

const families=[forces, motion, collisions, rotation];
const fields=Object.assign({},...families.map(family=>family.fields));
const modes=Object.assign({},...families.map(family=>family.modes));
const solvers=Object.assign({},...families.map(family=>family.solvers));
const groupNames={forces:'Fuerzas y equilibrio',motion:'Movimiento y marcos',collisions:'Colisiones y centro de masa',rotation:'Rotación y gravitación'};
function calculate(mode) {
  if(!Object.hasOwn(solvers, mode)) throw new RangeError('Problema no disponible');
  return solvers[mode](mode);
}
const labels={resultant:'Fuerza resultante (N)',magnitude:'Magnitud (N)',angleDegrees:'Ángulo (°)',torque:'Torque (N·m)',equilibrium:'Equilibrio',leftTension:'Tensión izquierda (N)',rightTension:'Tensión derecha (N)',horizontalResidual:'Residuo horizontal (N)',verticalResidual:'Residuo vertical (N)',left:'Reacción izquierda (N)',right:'Reacción derecha (N)',total:'Total',moment:'Momento (N·m)',requiresHoldDown:'Requiere sujeción',finalOmega:'ω final (rad/s)',angle:'Ángulo girado (rad)',speed:'Rapidez (m/s)',tangentialAcceleration:'Aceleración tangencial (m/s²)',radialAcceleration:'Aceleración radial (m/s²)',totalAcceleration:'Aceleración total (m/s²)',headingDegrees:'Rum­bo contracorriente (°)',perpendicularSpeed:'Rapidez perpendicular (m/s)',normal:'Normal (N)',gravityAlong:'Peso paralelo (N)',friction:'Fricción (N)',acceleration:'Aceleración (m/s²)',timeFromRest:'Tiempo desde reposo (s)',tensionOne:'Tensión 1 (N)',tensionTwo:'Tensión 2 (N)',maxSpeed:'Rapidez máxima (m/s)',bottomSpeed:'Rapidez en fondo (m/s)',topSpeed:'Rapidez en cima (m/s)',contactAtTop:'Contacto en cima',minimumStartHeight:'Altura mínima (m)',firstFinal:'Velocidad final 1 (m/s)',secondFinal:'Velocidad final 2 (m/s)',momentum:'Momento lineal inicial (kg·m/s)',initialEnergy:'Energía inicial (J)',finalEnergy:'Energía final (J)',lostEnergy:'Energía perdida (J)',secondFinal:'Velocidad final 2',initialMomentum:'Momento lineal inicial',totalMass:'Masa total (kg)',position:'Posición (m)',centerVelocity:'Velocidad CM (m/s)',totalKinetic:'Energía cinética total (J)',centerKinetic:'Energía cinética CM (J)',relativeKinetic:'Energía cinética relativa (J)',angularMomentum:'Momento angular (kg·m²/s)',inertia:'Inercia (kg·m²)',inertiaFactor:'Factor I/(mR²)',period:'Período (s)',escapeSpeed:'Rapidez de escape (m/s)',totalEnergy:'Energía orbital total (J)',specificAngularMomentum:'Momento angular específico (m²/s)',velocity:'Velocidad (m/s)',rotational:'Velocidad de arrastre (m/s)',relative:'Velocidad relativa (m/s)',requiredStaticFriction:'μ estática mínima',angularAcceleration:'Aceleración angular (rad/s²)',translationalEnergy:'Energía de traslación (J)',rotationalEnergy:'Energía de rotación (J)',potentialDrop:'Caída de energía potencial (J)',energyResidual:'Residuo energético (J)',initialKinetic:'Energía cinética inicial (J)',finalKinetic:'Energía cinética final (J)',energyChange:'Cambio de energía (J)',initialTorque:'Torque inicial (N·m)',initialAngularAcceleration:'α inicial (rad/s²)',apoapsisSpeed:'Rapidez en apoapsis (m/s)',angularMomentumResidual:'Residuo de h (m²/s)',assumption:'Hipótesis'};
const fmt=item=>item===null?'no alcanzada':typeof item==='boolean'?(item?'sí':'no'):typeof item==='number'?(Number.isFinite(item)?String(Number(item.toPrecision(10))):'∞'):Array.isArray(item)?`(${item.map(fmt).join(', ')})`:String(item);
function validateResult(data,mode,key=''){
  if(typeof data==='number'&&!Number.isFinite(data)&&!(mode==='bank'&&key==='maxSpeed'&&data===Infinity))throw new RangeError('El resultado supera el rango numérico disponible.');
  if(data&&typeof data==='object')for(const [name,value]of Object.entries(data))validateResult(value,mode,name);
}
Object.assign(labels,{sum:'A+B',difference:'A−B',magnitudeA:'|A|',magnitudeB:'|B|',dot:'A·B',cross:'A×B',parallelogramArea:'Área del paralelogramo',
  velocityFormula:'v(t) (m/s)',accelerationFormula:'a(t) (m/s²)',acceleration:'Aceleración (m/s²)',work:'Trabajo (J)',power:'Potencia media (W)',
  finalMomentum:'Momentum final (kg·m/s)',impulse:'Impulso (N·s)',forceMagnitude:'Fuerza gravitacional (N)',height:'Altura de subida (m)',
  reducedMass:'Masa reducida (kg)',angularMomentumVector:'L respecto al origen (kg·m²/s)',equilibria:'Puntos de equilibrio',
  secondFinal:'Velocidad final 2 (m/s)',initialMomentum:'Momentum inicial (kg·m/s)',total:'Fuerza total (N)'});

export function mechPlusOpenPanel(group) {
  if(!groupNames[group]) return;
  document.getElementById('mechplus-title').textContent=groupNames[group];
  document.getElementById('mechplus-heading').textContent=groupNames[group];
  document.getElementById('mechplus-mode').innerHTML=Object.entries(modes).filter(([,config])=>config[0]===group)
    .map(([key,config])=>`<option value="${key}">${config[1]}</option>`).join('');
  mechPlusSelect();
}
export function mechPlusSelect() {
  const mode=document.getElementById('mechplus-mode').value;
  if(!fields[mode]) return;
  document.getElementById('mechplus-fields').innerHTML=fields[mode].map(([key,label,defaultValue,type])=>{
    const dimensions=[...new Set(rowDimensions[mode]?.[key]||[vectorDimensions[key]||scalarDimensions[key]].filter(Boolean))];
    return `<label class="linear-field" for="mechplus-${key}"><span>${label}</span>${type==='textarea'
      ?`<textarea id="mechplus-${key}" class="tool-textarea" rows="4">${defaultValue}</textarea>`
      :`<input id="mechplus-${key}" class="tool-input" ${key==='shape'||type==='text'?'type="text"':'type="number" step="any"'} value="${defaultValue}">`}${dimensions.map(dimension=>unitOptions(key,dimension)).join('')}</label>`;
  }).join('');
  document.getElementById('mechplus-result').textContent='';
}
export function mechPlusUnitChanged(arg) {
  const [key,dimension]=arg.split(':'),select=document.getElementById(`mechplus-${key}-${dimension}-unit`);
  if(!select||!unitSpecs[dimension]) return;
  const previous=select.dataset.previous||Object.keys(unitSpecs[dimension])[0];
  const ratio=unitSpecs[dimension][previous]/unitSpecs[dimension][select.value];
  if(!Number.isFinite(ratio)) return;
  const input=document.getElementById(`mechplus-${key}`),raw=input.value.trim();
  if(raw) {
    if(rowDimensions[document.getElementById('mechplus-mode').value]?.[key]) {
      const columns=rowDimensions[document.getElementById('mechplus-mode').value][key];
      input.value=raw.split(/[\n;]+/).map(line=>line.split(/[,\s]+/).filter(Boolean).map((value,i)=>columns[i]===dimension?String(Number(value)*ratio):value).join(', ')).join('\n');
    } else if(vectorDimensions[key]) input.value=raw.split(/[,\s]+/).filter(Boolean).map(value=>String(Number(value)*ratio)).join(', ');
    else if(Number.isFinite(Number(raw))) input.value=String(Number(raw)*ratio);
  }
  select.dataset.previous=select.value;
}
export function mechPlusCalculate() {
  const mode=document.getElementById('mechplus-mode').value;
  const target=document.getElementById('mechplus-result');
  try {
    const data=calculate(mode);
    validateResult(data,mode);
    const constants=['gravity','orbit'].includes(mode)?`G = ${MECH_BIG_G} m³/(kg·s²).`:
      ['incline','atwood','bank','loop','rolling','hingedrod','table','ballistic'].includes(mode)?`g = ${MECH_G} m/s².`:'';
    target.classList.remove('tool-error');
    target.innerHTML=`<div class="tool-result-title">${modes[mode][1]}</div><p>${modes[mode][2]}</p>${constants?`<p>${constants}</p>`:''}<dl class="mechplus-results">${Object.entries(data).map(([key,item])=>`<dt>${labels[key]||key}</dt><dd>${key==='equilibria'?(item.length?item.map(point=>`x=${fmt(point.position)} m; U″=${fmt(point.curvature)} J/m²; ${point.stability}`).join('<br>'):'Ningún punto aislado; consulta las hipótesis.'):key==='angleDegrees'&&item===null?'Indefinido para vector nulo':fmt(item)}</dd>`).join('')}</dl>${physicsOutputControls('mechplus',labelledOutputEntries(data,key=>labels[key]||key))}${mechanicsVisual(mode,data)}`;
  } catch(error) {
    target.classList.add('tool-error');
    target.textContent=error.message;
  }
}

function mechanicsVisual(mode,data){
 const keys={cables:['weight','left','right'],incline:['mass','angle'],rolling:['mass','angle'],atwood:['m1','m2'],table:['m1','m2'],beam:['length','weight'],bank:[],forces:[]}[mode];
 if(keys){const input=Object.fromEntries(keys.map(key=>[key,num(key)]));input.gravity=MECH_G;if(mode==='beam')input.loads=rows('loads',2);if(mode==='forces')input.rows=rows('rows',4);return mechanicsDiagram(mode,input,data);}
 if(mode==='trajectory'){
  const expressions=value('expressions').split(/\n|;/).map(v=>v.trim()).filter(Boolean),end=num('time')||1,points=Array.from({length:81},(_,i)=>{const time=end*i/80;try{return {time,...particleKinematics(expressions,time)};}catch{return {time,position:expressions.map(()=>NaN)};}});
  return studyPlotSvg(expressions.map((_,axis)=>({label:['x(t)','y(t)','z(t)'][axis],points:points.map(p=>[p.time,p.position[axis]])})),{title:'Componentes de la trayectoria',xLabel:'t (s)',yLabel:'Posición (m)'});
 }
 if(mode==='collision2d')return forceDiagram('Velocidades 2D antes y después',[{label:'v₁ inicial',origin:[180,110],vector:vector('vi1')},{label:'v₂ inicial',origin:[430,110],vector:vector('vi2')},{label:'v₁ final',origin:[180,260],vector:data.firstFinal},{label:'v₂ final',origin:[430,260],vector:data.secondFinal}],{unit:'m/s',caption:'Arriba: antes; abajo: después. +x derecha, +y arriba. Una escala común. Conservación de momentum; no se presupone impacto elástico.'});
 if(mode==='collision')return forceDiagram('Velocidades antes y después',[{label:'v₁ inicial',origin:[180,110],vector:[num('v1'),0]},{label:'v₂ inicial',origin:[420,110],vector:[num('v2'),0]},{label:'v₁ final',origin:[180,250],vector:[data.firstFinal,0]},{label:'v₂ final',origin:[420,250],vector:[data.secondFinal,0]}],{unit:'m/s',caption:'Arriba: antes del impacto. Abajo: después. +x hacia la derecha; una escala común para las velocidades.'});
 return '';
}
