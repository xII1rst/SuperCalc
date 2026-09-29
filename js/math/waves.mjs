export const WAVE_C=299792458;
export const WAVE_EPS0=8.8541878128e-12;
export const WAVE_R=8.314462618;

function finite(value,label) {
  if (typeof value!=='number'||!Number.isFinite(value)) throw new RangeError(`${label} debe ser finito`);
  return value;
}
function positive(value,label) {
  finite(value,label);
  if (value<=0) throw new RangeError(`${label} debe ser positivo`);
  return value;
}
function nonnegative(value,label) {
  finite(value,label);
  if (value<0) throw new RangeError(`${label} no puede ser negativo`);
  return value;
}

export function harmonicMotion(amplitude,omega,phase=0,time=0,springConstant=null) {
  nonnegative(amplitude,'Amplitud');positive(omega,'Frecuencia angular');finite(phase,'Fase');finite(time,'Tiempo');
  if (springConstant!==null) positive(springConstant,'Constante elástica');
  const angle=omega*time+phase;
  return {amplitude,omega,frequency:omega/(2*Math.PI),period:2*Math.PI/omega,phase,time,
    position:amplitude*Math.cos(angle),velocity:-amplitude*omega*Math.sin(angle),
    acceleration:-amplitude*omega**2*Math.cos(angle),maxSpeed:amplitude*omega,
    maxAcceleration:amplitude*omega**2,energy:springConstant===null?null:0.5*springConstant*amplitude**2};
}

export function springOscillator(mass,springConstant,damping=0,driveForce=null,driveOmega=null) {
  positive(mass,'Masa');positive(springConstant,'Constante elástica');nonnegative(damping,'Amortiguamiento');
  const omega0=Math.sqrt(springConstant/mass),gamma=damping/(2*mass);
  const criticalDamping=2*Math.sqrt(mass*springConstant);
  const discriminant=gamma**2-omega0**2;
  const regime=Math.abs(discriminant)<=1e-12*omega0**2?'critical':discriminant<0?'underdamped':'overdamped';
  const dampedOmega=regime==='underdamped'?Math.sqrt(-discriminant):null;
  const roots=regime==='underdamped'?null:[-gamma+Math.sqrt(Math.max(0,discriminant)),-gamma-Math.sqrt(Math.max(0,discriminant))];
  const quality=damping===0?Infinity:omega0/(2*gamma);
  const decrement=dampedOmega===null?null:gamma*2*Math.PI/dampedOmega;
  const bandwidth=damping/mass;
  const resonanceOmega=omega0**2>2*gamma**2?Math.sqrt(omega0**2-2*gamma**2):null;
  let forced=null;
  if (driveForce!==null||driveOmega!==null) {
    positive(driveForce,'Fuerza motriz');nonnegative(driveOmega,'Frecuencia motriz');
    const denominator=Math.hypot(springConstant-mass*driveOmega**2,damping*driveOmega);
    if (denominator===0) throw new RangeError('Resonancia ideal sin amortiguamiento: amplitud estacionaria no finita');
    const amplitude=driveForce/denominator;
    forced={amplitude,phaseLag:Math.atan2(damping*driveOmega,springConstant-mass*driveOmega**2),
      averagePower:0.5*damping*driveOmega**2*amplitude**2};
  }
  return {omega0,gamma,criticalDamping,regime,dampedOmega,roots,quality,decrement,bandwidth,resonanceOmega,forced};
}

export function pendulumPeriod(length,gravity=9.80665,moment=null,mass=null,distance=null) {
  positive(length,'Longitud');positive(gravity,'Gravedad');
  if (moment===null) return {period:2*Math.PI*Math.sqrt(length/gravity),model:'simple',assumption:'ángulos pequeños'};
  positive(moment,'Momento de inercia');positive(mass,'Masa');positive(distance,'Distancia al pivote');
  return {period:2*Math.PI*Math.sqrt(moment/(mass*gravity*distance)),model:'physical',assumption:'ángulos pequeños'};
}

export function phasorSum(components) {
  if (!Array.isArray(components)||!components.length||components.length>20) throw new RangeError('Introduce entre 1 y 20 fasores');
  let real=0,imaginary=0;
  for(const [amplitude,phase] of components) {
    nonnegative(amplitude,'Amplitud');finite(phase,'Fase');
    real+=amplitude*Math.cos(phase);
    imaginary+=amplitude*Math.sin(phase);
  }
  return {real,imaginary,amplitude:Math.hypot(real,imaginary),phase:Math.atan2(imaginary,real)};
}

export function beats(firstFrequency,secondFrequency) {
  positive(firstFrequency,'Primera frecuencia');positive(secondFrequency,'Segunda frecuencia');
  return {beatFrequency:Math.abs(firstFrequency-secondFrequency),carrierFrequency:(firstFrequency+secondFrequency)/2,
    formula:'2 cos(π(f₁−f₂)t) cos(2π((f₁+f₂)/2)t) para amplitudes iguales'};
}

export function travelingWave(amplitude,waveNumber,omega,position=0,time=0,phase=0,form='sin') {
  nonnegative(amplitude,'Amplitud');positive(waveNumber,'Número de onda');positive(omega,'Frecuencia angular');
  finite(position,'Posición');finite(time,'Tiempo');finite(phase,'Fase');
  if (!['sin','cos'].includes(form)) throw new RangeError('Forma de onda inválida');
  const angle=waveNumber*position-omega*time+phase;
  const displacement=amplitude*(form==='sin'?Math.sin(angle):Math.cos(angle));
  const transverseVelocity=-amplitude*omega*(form==='sin'?Math.cos(angle):-Math.sin(angle));
  return {wavelength:2*Math.PI/waveNumber,frequency:omega/(2*Math.PI),period:2*Math.PI/omega,
    speed:omega/waveNumber,displacement,transverseVelocity,transverseAcceleration:-(omega**2)*displacement,
    maxTransverseVelocity:amplitude*omega};
}

export function stringWave(tension,linearDensity,length=null) {
  positive(tension,'Tensión');positive(linearDensity,'Densidad lineal');
  const speed=Math.sqrt(tension/linearDensity);
  if (length===null) return {speed};
  positive(length,'Longitud');
  return {speed,fundamental:speed/(2*length),harmonics:[1,2,3].map(n=>n*speed/(2*length))};
}

export function standingWave(amplitude,waveNumber,omega,length,count=10) {
  nonnegative(amplitude,'Amplitud');positive(waveNumber,'Número de onda');positive(omega,'Frecuencia angular');positive(length,'Longitud');
  if (!Number.isInteger(count)||count<1||count>100) throw new RangeError('Cantidad de nodos inválida');
  const nodes=[],antinodes=[];
  for(let n=0;n<count;n++) {
    const node=n*Math.PI/waveNumber,antinode=(n+0.5)*Math.PI/waveNumber;
    if (node<=length+1e-12) nodes.push(node);
    if (antinode<=length+1e-12) antinodes.push(antinode);
  }
  return {speed:omega/waveNumber,wavelength:2*Math.PI/waveNumber,frequency:omega/(2*Math.PI),nodes,antinodes,
    componentAmplitude:amplitude/2,componentFormula:'(A/2) sen(kx−ωt) + (A/2) sen(kx+ωt)'};
}

export function deepWaterDispersion(wavelength,gravity=9.80665) {
  positive(wavelength,'Longitud de onda');positive(gravity,'Gravedad');
  const k=2*Math.PI/wavelength,omega=Math.sqrt(gravity*k);
  return {waveNumber:k,omega,phaseSpeed:omega/k,groupSpeed:omega/(2*k)};
}

export function wavePowerString(linearDensity,omega,amplitude,speed) {
  positive(linearDensity,'Densidad lineal');positive(omega,'Frecuencia angular');nonnegative(amplitude,'Amplitud');positive(speed,'Velocidad');
  return {averagePower:0.5*linearDensity*omega**2*amplitude**2*speed};
}

export function intensityLevel(intensity,reference=1e-12) {
  positive(intensity,'Intensidad');positive(reference,'Intensidad de referencia');
  return {decibels:10*Math.log10(intensity/reference)};
}

export function combineSoundLevels(levels,reference=1e-12) {
  if (!Array.isArray(levels)||!levels.length||levels.length>100||levels.some(level=>!Number.isFinite(level))) throw new RangeError('Niveles inválidos');
  positive(reference,'Referencia');
  const intensity=levels.reduce((sum,level)=>sum+reference*10**(level/10),0);
  return {intensity,decibels:intensityLevel(intensity,reference).decibels};
}

export function pointSourceSound(power,distance,reference=1e-12) {
  positive(power,'Potencia');positive(distance,'Distancia');
  const intensity=power/(4*Math.PI*distance**2);
  return {intensity,decibels:intensityLevel(intensity,reference).decibels};
}

export function pointSourceDistanceForLevel(power,decibels,reference=1e-12) {
  positive(power,'Potencia');finite(decibels,'Nivel');positive(reference,'Referencia');
  const targetIntensity=reference*10**(decibels/10);
  return {distance:Math.sqrt(power/(4*Math.PI*targetIntensity)),targetIntensity};
}

export function gasSoundSpeed(heatCapacityRatio,temperatureKelvin,molarMass) {
  positive(heatCapacityRatio,'Razón de calores');positive(temperatureKelvin,'Temperatura absoluta');positive(molarMass,'Masa molar');
  return {speed:Math.sqrt(heatCapacityRatio*WAVE_R*temperatureKelvin/molarMass),assumption:'gas ideal'};
}

export function materialWaveSpeed(modulus,density) {
  positive(modulus,'Módulo elástico');positive(density,'Densidad');
  return {speed:Math.sqrt(modulus/density)};
}

export function machCone(sourceSpeed,soundSpeed) {
  positive(sourceSpeed,'Velocidad de fuente');positive(soundSpeed,'Velocidad del sonido');
  const mach=sourceSpeed/soundSpeed;
  return {mach,angleDegrees:mach>1?Math.asin(1/mach)*180/Math.PI:null};
}

export function movingWallEcho(frequency,soundSpeed,wallToward) {
  positive(frequency,'Frecuencia');positive(soundSpeed,'Velocidad del sonido');finite(wallToward,'Velocidad de pared');
  if (Math.abs(wallToward)>=soundSpeed) throw new RangeError('La pared debe ser subsónica');
  return {echoFrequency:frequency*(soundSpeed+wallToward)/(soundSpeed-wallToward)};
}

export function dopplerFrequency(sourceFrequency,speed,sourceToward=0,observerToward=0) {
  positive(sourceFrequency,'Frecuencia de fuente');positive(speed,'Velocidad del medio');
  finite(sourceToward,'Velocidad de fuente');finite(observerToward,'Velocidad de observador');
  if (Math.abs(sourceToward)>=speed||Math.abs(observerToward)>=speed) throw new RangeError('Esta fórmula requiere velocidades subsónicas');
  return {observed:sourceFrequency*(speed+observerToward)/(speed-sourceToward),
    convention:'fuente hacia observador y observador hacia fuente son positivas'};
}

export function stringBoundary(tension,firstDensity,secondDensity) {
  positive(tension,'Tensión');positive(firstDensity,'Primera densidad');positive(secondDensity,'Segunda densidad');
  const firstImpedance=Math.sqrt(tension*firstDensity),secondImpedance=Math.sqrt(tension*secondDensity);
  const reflected=(firstImpedance-secondImpedance)/(firstImpedance+secondImpedance);
  const transmitted=2*firstImpedance/(firstImpedance+secondImpedance);
  return {firstImpedance,secondImpedance,reflectedAmplitude:reflected,transmittedAmplitude:transmitted,
    reflectedEnergy:reflected**2,transmittedEnergy:4*firstImpedance*secondImpedance/(firstImpedance+secondImpedance)**2};
}

export function electromagneticWave(electricPeak) {
  nonnegative(electricPeak,'Campo eléctrico pico');
  const magneticPeak=electricPeak/WAVE_C;
  const averageIntensity=0.5*WAVE_EPS0*WAVE_C*electricPeak**2;
  return {magneticPeak,peakPoynting:2*averageIntensity,averageIntensity,
    absorbingPressure:averageIntensity/WAVE_C,reflectingPressure:2*averageIntensity/WAVE_C,
    assumption:'onda sinusoidal plana en vacío'};
}

export function refractiveMedium(refractiveIndex,vacuumWavelength) {
  positive(refractiveIndex,'Índice');positive(vacuumWavelength,'Longitud de onda en vacío');
  return {speed:WAVE_C/refractiveIndex,wavelength:vacuumWavelength/refractiveIndex,
    frequency:WAVE_C/vacuumWavelength};
}

export function normalIncidence(firstIndex,secondIndex) {
  positive(firstIndex,'Primer índice');positive(secondIndex,'Segundo índice');
  const reflectance=((firstIndex-secondIndex)/(firstIndex+secondIndex))**2;
  return {reflectance,transmittance:1-reflectance,assumption:'medios no absorbentes, incidencia normal'};
}

export function polarizerChain(unpolarizedIntensity,anglesDegrees) {
  nonnegative(unpolarizedIntensity,'Intensidad inicial');
  if (!Array.isArray(anglesDegrees)||!anglesDegrees.length||anglesDegrees.length>20||anglesDegrees.some(angle=>!Number.isFinite(angle))) throw new RangeError('Ángulos inválidos');
  const after=[unpolarizedIntensity/2];
  for(let i=1;i<anglesDegrees.length;i++) after.push(after.at(-1)*Math.cos((anglesDegrees[i]-anglesDegrees[i-1])*Math.PI/180)**2);
  return {after,final:after.at(-1),assumption:'luz inicial no polarizada y polarizadores ideales'};
}

export function youngInterference(wavelength,slitSeparation,screenDistance,brightOrder=1,darkOrder=0,filmIndex=null,filmThickness=null) {
  positive(wavelength,'Longitud de onda');positive(slitSeparation,'Separación');positive(screenDistance,'Distancia a pantalla');
  if (!Number.isInteger(brightOrder)||brightOrder<0||!Number.isInteger(darkOrder)||darkOrder<0) throw new RangeError('Órdenes no negativos');
  const spacing=wavelength*screenDistance/slitSeparation;
  let shift=null;
  if (filmIndex!==null||filmThickness!==null) {
    positive(filmIndex,'Índice de lámina');nonnegative(filmThickness,'Espesor');
    shift=(filmIndex-1)*filmThickness*screenDistance/slitSeparation;
  }
  return {spacing,bright:brightOrder*spacing,dark:(darkOrder+0.5)*spacing,filmShift:shift,
    convention:'primera franja oscura: orden 0; aproximación de ángulo pequeño'};
}

export function soapFilmConstructive(index,thickness,range=null) {
  positive(index,'Índice');positive(thickness,'Espesor');
  const formula='λ₀(m) = 4nt/(2m+1), m = 0,1,2,… para reflexión con una inversión de fase';
  if (range===null) return {formula,wavelengths:null};
  const [minimum,maximum]=range;
  positive(minimum,'Límite inferior');positive(maximum,'Límite superior');
  if (minimum>maximum) throw new RangeError('Intervalo espectral inválido');
  const wavelengths=[];
  for(let m=0;m<1000;m++) {
    const wavelength=4*index*thickness/(2*m+1);
    if (wavelength<minimum) break;
    if (wavelength<=maximum) wavelengths.push({order:m,wavelength});
  }
  return {formula,wavelengths};
}

export function newtonRing(radiusOfCurvature,wavelength,order,dark=true) {
  positive(radiusOfCurvature,'Radio de curvatura');positive(wavelength,'Longitud de onda');
  if (!Number.isInteger(order)||order<0) throw new RangeError('Orden no negativo');
  return {radius:Math.sqrt((order+(dark?0:0.5))*wavelength*radiusOfCurvature),
    convention:'reflexión: anillo oscuro m=0 en el centro; brillante m=0 es el primero'};
}

export function lcOscillation(inductance,capacitance,initialCharge,time) {
  positive(inductance,'Inductancia');positive(capacitance,'Capacitancia');finite(initialCharge,'Carga inicial');finite(time,'Tiempo');
  const omega=1/Math.sqrt(inductance*capacitance),charge=initialCharge*Math.cos(omega*time);
  const current=-initialCharge*omega*Math.sin(omega*time);
  return {omega,frequency:omega/(2*Math.PI),period:2*Math.PI/omega,charge,current,
    capacitorEnergy:charge**2/(2*capacitance),inductorEnergy:0.5*inductance*current**2,
    totalEnergy:initialCharge**2/(2*capacitance),assumption:'LC ideal sin resistencia; I=dQ/dt'};
}

export function tubeModes(length,soundSpeed,boundary='open-open',count=5) {
  positive(length,'Longitud');positive(soundSpeed,'Velocidad del sonido');
  if(!['open-open','closed-open'].includes(boundary)||!Number.isInteger(count)||count<1||count>30) throw new RangeError('Condición de frontera o cantidad inválida');
  const modes=Array.from({length:count},(_,i)=>{
    const harmonic=boundary==='open-open'?i+1:2*i+1;
    const wavelength=boundary==='open-open'?2*length/harmonic:4*length/harmonic;
    return {harmonic,wavelength,frequency:soundSpeed/wavelength};
  });
  return {modes,boundary,assumption:'tubo ideal; corrección de extremos despreciada'};
}

export function lissajous(amplitudeX,amplitudeY,omegaX,omegaY,phase,time=0,samples=200) {
  nonnegative(amplitudeX,'Amplitud X');nonnegative(amplitudeY,'Amplitud Y');positive(omegaX,'ωx');positive(omegaY,'ωy');finite(phase,'Fase');finite(time,'Tiempo');
  if(!Number.isInteger(samples)||samples<10||samples>500) throw new RangeError('Entre 10 y 500 muestras');
  const x=amplitudeX*Math.sin(omegaX*time+phase),y=amplitudeY*Math.sin(omegaY*time);
  const windowTime=4*Math.PI/Math.min(omegaX,omegaY);
  const points=Array.from({length:samples},(_,i)=>{
    const t=i*windowTime/(samples-1);
    return [amplitudeX*Math.sin(omegaX*t+phase),amplitudeY*Math.sin(omegaY*t)];
  });
  return {x,y,ratio:omegaX/omegaY,points,windowTime,assumption:'trazado paramétrico finito; el cierre exacto requiere razón racional de frecuencias'};
}

export function multipleSlitInterference(slitCount,separation,wavelength,angleDegrees) {
  if(!Number.isInteger(slitCount)||slitCount<2||slitCount>100) throw new RangeError('Entre 2 y 100 rendijas');
  positive(separation,'Separación');positive(wavelength,'Longitud de onda');finite(angleDegrees,'Ángulo');
  const phase=2*Math.PI*separation*Math.sin(angleDegrees*Math.PI/180)/wavelength;
  const denominator=Math.sin(phase/2);
  const normalizedIntensity=Math.abs(denominator)<1e-10?1:(Math.sin(slitCount*phase/2)/(slitCount*denominator))**2;
  return {phase,normalizedIntensity,order:separation*Math.sin(angleDegrees*Math.PI/180)/wavelength,
    assumption:'rendijas idénticas y estrechas; intensidad normalizada por N²'};
}

export function gratingOrders(separation,wavelength,minimumWavelength=null,maximumWavelength=null) {
  positive(separation,'Separación');positive(wavelength,'Longitud de onda');
  const minimum=minimumWavelength===null?wavelength:positive(minimumWavelength,'λ mínima');
  const maximum=maximumWavelength===null?wavelength:positive(maximumWavelength,'λ máxima');
  if(minimum>maximum) throw new RangeError('Banda espectral invertida');
  const highest=Math.floor(separation/minimum+1e-12);
  if(highest>1000) throw new RangeError('Demasiados órdenes; usa una banda más estrecha');
  const orders=Array.from({length:highest+1},(_,order)=>({order,
    angleDegrees:order*wavelength<=separation?Math.asin(order*wavelength/separation)*180/Math.PI:null,
    wavelengthRange:[minimum,order===0?maximum:Math.min(maximum,separation/order)]}));
  return {orders,assumption:'máximos de red: d sen θ = mλ; orden 0 siempre permitido'};
}
