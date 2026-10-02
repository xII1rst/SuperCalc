import { ballisticPendulum, centerOfMass, collisionOneDimensional, collisionTwoDimensional, kineticDecomposition, linearImpulse } from '../../math/mechanics-advanced.mjs';
import { num, rows, value, vector } from './units.mjs';

export const fields={
  impulse:[['mass','Masa (kg)','1500'],['v1','Velocidad inicial (m/s)','20'],['v2','Velocidad final (m/s)','10']],
  ballistic:[['m1','Masa de bala (kg)','0.02'],['speed','Rapidez de bala (m/s)','300'],['m2','Masa de bloque (kg)','2']],
  collision:[['m1','Masa 1 (kg)','2'],['v1','Velocidad inicial 1 (m/s)','3'],['m2','Masa 2 (kg)','1'],['v2','Velocidad inicial 2 (m/s)','0'],['e','Coeficiente de restitución (0–1)','1']],
  collision2d:[['m1','Masa 1 (kg)','2'],['vi1','Velocidad inicial 1: vx, vy','3, 0','text'],['m2','Masa 2 (kg)','1'],['vi2','Velocidad inicial 2: vx, vy','0, 0','text'],['vf1','Velocidad final 1: vx, vy (o rapidez y ángulo)','1, 1','text'],['vfSpeed','Rapidez final 1 (m/s, deja vector vacío)',''],['vfAngle','Ángulo final 1 desde +x (°)','30']],
  center:[['particles','Partículas: masa, x, y; una por línea','2, 0, 0\n1, 3, 0','textarea']],
  kinetic:[['particles','Partículas: masa, x, y, vx, vy; una por línea','2, 0, 0, 1, 0\n1, 3, 0, 0, 0','textarea']],
};

export const modes={
  impulse:['collisions','Momentum e impulso','p=mv; J=Δp=m(vf−vi)'],
  ballistic:['collisions','Péndulo balístico','m bala·v=(m bala+m bloque)V; h=V²/(2g)'],
  collision:['collisions','Colisión 1D','m₁u₁+m₂u₂ = m₁v₁+m₂v₂; e = (v₂−v₁)/(u₁−u₂)'],
  collision2d:['collisions','Colisión 2D','m₁u₁+m₂u₂ = m₁v₁+m₂v₂ por componente'],
  center:['collisions','Centro de masa','rCM = Σmᵢrᵢ / Σmᵢ'],
  kinetic:['collisions','Energía y momento del sistema','K = ½MvCM² + Krel; L₀ = Σrᵢ×mᵢvᵢ'],
};

export const solvers={
  impulse() { return linearImpulse(num('mass'),num('v1'),num('v2')); },
  ballistic() { return ballisticPendulum(num('m1'),num('speed'),num('m2')); },
  collision() { return collisionOneDimensional(num('m1'),num('v1'),num('m2'),num('v2'),num('e')); },
  collision2d() {
    const speed=num('vfSpeed',true);
    if(speed!==null&&(speed<0||value('vf1')))throw new RangeError('Con rapidez final no negativa, deja el vector final vacío.');
    const angle=speed===null?0:num('vfAngle')*Math.PI/180;
    const final=speed===null?vector('vf1'):[speed*Math.cos(angle),speed*Math.sin(angle)];
    return collisionTwoDimensional(num('m1'),vector('vi1'),num('m2'),vector('vi2'),final);
  },
  center() { return centerOfMass(rows('particles',3).map(([mass,x,y])=>({mass,position:[x,y]}))); },
  kinetic() { return kineticDecomposition(rows('particles',5).map(([mass,x,y,vx,vy])=>({mass,position:[x,y],velocity:[vx,vy]}))); },
};
