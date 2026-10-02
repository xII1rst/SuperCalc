import { bankedCurve, circularMotion, galileanTransform, particleKinematics, riverCrossing, rotatingFrameVelocity, verticalLoop } from '../../math/mechanics-advanced.mjs';
import { num, value, vector } from './units.mjs';

export const fields={
  trajectory:[['expressions','Componentes de r(t), una por línea (m)','3*t^2\n2*t-t^3','textarea'],['time','Tiempo (s)','2']],
  circular:[['radius','Radio (m)','2'],['omega','Velocidad angular inicial (rad/s)','3'],['alpha','Aceleración angular (rad/s²)','0.5'],['time','Tiempo (s)','4']],
  river:[['boat','Rapidez del bote respecto al agua (m/s)','5'],['current','Corriente con signo (m/s)','3']],
  bank:[['radius','Radio (m)','50'],['speed','Rapidez (m/s)','20'],['friction','Coeficiente de fricción','0.2']],
  loop:[['height','Altura inicial desde el fondo (m)','5'],['radius','Radio del rizo (m)','2']],
  galileo:[['position','Posición inicial x, y','10, 2','text'],['velocity','Velocidad vx, vy','5, 0','text'],['frame','Velocidad del marco vx, vy','2, 0','text'],['time','Tiempo','3']],
  rotating:[['position','Posición x, y','2, 0','text'],['velocity','Velocidad inercial vx, vy','0, 5','text'],['omega','Velocidad angular del marco','2']],
};

export const modes={
  trajectory:['motion','Velocidad y aceleración desde r(t)','v=r′(t); a=r″(t); rapidez=|v|'],
  circular:['motion','Movimiento circular acelerado','ω = ω₀+αt; θ = ω₀t+½αt²; aᵣ = rω²; aₜ = rα'],
  river:['motion','Bote y corriente','sen θ = vcorriente/vbote; v⊥ = √(vbote²−vcorriente²)'],
  bank:['motion','Curva peraltada','tan θ = v²/(rg); vₘₐₓ incluye fricción'],
  loop:['motion','Rizo vertical','v²fondo = 2gh; contacto superior si h ≥ 5R/2'],
  galileo:['motion','Transformación de Galileo','r′ = r−Vt; v′ = v−V'],
  rotating:['motion','Velocidad en marco giratorio','vrel = vinercial−ω×r'],
};

export const solvers={
  trajectory() { return particleKinematics(value('expressions').split(/\n|;/).map(x=>x.trim()).filter(Boolean),num('time')); },
  circular() { return circularMotion(num('radius'),num('omega'),num('alpha'),num('time')); },
  river() { return riverCrossing(num('boat'),num('current')); },
  bank() { return bankedCurve(num('radius'),num('speed'),num('friction')); },
  loop() { return verticalLoop(num('height'),num('radius')); },
  galileo() { return galileanTransform(vector('position'),vector('velocity'),vector('frame'),num('time')); },
  rotating() { return rotatingFrameVelocity(vector('velocity'),vector('position'),num('omega')); },
};
