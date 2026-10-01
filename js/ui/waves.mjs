import {physicsOutputControls} from './physics-output.mjs';
export {physicsOutputUnitChanged} from './physics-output.mjs';
import {
  harmonicMotion, waveRelation, dampingFromAmplitudes, springOscillator, pendulumPeriod, phasorSum, beats, WAVE_C,
  travelingWave, stringWave, stringHarmonics, standingWave, deepWaterDispersion, wavePowerString,
  intensityLevel, combineSoundLevels, pointSourceSound, pointSourceDistanceForLevel,
  dopplerFrequency, stringBoundary, gasSoundSpeed, materialWaveSpeed, machCone, movingWallEcho,
  electromagneticWave, refractiveMedium, normalIncidence, polarizerChain,
  youngInterference, soapFilmConstructive, newtonRing,
  lcOscillation, tubeModes, lissajous, multipleSlitInterference, gratingOrders,
} from '../math/waves.mjs';
import { drawWavePlot } from '../graphics/wave-plot.mjs';

const fmt=value=>value===Infinity?'∞':Number.isFinite(value)?(value===0?'0':String(Number(value.toPrecision(10)))):'—';
const modes={
  harmonic:{group:'oscillations',name:'Movimiento armónico simple',fields:[['a','Amplitud A (m)','0.05'],['w','ω (rad/s)','12.566370614359172'],['phase','Fase φ (rad)','1.0471975511965976'],['time','Tiempo t (s)','0.5'],['k','Resorte k (N/m, opcional)','']]},
  spring:{group:'oscillations',name:'Resorte amortiguado y forzado',fields:[['m','Masa m (kg)','0.5'],['k','Constante k (N/m)','50'],['b','Amortiguamiento b (kg/s)','2'],['force','Fuerza pico F₀ (N, opcional)','10'],['drive','ω motriz (rad/s, opcional)','8']]},
  pendulum:{group:'oscillations',name:'Péndulo simple o físico',fields:[['length','Longitud L (m)','1.5'],['g','Gravedad (m/s²)','9.80665'],['moment','Momento I (kg·m², opcional)',''],['mass','Masa (kg, físico)',''],['distance','Distancia al centro de masa (m, físico)','']]},
  rod:{group:'oscillations',name:'Péndulo de varilla uniforme',fields:[['length','Longitud L (m)','1'],['g','Gravedad (m/s²)','9.80665']]},
  phasors:{group:'oscillations',name:'Suma de fasores',fields:[['pairs','Amplitud, fase en radianes; un fasor por línea','3, 0\n4, 1.5707963267948966','textarea']]},
  beats:{group:'oscillations',name:'Pulsaciones',fields:[['f1','Frecuencia f₁ (Hz)','440'],['f2','Frecuencia f₂ (Hz)','446']]},
  decay:{group:'oscillations',name:'Amortiguamiento desde amplitudes',fields:[['initial','Amplitud inicial (m)','0.1'],['final','Amplitud final (m)','0.02'],['cycles','Oscilaciones transcurridas','5'],['period','Período amortiguado T (s)','0.5']]},
  lc:{group:'oscillations',name:'Oscilador LC ideal',fields:[['l','Inductancia L (H)','0.1'],['c','Capacitancia C (F)','0.0001'],['q','Carga inicial Q₀ (C)','0.001'],['time','Tiempo t (s)','0.005']]},
  lissajous:{group:'oscillations',name:'Figura de Lissajous',fields:[['ax','Amplitud X','1'],['ay','Amplitud Y','1'],['wx','ωx (rad/s)','2'],['wy','ωy (rad/s)','3'],['phase','Fase X (rad)','1.5707963267948966'],['time','Tiempo t (s)','0']]},
  traveling:{group:'mechanical',name:'Onda viajera',fields:[['a','Amplitud A (m)','0.02'],['k','Número de onda k (rad/m)','3'],['w','ω (rad/s)','12'],['x','Posición x (m)','0'],['time','Tiempo t (s)','0']]},
  relation:{group:'mechanical',name:'Velocidad, frecuencia y longitud de onda',fields:[['speed','Velocidad v (m/s)','343'],['frequency','Frecuencia f (Hz, deja λ vacía)','440'],['lambda','λ (m, deja f vacía)','']]},
  string:{group:'mechanical',name:'Cuerda y armónicos',fields:[['tension','Tensión (N, deja vacía si das v)','50'],['density','Densidad lineal μ (kg/m, o masa total)','0.01'],['mass','Masa total (kg, deja μ vacía)',''],['speed','Velocidad conocida (m/s, deja T y μ vacías)',''],['length','Longitud L (m, necesaria para masa o armónicos)','1.2']]},
  tube:{group:'mechanical',name:'Modos de tubo',fields:[['length','Longitud L (m)','1'],['speed','Velocidad del sonido (m/s)','343'],['boundary','Extremos: open-open o closed-open','open-open','select'],['count','Número de modos (1–30)','5']]},
  standing:{group:'mechanical',name:'Onda estacionaria',fields:[['a','Amplitud pico A (m)','0.04'],['k','k (rad/m)','15.707963267949'],['w','ω (rad/s)','628.31853071796'],['length','Longitud visible (m)','0.5']]},
  dispersion:{group:'mechanical',name:'Dispersión en agua profunda',fields:[['lambda','Longitud de onda λ (m)','10'],['g','Gravedad (m/s²)','9.80665']]},
  stringpower:{group:'mechanical',name:'Potencia en cuerda',fields:[['density','Densidad lineal μ (kg/m)','0.02'],['w','ω (rad/s)','200'],['a','Amplitud A (m)','0.01'],['speed','Velocidad (m/s)','30']]},
  sound:{group:'mechanical',name:'Sonido y decibelios',fields:[['levels','Niveles a combinar (dB)','60, 63'],['power','Potencia de fuente puntual (W)','50'],['distance','Distancia (m)','10'],['target','Nivel objetivo para distancia (dB)','60']]},
  intensity:{group:'mechanical',name:'Intensidad a decibelios',fields:[['intensity','Intensidad I (W/m²)','0.000001'],['reference','Referencia I₀ (W/m²)','0.000000000001']]},
  mach:{group:'mechanical',name:'Número de Mach y cono',fields:[['source','Velocidad del objeto (m/s)','680'],['speed','Velocidad del sonido (m/s)','343']]},
  doppler:{group:'mechanical',name:'Doppler y eco',fields:[['frequency','Frecuencia de fuente (Hz)','500'],['speed','Velocidad del sonido (m/s)','343'],['source','Fuente hacia observador (m/s)','30'],['observer','Observador hacia fuente (m/s)','0'],['wall','Pared hacia fuente (m/s)','0']]},
  boundary:{group:'mechanical',name:'Reflexión en cuerda',fields:[['tension','Tensión (N)','100'],['mu1','μ₁ (kg/m)','0.01'],['mu2','μ₂ (kg/m)','0.04']]},
  material:{group:'mechanical',name:'Velocidad en material/gas y Mach',fields:[['modulus','Módulo elástico (Pa)','200000000000'],['density','Densidad (kg/m³)','7850'],['gamma','γ del gas','1.4'],['temperature','Temperatura (K)','293.15'],['molar','Masa molar (kg/mol)','0.029'],['source','Velocidad de objeto (m/s)','680']]},
  em:{group:'optics',name:'Onda electromagnética',fields:[['electric','E₀ (V/m)','300']]},
  emrelation:{group:'optics',name:'Frecuencia y longitud EM en vacío',fields:[['frequency','Frecuencia f (Hz, deja λ vacía)','100000000'],['lambda','λ (m, deja f vacía)','']]},
  refraction:{group:'optics',name:'Refracción e incidencia normal',fields:[['n','Índice del medio','1.33'],['lambda','λ en vacío (m)','0.0000005'],['n1','Índice inicial','1'],['n2','Índice final','1.5']]},
  polarizers:{group:'optics',name:'Polarizadores sucesivos',fields:[['intensity','Intensidad no polarizada (W/m²)','100'],['angles','Ángulos en grados, en orden','0, 45, 90']]},
  young:{group:'optics',name:'Interferencia de Young',fields:[['lambda','λ (m)','0.00000055'],['separation','Distancia de rendijas d (m)','0.0003'],['screen','Pantalla L (m)','2'],['bright','Orden brillante m (0 central)','3'],['dark','Orden oscuro m (0 primero)','1'],['index','Índice de lámina (opcional)','1.5'],['thickness','Espesor de lámina (m, opcional)','0.00001']]},
  film:{group:'optics',name:'Película delgada',fields:[['n','Índice de película','1.33'],['thickness','Espesor (m)','0.0000003'],['minimum','λ mínima (m, opcional)','0.00000038'],['maximum','λ máxima (m, opcional)','0.00000075']]},
  rings:{group:'optics',name:'Anillos de Newton',fields:[['radius','Radio de curvatura R (m)','1'],['lambda','λ (m)','0.000000589'],['order','Orden m (desde 0)','5']]},
  multislit:{group:'optics',name:'Interferencia de varias rendijas',fields:[['count','Número de rendijas','4'],['separation','Separación d (m)','0.0003'],['lambda','λ (m)','0.00000055'],['angle','Ángulo θ (°)','0']]},
  grating:{group:'optics',name:'Órdenes de red de difracción',fields:[['separation','Separación d (m)','0.000002'],['lambda','λ de referencia (m)','0.00000055'],['minimum','Banda λ mínima (m, opcional)','0.00000038'],['maximum','Banda λ máxima (m, opcional)','0.00000075']]},
};
const groupNames={oscillations:'Oscilaciones',mechanical:'Ondas mecánicas',optics:'Ondas EM y óptica'};
const visualModes=new Set(['harmonic','traveling','standing','lissajous']);
const unitFactors={
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
const unitsByMode={
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
let playing=false,lastFrame=0;

function read(key) {return document.getElementById(`waves-${key}`).value.trim();}
function number(key,optional=false) {
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
function numbers(key) {
  const parts=read(key).split(/[,;\s]+/).filter(Boolean);
  if (!parts.length||parts.length>100||parts.some(part=>!Number.isFinite(Number(part)))) throw new RangeError(`${key}: lista numérica inválida`);
  return parts.map(Number);
}
const values=list=>list.map(fmt).join(', ');
function result(title,lines,data={}) {
  const target=document.getElementById('waves-result');
  target.classList.remove('tool-error');
  target.innerHTML=`<div class="tool-result-title">${title}</div><ol class="geom-steps">${lines.map(line=>`<li>${line}</li>`).join('')}</ol>${physicsOutputControls('waves',waveOutputEntries(data,document.getElementById('waves-mode').value))}`;
}

export function wavesOpenPanel(group) {
  if (!groupNames[group]) return;
  document.getElementById('waves-title').textContent=groupNames[group];
  document.getElementById('waves-heading').textContent=groupNames[group];
  document.getElementById('waves-mode').innerHTML=Object.entries(modes).filter(([,config])=>config.group===group)
    .map(([key,config])=>`<option value="${key}">${config.name}</option>`).join('');
  wavesSelect();
}

export function wavesSelect() {
  playing=false;
  const play=document.getElementById('waves-play');
  if(play) play.textContent='Reproducir';
  const config=modes[document.getElementById('waves-mode').value];
  if (!config) return;
  const mode=document.getElementById('waves-mode').value;
  document.getElementById('waves-fields').innerHTML=config.fields.map(([key,label,defaultValue,type])=>{
    const unitType=unitsByMode[mode]?.[key];
    const unitSelector=unitType?`<select id="waves-${key}-unit" class="tool-input waves-unit" aria-label="Unidad de ${label}">${Object.keys(unitFactors[unitType]).map(unit=>`<option value="${unit}">${unit}</option>`).join('')}</select>`:'';
    const displayLabel=unitType?label.replace(/\s*\(([^)]+)\)/g,(all,inside)=>{
      const [unit,...hints]=inside.split(',');
      return Object.hasOwn(unitFactors[unitType],unit.trim())?(hints.length?` (${hints.join(',').trim()})`:''):all;
    }):label;
    return `<label class="linear-field" for="waves-${key}"><span>${displayLabel}</span>${type==='select'
      ? `<select id="waves-${key}" class="tool-input"><option value="open-open">Ambos abiertos</option><option value="closed-open">Uno cerrado</option></select>`
      :type==='textarea'
      ? `<textarea id="waves-${key}" class="tool-textarea" rows="4">${defaultValue}</textarea>`
      : `<input id="waves-${key}" class="tool-input" type="number" step="any" value="${defaultValue}">`}${unitSelector}</label>`;
  }).join('')+'<p class="calc-res-hint">Las entradas se convierten a SI para calcular; los resultados indican sus unidades.</p>';
  const target=document.getElementById('waves-result');
  target.textContent='';
  target.classList.remove('tool-error');
  document.getElementById('waves-visual').hidden=!visualModes.has(document.getElementById('waves-mode').value);
}

function drawAt(time) {
  const mode=document.getElementById('waves-mode').value;
  if(!visualModes.has(mode)) return;
  const parameters=mode==='harmonic'?{a:number('a'),w:number('w'),phase:number('phase')}:
    mode==='lissajous'?{ax:number('ax'),ay:number('ay'),wx:number('wx'),wy:number('wy'),phase:number('phase')}:
      {a:number('a'),k:number('k'),w:number('w')};
  drawWavePlot(document.getElementById('waves-canvas'),mode,parameters,time);
  document.getElementById('waves-visual-description').textContent=`Gráfica ${mode==='lissajous'?'paramétrica':'de amplitud'} en t = ${fmt(time)} s. Usa el deslizador o reproduce para explorar.`;
}
export function wavesTimeChanged() {
  playing=false;document.getElementById('waves-play').textContent='Reproducir';
  try {drawAt(Number(document.getElementById('waves-time').value));}
  catch(error) {document.getElementById('waves-visual-description').textContent=error.message;}
}
export function wavesRedraw() {
  try {drawAt(Number(document.getElementById('waves-time').value));} catch { /* valores aún no introducidos */ }
}
export function wavesToggleAnimation() {
  playing=!playing;
  document.getElementById('waves-play').textContent=playing?'Pausar':'Reproducir';
  if(!playing) return;
  lastFrame=0;
  const frame=now=>{
    if(!playing||!document.getElementById('waves-app').classList.contains('visible')) {playing=false;return;}
    const delta=lastFrame?Math.min(0.05,(now-lastFrame)/1000):0;
    lastFrame=now;
    const slider=document.getElementById('waves-time'),limit=Number(slider.max)||2;
    slider.value=String((Number(slider.value)+delta)%limit);
    wavesRedraw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export function wavesCalculate() {
  const mode=document.getElementById('waves-mode').value;
  const target=document.getElementById('waves-result');
  try {
    if (mode==='harmonic') {
      const r=harmonicMotion(number('a'),number('w'),number('phase'),number('time'),number('k',true));
      result('Movimiento armónico simple',[`A = ${fmt(r.amplitude)} m; ω = ${fmt(r.omega)} rad/s; φ = ${fmt(r.phase)} rad.`,
        `f = ω/(2π) = ${fmt(r.frequency)} Hz; T = 2π/ω = ${fmt(r.period)} s.`,
        `x(t)=A cos(ωt+φ) = ${fmt(r.position)} m; v(t) = ${fmt(r.velocity)} m/s; a(t) = ${fmt(r.acceleration)} m/s².`,
        `vₘₐₓ = Aω = ${fmt(r.maxSpeed)} m/s; aₘₐₓ = Aω² = ${fmt(r.maxAcceleration)} m/s².`,
        r.energy===null?'Energía: introduce k para calcularla.':`E = ½kA² = ${fmt(r.energy)} J.`], r);
    } else if (mode==='spring') {
      const force=number('force',true),drive=number('drive',true);
      const r=springOscillator(number('m'),number('k'),number('b'),force,drive);
      result('Resorte y amortiguamiento',[`ω₀ = √(k/m) = ${fmt(r.omega0)} rad/s; γ = b/(2m) = ${fmt(r.gamma)} s⁻¹; b crítico = ${fmt(r.criticalDamping)} kg/s.`,
        `Frecuencia natural f₀ = ${fmt(r.frequency)} Hz; período natural T₀ = ${fmt(r.period)} s.`,
        `Régimen: ${r.regime}; ${r.dampedOmega===null?`raíces = ${values(r.roots)} s⁻¹`:`ω′ = ${fmt(r.dampedOmega)} rad/s`}.`,
        `Solución libre: ${r.freeSolution}; C₁ y C₂ dependen de las condiciones iniciales.`,
        `Q = ${fmt(r.quality)}; decremento logarítmico = ${fmt(r.decrement)}; ancho entre medias potencias Δω = b/m = ${fmt(r.bandwidth)} rad/s; ω de máximo de amplitud = ${fmt(r.resonanceOmega)} rad/s.`,
        r.forced?`A(ω)=F₀/√[(k−mω²)²+(bω)²] = ${fmt(r.forced.amplitude)} m; desfase = ${fmt(r.forced.phaseLag)} rad; potencia media disipada = ${fmt(r.forced.averagePower)} W.`:'Introduce F₀ y ω motriz para respuesta a una frecuencia dada.',
        ...(r.resonance?[`Máximo de amplitud: ω_res = ${fmt(r.resonance.omega)} rad/s; A máxima = ${fmt(r.resonance.amplitude)} m; potencia a ω_res = ${fmt(r.resonance.averagePower)} W.`,
          `Máximo de potencia: ω₀ = ${fmt(r.resonance.powerPeakOmega)} rad/s; A(ω₀) = ${fmt(r.resonance.powerPeakAmplitude)} m; P máxima = ${fmt(r.resonance.powerPeak)} W. Frecuencias de media potencia: ${fmt(r.resonance.lowerHalfPower)}, ${fmt(r.resonance.upperHalfPower)} rad/s.`,r.resonance.assumption]:
          force!==null&&number('b')===0?['Sin amortiguamiento: no existe amplitud estacionaria finita en la resonancia ideal.']:[])], r);
    } else if (mode==='pendulum') {
      const r=pendulumPeriod(number('length'),number('g'),number('moment',true),number('mass',true),number('distance',true));
      result('Péndulo',[`Modelo ${r.model}; ${r.model==='simple'?'T = 2π√(L/g)':'T = 2π√(I/(mgd))'} = ${fmt(r.period)} s.`,r.assumption], r);
    } else if (mode==='rod') {
      const length=number('length');
      const r=pendulumPeriod(length,number('g'),length**2/3,1,length/2);
      result('Péndulo de varilla',[`I = mL²/3; d = L/2; la masa se cancela.`,
        `T = 2π√(2L/(3g)) = ${fmt(r.period)} s.`,`Varilla uniforme articulada en un extremo; ${r.assumption}.`], r);
    } else if (mode==='phasors') {
      const pairs=read('pairs').split(/[;\n]+/).map(line=>line.trim()).filter(Boolean).map(line=>{
        const parts=line.split(/[,\s]+/).filter(Boolean).map(Number);
        if (parts.length!==2||parts.some(value=>!Number.isFinite(value))) throw new RangeError('Cada fasor requiere amplitud y fase');
        return parts;
      });
      const r=phasorSum(pairs);
      result('Suma de fasores',[`Σ Aᵢ cos φᵢ = ${fmt(r.real)}; Σ Aᵢ sen φᵢ = ${fmt(r.imaginary)}.`,
        `Amplitud = √(X²+Y²) = ${fmt(r.amplitude)}; fase = atan2(Y,X) = ${fmt(r.phase)} rad.`], r);
    } else if (mode==='beats') {
      const r=beats(number('f1'),number('f2'));
      result('Pulsaciones',[`f de pulsación = |f₁−f₂| = ${fmt(r.beatFrequency)} Hz; portadora = ${fmt(r.carrierFrequency)} Hz.`,r.formula], r);
    } else if (mode==='decay') {
      const r=dampingFromAmplitudes(number('initial'),number('final'),number('cycles'),number('period'));
      result('Amortiguamiento medido',[`δ = ln(A inicial/A final)/N = ${fmt(r.decrement)}.`,
        `γ = δ/T = ${fmt(r.gamma)} s⁻¹; ω′ = 2π/T = ${fmt(r.dampedOmega)} rad/s.`,
        `ω₀ = √(ω′²+γ²) = ${fmt(r.omega0)} rad/s; Q = ω₀/(2γ) = ${fmt(r.quality)}.`,r.assumption], r);
    } else if (mode==='relation'||mode==='emrelation') {
      const r=waveRelation(mode==='emrelation'?WAVE_C:number('speed'),{frequency:number('frequency',true),wavelength:number('lambda',true)});
      result('Relación v = λf',[`v = ${fmt(r.speed)} m/s; f = ${fmt(r.frequency)} Hz; λ = v/f = ${fmt(r.wavelength)} m.`,
        `T = 1/f = ${fmt(r.period)} s; ω = 2πf = ${fmt(r.omega)} rad/s; k = 2π/λ = ${fmt(r.waveNumber)} rad/m.`,
        mode==='emrelation'?'Onda electromagnética en vacío: v=c.':'Usa la velocidad de fase del medio.'], r);
    } else if (mode==='lc') {
      const r=lcOscillation(number('l'),number('c'),number('q'),number('time'));
      result('Oscilador LC ideal',[`ω = 1/√(LC) = ${fmt(r.omega)} rad/s; f = ${fmt(r.frequency)} Hz; T = ${fmt(r.period)} s.`,
        `Q(t)=Q₀cos(ωt) = ${fmt(r.charge)} C; I(t)=−Q₀ωsen(ωt) = ${fmt(r.current)} A.`,
        `E capacitor = ${fmt(r.capacitorEnergy)} J; E bobina = ${fmt(r.inductorEnergy)} J; E total = ${fmt(r.totalEnergy)} J.`,r.assumption], r);
    } else if (mode==='lissajous') {
      const r=lissajous(number('ax'),number('ay'),number('wx'),number('wy'),number('phase'),number('time'));
      result('Figura de Lissajous',[`x(t)=Ax sen(ωx t+φ) = ${fmt(r.x)}; y(t)=Ay sen(ωy t) = ${fmt(r.y)}.`,
        `Relación ωx/ωy = ${fmt(r.ratio)}; ventana de trazado = ${fmt(r.windowTime)} s; ${r.points.length} muestras.`,
        ...(r.ellipse?[`Eliminando t: X² + Y² + (${fmt(r.ellipse.crossCoefficient)})XY = ${fmt(r.ellipse.rightSide)}, con X=x/${fmt(number('ax'))}, Y=y/${fmt(number('ay'))}.`,
          r.ellipse.degenerate?'Curva degenerada o prácticamente recta: |sen φ| < 10⁻¹².':'Elipse para frecuencias iguales; fase relativa φ.']:[]),r.assumption], r);
    } else if (mode==='traveling') {
      const r=travelingWave(number('a'),number('k'),number('w'),number('x'),number('time'));
      result('Onda viajera seno',[`λ = 2π/k = ${fmt(r.wavelength)} m; f = ω/(2π) = ${fmt(r.frequency)} Hz; v = ω/k = ${fmt(r.speed)} m/s.`,
        `k = ${fmt(number('k'))} rad/m; ω = ${fmt(number('w'))} rad/s; velocidad transversal máxima Aω = ${fmt(r.maxTransverseVelocity)} m/s.`,
        `y(x,t) = ${fmt(r.displacement)} m; velocidad transversal = ${fmt(r.transverseVelocity)} m/s; aceleración = ${fmt(r.transverseAcceleration)} m/s².`], r);
    } else if (mode==='string') {
      const speed=number('speed',true),length=number('length',true),mass=number('mass',true);
      const tension=number('tension',true),density=number('density',true);
      let r,derivation;
      if(speed!==null){
        if(tension!==null||density!==null||mass!==null)throw new RangeError('Con velocidad conocida, deja tensión, densidad y masa vacías.');
        r=stringHarmonics(speed,length);derivation=`Velocidad dada v = ${fmt(r.speed)} m/s.`;
      }else{
        if(mass!==null&&(density!==null||mass<=0||length===null||length<=0))throw new RangeError('Para μ=masa/L, usa masa y longitud positivas y deja μ vacía.');
        const mu=mass===null?density:mass/length;
        r=stringWave(tension,mu,length);derivation=`${mass===null?'':`μ = masa/L = ${fmt(mu)} kg/m; `}v = √(T/μ) = ${fmt(r.speed)} m/s.`;
      }
      result('Cuerda',[derivation,r.harmonics?`fₙ = nv/(2L); f₁, f₂, f₃ = ${values(r.harmonics)} Hz.`:'Introduce L para los armónicos.',
        'Cuerda uniforme con ambos extremos fijos; tensión constante.'], r);
    } else if (mode==='tube') {
      const r=tubeModes(number('length'),number('speed'),read('boundary'),number('count'));
      result('Modos de tubo',[r.boundary==='open-open'?'Ambos extremos abiertos: fₙ=nv/(2L).':'Un extremo cerrado: fₙ=(2n−1)v/(4L).',
        `Armónicos: ${r.modes.map(item=>`n=${item.harmonic}: ${fmt(item.frequency)} Hz, λ=${fmt(item.wavelength)} m`).join('; ')}.`,r.assumption], r);
    } else if (mode==='standing') {
      const r=standingWave(number('a'),number('k'),number('w'),number('length'));
      result('Onda estacionaria',[`v = ω/k = ${fmt(r.speed)} m/s; λ = 2π/k = ${fmt(r.wavelength)} m.`,
        `Nodos xₙ = nπ/k: ${values(r.nodes)} m; antinodos xₙ = (n+½)π/k: ${values(r.antinodes)} m.`,
        `Componentes viajeras de amplitud ${fmt(r.componentAmplitude)} m: ${r.componentFormula}.`], r);
    } else if (mode==='dispersion') {
      const r=deepWaterDispersion(number('lambda'),number('g'));
      result('Agua profunda',[`ω = √(gk), k = 2π/λ = ${fmt(r.waveNumber)} rad/m.`,
        `Velocidad de fase = ω/k = ${fmt(r.phaseSpeed)} m/s; velocidad de grupo = ½ω/k = ${fmt(r.groupSpeed)} m/s.`], r);
    } else if (mode==='stringpower') {
      const r=wavePowerString(number('density'),number('w'),number('a'),number('speed'));
      result('Potencia media de cuerda',[`P̄ = ½ μ ω² A² v = ${fmt(r.averagePower)} W.`], r);
    } else if (mode==='sound') {
      const levels=numbers('levels'),combined=combineSoundLevels(levels);
      const source=pointSourceSound(number('power'),number('distance'));
      const targetLevel=pointSourceDistanceForLevel(number('power'),number('target'));
      result('Sonido y decibelios',[`I total = Σ Iᵢ = ${fmt(combined.intensity)} W/m²; nivel total = ${fmt(combined.decibels)} dB.`,
        `Fuente puntual: I=P/(4πr²) = ${fmt(source.intensity)} W/m²; nivel = ${fmt(source.decibels)} dB.`,
        `Distancia para ${fmt(number('target'))} dB = ${fmt(targetLevel.distance)} m (propagación esférica ideal).`], {...combined,sourceIntensity:source.intensity,distance:targetLevel.distance});
    } else if (mode==='intensity') {
      const r=intensityLevel(number('intensity'),number('reference'));
      result('Nivel de intensidad',[`β = 10 log₁₀(I/I₀) = ${fmt(r.decibels)} dB.`,`Referencia I₀ = ${fmt(number('reference'))} W/m².`], r);
    } else if (mode==='mach') {
      const r=machCone(number('source'),number('speed'));
      result('Mach y cono',[`Mach = v objeto/v sonido = ${fmt(r.mach)}.`,
        r.angleDegrees===null?'No hay cono de Mach subsónico o sónico.':`Semiángulo μ = arcsen(1/Mach) = ${fmt(r.angleDegrees)}°.`,
        'Velocidades respecto al mismo medio.'], r);
    } else if (mode==='doppler') {
      const speed=number('speed'),frequency=number('frequency');
      const r=dopplerFrequency(frequency,speed,number('source'),number('observer'));
      const echo=movingWallEcho(frequency,speed,number('wall'));
      result('Doppler y eco',[`f′ = f(v+vₒ)/(v−vₛ) = ${fmt(r.observed)} Hz.`,r.convention,
        `Eco de pared móvil: fₑ = f(v+u)/(v−u) = ${fmt(echo.echoFrequency)} Hz.`], r);
    } else if (mode==='boundary') {
      const r=stringBoundary(number('tension'),number('mu1'),number('mu2'));
      result('Frontera de cuerda',[`Z₁ = √(Tμ₁) = ${fmt(r.firstImpedance)}; Z₂ = √(Tμ₂) = ${fmt(r.secondImpedance)}.`,
        `Amplitud reflejada/incidente = (Z₁−Z₂)/(Z₁+Z₂) = ${fmt(r.reflectedAmplitude)}; transmitida/incidente = ${fmt(r.transmittedAmplitude)}.`,
        `Fracciones de energía: R = ${fmt(r.reflectedEnergy)}, T = ${fmt(r.transmittedEnergy)}; R+T = ${fmt(r.reflectedEnergy+r.transmittedEnergy)}.`], r);
    } else if (mode==='material') {
      const material=materialWaveSpeed(number('modulus'),number('density'));
      const gas=gasSoundSpeed(number('gamma'),number('temperature'),number('molar'));
      const mach=machCone(number('source'),gas.speed);
      result('Velocidades de onda',[`Sólido/líquido: v = √(módulo/ρ) = ${fmt(material.speed)} m/s.`,
        `Gas ideal: v = √(γRT/M) = ${fmt(gas.speed)} m/s.`,
        `Mach = v objeto/v gas = ${fmt(mach.mach)}; ángulo de cono = ${fmt(mach.angleDegrees)}° (solo si Mach > 1).`], {materialSpeed:material.speed,gasSpeed:gas.speed,angleDegrees:mach.angleDegrees});
    } else if (mode==='em') {
      const r=electromagneticWave(number('electric'));
      result('Onda EM plana',[`B₀ = E₀/c = ${fmt(r.magneticPeak)} T.`,
        `⟨S⟩ = ½ε₀cE₀² = ${fmt(r.averageIntensity)} W/m²; S pico = ${fmt(r.peakPoynting)} W/m².`,
        `Vector medio ⟨S⃗⟩ = ${fmt(r.averageIntensity)} k̂ W/m², donde k̂ apunta en la dirección de propagación E⃗×B⃗.`,
        `Presión absorbente = ⟨S⟩/c = ${fmt(r.absorbingPressure)} Pa; reflectora ideal = ${fmt(r.reflectingPressure)} Pa.`,r.assumption], r);
    } else if (mode==='refraction') {
      const r=refractiveMedium(number('n'),number('lambda'));
      const boundary=normalIncidence(number('n1'),number('n2'));
      result('Refracción e incidencia normal',[`v = c/n = ${fmt(r.speed)} m/s; λ = λ₀/n = ${fmt(r.wavelength)} m; f = ${fmt(r.frequency)} Hz.`,
        `R = ((n₁−n₂)/(n₁+n₂))² = ${fmt(boundary.reflectance)}; T = 1−R = ${fmt(boundary.transmittance)}.`,boundary.assumption], r);
    } else if (mode==='polarizers') {
      const r=polarizerChain(number('intensity'),numbers('angles'));
      result('Polarizadores ideales',[`Primero: I₀/2 = ${fmt(r.after[0])} W/m²; siguientes por ley de Malus cos²Δθ.`,
        `Intensidades tras cada polarizador: ${values(r.after)} W/m²; final = ${fmt(r.final)} W/m².`], r);
    } else if (mode==='young') {
      const r=youngInterference(number('lambda'),number('separation'),number('screen'),number('bright'),number('dark'),number('index',true),number('thickness',true));
      result('Interferencia de Young',[`Separación de franjas Δy = λL/d = ${fmt(r.spacing)} m.`,
        `Brillante m: y = mΔy = ${fmt(r.bright)} m; oscura m: y = (m+½)Δy = ${fmt(r.dark)} m.`,
        r.filmShift===null?'Sin lámina.':`Corrimiento por lámina: (n−1)tL/d = ${fmt(r.filmShift)} m.`,r.convention], r);
    } else if (mode==='film') {
      const minimum=number('minimum',true),maximum=number('maximum',true);
      const r=soapFilmConstructive(number('n'),number('thickness'),minimum===null&&maximum===null?null:[minimum,maximum]);
      result('Película en aire',[r.formula,r.wavelengths===null?'Sin banda espectral: todos los órdenes m≥0 son posibles.':
        `En la banda: ${r.wavelengths.length?r.wavelengths.map(item=>`m=${item.order}: ${fmt(item.wavelength)} m`).join('; '):'ninguna longitud de onda'}.`], r);
    } else if (mode==='rings') {
      const R=number('radius'),lambda=number('lambda'),order=number('order');
      const dark=newtonRing(R,lambda,order,true),bright=newtonRing(R,lambda,order,false);
      result('Anillos de Newton',[`Radio oscuro m=${order}: √(mλR) = ${fmt(dark.radius)} m.`,
        `Radio brillante m=${order}: √((m+½)λR) = ${fmt(bright.radius)} m.`,dark.convention], {darkRadius:dark.radius,brightRadius:bright.radius});
    } else if (mode==='multislit') {
      const r=multipleSlitInterference(number('count'),number('separation'),number('lambda'),number('angle'));
      result('Varias rendijas',[`δ = 2πd sen θ/λ = ${fmt(r.phase)} rad; orden continuo d sen θ/λ = ${fmt(r.order)}.`,
        `I/(N²I₁) = [sen(Nδ/2)/(N sen(δ/2))]² = ${fmt(r.normalizedIntensity)}.`,r.assumption], r);
    } else if (mode==='grating') {
      const r=gratingOrders(number('separation'),number('lambda'),number('minimum',true),number('maximum',true));
      result('Red de difracción',[r.assumption,`Órdenes físicamente posibles en la banda: ${r.orders.map(item=>`m=${item.order}, λ∈[${fmt(item.wavelengthRange[0])}, ${fmt(item.wavelengthRange[1])}] m${item.angleDegrees===null?'':`, θ(λ referencia)=${fmt(item.angleDegrees)}°`}`).join('; ')}.`], r);
    } else throw new RangeError('Selecciona una operación válida');
    if(visualModes.has(mode)) wavesRedraw();
  } catch(error) {
    target.textContent=error.message;
    target.classList.add('tool-error');
  }
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
