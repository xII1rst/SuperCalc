import { mechanicsDiagram, forceDiagram } from '../graphics/physics-diagrams.mjs';
import { studyPlotSvg } from '../graphics/study-plot.mjs';
import { labelledOutputEntries, physicsOutputControls } from './physics-output.mjs';
export { physicsOutputUnitChanged } from './physics-output.mjs';
import {
  forceSystem2D, twoCableEquilibrium, beamReactions, circularMotion, riverCrossing,
  inclinedPlane, atwood, bankedCurve, verticalLoop, collisionOneDimensional,
  collisionTwoDimensional, centerOfMass, kineticDecomposition, standardInertia,
  circularOrbit, galileanTransform, rotatingFrameVelocity, rollingDownIncline,
  angularMomentumSkater, hingedRodDrop, apsisAngularMomentum,
  vectorPair, polarForce, particleKinematics, workByForce, averagePower, linearImpulse,
  gravitationalAttraction, tablePulley, springLaunch, ballisticPendulum, angularMomentumVector, potentialEquilibria,
  MECH_G, MECH_BIG_G,
} from '../math/mechanics-advanced.mjs';
import { MECHANICS_UNITS } from '../math/mechanics-units.mjs';

const fields={
  vectors:[['first','Vector A: x,y,z','3,-2,4','text'],['second','Vector B: x,y,z','1,5,-2','text']],
  polar:[['weight','Magnitud de fuerza (N)','50'],['angle','Ángulo desde +x (°)','37']],
  trajectory:[['expressions','Componentes de r(t), una por línea (m)','3*t^2\n2*t-t^3','textarea'],['time','Tiempo (s)','2']],
  work:[['weight','Fuerza (N)','30'],['distance','Desplazamiento (m)','5'],['angle','Ángulo fuerza-desplazamiento (°)','60']],
  power:[['energy','Trabajo (J)','5000'],['time','Intervalo (s)','20']],
  impulse:[['mass','Masa (kg)','1500'],['v1','Velocidad inicial (m/s)','20'],['v2','Velocidad final (m/s)','10']],
  gravity:[['m1','Masa 1 (kg)','5e24'],['m2','Masa 2 (kg)','7e22'],['distance','Distancia entre centros (m)','3.8e8']],
  table:[['m1','Masa sobre mesa (kg)','4'],['m2','Masa colgante (kg)','6'],['friction','Coeficiente de fricción cinética','0.1']],
  spring:[['stiffness','Constante k (N/m)','200'],['distance','Compresión (m)','0.1'],['mass','Masa lanzada (kg)','0.5']],
  ballistic:[['m1','Masa de bala (kg)','0.02'],['speed','Rapidez de bala (m/s)','300'],['m2','Masa de bloque (kg)','2']],
  angular:[['mass','Masa (kg)','2'],['position','r: x,y,z (m)','3,4,0','text'],['velocity','v: x,y,z (m/s)','-1,2,0','text']],
  potential:[['coefficients','a,b,c,d en U(x)=ax³+bx²+cx+d (J, x en m)','1,-6,9,0','text']],
  forces:[['rows','Fuerzas: Fx, Fy, x, y; una por línea','3, 4, 0, 0\n-1, 2, 2, 0','textarea']],
  cables:[['weight','Peso (N)','100'],['left','Ángulo cable izquierdo desde horizontal (°)','30'],['right','Ángulo derecho (°)','45']],
  beam:[['length','Longitud de viga (m)','4'],['weight','Peso de la viga (N)','20'],['loads','Cargas: peso (N), posición (m); una por línea','40, 1\n60, 3','textarea']],
  circular:[['radius','Radio (m)','2'],['omega','Velocidad angular inicial (rad/s)','3'],['alpha','Aceleración angular (rad/s²)','0.5'],['time','Tiempo (s)','4']],
  river:[['boat','Rapidez del bote respecto al agua (m/s)','5'],['current','Corriente con signo (m/s)','3']],
  incline:[['mass','Masa (kg)','5'],['angle','Ángulo (°)','30'],['friction','Coeficiente de fricción cinética','0.1'],['distance','Distancia recorrida (m)','2']],
  atwood:[['m1','Masa 1 (kg)','5'],['m2','Masa 2 (kg)','3'],['inertia','Inercia I (kg·m², o masa de disco)','0'],['pulleyMass','Masa de polea disco (kg, deja I vacía)',''],['radius','Radio de polea (m), si tiene inercia','0.2']],
  bank:[['radius','Radio (m)','50'],['speed','Rapidez (m/s)','20'],['friction','Coeficiente de fricción','0.2']],
  loop:[['height','Altura inicial desde el fondo (m)','5'],['radius','Radio del rizo (m)','2']],
  collision:[['m1','Masa 1 (kg)','2'],['v1','Velocidad inicial 1 (m/s)','3'],['m2','Masa 2 (kg)','1'],['v2','Velocidad inicial 2 (m/s)','0'],['e','Coeficiente de restitución (0–1)','1']],
  collision2d:[['m1','Masa 1 (kg)','2'],['vi1','Velocidad inicial 1: vx, vy','3, 0','text'],['m2','Masa 2 (kg)','1'],['vi2','Velocidad inicial 2: vx, vy','0, 0','text'],['vf1','Velocidad final 1: vx, vy (o rapidez y ángulo)','1, 1','text'],['vfSpeed','Rapidez final 1 (m/s, deja vector vacío)',''],['vfAngle','Ángulo final 1 desde +x (°)','30']],
  center:[['particles','Partículas: masa, x, y; una por línea','2, 0, 0\n1, 3, 0','textarea']],
  kinetic:[['particles','Partículas: masa, x, y, vx, vy; una por línea','2, 0, 0, 1, 0\n1, 3, 0, 0, 0','textarea']],
  inertia:[['shape','Cuerpo: disk, hoop, rodCenter, rodEnd, solidSphere','disk'],['mass','Masa (kg)','2'],['size','Radio o longitud (m)','0.5']],
  rolling:[['shape','Cuerpo: solidCylinder, hoop, solidSphere','solidCylinder','text'],['mass','Masa (kg)','10'],['radius','Radio (m)','0.2'],['angle','Ángulo del plano (°)','30'],['distance','Distancia recorrida (m)','3'],['friction','μ estática disponible (opcional)','','text']],
  skater:[['initialInertia','Inercia inicial (kg·m²)','3'],['initialOmega','ω inicial (rad/s)','2'],['finalInertia','Inercia final (kg·m²)','1.2']],
  hingedrod:[['mass','Masa de varilla (kg)','2'],['length','Longitud de varilla (m)','1']],
  apsides:[['periapsisRadius','Radio periapsis (m)','10000000'],['periapsisSpeed','Rapidez periapsis (m/s)','9000'],['apoapsisRadius','Radio apoapsis (m)','20000000']],
  orbit:[['mass','Masa central (kg)','5.972e24'],['radius','Radio orbital desde el centro (m)','6771000'],['satellite','Masa del satélite (kg), opcional','1000']],
  galileo:[['position','Posición inicial x, y','10, 2','text'],['velocity','Velocidad vx, vy','5, 0','text'],['frame','Velocidad del marco vx, vy','2, 0','text'],['time','Tiempo','3']],
  rotating:[['position','Posición x, y','2, 0','text'],['velocity','Velocidad inercial vx, vy','0, 5','text'],['omega','Velocidad angular del marco','2']],
};
const modes={
  vectors:['forces','Operaciones vectoriales 3D','A±B; A·B; A×B; cos θ=(A·B)/(|A||B|); área=|A×B|'],
  polar:['forces','Componentes de fuerza','Fx=F cos θ; Fy=F sen θ'],
  trajectory:['motion','Velocidad y aceleración desde r(t)','v=r′(t); a=r″(t); rapidez=|v|'],
  work:['forces','Trabajo de fuerza constante','W=F d cos θ'],power:['forces','Potencia media','P=W/Δt'],
  impulse:['collisions','Momentum e impulso','p=mv; J=Δp=m(vf−vi)'],
  gravity:['rotation','Atracción gravitacional','F=GM₁M₂/r²'],
  table:['forces','Mesa y masa colgante','a=(m₂g−μm₁g)/(m₁+m₂); T=m₁a+μm₁g=m₂(g−a)'],
  spring:['forces','Lanzamiento desde resorte','½kx²=½mv²'],
  ballistic:['collisions','Péndulo balístico','m bala·v=(m bala+m bloque)V; h=V²/(2g)'],
  angular:['rotation','Momento angular 3D','L=r×mv'],
  potential:['forces','Equilibrio desde potencial cúbico','F=−U′; equilibrio si U′=0; mínimo estable, máximo inestable'],
  forces:['forces','Sistema de fuerzas 2D','R = ΣF; τ₀ = Σ[(x−x₀)Fy − (y−y₀)Fx]'],
  cables:['forces','Dos cables en equilibrio','ΣFx = 0; ΣFy = 0; T₁ = W cos β / sen(α+β)'],
  beam:['forces','Reacciones en viga','R₁+R₂ = Wtotal; R₂L = Wviga L/2 + ΣWᵢxᵢ'],
  circular:['motion','Movimiento circular acelerado','ω = ω₀+αt; θ = ω₀t+½αt²; aᵣ = rω²; aₜ = rα'],
  river:['motion','Bote y corriente','sen θ = vcorriente/vbote; v⊥ = √(vbote²−vcorriente²)'],
  incline:['forces','Plano inclinado con fricción','N = mg cos θ; a = g(sen θ−μ cos θ)'],
  atwood:['forces','Máquina de Atwood y polea','a = (m₁−m₂)g/(m₁+m₂+I/R²)'],
  bank:['motion','Curva peraltada','tan θ = v²/(rg); vₘₐₓ incluye fricción'],
  loop:['motion','Rizo vertical','v²fondo = 2gh; contacto superior si h ≥ 5R/2'],
  collision:['collisions','Colisión 1D','m₁u₁+m₂u₂ = m₁v₁+m₂v₂; e = (v₂−v₁)/(u₁−u₂)'],
  collision2d:['collisions','Colisión 2D','m₁u₁+m₂u₂ = m₁v₁+m₂v₂ por componente'],
  center:['collisions','Centro de masa','rCM = Σmᵢrᵢ / Σmᵢ'],
  kinetic:['collisions','Energía y momento del sistema','K = ½MvCM² + Krel; L₀ = Σrᵢ×mᵢvᵢ'],
  inertia:['rotation','Inercia de cuerpo estándar','I = factor·m·R² o factor·m·L²'],
  rolling:['rotation','Rodadura sin deslizamiento','a = g sen θ/(1+I/mR²); mgh = ½mv²+½Iω²'],
  skater:['rotation','Momento angular de patinador','I₀ω₀ = Iω; ΔK = ½Iω²−½I₀ω₀²'],
  hingedrod:['rotation','Varilla articulada al caer','α₀ = 3g/(2L); ωvertical = √(3g/L)'],
  apsides:['rotation','Velocidad en los ápsides','h = rₚvₚ = rₐvₐ'],
  orbit:['rotation','Órbita circular','v = √(GM/r); T = 2π√(r³/GM); E = −GMm/(2r)'],
  galileo:['motion','Transformación de Galileo','r′ = r−Vt; v′ = v−V'],
  rotating:['motion','Velocidad en marco giratorio','vrel = vinercial−ω×r'],
};
const groupNames={forces:'Fuerzas y equilibrio',motion:'Movimiento y marcos',collisions:'Colisiones y centro de masa',rotation:'Rotación y gravitación'};
const unitSpecs={
  length:MECHANICS_UNITS.length,time:MECHANICS_UNITS.time,speed:MECHANICS_UNITS.speed,
  mass:MECHANICS_UNITS.mass,force:MECHANICS_UNITS.force,
  energy:MECHANICS_UNITS.energy,stiffness:{'N/m':1,'kN/m':1000},
  angle:{'°':1,'rad':180/Math.PI},angularSpeed:{'rad/s':1,'°/s':Math.PI/180,'rpm':2*Math.PI/60},
  angularAcceleration:{'rad/s²':1,'°/s²':Math.PI/180},inertia:{'kg·m²':1,'lb·ft²':0.45359237*0.3048**2},
};
const scalarDimensions={weight:'force',left:'angle',right:'angle',angle:'angle',length:'length',radius:'length',height:'length',distance:'length',size:'length',time:'time',mass:'mass',m1:'mass',m2:'mass',satellite:'mass',boat:'speed',current:'speed',speed:'speed',v1:'speed',v2:'speed',omega:'angularSpeed',alpha:'angularAcceleration',inertia:'inertia',initialInertia:'inertia',finalInertia:'inertia',initialOmega:'angularSpeed',periapsisRadius:'length',apoapsisRadius:'length',periapsisSpeed:'speed'};
Object.assign(scalarDimensions,{energy:'energy',stiffness:'stiffness',pulleyMass:'mass',vfSpeed:'speed',vfAngle:'angle'});
const vectorDimensions={vi1:'speed',vi2:'speed',vf1:'speed',position:'length',velocity:'speed',frame:'speed'};
const rowDimensions={forces:{rows:['force','force','length','length']},beam:{loads:['force','length']},
  center:{particles:['mass','length','length']},kinetic:{particles:['mass','length','length','speed','speed']}};
const unitOptions=(key,dimension)=>`<select id="mechplus-${key}-${dimension}-unit" class="tool-input" data-action="mechPlusUnitChanged" data-event="change" data-arg="${key}:${dimension}" data-previous="${Object.keys(unitSpecs[dimension])[0]}">${Object.keys(unitSpecs[dimension]).map(unit=>`<option value="${unit}">${unit}</option>`).join('')}</select>`;
function unitFactor(key,dimension) {
  const unit=document.getElementById(`mechplus-${key}-${dimension}-unit`)?.value;
  return unitSpecs[dimension][unit]??Object.values(unitSpecs[dimension])[0];
}
const value=key=>document.getElementById(`mechplus-${key}`).value.trim();
function num(key,optional=false) {
  const raw=value(key);
  if (optional&&raw==='') return null;
  if (raw===''||!Number.isFinite(Number(raw))) throw new RangeError(`${key}: introduce un número finito`);
  return Number(raw)*(scalarDimensions[key]?unitFactor(key,scalarDimensions[key]):1);
}
function rows(key,width) {
  const lines=value(key).split(/[\n;]+/).map(line=>line.trim()).filter(Boolean);
  if (!lines.length||lines.length>100) throw new RangeError(`${key}: introduce entre 1 y 100 filas`);
  const dimensions=rowDimensions[document.getElementById('mechplus-mode').value]?.[key]||Array(width).fill(vectorDimensions[key]||null);
  return lines.map(line=>{
    const cells=line.split(/[,\s]+/).filter(Boolean).map(Number);
    if (cells.length!==width||cells.some(cell=>!Number.isFinite(cell))) throw new RangeError(`${key}: cada fila requiere ${width} números`);
    return cells.map((value,i)=>value*(dimensions[i]?unitFactor(key,dimensions[i]):1));
  });
}
const vector=key=>{const list=rows(key,2);if(list.length!==1) throw new RangeError(`${key}: introduce un vector de dos componentes`);return list[0];};
const singleRow=(key,width)=>{const list=rows(key,width);if(list.length!==1)throw new RangeError(`${key}: introduce una sola fila`);return list[0];};
function calculate(mode) {
  if(mode==='vectors')return vectorPair(singleRow('first',3),singleRow('second',3));
  if(mode==='polar')return polarForce(num('weight'),num('angle'));
  if(mode==='trajectory')return particleKinematics(value('expressions').split(/\n|;/).map(x=>x.trim()).filter(Boolean),num('time'));
  if(mode==='work')return workByForce(num('weight'),num('distance'),num('angle'));
  if(mode==='power')return averagePower(num('energy'),num('time'));
  if(mode==='impulse')return linearImpulse(num('mass'),num('v1'),num('v2'));
  if(mode==='gravity'){const {magnitude,...data}=gravitationalAttraction(num('m1'),num('m2'),num('distance'));return {forceMagnitude:magnitude,...data};}
  if(mode==='table')return tablePulley(num('m1'),num('m2'),num('friction'));
  if(mode==='spring')return springLaunch(num('stiffness'),num('distance'),num('mass'));
  if(mode==='ballistic')return ballisticPendulum(num('m1'),num('speed'),num('m2'));
  if(mode==='angular')return angularMomentumVector(num('mass'),singleRow('position',3),singleRow('velocity',3));
  if(mode==='potential')return potentialEquilibria(singleRow('coefficients',4));
  if(mode==='forces') return forceSystem2D(rows('rows',4).map(([fx,fy,x,y])=>({force:[fx,fy],point:[x,y]})));
  if(mode==='cables') return twoCableEquilibrium(num('weight'),num('left'),num('right'));
  if(mode==='beam') return beamReactions(num('length'),num('weight'),rows('loads',2).map(([weight,position])=>({weight,position})));
  if(mode==='circular') return circularMotion(num('radius'),num('omega'),num('alpha'),num('time'));
  if(mode==='river') return riverCrossing(num('boat'),num('current'));
  if(mode==='incline') return inclinedPlane(num('mass'),num('angle'),num('friction'),num('distance'));
  if(mode==='atwood'){
    const mass=num('pulleyMass',true),inertia=num('inertia',true),radius=num('radius');
    if(mass!==null&&inertia!==null)throw new RangeError('Introduce inercia o masa de polea, solo una.');
    const I=mass===null?(inertia??0):standardInertia('disk',mass,radius).inertia;
    return {...atwood(num('m1'),num('m2'),undefined,I,radius),inertia:I,assumption:'Cuerda inextensible sin deslizamiento; polea disco si se suministra su masa.'};
  }
  if(mode==='bank') return bankedCurve(num('radius'),num('speed'),num('friction'));
  if(mode==='loop') return verticalLoop(num('height'),num('radius'));
  if(mode==='collision') return collisionOneDimensional(num('m1'),num('v1'),num('m2'),num('v2'),num('e'));
  if(mode==='collision2d'){
    const speed=num('vfSpeed',true);
    if(speed!==null&&(speed<0||value('vf1')))throw new RangeError('Con rapidez final no negativa, deja el vector final vacío.');
    const angle=speed===null?0:num('vfAngle')*Math.PI/180;
    const final=speed===null?vector('vf1'):[speed*Math.cos(angle),speed*Math.sin(angle)];
    return collisionTwoDimensional(num('m1'),vector('vi1'),num('m2'),vector('vi2'),final);
  }
  if(mode==='center') return centerOfMass(rows('particles',3).map(([mass,x,y])=>({mass,position:[x,y]})));
  if(mode==='kinetic') return kineticDecomposition(rows('particles',5).map(([mass,x,y,vx,vy])=>({mass,position:[x,y],velocity:[vx,vy]})));
  if(mode==='inertia') return standardInertia(value('shape'),num('mass'),num('size'));
  if(mode==='rolling') return rollingDownIncline(num('mass'),num('radius'),num('angle'),num('distance'),value('shape'),num('friction',true));
  if(mode==='skater') return angularMomentumSkater(num('initialInertia'),num('initialOmega'),num('finalInertia'));
  if(mode==='hingedrod') return hingedRodDrop(num('mass'),num('length'));
  if(mode==='apsides') return apsisAngularMomentum(num('periapsisRadius'),num('periapsisSpeed'),num('apoapsisRadius'));
  if(mode==='orbit') return circularOrbit(num('mass'),num('radius'),num('satellite',true));
  if(mode==='galileo') return galileanTransform(vector('position'),vector('velocity'),vector('frame'),num('time'));
  if(mode==='rotating') return rotatingFrameVelocity(vector('velocity'),vector('position'),num('omega'));
  throw new RangeError('Problema no disponible');
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
