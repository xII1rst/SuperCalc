import { EM_EPS0, EM_MU0, EM_K } from './electromagnetism.mjs';

function finite(value,name) {
  if(typeof value!=='number'||!Number.isFinite(value)) throw new RangeError(`${name}: valor finito requerido`);
  return value;
}
function positive(value,name) {
  finite(value,name);
  if(value<=0) throw new RangeError(`${name}: debe ser positivo`);
  return value;
}
function vector3(value,name) {
  if(!Array.isArray(value)||value.length!==3||value.some(item=>!Number.isFinite(item))) throw new RangeError(`${name}: vector de tres componentes requerido`);
  return value;
}
export function pointChargeSystem(charges,point) {
  vector3(point,'Punto');
  if(!Array.isArray(charges)||!charges.length||charges.length>100) throw new RangeError('Introduce entre 1 y 100 cargas');
  const field=[0,0,0];let potential=0;
  for(const item of charges) {
    finite(item.charge,'Carga');vector3(item.position,'Posición');
    const delta=point.map((value,i)=>value-item.position[i]),r=Math.hypot(...delta);
    if(r<=1e-12) throw new RangeError('El campo puntual es singular en una carga');
    const factor=EM_K*item.charge/r**3;
    delta.forEach((value,i)=>{field[i]+=factor*value;});
    potential+=EM_K*item.charge/r;
  }
  return {field,magnitude:Math.hypot(...field),potential};
}
export function equivalentComponents(values,kind,connection) {
  if(!['resistor','capacitor'].includes(kind)||!['series','parallel'].includes(connection)) throw new RangeError('Tipo de conexión inválido');
  if(!Array.isArray(values)||!values.length||values.length>100) throw new RangeError('Introduce entre 1 y 100 componentes');
  values.forEach((value,i)=>positive(value,`Componente ${i+1}`));
  const sum=values.reduce((a,b)=>a+b,0),inverse=1/values.reduce((a,b)=>a+1/b,0);
  return {equivalent:kind==='resistor'?(connection==='series'?sum:inverse):(connection==='series'?inverse:sum),kind,connection};
}
export function capacitorState(capacitance,voltage) {
  positive(capacitance,'Capacitancia');finite(voltage,'Voltaje');
  return {charge:capacitance*voltage,energy:0.5*capacitance*voltage**2,voltage};
}
export function resistiveWire(resistivity,length,area,voltage=null) {
  positive(resistivity,'Resistividad');positive(length,'Longitud');positive(area,'Área');
  if(voltage!==null) finite(voltage,'Voltaje');
  const resistance=resistivity*length/area;
  return {resistance,current:voltage===null?null:voltage/resistance,power:voltage===null?null:voltage**2/resistance};
}
export function dielectricPlate(area,separation,relativePermittivity,initialVoltage,connected=false) {
  positive(area,'Área');positive(separation,'Separación');positive(relativePermittivity,'Constante dieléctrica');finite(initialVoltage,'Voltaje');
  if(relativePermittivity<1) throw new RangeError('El dieléctrico pasivo debe tener εr ≥ 1');
  const initialCapacitance=EM_EPS0*area/separation,capacitance=initialCapacitance*relativePermittivity;
  const initialCharge=initialCapacitance*initialVoltage;
  const voltage=connected?initialVoltage:initialVoltage/relativePermittivity;
  const charge=connected?capacitance*initialVoltage:initialCharge;
  return {initialCapacitance,capacitance,initialCharge,charge,voltage,field:voltage/separation,
    energy:0.5*capacitance*voltage**2,connection:connected?'conectado a fuente':'aislado'};
}
export function chargedRingAxis(charge,radius,position) {
  finite(charge,'Carga');positive(radius,'Radio');finite(position,'Posición axial');
  const distance=Math.hypot(radius,position);
  return {field:EM_K*charge*position/distance**3,potential:EM_K*charge/distance,
    formula:'Ez = kQz/(R²+z²)^(3/2); V = kQ/√(R²+z²)',assumption:'anillo delgado con carga uniforme; resultado sobre su eje'};
}
export function infiniteChargedPlane(surfaceDensity,paired=false) {
  finite(surfaceDensity,'Densidad superficial');
  return {field:(paired?1:0.5)*surfaceDensity/EM_EPS0,
    formula:paired?'Eentre = σ/ε₀':'E = σ/(2ε₀)',
    assumption:paired?'dos planos infinitos paralelos con densidades +σ y −σ; campo entre ellos':'plano infinito no conductor; campo con signo del lado positivo'};
}
export function conductingSphere(charge,radius,position) {
  finite(charge,'Carga');positive(radius,'Radio');
  if(!Number.isFinite(position)||position<0) throw new RangeError('Distancia radial no negativa requerida');
  const outside=position>=radius;
  return {field:outside?EM_K*charge/position**2:0,
    potential:EM_K*charge/(outside?position:radius),
    formula:'r < R: E = 0, V = kQ/R; r ≥ R: E = kQ/r², V = kQ/r',
    assumption:'esfera conductora aislada en equilibrio; V(∞)=0'};
}
export function uniformSolidSphere(chargeDensity,radius,position) {
  finite(chargeDensity,'Densidad volumétrica');positive(radius,'Radio');
  if(!Number.isFinite(position)||position<0) throw new RangeError('Distancia radial no negativa requerida');
  const charge=4*Math.PI*radius**3*chargeDensity/3,outside=position>=radius;
  return {charge,field:outside?EM_K*charge/position**2:chargeDensity*position/(3*EM_EPS0),
    potential:outside?EM_K*charge/position:EM_K*charge*(3*radius**2-position**2)/(2*radius**3),
    formula:'r ≤ R: E = ρr/(3ε₀), V = kQ(3R²−r²)/(2R³); r ≥ R: E = kQ/r², V = kQ/r',
    assumption:'esfera aislante con densidad uniforme; V(∞)=0'};
}
export function longCurrentCable(current,radius,position) {
  finite(current,'Corriente');positive(radius,'Radio');
  if(!Number.isFinite(position)||position<0) throw new RangeError('Distancia radial no negativa requerida');
  return {field:EM_MU0*current*(position<=radius?position/radius**2:1/position)/(2*Math.PI),
    formula:'r ≤ R: B = μ₀Ir/(2πR²); r ≥ R: B = μ₀I/(2πr)',
    assumption:'cable recto infinito con densidad de corriente uniforme; signo según regla de mano derecha'};
}
export function coaxialCapacitor(innerRadius,outerRadius,length,relativePermittivity=1,voltage=0) {
  positive(innerRadius,'Radio interior');positive(outerRadius,'Radio exterior');positive(length,'Longitud');
  positive(relativePermittivity,'Permitividad relativa');finite(voltage,'Voltaje');
  if(outerRadius<=innerRadius) throw new RangeError('El radio exterior debe superar al interior');
  const capacitance=2*Math.PI*EM_EPS0*relativePermittivity*length/Math.log(outerRadius/innerRadius);
  return {capacitance,charge:capacitance*voltage,energy:0.5*capacitance*voltage**2,
    formula:'C = 2πε₀κL/ln(b/a); Q = CV; U = ½CV²',
    assumption:'cilindros coaxiales largos; se ignoran efectos de borde'};
}
export function layeredPlateCapacitor(area,layers,voltage=0) {
  positive(area,'Área');finite(voltage,'Voltaje');
  if(!Array.isArray(layers)||!layers.length||layers.length>20) throw new RangeError('Introduce entre 1 y 20 capas');
  let weightedThickness=0;
  for(const [index,layer] of layers.entries()) {
    positive(layer.thickness,`Espesor ${index+1}`);positive(layer.relativePermittivity,`Permitividad ${index+1}`);
    weightedThickness+=layer.thickness/layer.relativePermittivity;
  }
  const capacitance=EM_EPS0*area/weightedThickness,charge=capacitance*voltage;
  return {capacitance,charge,energy:0.5*capacitance*voltage**2,
    layerFields:layers.map(layer=>charge/(EM_EPS0*layer.relativePermittivity*area)),
    formula:'C = ε₀A/Σ(dᵢ/κᵢ); Eᵢ = Q/(ε₀κᵢA); U = ½CV²',
    assumption:'capas apiladas en dirección del campo; se ignoran efectos de borde'};
}
function solveSystem(matrix,rhs) {
  const n=rhs.length,a=matrix.map((row,i)=>[...row,rhs[i]]);
  for(let col=0;col<n;col++) {
    let pivot=col;
    for(let row=col+1;row<n;row++) if(Math.abs(a[row][col])>Math.abs(a[pivot][col])) pivot=row;
    if(Math.abs(a[pivot][col])<1e-12) throw new RangeError('Circuito flotante o sin solución única');
    [a[pivot],a[col]]=[a[col],a[pivot]];
    const scale=a[col][col];
    for(let j=col;j<=n;j++) a[col][j]/=scale;
    for(let row=0;row<n;row++) if(row!==col) {
      const factor=a[row][col];
      for(let j=col;j<=n;j++) a[row][j]-=factor*a[col][j];
    }
  }
  return a.map(row=>row[n]);
}
export function nodalCircuit(nodeCount,resistors,fixedVoltages,currentInjections=[]) {
  if(!Number.isInteger(nodeCount)||nodeCount<2||nodeCount>12) throw new RangeError('Se admiten de 2 a 12 nodos');
  if(!Array.isArray(resistors)||!resistors.length||resistors.length>50||!Array.isArray(fixedVoltages)||!fixedVoltages.length||!Array.isArray(currentInjections)) throw new RangeError('Lista de conexiones inválida');
  const fixed=new Map();
  for(const item of fixedVoltages) {
    if(!Number.isInteger(item.node)||item.node<0||item.node>=nodeCount||fixed.has(item.node)) throw new RangeError('Nodo fijo inválido o repetido');
    fixed.set(item.node,finite(item.voltage,'Potencial fijo'));
  }
  if(!fixed.has(0)||fixed.get(0)!==0) throw new RangeError('El nodo 0 debe ser tierra a 0 V');
  const checkNode=node=>{if(!Number.isInteger(node)||node<0||node>=nodeCount) throw new RangeError('Nodo fuera del circuito');};
  for(const item of resistors) {checkNode(item.a);checkNode(item.b);positive(item.resistance,'Resistencia');if(item.a===item.b) throw new RangeError('Resistor entre el mismo nodo');}
  for(const item of currentInjections) {checkNode(item.node);finite(item.current,'Corriente inyectada');}
  const unknown=Array.from({length:nodeCount},(_,i)=>i).filter(i=>!fixed.has(i)),index=new Map(unknown.map((node,i)=>[node,i]));
  const matrix=unknown.map(()=>Array(unknown.length).fill(0)),rhs=unknown.map(()=>0);
  for(const item of resistors) {
    const conductance=1/item.resistance;
    for(const [at,other] of [[item.a,item.b],[item.b,item.a]]) if(index.has(at)) {
      const i=index.get(at);matrix[i][i]+=conductance;
      if(index.has(other)) matrix[i][index.get(other)]-=conductance;
      else rhs[i]+=conductance*fixed.get(other);
    }
  }
  for(const item of currentInjections) if(index.has(item.node)) rhs[index.get(item.node)]+=item.current;
  const solved=unknown.length?solveSystem(matrix,rhs):[];
  const voltages=Array.from({length:nodeCount},(_,node)=>fixed.has(node)?fixed.get(node):solved[index.get(node)]);
  const branchCurrents=resistors.map(({a,b,resistance})=>(voltages[a]-voltages[b])/resistance);
  const kcl=unknown.map(node=>{
    const outgoing=resistors.reduce((sum,item,i)=>sum+(item.a===node?branchCurrents[i]:item.b===node?-branchCurrents[i]:0),0);
    return outgoing-currentInjections.reduce((sum,item)=>sum+(item.node===node?item.current:0),0);
  });
  return {voltages,branchCurrents,kclResiduals:kcl,convention:'I de a hacia b; corriente inyectada positiva entra al nodo'};
}
export function magneticGeometries(kind,current,turns,size,position=null) {
  finite(current,'Corriente');positive(size,'Radio o longitud');
  if(!Number.isInteger(turns)||turns<=0) throw new RangeError('Vueltas enteras positivas');
  if(position!==null) positive(position,'Posición');
  if(kind==='loop') return {field:EM_MU0*turns*current/(2*size),formula:'Bcentro = μ₀NI/(2R)'};
  if(kind==='solenoid') return {field:EM_MU0*turns*current/size,formula:'Binterior ≈ μ₀NI/L (solenoide largo)'};
  if(kind==='toroid') {
    if(position===null) throw new RangeError('Introduce el radio interior de observación');
    return {field:EM_MU0*turns*current/(2*Math.PI*position),formula:'B = μ₀NI/(2πr), dentro del toroide ideal'};
  }
  throw new RangeError('Geometría no soportada');
}
export function magneticForceWire(current,length,field,angleDegrees=90) {
  finite(current,'Corriente');positive(length,'Longitud');finite(field,'Campo');finite(angleDegrees,'Ángulo');
  const magnitude=current*length*field*Math.sin(angleDegrees*Math.PI/180);
  return {signedForce:magnitude,magnitude:Math.abs(magnitude),formula:'F = ILB sen θ'};
}
export function hallEffect(current,field,carrierDensity,charge,thickness) {
  finite(current,'Corriente');finite(field,'Campo');positive(carrierDensity,'Densidad de portadores');
  finite(charge,'Carga del portador');if(charge===0) throw new RangeError('Carga del portador no nula');positive(thickness,'Espesor');
  return {hallVoltage:current*field/(carrierDensity*charge*thickness),
    magnitude:Math.abs(current*field/(carrierDensity*charge*thickness)),formula:'VH = IB/(nqt); signo dado por q'};
}
export function motionalEmf(field,length,speed,angleDegrees=90) {
  finite(field,'Campo');positive(length,'Longitud');finite(speed,'Rapidez');finite(angleDegrees,'Ángulo');
  return {emf:field*length*speed*Math.sin(angleDegrees*Math.PI/180),formula:'ε = Bℓv sen θ'};
}
export function rlTransient(resistance,inductance,voltage,time) {
  positive(resistance,'Resistencia');positive(inductance,'Inductancia');finite(voltage,'Voltaje');
  if(!Number.isFinite(time)||time<0) throw new RangeError('Tiempo no negativo requerido');
  const tau=inductance/resistance,decay=Math.exp(-time/tau);
  return {tau,growingCurrent:voltage/resistance*(1-decay),decayingCurrent:voltage/resistance*decay,
    growingInductorVoltage:voltage*decay,assumption:'escalón de tensión; corriente inicial 0 al conectar o V/R al desconectar'};
}
export function seriesRlcAc(resistance,inductance,capacitance,frequency,rmsVoltage) {
  if(!Number.isFinite(resistance)||resistance<0) throw new RangeError('Resistencia no negativa requerida');
  positive(inductance,'Inductancia');positive(capacitance,'Capacitancia');positive(frequency,'Frecuencia');finite(rmsVoltage,'Voltaje RMS');
  const omega=2*Math.PI*frequency,reactanceInductive=omega*inductance,reactanceCapacitive=1/(omega*capacitance);
  const reactance=reactanceInductive-reactanceCapacitive,impedance=Math.hypot(resistance,reactance);
  const current=Math.abs(rmsVoltage)/impedance,phase=Math.atan2(reactance,resistance);
  const resonanceFrequency=1/(2*Math.PI*Math.sqrt(inductance*capacitance));
  const quality=resistance===0?Infinity:Math.sqrt(inductance/capacitance)/resistance;
  return {reactanceInductive,reactanceCapacitive,reactance,impedance,current,phaseRadians:phase,
    powerFactor:Math.cos(phase),averagePower:current**2*resistance,resonanceFrequency,
    quality,bandwidthHz:resistance/(2*Math.PI*inductance),assumption:'RLC serie sinusoidal en régimen permanente'};
}
export function displacementCurrent(area,fieldRate,relativePermittivity=1) {
  positive(area,'Área');finite(fieldRate,'Derivada del campo');positive(relativePermittivity,'Permitividad relativa');
  return {current:relativePermittivity*EM_EPS0*area*fieldRate,formula:'Id = ε dΦE/dt = ε A dE/dt para campo uniforme'};
}
export function poissonOneDimensional(length,leftVoltage,rightVoltage,chargeDensity,position) {
  positive(length,'Longitud');finite(leftVoltage,'Potencial izquierdo');finite(rightVoltage,'Potencial derecho');finite(chargeDensity,'Densidad de carga');
  if(!Number.isFinite(position)||position<0||position>length) throw new RangeError('Posición fuera del dominio');
  const slope=(rightVoltage-leftVoltage)/length+chargeDensity*length/(2*EM_EPS0);
  return {potential:leftVoltage+slope*position-chargeDensity*position**2/(2*EM_EPS0),
    field:-slope+chargeDensity*position/EM_EPS0,formula:'V″ = −ρ/ε₀; V(0)=V₀, V(L)=VL; E=−V′'};
}
