import {
  harmonicMotion, springOscillator, pendulumPeriod, phasorSum, beats,
  travelingWave, stringWave, standingWave, deepWaterDispersion, wavePowerString,
  intensityLevel, combineSoundLevels, pointSourceSound, pointSourceDistanceForLevel,
  dopplerFrequency, stringBoundary, gasSoundSpeed, materialWaveSpeed, machCone, movingWallEcho,
  electromagneticWave, refractiveMedium, normalIncidence, polarizerChain,
  youngInterference, soapFilmConstructive, newtonRing,
  lcOscillation, tubeModes, lissajous, multipleSlitInterference, gratingOrders,
} from '../math/waves.mjs';
import { drawWavePlot } from '../graphics/wave-plot.mjs';

const fmt=value=>Number.isFinite(value)?(value===0?'0':String(Number(value.toPrecision(10)))):'—';
const modes={
  harmonic:{group:'oscillations',name:'Movimiento armónico simple',fields:[['a','Amplitud A (m)','0.05'],['w','ω (rad/s)','12.566370614359172'],['phase','Fase φ (rad)','1.0471975511965976'],['time','Tiempo t (s)','0.5'],['k','Resorte k (N/m, opcional)','']]},
  spring:{group:'oscillations',name:'Resorte amortiguado y forzado',fields:[['m','Masa m (kg)','0.5'],['k','Constante k (N/m)','50'],['b','Amortiguamiento b (kg/s)','2'],['force','Fuerza pico F₀ (N, opcional)','10'],['drive','ω motriz (rad/s, opcional)','8']]},
  pendulum:{group:'oscillations',name:'Péndulo simple o físico',fields:[['length','Longitud L (m)','1.5'],['g','Gravedad (m/s²)','9.80665'],['moment','Momento I (kg·m², opcional)',''],['mass','Masa (kg, físico)',''],['distance','Distancia al centro de masa (m, físico)','']]},
  phasors:{group:'oscillations',name:'Suma de fasores',fields:[['pairs','Amplitud, fase en radianes; un fasor por línea','3, 0\n4, 1.5707963267948966','textarea']]},
  beats:{group:'oscillations',name:'Pulsaciones',fields:[['f1','Frecuencia f₁ (Hz)','440'],['f2','Frecuencia f₂ (Hz)','446']]},
  lc:{group:'oscillations',name:'Oscilador LC ideal',fields:[['l','Inductancia L (H)','0.1'],['c','Capacitancia C (F)','0.0001'],['q','Carga inicial Q₀ (C)','0.001'],['time','Tiempo t (s)','0.005']]},
  lissajous:{group:'oscillations',name:'Figura de Lissajous',fields:[['ax','Amplitud X','1'],['ay','Amplitud Y','1'],['wx','ωx (rad/s)','2'],['wy','ωy (rad/s)','3'],['phase','Fase X (rad)','1.5707963267948966'],['time','Tiempo t (s)','0']]},
  traveling:{group:'mechanical',name:'Onda viajera',fields:[['a','Amplitud A (m)','0.02'],['k','Número de onda k (rad/m)','3'],['w','ω (rad/s)','12'],['x','Posición x (m)','0'],['time','Tiempo t (s)','0']]},
  string:{group:'mechanical',name:'Cuerda y armónicos',fields:[['tension','Tensión (N)','50'],['density','Densidad lineal μ (kg/m)','0.01'],['length','Longitud L (m, opcional)','1.2']]},
  tube:{group:'mechanical',name:'Modos de tubo',fields:[['length','Longitud L (m)','1'],['speed','Velocidad del sonido (m/s)','343'],['boundary','Extremos: open-open o closed-open','open-open','select'],['count','Número de modos (1–30)','5']]},
  standing:{group:'mechanical',name:'Onda estacionaria',fields:[['a','Amplitud pico A (m)','0.04'],['k','k (rad/m)','15.707963267949'],['w','ω (rad/s)','628.31853071796'],['length','Longitud visible (m)','0.5']]},
  dispersion:{group:'mechanical',name:'Dispersión en agua profunda',fields:[['lambda','Longitud de onda λ (m)','10'],['g','Gravedad (m/s²)','9.80665']]},
  stringpower:{group:'mechanical',name:'Potencia en cuerda',fields:[['density','Densidad lineal μ (kg/m)','0.02'],['w','ω (rad/s)','200'],['a','Amplitud A (m)','0.01'],['speed','Velocidad (m/s)','30']]},
  sound:{group:'mechanical',name:'Sonido y decibelios',fields:[['levels','Niveles a combinar (dB)','60, 63'],['power','Potencia de fuente puntual (W)','50'],['distance','Distancia (m)','10'],['target','Nivel objetivo para distancia (dB)','60']]},
  doppler:{group:'mechanical',name:'Doppler y eco',fields:[['frequency','Frecuencia de fuente (Hz)','500'],['speed','Velocidad del sonido (m/s)','343'],['source','Fuente hacia observador (m/s)','30'],['observer','Observador hacia fuente (m/s)','0'],['wall','Pared hacia fuente (m/s)','0']]},
  boundary:{group:'mechanical',name:'Reflexión en cuerda',fields:[['tension','Tensión (N)','100'],['mu1','μ₁ (kg/m)','0.01'],['mu2','μ₂ (kg/m)','0.04']]},
  material:{group:'mechanical',name:'Velocidad en material/gas y Mach',fields:[['modulus','Módulo elástico (Pa)','200000000000'],['density','Densidad (kg/m³)','7850'],['gamma','γ del gas','1.4'],['temperature','Temperatura absoluta (K)','293.15'],['molar','Masa molar (kg/mol)','0.029'],['source','Velocidad de objeto (m/s)','680']]},
  em:{group:'optics',name:'Onda electromagnética',fields:[['electric','E₀ (V/m)','300']]},
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
let playing=false,lastFrame=0;

function read(key) {return document.getElementById(`waves-${key}`).value.trim();}
function number(key,optional=false) {
  const raw=read(key);
  if (!raw&&optional) return null;
  if (!raw||!Number.isFinite(Number(raw))) throw new RangeError(`${key}: introduce un número finito`);
  return Number(raw);
}
function numbers(key) {
  const parts=read(key).split(/[,;\s]+/).filter(Boolean);
  if (!parts.length||parts.length>100||parts.some(part=>!Number.isFinite(Number(part)))) throw new RangeError(`${key}: lista numérica inválida`);
  return parts.map(Number);
}
const values=list=>list.map(fmt).join(', ');
function result(title,lines) {
  const target=document.getElementById('waves-result');
  target.classList.remove('tool-error');
  target.innerHTML=`<div class="tool-result-title">${title}</div><ol class="geom-steps">${lines.map(line=>`<li>${line}</li>`).join('')}</ol>`;
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
  document.getElementById('waves-fields').innerHTML=config.fields.map(([key,label,defaultValue,type])=>
    `<label class="linear-field" for="waves-${key}"><span>${label}</span>${type==='select'
      ? `<select id="waves-${key}" class="tool-input"><option value="open-open">Ambos abiertos</option><option value="closed-open">Uno cerrado</option></select>`
      :type==='textarea'
      ? `<textarea id="waves-${key}" class="tool-textarea" rows="4">${defaultValue}</textarea>`
      : `<input id="waves-${key}" class="tool-input" type="number" step="any" value="${defaultValue}">`}</label>`
  ).join('');
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
      result('Movimiento armónico simple',[`f = ω/(2π) = ${fmt(r.frequency)} Hz; T = 2π/ω = ${fmt(r.period)} s.`,
        `x(t)=A cos(ωt+φ) = ${fmt(r.position)} m; v(t) = ${fmt(r.velocity)} m/s; a(t) = ${fmt(r.acceleration)} m/s².`,
        `vₘₐₓ = Aω = ${fmt(r.maxSpeed)} m/s; aₘₐₓ = Aω² = ${fmt(r.maxAcceleration)} m/s².`,
        r.energy===null?'Energía: introduce k para calcularla.':`E = ½kA² = ${fmt(r.energy)} J.`]);
    } else if (mode==='spring') {
      const force=number('force',true),drive=number('drive',true);
      const r=springOscillator(number('m'),number('k'),number('b'),force,drive);
      result('Resorte y amortiguamiento',[`ω₀ = √(k/m) = ${fmt(r.omega0)} rad/s; γ = b/(2m) = ${fmt(r.gamma)} s⁻¹; b crítico = ${fmt(r.criticalDamping)} kg/s.`,
        `Régimen: ${r.regime}; ${r.dampedOmega===null?`raíces = ${values(r.roots)} s⁻¹`:`ω′ = ${fmt(r.dampedOmega)} rad/s`}.`,
        `Q = ${fmt(r.quality)}; decremento logarítmico = ${fmt(r.decrement)}; ancho de banda ≈ ${fmt(r.bandwidth)} rad/s; ω de máximo de amplitud = ${fmt(r.resonanceOmega)} rad/s.`,
        r.forced?`A(ω)=F₀/√[(k−mω²)²+(bω)²] = ${fmt(r.forced.amplitude)} m; desfase = ${fmt(r.forced.phaseLag)} rad; potencia media disipada = ${fmt(r.forced.averagePower)} W.`:'Introduce F₀ y ω motriz para respuesta forzada.']);
    } else if (mode==='pendulum') {
      const r=pendulumPeriod(number('length'),number('g'),number('moment',true),number('mass',true),number('distance',true));
      result('Péndulo',[`Modelo ${r.model}; ${r.model==='simple'?'T = 2π√(L/g)':'T = 2π√(I/(mgd))'} = ${fmt(r.period)} s.`,r.assumption]);
    } else if (mode==='phasors') {
      const pairs=read('pairs').split(/[;\n]+/).map(line=>line.trim()).filter(Boolean).map(line=>{
        const parts=line.split(/[,\s]+/).filter(Boolean).map(Number);
        if (parts.length!==2||parts.some(value=>!Number.isFinite(value))) throw new RangeError('Cada fasor requiere amplitud y fase');
        return parts;
      });
      const r=phasorSum(pairs);
      result('Suma de fasores',[`Σ Aᵢ cos φᵢ = ${fmt(r.real)}; Σ Aᵢ sen φᵢ = ${fmt(r.imaginary)}.`,
        `Amplitud = √(X²+Y²) = ${fmt(r.amplitude)}; fase = atan2(Y,X) = ${fmt(r.phase)} rad.`]);
    } else if (mode==='beats') {
      const r=beats(number('f1'),number('f2'));
      result('Pulsaciones',[`f de pulsación = |f₁−f₂| = ${fmt(r.beatFrequency)} Hz; portadora = ${fmt(r.carrierFrequency)} Hz.`,r.formula]);
    } else if (mode==='lc') {
      const r=lcOscillation(number('l'),number('c'),number('q'),number('time'));
      result('Oscilador LC ideal',[`ω = 1/√(LC) = ${fmt(r.omega)} rad/s; f = ${fmt(r.frequency)} Hz; T = ${fmt(r.period)} s.`,
        `Q(t)=Q₀cos(ωt) = ${fmt(r.charge)} C; I(t)=−Q₀ωsen(ωt) = ${fmt(r.current)} A.`,
        `E capacitor = ${fmt(r.capacitorEnergy)} J; E bobina = ${fmt(r.inductorEnergy)} J; E total = ${fmt(r.totalEnergy)} J.`,r.assumption]);
    } else if (mode==='lissajous') {
      const r=lissajous(number('ax'),number('ay'),number('wx'),number('wy'),number('phase'),number('time'));
      result('Figura de Lissajous',[`x(t)=Ax sen(ωx t+φ) = ${fmt(r.x)}; y(t)=Ay sen(ωy t) = ${fmt(r.y)}.`,
        `Relación ωx/ωy = ${fmt(r.ratio)}; ventana de trazado = ${fmt(r.windowTime)} s; ${r.points.length} muestras.`,r.assumption]);
    } else if (mode==='traveling') {
      const r=travelingWave(number('a'),number('k'),number('w'),number('x'),number('time'));
      result('Onda viajera seno',[`λ = 2π/k = ${fmt(r.wavelength)} m; f = ω/(2π) = ${fmt(r.frequency)} Hz; v = ω/k = ${fmt(r.speed)} m/s.`,
        `y(x,t) = ${fmt(r.displacement)} m; velocidad transversal = ${fmt(r.transverseVelocity)} m/s; aceleración = ${fmt(r.transverseAcceleration)} m/s².`]);
    } else if (mode==='string') {
      const r=stringWave(number('tension'),number('density'),number('length',true));
      result('Cuerda',[`v = √(T/μ) = ${fmt(r.speed)} m/s.`,r.harmonics?`fₙ = nv/(2L); f₁, f₂, f₃ = ${values(r.harmonics)} Hz.`:'Introduce L para los armónicos.']);
    } else if (mode==='tube') {
      const r=tubeModes(number('length'),number('speed'),read('boundary'),number('count'));
      result('Modos de tubo',[r.boundary==='open-open'?'Ambos extremos abiertos: fₙ=nv/(2L).':'Un extremo cerrado: fₙ=(2n−1)v/(4L).',
        `Armónicos: ${r.modes.map(item=>`n=${item.harmonic}: ${fmt(item.frequency)} Hz, λ=${fmt(item.wavelength)} m`).join('; ')}.`,r.assumption]);
    } else if (mode==='standing') {
      const r=standingWave(number('a'),number('k'),number('w'),number('length'));
      result('Onda estacionaria',[`v = ω/k = ${fmt(r.speed)} m/s; λ = 2π/k = ${fmt(r.wavelength)} m.`,
        `Nodos xₙ = nπ/k: ${values(r.nodes)} m; antinodos xₙ = (n+½)π/k: ${values(r.antinodes)} m.`,
        `Componentes viajeras de amplitud ${fmt(r.componentAmplitude)} m: ${r.componentFormula}.`]);
    } else if (mode==='dispersion') {
      const r=deepWaterDispersion(number('lambda'),number('g'));
      result('Agua profunda',[`ω = √(gk), k = 2π/λ = ${fmt(r.waveNumber)} rad/m.`,
        `Velocidad de fase = ω/k = ${fmt(r.phaseSpeed)} m/s; velocidad de grupo = ½ω/k = ${fmt(r.groupSpeed)} m/s.`]);
    } else if (mode==='stringpower') {
      const r=wavePowerString(number('density'),number('w'),number('a'),number('speed'));
      result('Potencia media de cuerda',[`P̄ = ½ μ ω² A² v = ${fmt(r.averagePower)} W.`]);
    } else if (mode==='sound') {
      const levels=numbers('levels'),combined=combineSoundLevels(levels);
      const source=pointSourceSound(number('power'),number('distance'));
      const targetLevel=pointSourceDistanceForLevel(number('power'),number('target'));
      result('Sonido y decibelios',[`I total = Σ Iᵢ = ${fmt(combined.intensity)} W/m²; nivel total = ${fmt(combined.decibels)} dB.`,
        `Fuente puntual: I=P/(4πr²) = ${fmt(source.intensity)} W/m²; nivel = ${fmt(source.decibels)} dB.`,
        `Distancia para ${fmt(number('target'))} dB = ${fmt(targetLevel.distance)} m (propagación esférica ideal).`]);
    } else if (mode==='doppler') {
      const speed=number('speed'),frequency=number('frequency');
      const r=dopplerFrequency(frequency,speed,number('source'),number('observer'));
      const echo=movingWallEcho(frequency,speed,number('wall'));
      result('Doppler y eco',[`f′ = f(v+vₒ)/(v−vₛ) = ${fmt(r.observed)} Hz.`,r.convention,
        `Eco de pared móvil: fₑ = f(v+u)/(v−u) = ${fmt(echo.echoFrequency)} Hz.`]);
    } else if (mode==='boundary') {
      const r=stringBoundary(number('tension'),number('mu1'),number('mu2'));
      result('Frontera de cuerda',[`Z₁ = √(Tμ₁) = ${fmt(r.firstImpedance)}; Z₂ = √(Tμ₂) = ${fmt(r.secondImpedance)}.`,
        `Amplitud reflejada/incidente = (Z₁−Z₂)/(Z₁+Z₂) = ${fmt(r.reflectedAmplitude)}; transmitida/incidente = ${fmt(r.transmittedAmplitude)}.`,
        `Fracciones de energía: R = ${fmt(r.reflectedEnergy)}, T = ${fmt(r.transmittedEnergy)}; R+T = ${fmt(r.reflectedEnergy+r.transmittedEnergy)}.`]);
    } else if (mode==='material') {
      const material=materialWaveSpeed(number('modulus'),number('density'));
      const gas=gasSoundSpeed(number('gamma'),number('temperature'),number('molar'));
      const mach=machCone(number('source'),gas.speed);
      result('Velocidades de onda',[`Sólido/líquido: v = √(módulo/ρ) = ${fmt(material.speed)} m/s.`,
        `Gas ideal: v = √(γRT/M) = ${fmt(gas.speed)} m/s.`,
        `Mach = v objeto/v gas = ${fmt(mach.mach)}; ángulo de cono = ${fmt(mach.angleDegrees)}° (solo si Mach > 1).`]);
    } else if (mode==='em') {
      const r=electromagneticWave(number('electric'));
      result('Onda EM plana',[`B₀ = E₀/c = ${fmt(r.magneticPeak)} T.`,
        `⟨S⟩ = ½ε₀cE₀² = ${fmt(r.averageIntensity)} W/m²; S pico = ${fmt(r.peakPoynting)} W/m².`,
        `Presión absorbente = ⟨S⟩/c = ${fmt(r.absorbingPressure)} Pa; reflectora ideal = ${fmt(r.reflectingPressure)} Pa.`,r.assumption]);
    } else if (mode==='refraction') {
      const r=refractiveMedium(number('n'),number('lambda'));
      const boundary=normalIncidence(number('n1'),number('n2'));
      result('Refracción e incidencia normal',[`v = c/n = ${fmt(r.speed)} m/s; λ = λ₀/n = ${fmt(r.wavelength)} m; f = ${fmt(r.frequency)} Hz.`,
        `R = ((n₁−n₂)/(n₁+n₂))² = ${fmt(boundary.reflectance)}; T = 1−R = ${fmt(boundary.transmittance)}.`,boundary.assumption]);
    } else if (mode==='polarizers') {
      const r=polarizerChain(number('intensity'),numbers('angles'));
      result('Polarizadores ideales',[`Primero: I₀/2 = ${fmt(r.after[0])} W/m²; siguientes por ley de Malus cos²Δθ.`,
        `Intensidades tras cada polarizador: ${values(r.after)} W/m²; final = ${fmt(r.final)} W/m².`]);
    } else if (mode==='young') {
      const r=youngInterference(number('lambda'),number('separation'),number('screen'),number('bright'),number('dark'),number('index',true),number('thickness',true));
      result('Interferencia de Young',[`Separación de franjas Δy = λL/d = ${fmt(r.spacing)} m.`,
        `Brillante m: y = mΔy = ${fmt(r.bright)} m; oscura m: y = (m+½)Δy = ${fmt(r.dark)} m.`,
        r.filmShift===null?'Sin lámina.':`Corrimiento por lámina: (n−1)tL/d = ${fmt(r.filmShift)} m.`,r.convention]);
    } else if (mode==='film') {
      const minimum=number('minimum',true),maximum=number('maximum',true);
      const r=soapFilmConstructive(number('n'),number('thickness'),minimum===null&&maximum===null?null:[minimum,maximum]);
      result('Película en aire',[r.formula,r.wavelengths===null?'Sin banda espectral: todos los órdenes m≥0 son posibles.':
        `En la banda: ${r.wavelengths.length?r.wavelengths.map(item=>`m=${item.order}: ${fmt(item.wavelength)} m`).join('; '):'ninguna longitud de onda'}.`]);
    } else if (mode==='rings') {
      const R=number('radius'),lambda=number('lambda'),order=number('order');
      const dark=newtonRing(R,lambda,order,true),bright=newtonRing(R,lambda,order,false);
      result('Anillos de Newton',[`Radio oscuro m=${order}: √(mλR) = ${fmt(dark.radius)} m.`,
        `Radio brillante m=${order}: √((m+½)λR) = ${fmt(bright.radius)} m.`,dark.convention]);
    } else if (mode==='multislit') {
      const r=multipleSlitInterference(number('count'),number('separation'),number('lambda'),number('angle'));
      result('Varias rendijas',[`δ = 2πd sen θ/λ = ${fmt(r.phase)} rad; orden continuo d sen θ/λ = ${fmt(r.order)}.`,
        `I/(N²I₁) = [sen(Nδ/2)/(N sen(δ/2))]² = ${fmt(r.normalizedIntensity)}.`,r.assumption]);
    } else if (mode==='grating') {
      const r=gratingOrders(number('separation'),number('lambda'),number('minimum',true),number('maximum',true));
      result('Red de difracción',[r.assumption,`Órdenes físicamente posibles en la banda: ${r.orders.map(item=>`m=${item.order}, λ∈[${fmt(item.wavelengthRange[0])}, ${fmt(item.wavelengthRange[1])}] m${item.angleDegrees===null?'':`, θ(λ referencia)=${fmt(item.angleDegrees)}°`}`).join('; ')}.`]);
    } else throw new RangeError('Selecciona una operación válida');
    if(visualModes.has(mode)) wavesRedraw();
  } catch(error) {
    target.textContent=error.message;
    target.classList.add('tool-error');
  }
}
