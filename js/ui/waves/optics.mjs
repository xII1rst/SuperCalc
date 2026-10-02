import { electromagneticWave, gratingOrders, multipleSlitInterference, newtonRing, normalIncidence, polarizerChain, refractiveMedium, soapFilmConstructive, youngInterference } from '../../math/waves.mjs';
import { fmt, number, numbers, result, values } from './output.mjs';
import { solveWaveRelation } from './mechanical.mjs';

export const modes={
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

export const solvers={
  emrelation: solveWaveRelation,
  em() {
      const r=electromagneticWave(number('electric'));
      result('Onda EM plana',[`B₀ = E₀/c = ${fmt(r.magneticPeak)} T.`,
        `⟨S⟩ = ½ε₀cE₀² = ${fmt(r.averageIntensity)} W/m²; S pico = ${fmt(r.peakPoynting)} W/m².`,
        `Vector medio ⟨S⃗⟩ = ${fmt(r.averageIntensity)} k̂ W/m², donde k̂ apunta en la dirección de propagación E⃗×B⃗.`,
        `Presión absorbente = ⟨S⟩/c = ${fmt(r.absorbingPressure)} Pa; reflectora ideal = ${fmt(r.reflectingPressure)} Pa.`,r.assumption], r);
  },
  refraction() {
      const r=refractiveMedium(number('n'),number('lambda'));
      const boundary=normalIncidence(number('n1'),number('n2'));
      result('Refracción e incidencia normal',[`v = c/n = ${fmt(r.speed)} m/s; λ = λ₀/n = ${fmt(r.wavelength)} m; f = ${fmt(r.frequency)} Hz.`,
        `R = ((n₁−n₂)/(n₁+n₂))² = ${fmt(boundary.reflectance)}; T = 1−R = ${fmt(boundary.transmittance)}.`,boundary.assumption], r);
  },
  polarizers() {
      const r=polarizerChain(number('intensity'),numbers('angles'));
      result('Polarizadores ideales',[`Primero: I₀/2 = ${fmt(r.after[0])} W/m²; siguientes por ley de Malus cos²Δθ.`,
        `Intensidades tras cada polarizador: ${values(r.after)} W/m²; final = ${fmt(r.final)} W/m².`], r);
  },
  young() {
      const r=youngInterference(number('lambda'),number('separation'),number('screen'),number('bright'),number('dark'),number('index',true),number('thickness',true));
      result('Interferencia de Young',[`Separación de franjas Δy = λL/d = ${fmt(r.spacing)} m.`,
        `Brillante m: y = mΔy = ${fmt(r.bright)} m; oscura m: y = (m+½)Δy = ${fmt(r.dark)} m.`,
        r.filmShift===null?'Sin lámina.':`Corrimiento por lámina: (n−1)tL/d = ${fmt(r.filmShift)} m.`,r.convention], r);
  },
  film() {
      const minimum=number('minimum',true),maximum=number('maximum',true);
      const r=soapFilmConstructive(number('n'),number('thickness'),minimum===null&&maximum===null?null:[minimum,maximum]);
      result('Película en aire',[r.formula,r.wavelengths===null?'Sin banda espectral: todos los órdenes m≥0 son posibles.':
        `En la banda: ${r.wavelengths.length?r.wavelengths.map(item=>`m=${item.order}: ${fmt(item.wavelength)} m`).join('; '):'ninguna longitud de onda'}.`], r);
  },
  rings() {
      const R=number('radius'),lambda=number('lambda'),order=number('order');
      const dark=newtonRing(R,lambda,order,true),bright=newtonRing(R,lambda,order,false);
      result('Anillos de Newton',[`Radio oscuro m=${order}: √(mλR) = ${fmt(dark.radius)} m.`,
        `Radio brillante m=${order}: √((m+½)λR) = ${fmt(bright.radius)} m.`,dark.convention], {darkRadius:dark.radius,brightRadius:bright.radius});
  },
  multislit() {
      const r=multipleSlitInterference(number('count'),number('separation'),number('lambda'),number('angle'));
      result('Varias rendijas',[`δ = 2πd sen θ/λ = ${fmt(r.phase)} rad; orden continuo d sen θ/λ = ${fmt(r.order)}.`,
        `I/(N²I₁) = [sen(Nδ/2)/(N sen(δ/2))]² = ${fmt(r.normalizedIntensity)}.`,r.assumption], r);
  },
  grating() {
      const r=gratingOrders(number('separation'),number('lambda'),number('minimum',true),number('maximum',true));
      result('Red de difracción',[r.assumption,`Órdenes físicamente posibles en la banda: ${r.orders.map(item=>`m=${item.order}, λ∈[${fmt(item.wavelengthRange[0])}, ${fmt(item.wavelengthRange[1])}] m${item.angleDegrees===null?'':`, θ(λ referencia)=${fmt(item.angleDegrees)}°`}`).join('; ')}.`], r);
  },
};
