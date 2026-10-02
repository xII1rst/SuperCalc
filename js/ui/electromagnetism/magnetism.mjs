import { chargedParticleOrbit, circularDisplacementField, circularLoopAxis, displacementCurrent, hallEffect, longCurrentCable, loopTorque, magneticForceWire, magneticGeometries, motionalEmf, railBarCircuit, sinusoidalFluxEmf, solenoidFieldDensity, solenoidSelfInductance, toroidSelfInductance } from '../../math/electromagnetism-advanced.mjs';
import { inducedEmf, lorentz, magneticFieldWire } from '../../math/electromagnetism.mjs';
import { list, number, read } from './units.mjs';

export const fields={
  lorentz:[['charge','Carga (C)','1.6e-19'],['velocity','v: x,y,z (m/s)','3000000,0,0','text'],['electricVector','E: x,y,z (N/C)','0,0,0','text'],['magneticVector','B: x,y,z (T)','0,0,0.5','text']],
  wirefield:[['current','Corriente (A)','10'],['position','Distancia al hilo (m)','0.05']],
  fluxchange:[['turns','Espiras N','100'],['firstFlux','Flujo inicial por espira (Wb)','0.02'],['lastFlux','Flujo final por espira (Wb)','0.05'],['time','Δt (s)','0.1']],
  solenoidfield:[['density','Espiras por longitud (m⁻¹)','1000'],['current','Corriente (A)','2'],['er','Permeabilidad relativa μr','1']],
  particle:[['charge','Carga de partícula (C)','1.602176634e-19'],['mass','Masa de partícula (kg)','1.67262192369e-27'],['speed','Rapidez perpendicular (m/s)','1000000'],['field','B (T)','0.2']],
  magnetic:[['shape','Geometría: loop, solenoid, toroid','loop','select','loop,solenoid,toroid'],['current','Corriente (A)','2'],['turns','Vueltas N','100'],['size','Radio R o longitud L (m)','0.2'],['position','Radio de observación en toroide (m)','0.1']],
  loopaxis:[['current','Corriente I (A)','3'],['turns','Espiras N','1'],['radius','Radio R (m)','0.05'],['position','Posición axial z (m)','0.1']],
  looptorque:[['turns','Espiras N','50'],['current','Corriente I (A)','2'],['width','Ancho (m)','0.1'],['height','Alto (m)','0.2'],['field','Campo B (T)','0.5'],['angle','Ángulo entre el plano y B (°)','30']],
  solenoidinductance:[['turns','Espiras N','500'],['length','Longitud l (m)','0.25'],['area','Sección A (m²)','0.0004'],['current','Corriente para energía (A)','0'],['er','Permeabilidad relativa μr','1']],
  toroidinductance:[['turns','Espiras N','800'],['radius','Radio medio (m)','0.1'],['area','Sección A (m²)','0.0002'],['current','Corriente I (A)','3'],['er','Permeabilidad relativa μr','1']],
  cable:[['current','Corriente I (A)','8'],['radius','Radio del cable R (m)','0.002'],['position','Distancia al eje r (m)','0.001']],
  magneticforce:[['current','Corriente (A)','2'],['length','Longitud (m)','0.5'],['field','Campo magnético (T)','0.1'],['angle','Ángulo I-B (°)','90']],
  hall:[['current','Corriente (A)','1'],['field','Campo (T)','0.5'],['density','Densidad de portadores (m⁻³)','1e20'],['charge','Carga por portador (C)','-1.6e-19'],['thickness','Espesor (m)','0.001']],
  motional:[['field','Campo B (T)','0.5'],['length','Longitud de barra (m)','0.2'],['speed','Rapidez (m/s)','10'],['angle','Ángulo (°)','90']],
  fluxemf:[['turns','Espiras N','20'],['width','Ancho (m)','0.2'],['height','Alto (m)','0.3'],['field','Amplitud B₀ (T)','0.5'],['omega','Frecuencia angular ω (rad/s)','100'],['time','Tiempo t (s)','0.01']],
  railbar:[['field','Campo B (T)','0.3'],['length','Longitud de barra (m)','0.5'],['speed','Velocidad (m/s)','4'],['resistance','Resistencia total (Ω)','2']],
  displacement:[['area','Área (m²)','2'],['rate','dE/dt (V/m/s)','100'],['er','Permitividad relativa','1']],
  displacementplates:[['radius','Radio de placas R (m)','0.05'],['position','Radio de observación r (m)','0.02'],['rate','dE/dt (V/m/s)','1e12']],
};

export const modes={
  lorentz:['magnetism','Fuerza de Lorentz','F=q(E+v×B)'],
  wirefield:['magnetism','Hilo recto largo','B=μ₀I/(2πr)'],
  fluxchange:['magnetism','Faraday por cambio de flujo','ε=−N(Φ₂−Φ₁)/Δt'],
  solenoidfield:['magnetism','Solenoide: B y densidad de energía','B=μnI; uB=B²/(2μ)'],
  particle:['magnetism','Órbita de partícula cargada','r=mv/(|qB|); T=2πm/|qB|'],
  magnetic:['magnetism','Campo de espira, solenoide o toroide','Biot–Savart o Ampère bajo la geometría ideal indicada'],
  loopaxis:['magnetism','Espira: campo en centro y eje','B(z) = μ₀NI R²/[2(R²+z²)^(3/2)]'],
  looptorque:['magnetism','Torque de una bobina','|τ| = NIAB cos β; β es el ángulo plano-campo'],
  solenoidinductance:['magnetism','Autoinductancia de solenoide','L = μ₀μr N²A/l'],
  toroidinductance:['magnetism','Autoinductancia de toroide','L ≈ μ₀μr N²A/(2πrmedio); U = ½LI²'],
  cable:['magnetism','Cable con corriente uniforme','r ≤ R: B = μ₀Ir/(2πR²); r ≥ R: B = μ₀I/(2πr)'],
  magneticforce:['magnetism','Fuerza sobre un conductor','F = ILB sen θ'],
  hall:['magnetism','Efecto Hall','VH = IB/(nqt)'],
  motional:['magnetism','FEM motriz','ε = Bℓv sen θ'],
  fluxemf:['magnetism','FEM por flujo sinusoidal','ε = −d(NΦ)/dt; NΦ = NAB₀ sen(ωt)'],
  railbar:['magnetism','Barra móvil sobre rieles','ε = Bℓv; I = ε/R; |F| = |I|ℓ|B|'],
  displacement:['magnetism','Corriente de desplazamiento','Id = ε A dE/dt para campo uniforme'],
  displacementplates:['magnetism','Placas circulares: corriente de desplazamiento y B','Id = ε₀πR² dE/dt; ley de Ampère-Maxwell'],
};

export const solvers={
  lorentz() {
    const v=list('velocity'),e=list('electricVector'),b=list('magneticVector');
    if([v,e,b].some(row=>row.length!==3))throw new RangeError('Vectores de tres componentes requeridos.');
    const r=lorentz(number('charge'),v,e,b);return {forceVector:[r.Fx,r.Fy,r.Fz],forceMagnitude:r.Fmag};
  },
  wirefield() { const field=magneticFieldWire(number('current'),number('position'));if(field===null)throw new RangeError('Distancia positiva requerida.');return {field}; },
  fluxchange() {
    const turns=number('turns');if(!Number.isInteger(turns)||turns<1)throw new RangeError('Espiras enteras positivas requeridas.');
    const r=inducedEmf(turns,number('firstFlux'),number('lastFlux'),number('time'));
    if(!r)throw new RangeError('Intervalo de tiempo positivo requerido.');return r;
  },
  solenoidfield() { return solenoidFieldDensity(number('density'),number('current'),number('er')); },
  particle() { return chargedParticleOrbit(number('charge'),number('mass'),number('speed'),number('field')); },
  magnetic() { return magneticGeometries(read('shape'),number('current'),number('turns'),number('size'),read('shape')==='toroid'?number('position'):null); },
  loopaxis() { return circularLoopAxis(number('current'),number('turns'),number('radius'),number('position')); },
  looptorque() { return loopTorque(number('turns'),number('current'),number('width'),number('height'),number('field'),number('angle')); },
  solenoidinductance() { return solenoidSelfInductance(number('turns'),number('length'),number('area'),number('current'),number('er')); },
  toroidinductance() { return toroidSelfInductance(number('turns'),number('radius'),number('area'),number('current'),number('er')); },
  cable() { return longCurrentCable(number('current'),number('radius'),number('position')); },
  magneticforce() { return magneticForceWire(number('current'),number('length'),number('field'),number('angle')); },
  hall() { return hallEffect(number('current'),number('field'),number('density'),number('charge'),number('thickness')); },
  motional() { return motionalEmf(number('field'),number('length'),number('speed'),number('angle')); },
  fluxemf() { return sinusoidalFluxEmf(number('turns'),number('width')*number('height'),number('field'),number('omega'),number('time')); },
  railbar() { return railBarCircuit(number('field'),number('length'),number('speed'),number('resistance')); },
  displacement() { return displacementCurrent(number('area'),number('rate'),number('er')); },
  displacementplates() { return circularDisplacementField(number('radius'),number('position'),number('rate')); },
};
