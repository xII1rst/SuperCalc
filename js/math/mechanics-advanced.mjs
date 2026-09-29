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
  return {secondFinal,initialMomentum:firstInitial.map((value,i)=>massOne*value+massTwo*secondInitial[i])};
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
  return {...center,centerVelocity,totalKinetic,centerKinetic,relativeKinetic:totalKinetic-centerKinetic,angularMomentum};
}

export function standardInertia(shape,mass,size) {
  positive(mass,'Masa');positive(size,'Radio o longitud');
  const factor={disk:0.5,solidCylinder:0.5,hoop:1,rodCenter:1/12,rodEnd:1/3,solidSphere:0.4}[shape];
  if (factor===undefined) throw new RangeError('Cuerpo estándar no soportado');
  return {inertia:factor*mass*size**2,shape,factor};
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
  return {rotational,relative:inertialVelocity.map((value,i)=>value-rotational[i])};
}
