import { derivativeDetails } from './calculus/derivatives.mjs';
import { vdot, vcross } from './algebra/vector.mjs';

export const MECH_G=9.80665;
export const MECH_BIG_G=6.67430e-11;

function finite(value,label) {
  if (typeof value!=='number'||!Number.isFinite(value)) throw new RangeError(`${label} debe ser finito`);
  return value;
}
function positive(value,label) {
  finite(value,label);
  if (value<=0) throw new RangeError(`${label} debe ser positivo`);
  return value;
}
const radians=degrees=>degrees*Math.PI/180;

function vector3(vector) {
  if(!Array.isArray(vector)||vector.length!==3||!vector.every(Number.isFinite))throw new RangeError('Introduce tres componentes finitas por vector.');
  return {vx:vector[0],vy:vector[1],vz:vector[2]};
}
export function vectorPair(first,second) {
  const a=vector3(first),b=vector3(second),magnitudeA=Math.hypot(...first),magnitudeB=Math.hypot(...second);
  const dot=vdot(a,b,3),cross=Object.values(vcross(a,b));
  return {sum:first.map((x,i)=>x+second[i]),difference:first.map((x,i)=>x-second[i]),magnitudeA,magnitudeB,dot,cross,
    angleDegrees:magnitudeA&&magnitudeB?Math.acos(Math.max(-1,Math.min(1,dot/(magnitudeA*magnitudeB))))*180/Math.PI:null,
    parallelogramArea:Math.hypot(...cross)};
}
export function polarForce(magnitude,angleDegrees) {
  finite(magnitude,'Magnitud');finite(angleDegrees,'Ángulo');
  if(magnitude<0)throw new RangeError('La magnitud no puede ser negativa.');
  return {resultant:[magnitude*Math.cos(radians(angleDegrees)),magnitude*Math.sin(radians(angleDegrees))],magnitude,angleDegrees};
}
export function particleKinematics(expressions,time) {
  finite(time,'Tiempo');
  if(!Array.isArray(expressions)||expressions.length<2||expressions.length>3)throw new RangeError('Introduce dos o tres funciones de t.');
  const first=expressions.map(expr=>derivativeDetails(expr,1,'t')),second=expressions.map(expr=>derivativeDetails(expr,2,'t'));
  if([...first,...second].some(r=>!r))throw new RangeError('Componente no admitida para derivación simbólica.');
  const v=first.map(r=>r.evaluate(time)),a=second.map(r=>r.evaluate(time));
  if([...v,...a].some(r=>r.status!=='evaluated'))throw new RangeError('El punto queda fuera del dominio de una componente o sus derivadas.');
  const velocity=v.map(r=>r.value),acceleration=a.map(r=>r.value);
  return {position:v.map(r=>r.functionValue),velocity,acceleration,speed:Math.hypot(...velocity),
    velocityFormula:first.map(r=>r.derivative),accelerationFormula:second.map(r=>r.derivative),assumption:'Componentes en metros, t en segundos; derivadas simbólicas en el dominio real.'};
}
export function workByForce(force,distance,angleDegrees) {
  finite(force,'Fuerza');finite(distance,'Desplazamiento');finite(angleDegrees,'Ángulo');
  if(force<0||distance<0)throw new RangeError('Magnitudes de fuerza y desplazamiento no negativas.');
  return {work:force*distance*Math.cos(radians(angleDegrees)),assumption:'Fuerza constante; ángulo entre fuerza y desplazamiento.'};
}
export function averagePower(work,time) {
  finite(work,'Trabajo');positive(time,'Tiempo');return {power:work/time};
}
export function linearImpulse(mass,initialVelocity,finalVelocity) {
  positive(mass,'Masa');finite(initialVelocity,'Velocidad inicial');finite(finalVelocity,'Velocidad final');
  return {momentum:mass*initialVelocity,finalMomentum:mass*finalVelocity,impulse:mass*(finalVelocity-initialVelocity)};
}
export function gravitationalAttraction(firstMass,secondMass,distance) {
  positive(firstMass,'Masa 1');positive(secondMass,'Masa 2');positive(distance,'Separación');
  return {magnitude:MECH_BIG_G*firstMass*secondMass/distance**2,assumption:'Masas puntuales o cuerpos esféricos; separación entre centros, fuerza atractiva.'};
}
export function tablePulley(tableMass,hangingMass,kineticFriction,gravity=MECH_G) {
  positive(tableMass,'Masa en mesa');positive(hangingMass,'Masa colgante');positive(gravity,'Gravedad');finite(kineticFriction,'Fricción');
  if(kineticFriction<0)throw new RangeError('Fricción no negativa.');
  const normal=tableMass*gravity,friction=kineticFriction*normal;
  const acceleration=(hangingMass*gravity-friction)/(tableMass+hangingMass);
  const tensionOne=tableMass*acceleration+friction,tensionTwo=hangingMass*(gravity-acceleration);
  return {normal,friction,acceleration,tensionOne,tensionTwo,
    assumption:'Cuerda y polea ideales; fricción cinética, masa colgante desciende. Si a≤0, el inicio desde reposo requiere analizar fricción estática.'};
}
export function springLaunch(stiffness,compression,mass) {
  positive(stiffness,'Constante de resorte');positive(mass,'Masa');finite(compression,'Compresión');
  if(compression<0)throw new RangeError('Compresión no negativa.');
  const initialEnergy=.5*stiffness*compression**2;
  return {initialEnergy,speed:Math.sqrt(2*initialEnergy/mass),assumption:'Toda la energía del resorte pasa a energía cinética; sin rozamiento.'};
}
export function ballisticPendulum(bulletMass,bulletSpeed,blockMass,gravity=MECH_G) {
  positive(bulletMass,'Masa de bala');positive(blockMass,'Masa de bloque');positive(gravity,'Gravedad');finite(bulletSpeed,'Rapidez');
  if(bulletSpeed<0)throw new RangeError('Rapidez no negativa.');
  const totalMass=bulletMass+blockMass,speed=bulletMass*bulletSpeed/totalMass;
  return {speed,height:speed**2/(2*gravity),lostEnergy:.5*bulletMass*bulletSpeed**2-.5*totalMass*speed**2,
    assumption:'Bala incrustada: momentum conservado durante impacto; después energía mecánica conservada al subir.'};
}
export function angularMomentumVector(mass,position,velocity) {
  positive(mass,'Masa');vector3(velocity);const r=vector3(position),p=vector3(velocity.map(v=>mass*v));
  return {angularMomentumVector:Object.values(vcross(r,p)),assumption:'Momento respecto al origen, L=r×mv.'};
}
export function potentialEquilibria(coefficients) {
  if(!Array.isArray(coefficients)||coefficients.length!==4||!coefficients.every(Number.isFinite))throw new RangeError('Introduce a,b,c,d para U=ax³+bx²+cx+d.');
  const [a,b,c]=coefficients;
  if(a===0&&b===0)return {equilibria:[],assumption:c===0?'Potencial constante: todo x es equilibrio indiferente.':'Fuerza constante no nula: no hay equilibrio.'};
  let roots;
  if(a===0)roots=[-c/(2*b)];
  else{
    const scale=Math.max(Math.abs(a),Math.abs(b),Math.abs(c)),A=3*(a/scale),B=2*(b/scale),C=c/scale;
    const discriminant=B*B-4*A*C;
    if(discriminant<0)roots=[];
    else if(discriminant===0)roots=[-B/(2*A)];
    else {const q=-.5*(B+(B>=0?1:-1)*Math.sqrt(discriminant));roots=[q/A,C/q].sort((x,y)=>x-y);}
  }
  return {equilibria:roots.map(x=>({position:x,curvature:6*a*x+2*b,
    stability:6*a*x+2*b>0?'estable':6*a*x+2*b<0?'inestable':'sin extremo: inflexión estacionaria, inestable'})),
    assumption:'F=−U′; U polinómica hasta grado 3. U″>0: mínimo estable; U″<0: máximo inestable.'};
}

export function forceSystem2D(forces,origin=[0,0]) {
  if (!Array.isArray(forces)||!forces.length||forces.length>50||forces.some(item=>!Array.isArray(item.force)||item.force.length!==2
    ||item.force.some(value=>!Number.isFinite(value))||!Array.isArray(item.point)||item.point.length!==2||item.point.some(value=>!Number.isFinite(value)))) {
    throw new RangeError('Introduce entre 1 y 50 fuerzas 2D con punto de aplicación');
  }
  if (origin.length!==2||origin.some(value=>!Number.isFinite(value))) throw new RangeError('Origen inválido');
  const resultant=forces.reduce((sum,item)=>sum.map((value,i)=>value+item.force[i]),[0,0]);
  const torque=forces.reduce((sum,item)=>sum+(item.point[0]-origin[0])*item.force[1]-(item.point[1]-origin[1])*item.force[0],0);
  return {resultant,magnitude:Math.hypot(...resultant),angleDegrees:Math.atan2(resultant[1],resultant[0])*180/Math.PI,
    torque,equilibrium:Math.hypot(...resultant)<1e-9&&Math.abs(torque)<1e-9};
}

export function twoCableEquilibrium(weight,leftDegrees,rightDegrees) {
  positive(weight,'Peso');finite(leftDegrees,'Ángulo izquierdo');finite(rightDegrees,'Ángulo derecho');
  if (leftDegrees<=0||leftDegrees>=180||rightDegrees<=0||rightDegrees>=180) throw new RangeError('Ángulos entre 0° y 180°');
  const left=radians(leftDegrees),right=radians(rightDegrees);
  const denominator=Math.sin(left+right);
  if (Math.abs(denominator)<1e-12) throw new RangeError('Geometría sin equilibrio único');
  const leftTension=weight*Math.cos(right)/denominator;
  const rightTension=weight*Math.cos(left)/denominator;
  if (leftTension<0||rightTension<0) throw new RangeError('La geometría requiere compresión; los cables no pueden sostenerla');
  return {leftTension,rightTension,horizontalResidual:leftTension*Math.cos(left)-rightTension*Math.cos(right),
    verticalResidual:leftTension*Math.sin(left)+rightTension*Math.sin(right)-weight};
}

export function beamReactions(length,beamWeight,loads=[]) {
  positive(length,'Longitud');
  if (!Number.isFinite(beamWeight)||beamWeight<0) throw new RangeError('Peso de viga inválido');
  if (!Array.isArray(loads)||loads.length>30||loads.some(load=>!Number.isFinite(load.weight)||load.weight<0||!Number.isFinite(load.position)||load.position<0||load.position>length)) {
    throw new RangeError('Cargas fuera de la viga');
  }
  const total=beamWeight+loads.reduce((sum,load)=>sum+load.weight,0);
  const moment=beamWeight*length/2+loads.reduce((sum,load)=>sum+load.weight*load.position,0);
  const right=moment/length,left=total-right;
  return {left,right,total,moment,requiresHoldDown:left<0||right<0};
}

export function circularMotion(radius,omega,angularAcceleration=0,time=0) {
  positive(radius,'Radio');finite(omega,'Velocidad angular inicial');finite(angularAcceleration,'Aceleración angular');finite(time,'Tiempo');
  const finalOmega=omega+angularAcceleration*time;
  const angle=omega*time+0.5*angularAcceleration*time**2;
  const tangentialAcceleration=radius*angularAcceleration;
  const radialAcceleration=radius*finalOmega**2;
  return {finalOmega,angle,speed:radius*Math.abs(finalOmega),tangentialAcceleration,radialAcceleration,
    totalAcceleration:Math.hypot(tangentialAcceleration,radialAcceleration)};
}

export function riverCrossing(boatSpeed,currentSpeed) {
  positive(boatSpeed,'Rapidez del bote');finite(currentSpeed,'Corriente');
  if (Math.abs(currentSpeed)>=boatSpeed) throw new RangeError('El bote no puede compensar por completo la corriente');
  return {headingDegrees:Math.asin(currentSpeed/boatSpeed)*180/Math.PI,
    perpendicularSpeed:Math.sqrt(boatSpeed**2-currentSpeed**2),
    direction:'ángulo hacia contracorriente respecto a la perpendicular'};
}

export function inclinedPlane(mass,angleDegrees,kineticFriction,distance=0,gravity=MECH_G) {
  positive(mass,'Masa');finite(angleDegrees,'Ángulo');finite(kineticFriction,'Fricción');positive(gravity,'Gravedad');
  if (angleDegrees<0||angleDegrees>=90||kineticFriction<0||distance<0||!Number.isFinite(distance)) throw new RangeError('Plano o distancia inválidos');
  const angle=radians(angleDegrees),normal=mass*gravity*Math.cos(angle);
  const acceleration=gravity*(Math.sin(angle)-kineticFriction*Math.cos(angle));
  return {normal,gravityAlong:mass*gravity*Math.sin(angle),friction:kineticFriction*normal,
    acceleration,timeFromRest:distance===0?0:acceleration>0?Math.sqrt(2*distance/acceleration):null,
    assumption:'fricción cinética y movimiento hacia abajo; si a≤0 no parte del reposo en este modelo'};
}

export function atwood(massOne,massTwo,gravity=MECH_G,pulleyInertia=0,pulleyRadius=null) {
  positive(massOne,'Primera masa');positive(massTwo,'Segunda masa');positive(gravity,'Gravedad');
  if (!Number.isFinite(pulleyInertia)||pulleyInertia<0) throw new RangeError('Inercia inválida');
  if (pulleyInertia>0) positive(pulleyRadius,'Radio de polea');
  const effectiveMass=massOne+massTwo+(pulleyInertia>0?pulleyInertia/pulleyRadius**2:0);
  const acceleration=(massOne-massTwo)*gravity/effectiveMass;
  return {acceleration,tensionOne:massOne*(gravity-acceleration),tensionTwo:massTwo*(gravity+acceleration),
    direction:'aceleración positiva cuando m₁ desciende'};
}

export function bankedCurve(radius,speed,friction=0,gravity=MECH_G) {
  positive(radius,'Radio');positive(speed,'Rapidez');positive(gravity,'Gravedad');
  if (!Number.isFinite(friction)||friction<0) throw new RangeError('Fricción inválida');
  const angle=Math.atan(speed**2/(radius*gravity));
  const denominator=Math.cos(angle)-friction*Math.sin(angle);
  return {angleDegrees:angle*180/Math.PI,
    maxSpeed:denominator<=0?Infinity:Math.sqrt(radius*gravity*(Math.sin(angle)+friction*Math.cos(angle))/denominator)};
}

export function verticalLoop(startHeight,radius,gravity=MECH_G) {
  if (!Number.isFinite(startHeight)||startHeight<0) throw new RangeError('Altura inválida');
  positive(radius,'Radio');positive(gravity,'Gravedad');
  const bottomSpeed=Math.sqrt(2*gravity*startHeight);
  const topSpeed=startHeight>=2*radius?Math.sqrt(2*gravity*(startHeight-2*radius)):null;
  const minimumStartHeight=2.5*radius;
  return {bottomSpeed,topSpeed,contactAtTop:topSpeed!==null&&startHeight>=minimumStartHeight-1e-12*Math.max(1,minimumStartHeight),
    minimumStartHeight,assumption:'sin rozamiento; parte del reposo'};
}

export function collisionOneDimensional(massOne,firstVelocity,massTwo,secondVelocity,restitution=1) {
  positive(massOne,'Primera masa');positive(massTwo,'Segunda masa');finite(firstVelocity,'Primera velocidad');finite(secondVelocity,'Segunda velocidad');
  if (!Number.isFinite(restitution)||restitution<0||restitution>1) throw new RangeError('Restitución entre 0 y 1');
  const total=massOne+massTwo,momentum=massOne*firstVelocity+massTwo*secondVelocity;
  const firstFinal=(momentum-massTwo*restitution*(firstVelocity-secondVelocity))/total;
  const secondFinal=(momentum+massOne*restitution*(firstVelocity-secondVelocity))/total;
  const initialEnergy=0.5*massOne*firstVelocity**2+0.5*massTwo*secondVelocity**2;
  const finalEnergy=0.5*massOne*firstFinal**2+0.5*massTwo*secondFinal**2;
  return {firstFinal,secondFinal,momentum,initialEnergy,finalEnergy,lostEnergy:initialEnergy-finalEnergy};
}

export function collisionTwoDimensional(massOne,firstInitial,massTwo,secondInitial,firstFinal) {
  positive(massOne,'Primera masa');positive(massTwo,'Segunda masa');
  for (const value of [firstInitial,secondInitial,firstFinal]) if (!Array.isArray(value)||value.length!==2||value.some(v=>!Number.isFinite(v))) throw new RangeError('Velocidades 2D inválidas');
  const secondFinal=firstInitial.map((value,i)=>(massOne*value+massTwo*secondInitial[i]-massOne*firstFinal[i])/massTwo);
  const initialEnergy=.5*massOne*firstInitial.reduce((s,v)=>s+v*v,0)+.5*massTwo*secondInitial.reduce((s,v)=>s+v*v,0),finalEnergy=.5*massOne*firstFinal.reduce((s,v)=>s+v*v,0)+.5*massTwo*secondFinal.reduce((s,v)=>s+v*v,0);
  return {firstFinal:firstFinal.slice(),secondFinal,initialMomentum:firstInitial.map((value,i)=>massOne*value+massTwo*secondInitial[i]),initialEnergy,finalEnergy,energyChange:finalEnergy-initialEnergy,assumption:'Momentum conservado; no se impone energía cinética constante. Un aumento de energía requiere aporte energético; solo ΔE=0 es compatible con impacto elástico.'};
}

export function centerOfMass(particles) {
  if (!Array.isArray(particles)||!particles.length||particles.length>100||particles.some(item=>!Number.isFinite(item.mass)||item.mass<=0||!Array.isArray(item.position)||item.position.length!==2||item.position.some(value=>!Number.isFinite(value)))) {
    throw new RangeError('Partículas inválidas');
  }
  const totalMass=particles.reduce((sum,item)=>sum+item.mass,0);
  return {totalMass,position:[0,1].map(i=>particles.reduce((sum,item)=>sum+item.mass*item.position[i],0)/totalMass)};
}

export function kineticDecomposition(particles) {
  if (!Array.isArray(particles)||!particles.length||particles.some(item=>!Array.isArray(item.velocity)||item.velocity.length!==2||item.velocity.some(value=>!Number.isFinite(value)))) throw new RangeError('Velocidades inválidas');
  const center=centerOfMass(particles);
  const centerVelocity=[0,1].map(i=>particles.reduce((sum,item)=>sum+item.mass*item.velocity[i],0)/center.totalMass);
  const totalKinetic=particles.reduce((sum,item)=>sum+0.5*item.mass*(item.velocity[0]**2+item.velocity[1]**2),0);
  const centerKinetic=0.5*center.totalMass*(centerVelocity[0]**2+centerVelocity[1]**2);
  const angularMomentum=particles.reduce((sum,item)=>sum+item.mass*(item.position[0]*item.velocity[1]-item.position[1]*item.velocity[0]),0);
  return {...center,centerVelocity,totalKinetic,centerKinetic,relativeKinetic:totalKinetic-centerKinetic,angularMomentum,
    ...(particles.length===2?{reducedMass:particles[0].mass*particles[1].mass/center.totalMass}:{})};
}

export function standardInertia(shape,mass,size) {
  positive(mass,'Masa');positive(size,'Radio o longitud');
  const factor={disk:0.5,solidCylinder:0.5,hoop:1,rodCenter:1/12,rodEnd:1/3,solidSphere:0.4}[shape];
  if (factor===undefined) throw new RangeError('Cuerpo estándar no soportado');
  return {inertia:factor*mass*size**2,shape,factor};
}

export function rollingDownIncline(mass,radius,angleDegrees,distance,shape='solidCylinder',staticFriction=null,gravity=MECH_G) {
  positive(mass,'Masa');positive(radius,'Radio');positive(distance,'Distancia');positive(gravity,'Gravedad');finite(angleDegrees,'Ángulo');
  const factor={solidCylinder:0.5,hoop:1,solidSphere:0.4}[shape];
  if(factor===undefined||angleDegrees<=0||angleDegrees>=90) throw new RangeError('Cuerpo o ángulo de rodadura inválido');
  if(staticFriction!==null&&(!Number.isFinite(staticFriction)||staticFriction<0)) throw new RangeError('Fricción estática inválida');
  const angle=radians(angleDegrees),normal=mass*gravity*Math.cos(angle);
  const acceleration=gravity*Math.sin(angle)/(1+factor),friction=mass*factor*acceleration;
  const requiredStaticFriction=friction/normal;
  if(staticFriction!==null&&staticFriction+1e-12<requiredStaticFriction)
    throw new RangeError(`La fricción estática debe ser al menos ${requiredStaticFriction} para rodar sin deslizar`);
  const speed=Math.sqrt(2*acceleration*distance),finalOmega=speed/radius;
  const translationalEnergy=0.5*mass*speed**2,rotationalEnergy=0.5*factor*mass*radius**2*finalOmega**2;
  return {inertiaFactor:factor,normal,friction,requiredStaticFriction,acceleration,
    angularAcceleration:acceleration/radius,timeFromRest:Math.sqrt(2*distance/acceleration),speed,finalOmega,
    translationalEnergy,rotationalEnergy,potentialDrop:mass*gravity*distance*Math.sin(angle),
    energyResidual:translationalEnergy+rotationalEnergy-mass*gravity*distance*Math.sin(angle),
    assumption:'parte del reposo, rueda sin deslizar y no pierde energía'};
}

export function angularMomentumSkater(initialInertia,initialOmega,finalInertia) {
  positive(initialInertia,'Inercia inicial');positive(finalInertia,'Inercia final');finite(initialOmega,'Velocidad angular inicial');
  const angularMomentum=initialInertia*initialOmega,finalOmega=angularMomentum/finalInertia;
  const initialKinetic=0.5*initialInertia*initialOmega**2,finalKinetic=0.5*finalInertia*finalOmega**2;
  return {angularMomentum,finalOmega,initialKinetic,finalKinetic,energyChange:finalKinetic-initialKinetic,
    assumption:'sin torque externo; el cambio de energía proviene del trabajo interno'};
}

export function hingedRodDrop(mass,length,gravity=MECH_G) {
  positive(mass,'Masa');positive(length,'Longitud');positive(gravity,'Gravedad');
  const inertia=mass*length**2/3,initialTorque=mass*gravity*length/2;
  const potentialDrop=mass*gravity*length/2,finalOmega=Math.sqrt(2*potentialDrop/inertia);
  return {inertia,initialTorque,initialAngularAcceleration:initialTorque/inertia,finalOmega,
    potentialDrop,finalKinetic:0.5*inertia*finalOmega**2,
    assumption:'varilla uniforme, articulación sin fricción; se suelta desde horizontal y llega a vertical'};
}

export function apsisAngularMomentum(periapsisRadius,periapsisSpeed,apoapsisRadius) {
  positive(periapsisRadius,'Radio periapsis');positive(periapsisSpeed,'Rapidez periapsis');positive(apoapsisRadius,'Radio apoapsis');
  if(apoapsisRadius<periapsisRadius) throw new RangeError('El apoapsis debe estar al menos tan lejos como el periapsis');
  const specificAngularMomentum=periapsisRadius*periapsisSpeed;
  const apoapsisSpeed=specificAngularMomentum/apoapsisRadius;
  return {specificAngularMomentum,apoapsisSpeed,angularMomentumResidual:specificAngularMomentum-apoapsisRadius*apoapsisSpeed,
    assumption:'órbita de fuerza central; en ambos ápsides la velocidad es tangencial'};
}

export function circularOrbit(centralMass,radius,satelliteMass=null) {
  positive(centralMass,'Masa central');positive(radius,'Radio orbital');
  if (satelliteMass!==null) positive(satelliteMass,'Masa de satélite');
  const mu=MECH_BIG_G*centralMass;
  return {speed:Math.sqrt(mu/radius),period:2*Math.PI*Math.sqrt(radius**3/mu),escapeSpeed:Math.sqrt(2*mu/radius),
    totalEnergy:satelliteMass===null?null:-mu*satelliteMass/(2*radius),specificAngularMomentum:Math.sqrt(mu*radius),
    assumption:'órbita circular y cuerpo central dominante'};
}

export function galileanTransform(position,velocity,frameVelocity,time) {
  if (![position,velocity,frameVelocity].every(vector=>Array.isArray(vector)&&vector.length===2&&vector.every(value=>Number.isFinite(value)))) throw new RangeError('Vectores 2D inválidos');
  finite(time,'Tiempo');
  return {position:position.map((value,i)=>value-frameVelocity[i]*time),velocity:velocity.map((value,i)=>value-frameVelocity[i])};
}

export function rotatingFrameVelocity(inertialVelocity,position,angularVelocity) {
  if (![inertialVelocity,position].every(vector=>Array.isArray(vector)&&vector.length===2&&vector.every(value=>Number.isFinite(value)))) throw new RangeError('Vectores 2D inválidos');
  finite(angularVelocity,'Velocidad angular');
  const rotational=[-angularVelocity*position[1],angularVelocity*position[0]];
  return {rotational,relative:inertialVelocity.map((value,i)=>value-rotational[i]),
    assumption:'Origen común sin traslación; ω sobre +z, vectores expresados en los mismos ejes instantáneos.'};
}
