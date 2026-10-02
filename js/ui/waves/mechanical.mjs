import { WAVE_C, combineSoundLevels, deepWaterDispersion, dopplerFrequency, gasSoundSpeed, intensityLevel, machCone, materialWaveSpeed, movingWallEcho, pointSourceDistanceForLevel, pointSourceSound, standingWave, stringBoundary, stringHarmonics, stringWave, travelingWave, tubeModes, wavePowerString, waveRelation } from '../../math/waves.mjs';
import { fmt, number, numbers, read, result, values } from './output.mjs';

export function solveWaveRelation(mode) {
      const r=waveRelation(mode==='emrelation'?WAVE_C:number('speed'),{frequency:number('frequency',true),wavelength:number('lambda',true)});
      result('Relación v = λf',[`v = ${fmt(r.speed)} m/s; f = ${fmt(r.frequency)} Hz; λ = v/f = ${fmt(r.wavelength)} m.`,
        `T = 1/f = ${fmt(r.period)} s; ω = 2πf = ${fmt(r.omega)} rad/s; k = 2π/λ = ${fmt(r.waveNumber)} rad/m.`,
        mode==='emrelation'?'Onda electromagnética en vacío: v=c.':'Usa la velocidad de fase del medio.'], r);
}

export const modes={
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
};

export const solvers={
  relation: solveWaveRelation,
  traveling() {
      const r=travelingWave(number('a'),number('k'),number('w'),number('x'),number('time'));
      result('Onda viajera seno',[`λ = 2π/k = ${fmt(r.wavelength)} m; f = ω/(2π) = ${fmt(r.frequency)} Hz; v = ω/k = ${fmt(r.speed)} m/s.`,
        `k = ${fmt(number('k'))} rad/m; ω = ${fmt(number('w'))} rad/s; velocidad transversal máxima Aω = ${fmt(r.maxTransverseVelocity)} m/s.`,
        `y(x,t) = ${fmt(r.displacement)} m; velocidad transversal = ${fmt(r.transverseVelocity)} m/s; aceleración = ${fmt(r.transverseAcceleration)} m/s².`], r);
  },
  string() {
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
  },
  tube() {
      const r=tubeModes(number('length'),number('speed'),read('boundary'),number('count'));
      result('Modos de tubo',[r.boundary==='open-open'?'Ambos extremos abiertos: fₙ=nv/(2L).':'Un extremo cerrado: fₙ=(2n−1)v/(4L).',
        `Armónicos: ${r.modes.map(item=>`n=${item.harmonic}: ${fmt(item.frequency)} Hz, λ=${fmt(item.wavelength)} m`).join('; ')}.`,r.assumption], r);
  },
  standing() {
      const r=standingWave(number('a'),number('k'),number('w'),number('length'));
      result('Onda estacionaria',[`v = ω/k = ${fmt(r.speed)} m/s; λ = 2π/k = ${fmt(r.wavelength)} m.`,
        `Nodos xₙ = nπ/k: ${values(r.nodes)} m; antinodos xₙ = (n+½)π/k: ${values(r.antinodes)} m.`,
        `Componentes viajeras de amplitud ${fmt(r.componentAmplitude)} m: ${r.componentFormula}.`], r);
  },
  dispersion() {
      const r=deepWaterDispersion(number('lambda'),number('g'));
      result('Agua profunda',[`ω = √(gk), k = 2π/λ = ${fmt(r.waveNumber)} rad/m.`,
        `Velocidad de fase = ω/k = ${fmt(r.phaseSpeed)} m/s; velocidad de grupo = ½ω/k = ${fmt(r.groupSpeed)} m/s.`], r);
  },
  stringpower() {
      const r=wavePowerString(number('density'),number('w'),number('a'),number('speed'));
      result('Potencia media de cuerda',[`P̄ = ½ μ ω² A² v = ${fmt(r.averagePower)} W.`], r);
  },
  sound() {
      const levels=numbers('levels'),combined=combineSoundLevels(levels);
      const source=pointSourceSound(number('power'),number('distance'));
      const targetLevel=pointSourceDistanceForLevel(number('power'),number('target'));
      result('Sonido y decibelios',[`I total = Σ Iᵢ = ${fmt(combined.intensity)} W/m²; nivel total = ${fmt(combined.decibels)} dB.`,
        `Fuente puntual: I=P/(4πr²) = ${fmt(source.intensity)} W/m²; nivel = ${fmt(source.decibels)} dB.`,
        `Distancia para ${fmt(number('target'))} dB = ${fmt(targetLevel.distance)} m (propagación esférica ideal).`], {...combined,sourceIntensity:source.intensity,distance:targetLevel.distance});
  },
  intensity() {
      const r=intensityLevel(number('intensity'),number('reference'));
      result('Nivel de intensidad',[`β = 10 log₁₀(I/I₀) = ${fmt(r.decibels)} dB.`,`Referencia I₀ = ${fmt(number('reference'))} W/m².`], r);
  },
  mach() {
      const r=machCone(number('source'),number('speed'));
      result('Mach y cono',[`Mach = v objeto/v sonido = ${fmt(r.mach)}.`,
        r.angleDegrees===null?'No hay cono de Mach subsónico o sónico.':`Semiángulo μ = arcsen(1/Mach) = ${fmt(r.angleDegrees)}°.`,
        'Velocidades respecto al mismo medio.'], r);
  },
  doppler() {
      const speed=number('speed'),frequency=number('frequency');
      const r=dopplerFrequency(frequency,speed,number('source'),number('observer'));
      const echo=movingWallEcho(frequency,speed,number('wall'));
      result('Doppler y eco',[`f′ = f(v+vₒ)/(v−vₛ) = ${fmt(r.observed)} Hz.`,r.convention,
        `Eco de pared móvil: fₑ = f(v+u)/(v−u) = ${fmt(echo.echoFrequency)} Hz.`], r);
  },
  boundary() {
      const r=stringBoundary(number('tension'),number('mu1'),number('mu2'));
      result('Frontera de cuerda',[`Z₁ = √(Tμ₁) = ${fmt(r.firstImpedance)}; Z₂ = √(Tμ₂) = ${fmt(r.secondImpedance)}.`,
        `Amplitud reflejada/incidente = (Z₁−Z₂)/(Z₁+Z₂) = ${fmt(r.reflectedAmplitude)}; transmitida/incidente = ${fmt(r.transmittedAmplitude)}.`,
        `Fracciones de energía: R = ${fmt(r.reflectedEnergy)}, T = ${fmt(r.transmittedEnergy)}; R+T = ${fmt(r.reflectedEnergy+r.transmittedEnergy)}.`], r);
  },
  material() {
      const material=materialWaveSpeed(number('modulus'),number('density'));
      const gas=gasSoundSpeed(number('gamma'),number('temperature'),number('molar'));
      const mach=machCone(number('source'),gas.speed);
      result('Velocidades de onda',[`Sólido/líquido: v = √(módulo/ρ) = ${fmt(material.speed)} m/s.`,
        `Gas ideal: v = √(γRT/M) = ${fmt(gas.speed)} m/s.`,
        `Mach = v objeto/v gas = ${fmt(mach.mach)}; ángulo de cono = ${fmt(mach.angleDegrees)}° (solo si Mach > 1).`], {materialSpeed:material.speed,gasSpeed:gas.speed,angleDegrees:mach.angleDegrees});
  },
};
