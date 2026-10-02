import { calcParse, collectVariables } from '../../math/expression.mjs';
import { capacitorState, chargedRingAxis, coaxialCapacitor, conductingSphere, dielectricCapacitor, dielectricPlate, dipoleAxis, enclosedChargeFlux, infiniteChargedPlane, layeredPlateCapacitor, pointChargeSystem, poissonOneDimensional, polynomialFieldDivergence, polynomialPotential, radialChargedCylinder, uniformElectricFlux, uniformSolidSphere, uniformSphereSelfEnergy } from '../../math/electromagnetism-advanced.mjs';
import { coulomb, parallelPlateCapacitance } from '../../math/electromagnetism.mjs';
import { list, number, read, rows } from './units.mjs';
import { poissonRectangle } from '../../math/poisson-rectangle.mjs';

export const fields={
  poisson2d:[['width','Ancho Lx (m)','1'],['height','Alto Ly (m)','1'],['rho','ρ uniforme (C/m³)','0'],['leftBoundary','V(0,y), expresión en y (V)','y','text'],['rightBoundary','V(Lx,y), expresión en y (V)','1+y','text'],['bottomBoundary','V(x,0), expresión en x (V)','x','text'],['topBoundary','V(x,Ly), expresión en x (V)','x+1','text'],['nx','Subintervalos x (4–48)','12'],['ny','Subintervalos y (4–48)','12'],['tolerance','Tolerancia de cambio/residuo normalizado (V)','1e-8'],['maxIterations','Máximo de barridos (1–10000)','5000']],
  coulomb:[['first','q₁ (C)','2e-6'],['last','q₂ (C)','-3e-6'],['distance','Separación (m)','0.1']],
  flux:[['electric','Campo E (N/C)','200'],['area','Área (m²)','0.5'],['angle','Ángulo E-normal (°)','0']],
  gaussflux:[['charge','Carga encerrada (C)','8.85e-9']],
  plates:[['area','Área (m²)','0.02'],['distance','Separación (m)','0.001'],['er','Permitividad relativa','1']],
  dipole:[['charge','Carga del par +q (C)','2e-9'],['distance','Separación d (m)','0.01'],['position','Posición axial z (m)','0.5']],
  dielectriccapacitor:[['capacitance','Capacitancia inicial (F)','0.000005'],['voltage','Voltaje inicial (V)','100'],['er','κ','3'],['connected','Condición','isolated','select','isolated,connected']],
  potentialfield:[['expression','V(x,y,z) polinómico (V)','3*x^2*y-z^3','text'],['point','Punto x,y,z (m)','1,2,1','text']],
  divergence:[['expressions','Ex,Ey,Ez polinómicos; una componente por línea (N/C)','2*x\n3*y^2\nz','textarea'],['point','Punto x,y,z (m)','1,1,1','text']],
  radialcylinder:[['rho','ρ₀ (C/m³)','0.000001'],['radius','R (m)','0.1'],['position','r (m)','0.05']],
  selfsphere:[['charge','Carga Q (C)','2e-9'],['radius','Radio R (m)','0.05']],
  charges:[['charges','Carga, x, y, z; una por línea','0.000001, -1, 0, 0\n0.000001, 1, 0, 0','textarea'],['point','Punto x, y, z','0, 0, 1']],
  capacitor:[['capacitance','Capacitancia (F)','0.000002'],['voltage','Voltaje (V)','10']],
  dielectric:[['area','Área de placas (m²)','0.01'],['distance','Separación (m)','0.001'],['er','Permitividad relativa εr','4'],['voltage','Voltaje antes de insertar (V)','12'],['connected','Estado: isolated o connected','isolated','select','isolated,connected']],
  ring:[['charge','Carga total Q (C)','1e-8'],['radius','Radio del anillo (m)','0.1'],['position','Posición axial z (m)','0.2']],
  plane:[['density','Densidad superficial σ (C/m²)','3e-6'],['paired','Configuración','un plano','select','un plano,dos planos']],
  conductingsphere:[['charge','Carga total Q (C)','5e-9'],['radius','Radio de la esfera (m)','0.2'],['position','Distancia al centro r (m)','0.1']],
  solidsphere:[['density','Densidad volumétrica ρ (C/m³)','2e-6'],['radius','Radio de la esfera (m)','0.1'],['position','Distancia al centro r (m)','0.05']],
  coaxial:[['inner','Radio interior a (m)','0.001'],['outer','Radio exterior b (m)','0.004'],['length','Longitud L (m)','0.5'],['er','Permitividad relativa κ','1'],['voltage','Voltaje (V)','100']],
  layered:[['area','Área de placas A (m²)','0.01'],['layers','Capas: espesor, κ; una por línea','0.001, 2\n0.002, 4','textarea'],['voltage','Voltaje (V)','100']],
  poisson:[['length','Dominio L (m)','1'],['left','Potencial V(0) (V)','0'],['right','Potencial V(L) (V)','10'],['rho','Carga uniforme ρ (C/m³)','1e-11'],['position','Posición x (m)','0.5']],
};

export const modes={
  poisson2d:['electrostatics','Poisson/Laplace 2D en rectángulo','Diferencias de cinco puntos con fronteras Dirichlet compatibles; ε₀ uniforme.'],
  coulomb:['electrostatics','Fuerza entre dos cargas','|F|=k|q₁q₂|/r²; signo del producto determina atracción/repulsión'],
  flux:['electrostatics','Flujo eléctrico uniforme','Φ=EA cos θ'],
  gaussflux:['electrostatics','Flujo de Gauss cerrado','Φ=Q/ε₀'],
  plates:['electrostatics','Capacitancia de placas paralelas','C=κε₀A/d'],
  dipole:['electrostatics','Dipolo en su eje','p=qd; potencial exacto y aproximación lejana'],
  dielectriccapacitor:['electrostatics','Dieléctrico desde C y V','C=κC₀; aislado conserva Q; conectado conserva V'],
  potentialfield:['electrostatics','Campo y densidad desde potencial','E=−∇V; ρ=−ε₀∇²V; familia polinómica en x,y,z'],
  divergence:['electrostatics','Gauss diferencial','ρ/ε₀=∇·E; componentes polinómicas en x,y,z'],
  radialcylinder:['electrostatics','Cilindro con densidad radial','ρ(r)=ρ₀r/R; Gauss dentro/fuera'],
  selfsphere:['electrostatics','Energía de esfera uniforme','U=3kQ²/(5R)'],
  charges:['electrostatics','Superposición de cargas','E(P) = Σ kqᵢ(P−rᵢ)/|P−rᵢ|³; V(P) = Σ kqᵢ/|P−rᵢ|'],
  capacitor:['electrostatics','Carga y energía de capacitor','Q = CV; U = ½CV²'],
  dielectric:['electrostatics','Dieléctrico en placas','C = εr ε₀A/d; aislado conserva Q; conectado conserva V'],
  ring:['electrostatics','Anillo cargado: campo axial','Ez = kQz/(R²+z²)^(3/2); V = kQ/√(R²+z²)'],
  plane:['electrostatics','Plano infinito cargado','E = σ/(2ε₀); entre planos ±σ: E = σ/ε₀'],
  conductingsphere:['electrostatics','Esfera conductora','Interior E = 0, V = kQ/R; exterior E = kQ/r², V = kQ/r'],
  solidsphere:['electrostatics','Esfera aislante uniforme','Interior E = ρr/(3ε₀); exterior E = kQ/r²'],
  coaxial:['electrostatics','Capacitor cilíndrico','C = 2πε₀κL/ln(b/a); U = ½CV²'],
  layered:['electrostatics','Capacitor de capas','C = ε₀A/Σ(dᵢ/κᵢ); Eᵢ = Q/(ε₀κᵢA)'],
  poisson:['electrostatics','Poisson 1D con fronteras','V″ = −ρ/ε₀ y V(0), V(L) fijos; E = −V′'],
};

export const solvers={
  coulomb() {
    const q1=number('first'),q2=number('last'),distance=number('distance');
    if(distance<=0)throw new RangeError('Separación positiva requerida.');
    const r=coulomb(q1,q2,[0,0,0],[distance,0,0]);if(!r)throw new RangeError('Separación singular o demasiado pequeña.');
    return {forceMagnitude:r.F,interaction:q1*q2===0?'Sin interacción':r.sign};
  },
  flux() { return uniformElectricFlux(number('electric'),number('area'),number('angle')); },
  gaussflux() { return enclosedChargeFlux(number('charge')); },
  plates() {
    const capacitance=parallelPlateCapacitance(number('area'),number('distance'),number('er'));
    if(capacitance===null)throw new RangeError('Área, distancia y permitividad positivas requeridas.');
    return {capacitance};
  },
  dipole() { return dipoleAxis(number('charge'),number('distance'),number('position')); },
  dielectriccapacitor() { return dielectricCapacitor(number('capacitance'),number('voltage'),number('er'),read('connected')==='connected'); },
  potentialfield() { return polynomialPotential(read('expression'),list('point')); },
  divergence() { return polynomialFieldDivergence(read('expressions').split(/\n|;/).map(s=>s.trim()).filter(Boolean),list('point')); },
  radialcylinder() { return radialChargedCylinder(number('rho'),number('radius'),number('position')); },
  selfsphere() { return uniformSphereSelfEnergy(number('charge'),number('radius')); },
  charges() {
    const points=list('point');if(points.length!==3) throw new RangeError('Punto: se requieren x, y, z');
    return pointChargeSystem(rows('charges',4).map(([charge,x,y,z])=>({charge,position:[x,y,z]})),points);
  },
  capacitor() { return capacitorState(number('capacitance'),number('voltage')); },
  dielectric() { return dielectricPlate(number('area'),number('distance'),number('er'),number('voltage'),read('connected')==='connected'); },
  ring() { return chargedRingAxis(number('charge'),number('radius'),number('position')); },
  plane() { return infiniteChargedPlane(number('density'),read('paired')==='dos planos'); },
  conductingsphere() { return conductingSphere(number('charge'),number('radius'),number('position')); },
  solidsphere() { return uniformSolidSphere(number('density'),number('radius'),number('position')); },
  coaxial() { return coaxialCapacitor(number('inner'),number('outer'),number('length'),number('er'),number('voltage')); },
  layered() { return layeredPlateCapacitor(number('area'),rows('layers',2).map(([thickness,relativePermittivity])=>({thickness,relativePermittivity})),number('voltage')); },
  poisson2d() {
    const boundary=(key,variable)=>{const source=read(key);if(source.length>300||collectVariables(source).some(v=>v!==variable))throw new RangeError(`${key}: usa solo ${variable}, hasta 300 caracteres.`);const f=calcParse(source,variable);if(!f)throw new RangeError('Frontera no reconocida.');return f;};
    return poissonRectangle({width:number('width'),height:number('height'),rho:number('rho'),nx:number('nx'),ny:number('ny'),left:boundary('leftBoundary','y'),right:boundary('rightBoundary','y'),bottom:boundary('bottomBoundary','x'),top:boundary('topBoundary','x')},{tolerance:number('tolerance'),maxIterations:number('maxIterations')});
  },
  poisson() { return poissonOneDimensional(number('length'),number('left'),number('right'),number('rho'),number('position')); },
};
