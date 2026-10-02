import { beats, dampingFromAmplitudes, harmonicMotion, lcOscillation, lissajous, pendulumPeriod, phasorSum, springOscillator } from '../../math/waves.mjs';
import { fmt, number, read, result, values } from './output.mjs';

export const modes={
  harmonic:{group:'oscillations',name:'Movimiento armónico simple',fields:[['a','Amplitud A (m)','0.05'],['w','ω (rad/s)','12.566370614359172'],['phase','Fase φ (rad)','1.0471975511965976'],['time','Tiempo t (s)','0.5'],['k','Resorte k (N/m, opcional)','']]},
  spring:{group:'oscillations',name:'Resorte amortiguado y forzado',fields:[['m','Masa m (kg)','0.5'],['k','Constante k (N/m)','50'],['b','Amortiguamiento b (kg/s)','2'],['force','Fuerza pico F₀ (N, opcional)','10'],['drive','ω motriz (rad/s, opcional)','8']]},
  pendulum:{group:'oscillations',name:'Péndulo simple o físico',fields:[['length','Longitud L (m)','1.5'],['g','Gravedad (m/s²)','9.80665'],['moment','Momento I (kg·m², opcional)',''],['mass','Masa (kg, físico)',''],['distance','Distancia al centro de masa (m, físico)','']]},
  rod:{group:'oscillations',name:'Péndulo de varilla uniforme',fields:[['length','Longitud L (m)','1'],['g','Gravedad (m/s²)','9.80665']]},
  phasors:{group:'oscillations',name:'Suma de fasores',fields:[['pairs','Amplitud, fase en radianes; un fasor por línea','3, 0\n4, 1.5707963267948966','textarea']]},
  beats:{group:'oscillations',name:'Pulsaciones',fields:[['f1','Frecuencia f₁ (Hz)','440'],['f2','Frecuencia f₂ (Hz)','446']]},
  decay:{group:'oscillations',name:'Amortiguamiento desde amplitudes',fields:[['initial','Amplitud inicial (m)','0.1'],['final','Amplitud final (m)','0.02'],['cycles','Oscilaciones transcurridas','5'],['period','Período amortiguado T (s)','0.5']]},
  lc:{group:'oscillations',name:'Oscilador LC ideal',fields:[['l','Inductancia L (H)','0.1'],['c','Capacitancia C (F)','0.0001'],['q','Carga inicial Q₀ (C)','0.001'],['time','Tiempo t (s)','0.005']]},
  lissajous:{group:'oscillations',name:'Figura de Lissajous',fields:[['ax','Amplitud X','1'],['ay','Amplitud Y','1'],['wx','ωx (rad/s)','2'],['wy','ωy (rad/s)','3'],['phase','Fase X (rad)','1.5707963267948966'],['time','Tiempo t (s)','0']]},
};

export const solvers={
  harmonic() {
      const r=harmonicMotion(number('a'),number('w'),number('phase'),number('time'),number('k',true));
      result('Movimiento armónico simple',[`A = ${fmt(r.amplitude)} m; ω = ${fmt(r.omega)} rad/s; φ = ${fmt(r.phase)} rad.`,
        `f = ω/(2π) = ${fmt(r.frequency)} Hz; T = 2π/ω = ${fmt(r.period)} s.`,
        `x(t)=A cos(ωt+φ) = ${fmt(r.position)} m; v(t) = ${fmt(r.velocity)} m/s; a(t) = ${fmt(r.acceleration)} m/s².`,
        `vₘₐₓ = Aω = ${fmt(r.maxSpeed)} m/s; aₘₐₓ = Aω² = ${fmt(r.maxAcceleration)} m/s².`,
        r.energy===null?'Energía: introduce k para calcularla.':`E = ½kA² = ${fmt(r.energy)} J.`], r);
  },
  spring() {
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
  },
  pendulum() {
      const r=pendulumPeriod(number('length'),number('g'),number('moment',true),number('mass',true),number('distance',true));
      result('Péndulo',[`Modelo ${r.model}; ${r.model==='simple'?'T = 2π√(L/g)':'T = 2π√(I/(mgd))'} = ${fmt(r.period)} s.`,r.assumption], r);
  },
  rod() {
      const length=number('length');
      const r=pendulumPeriod(length,number('g'),length**2/3,1,length/2);
      result('Péndulo de varilla',[`I = mL²/3; d = L/2; la masa se cancela.`,
        `T = 2π√(2L/(3g)) = ${fmt(r.period)} s.`,`Varilla uniforme articulada en un extremo; ${r.assumption}.`], r);
  },
  phasors() {
      const pairs=read('pairs').split(/[;\n]+/).map(line=>line.trim()).filter(Boolean).map(line=>{
        const parts=line.split(/[,\s]+/).filter(Boolean).map(Number);
        if (parts.length!==2||parts.some(value=>!Number.isFinite(value))) throw new RangeError('Cada fasor requiere amplitud y fase');
        return parts;
      });
      const r=phasorSum(pairs);
      result('Suma de fasores',[`Σ Aᵢ cos φᵢ = ${fmt(r.real)}; Σ Aᵢ sen φᵢ = ${fmt(r.imaginary)}.`,
        `Amplitud = √(X²+Y²) = ${fmt(r.amplitude)}; fase = atan2(Y,X) = ${fmt(r.phase)} rad.`], r);
  },
  beats() {
      const r=beats(number('f1'),number('f2'));
      result('Pulsaciones',[`f de pulsación = |f₁−f₂| = ${fmt(r.beatFrequency)} Hz; portadora = ${fmt(r.carrierFrequency)} Hz.`,r.formula], r);
  },
  decay() {
      const r=dampingFromAmplitudes(number('initial'),number('final'),number('cycles'),number('period'));
      result('Amortiguamiento medido',[`δ = ln(A inicial/A final)/N = ${fmt(r.decrement)}.`,
        `γ = δ/T = ${fmt(r.gamma)} s⁻¹; ω′ = 2π/T = ${fmt(r.dampedOmega)} rad/s.`,
        `ω₀ = √(ω′²+γ²) = ${fmt(r.omega0)} rad/s; Q = ω₀/(2γ) = ${fmt(r.quality)}.`,r.assumption], r);
  },
  lc() {
      const r=lcOscillation(number('l'),number('c'),number('q'),number('time'));
      result('Oscilador LC ideal',[`ω = 1/√(LC) = ${fmt(r.omega)} rad/s; f = ${fmt(r.frequency)} Hz; T = ${fmt(r.period)} s.`,
        `Q(t)=Q₀cos(ωt) = ${fmt(r.charge)} C; I(t)=−Q₀ωsen(ωt) = ${fmt(r.current)} A.`,
        `E capacitor = ${fmt(r.capacitorEnergy)} J; E bobina = ${fmt(r.inductorEnergy)} J; E total = ${fmt(r.totalEnergy)} J.`,r.assumption], r);
  },
  lissajous() {
      const r=lissajous(number('ax'),number('ay'),number('wx'),number('wy'),number('phase'),number('time'));
      result('Figura de Lissajous',[`x(t)=Ax sen(ωx t+φ) = ${fmt(r.x)}; y(t)=Ay sen(ωy t) = ${fmt(r.y)}.`,
        `Relación ωx/ωy = ${fmt(r.ratio)}; ventana de trazado = ${fmt(r.windowTime)} s; ${r.points.length} muestras.`,
        ...(r.ellipse?[`Eliminando t: X² + Y² + (${fmt(r.ellipse.crossCoefficient)})XY = ${fmt(r.ellipse.rightSide)}, con X=x/${fmt(number('ax'))}, Y=y/${fmt(number('ay'))}.`,
          r.ellipse.degenerate?'Curva degenerada o prácticamente recta: |sen φ| < 10⁻¹².':'Elipse para frecuencias iguales; fase relativa φ.']:[]),r.assumption], r);
  },
};
