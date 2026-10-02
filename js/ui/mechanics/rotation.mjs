import { angularMomentumSkater, angularMomentumVector, apsisAngularMomentum, circularOrbit, gravitationalAttraction, hingedRodDrop, rollingDownIncline, standardInertia } from '../../math/mechanics-advanced.mjs';
import { num, singleRow, value } from './units.mjs';

export const fields={
  gravity:[['m1','Masa 1 (kg)','5e24'],['m2','Masa 2 (kg)','7e22'],['distance','Distancia entre centros (m)','3.8e8']],
  angular:[['mass','Masa (kg)','2'],['position','r: x,y,z (m)','3,4,0','text'],['velocity','v: x,y,z (m/s)','-1,2,0','text']],
  inertia:[['shape','Cuerpo: disk, hoop, rodCenter, rodEnd, solidSphere','disk'],['mass','Masa (kg)','2'],['size','Radio o longitud (m)','0.5']],
  rolling:[['shape','Cuerpo: solidCylinder, hoop, solidSphere','solidCylinder','text'],['mass','Masa (kg)','10'],['radius','Radio (m)','0.2'],['angle','Ángulo del plano (°)','30'],['distance','Distancia recorrida (m)','3'],['friction','μ estática disponible (opcional)','','text']],
  skater:[['initialInertia','Inercia inicial (kg·m²)','3'],['initialOmega','ω inicial (rad/s)','2'],['finalInertia','Inercia final (kg·m²)','1.2']],
  hingedrod:[['mass','Masa de varilla (kg)','2'],['length','Longitud de varilla (m)','1']],
  apsides:[['periapsisRadius','Radio periapsis (m)','10000000'],['periapsisSpeed','Rapidez periapsis (m/s)','9000'],['apoapsisRadius','Radio apoapsis (m)','20000000']],
  orbit:[['mass','Masa central (kg)','5.972e24'],['radius','Radio orbital desde el centro (m)','6771000'],['satellite','Masa del satélite (kg), opcional','1000']],
};

export const modes={
  gravity:['rotation','Atracción gravitacional','F=GM₁M₂/r²'],
  angular:['rotation','Momento angular 3D','L=r×mv'],
  inertia:['rotation','Inercia de cuerpo estándar','I = factor·m·R² o factor·m·L²'],
  rolling:['rotation','Rodadura sin deslizamiento','a = g sen θ/(1+I/mR²); mgh = ½mv²+½Iω²'],
  skater:['rotation','Momento angular de patinador','I₀ω₀ = Iω; ΔK = ½Iω²−½I₀ω₀²'],
  hingedrod:['rotation','Varilla articulada al caer','α₀ = 3g/(2L); ωvertical = √(3g/L)'],
  apsides:['rotation','Velocidad en los ápsides','h = rₚvₚ = rₐvₐ'],
  orbit:['rotation','Órbita circular','v = √(GM/r); T = 2π√(r³/GM); E = −GMm/(2r)'],
};

export const solvers={
  gravity() { const {magnitude,...data}=gravitationalAttraction(num('m1'),num('m2'),num('distance'));return {forceMagnitude:magnitude,...data}; },
  angular() { return angularMomentumVector(num('mass'),singleRow('position',3),singleRow('velocity',3)); },
  inertia() { return standardInertia(value('shape'),num('mass'),num('size')); },
  rolling() { return rollingDownIncline(num('mass'),num('radius'),num('angle'),num('distance'),value('shape'),num('friction',true)); },
  skater() { return angularMomentumSkater(num('initialInertia'),num('initialOmega'),num('finalInertia')); },
  hingedrod() { return hingedRodDrop(num('mass'),num('length')); },
  apsides() { return apsisAngularMomentum(num('periapsisRadius'),num('periapsisSpeed'),num('apoapsisRadius')); },
  orbit() { return circularOrbit(num('mass'),num('radius'),num('satellite',true)); },
};
