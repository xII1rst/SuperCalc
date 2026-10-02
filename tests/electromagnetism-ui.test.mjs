import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppHarness } from './helpers/app-harness.mjs';

test('electromagnetismo: auditoría de enunciados y lienzo', async () => {
  const harness = await createAppHarness();
  const { delegatedEvents, getElementById } = harness;
  const actions = harness.actions;
  actions.openSubmod('fi');
  assert.match(getElementById('submod-cards').innerHTML, /data-action="openSubmod" data-arg="mech"/);
  assert.match(getElementById('submod-cards').innerHTML, /data-action="openSubmod" data-arg="waves"/);
  actions.openSubmod('em');
  for (const [card,mode,input,expected] of [
    ['emplus-electrostatics','ring',{charge:'1e-8',radius:'0.1',position:'0.2'},/Anillo cargado/],
    ['emplus-electrostatics','layered',{area:'0.01',layers:'0.001, 2\n0.002, 4',voltage:'100'},/Campos por capa/],
    ['emplus-magnetism','cable',{current:'8',radius:'0.002',position:'0.001'},/Cable con corriente uniforme/],
    ['emplus-magnetism','loopaxis',{current:'3',turns:'1',radius:'0.05',position:'0.1'},/B en z \(T\)/],
    ['emplus-magnetism','looptorque',{turns:'50',current:'2',width:'0.1',height:'0.2',field:'0.5',angle:'30'},/Torque \(N·m\)/],
    ['emplus-magnetism','solenoidinductance',{turns:'500',length:'0.25',area:'0.0004',current:'0',er:'1'},/Autoinductancia \(H\)/],
    ['emplus-magnetism','toroidinductance',{turns:'800',radius:'0.1',area:'0.0002',current:'3',er:'1'},/Autoinductancia \(H\)/],
    ['emplus-magnetism','fluxemf',{turns:'20',width:'0.2',height:'0.3',field:'0.5',omega:'100',time:'0.01'},/FEM máxima/],
    ['emplus-magnetism','railbar',{field:'0.3',length:'0.5',speed:'4',resistance:'2'},/Fuerza magnética/],
    ['emplus-magnetism','displacementplates',{radius:'0.05',position:'0.02',rate:'1e12'},/Campo B a radio r/],
    ['emplus-circuits','lc',{inductance:'0.1',capacitance:'0.00001',charge:'0.0001',time:'0.01'},/Energía total/],
    ['emplus-circuits','rlctransient',{resistance:'20',inductance:'0.5',capacitance:'0.00005',charge:'0.0001',current:'0',time:'0.01'},/subamortiguado/],
    ['emplus-electrostatics','charges',{charges:'0.000001, -1, 0, 0\n0.000001, 1, 0, 0',point:'0, 0, 1'},/Potencial/],
    ['emplus-circuits','nodal',{nodes:'3',resistors:'1, 2, 1000\n2, 0, 1000',fixed:'0, 0\n1, 10',injections:''},/Potenciales de nodos/],
    ['emplus-circuits','nodalfloating',{nodes:'3',resistors:'2, 0, 2',sources:'1, 0, 12\n1, 2, 6',injections:''},/Corrientes de fuentes/],
    ['emplus-magnetism','magnetic',{shape:'loop',current:'2',turns:'100',size:'0.2',position:'0.1'},/Campo B \(T\)/],
  ]) {
    assert.match(getElementById('submod-cards').innerHTML,new RegExp(`data-arg="${card}"`));
    actions.launchSubmod(card);
    getElementById('emplus-mode').value=mode;
    actions.emPlusSelect();
    for (const [key,value] of Object.entries(input)) getElementById(`emplus-${key}`).value=value;
    actions.emPlusCalculate();
    assert.match(getElementById('emplus-result').innerHTML,expected);
    actions.closeModule('emplus');
  }
  actions.launchSubmod('emplus-magnetism');
  getElementById('emplus-mode').value='loopaxis';
  actions.emPlusSelect();
  assert.match(getElementById('emplus-fields').innerHTML,/data-action="emPlusUnitChanged"/);
  for(const [key,value] of Object.entries({current:'3',turns:'1',radius:'0.05',position:'0.1'})) getElementById(`emplus-${key}`).value=value;
  actions.emPlusCalculate();
  const siLoopResult=getElementById('emplus-result').innerHTML;
  for(const [key,kind,unit,expected] of [['current','current','mA',3000],['radius','length','cm',5],['position','length','cm',10]]) {
    getElementById(`emplus-${key}-${kind}-unit`).value=unit;
    actions.emPlusUnitChanged(`${key}:${kind}`);
    assert.equal(Number(getElementById(`emplus-${key}`).value),expected);
  }
  actions.emPlusCalculate();
  assert.equal(getElementById('emplus-result').innerHTML,siLoopResult);
  actions.closeModule('emplus');
  actions.launchSubmod('emplus-electrostatics');
  getElementById('emplus-mode').value='charges';
  actions.emPlusSelect();
  getElementById('emplus-charges').value='0.000001, -1, 0, 0\n0.000001, 1, 0, 0';
  getElementById('emplus-point').value='0, 0, 1';
  actions.emPlusCalculate();
  const siChargesResult=getElementById('emplus-result').innerHTML;
  for(const [key,kind,unit] of [['charges','charge','µC'],['charges','length','cm'],['point','length','cm']]) {
    getElementById(`emplus-${key}-${kind}-unit`).value=unit;
    actions.emPlusUnitChanged(`${key}:${kind}`);
  }
  assert.match(getElementById('emplus-charges').value,/1, -100, 0, 0/);
  assert.equal(getElementById('emplus-point').value,'0, 0, 100');
  actions.emPlusCalculate();
  assert.equal(getElementById('emplus-result').innerHTML,siChargesResult);
  actions.closeModule('emplus');
  actions.launchSubmod('emplus-circuits');
  getElementById('emplus-mode').value='equivalent';
  actions.emPlusSelect();
  assert.match(getElementById('emplus-fields').innerHTML,/emPlusEquivalentKindChanged/);
  for(const [key,value] of Object.entries({values:'4, 6',kind:'resistor',inputUnit:'kΩ',connection:'parallel',outputUnit:'kΩ'}))
    getElementById(`emplus-${key}`).value=value;
  actions.emPlusCalculate();
  assert.match(getElementById('emplus-result').innerHTML,/<dt>Equivalente<\/dt><dd>2\.4<\/dd>/);
  assert.match(getElementById('emplus-result').innerHTML,/<dt>Equivalente en SI \(Ω o F\)<\/dt><dd>2400<\/dd>/);
  getElementById('emplus-values').value='10, 20, 30';
  getElementById('emplus-inputUnit').value='Ω';
  getElementById('emplus-outputUnit').value='Ω';
  getElementById('emplus-connection').value='parallel';
  actions.emPlusCalculate();
  assert.match(getElementById('emplus-result').innerHTML,/5\.454545455/);
  getElementById('emplus-kind').value='capacitor';
  actions.emPlusEquivalentKindChanged();
  assert.equal(getElementById('emplus-inputUnit').value,'F');
  getElementById('emplus-values').value='4, 6';
  getElementById('emplus-inputUnit').value='µF';
  getElementById('emplus-outputUnit').value='µF';
  getElementById('emplus-connection').value='series';
  actions.emPlusCalculate();
  assert.match(getElementById('emplus-result').innerHTML,/<dt>Equivalente<\/dt><dd>2\.4<\/dd>/);
  assert.match(getElementById('emplus-result').innerHTML,/0\.0000024/);
  getElementById('emplus-inputUnit').value='Ω';
  actions.emPlusCalculate();
  assert.match(getElementById('emplus-result').textContent,/deben corresponder/);
  // Los 49 enunciados determinados y dos polaridades explícitas para el 22 ambiguo.
  const emPi=Math.PI,emK=8.9875e9,emEps=8.854e-12,emMu=4*Math.PI*1e-7;
  const emGroups={coulomb:'electrostatics',charges:'electrostatics',flux:'electrostatics',gaussflux:'electrostatics',plates:'electrostatics',capacitor:'electrostatics',ring:'electrostatics',plane:'electrostatics',conductingsphere:'electrostatics',dipole:'electrostatics',dielectriccapacitor:'electrostatics',potentialfield:'electrostatics',divergence:'electrostatics',solidsphere:'electrostatics',radialcylinder:'electrostatics',selfsphere:'electrostatics',coaxial:'electrostatics',layered:'electrostatics',poisson:'electrostatics',equivalent:'circuits',ohm:'circuits',wire:'circuits',rc:'circuits',nodalfloating:'circuits',rl:'circuits',lc:'circuits',rlc:'circuits',rlctransient:'circuits',lorentz:'magnetism',wirefield:'magnetism',magneticforce:'magnetism',fluxchange:'magnetism',solenoidfield:'magnetism',cable:'magnetism',loopaxis:'magnetism',particle:'magnetism',looptorque:'magnetism',hall:'magnetism',solenoidinductance:'magnetism',fluxemf:'magnetism',railbar:'magnetism',toroidinductance:'magnetism',displacementplates:'magnetism'};
  const emFmt=value=>String(Number(value.toPrecision(10)));
  function emCase(id,mode,input,checks,labels=[]) {
    actions.emPlusOpenPanel(emGroups[mode]);
    assert.ok(getElementById('emplus-mode').innerHTML.includes(`value="${mode}"`),`EM ${id}: menú ${mode}`);
    getElementById('emplus-mode').value=mode;
    actions.emPlusSelect();
    const markup=getElementById('emplus-fields').innerHTML;
    for(const [,unitId]of markup.matchAll(/id="(emplus-[^"]+-unit)"/g)) {
      getElementById(unitId).value='';getElementById(unitId).dataset.previous='';
    }
    for(const[key,value]of Object.entries(input)) {
      assert.ok(markup.includes(`id="emplus-${key}"`),`EM ${id}: campo ${key}`);
      getElementById(`emplus-${key}`).value=String(value);
    }
    getElementById('emplus-result').innerHTML='';
    actions.emPlusCalculate();
    const result=getElementById('emplus-result');
    assert.equal(result.classList.contains('tool-error'),false,`EM ${id}: ${result.textContent}`);
    // Verifica cada magnitud junto a su etiqueta para no confundir valores repetidos.
    for(const[label,value]of checks)assert.ok(result.innerHTML.includes(`<dt>${label}</dt><dd>${Array.isArray(value)?`(${value.map(emFmt).join(', ')})`:emFmt(value)}</dd>`),`EM ${id}: ${label} = ${value}\n${result.innerHTML}`);
    for(const text of labels)assert.ok(result.innerHTML.includes(text),`EM ${id}: ${text}`);
    return result.innerHTML;
  }
  emCase(1,'coulomb',{first:2e-6,last:-3e-6,distance:.1},[['Magnitud de fuerza (N)',emK*6e-12/.01]],['Atractiva']);
  emCase(2,'charges',{charges:'5e-9,0,0,0',point:'.5,0,0'},[['Magnitud de campo E (N/C)',emK*5e-9/.25]]);
  emCase(3,'charges',{charges:'-4e-9,0,0,0',point:'2,0,0'},[['Potencial (V)',-emK*4e-9/2]]);
  emCase(4,'flux',{electric:200,area:.5,angle:0},[['Flujo eléctrico (N·m²/C)',100]]);
  emCase(5,'gaussflux',{charge:8.85e-9},[['Flujo eléctrico (N·m²/C)',8.85e-9/emEps]]);
  emCase(6,'plates',{area:.02,distance:.001,er:1},[['Capacitancia (F)',20*emEps]]);
  emCase(7,'capacitor',{capacitance:10e-6,voltage:12},[['Energía (J)',.00072]]);
  for(const[connection,value]of [['series',2.4e-6],['parallel',10e-6]])emCase(8,'equivalent',{values:'4e-6,6e-6',kind:'capacitor',connection,inputUnit:'F',outputUnit:'F'},[['Equivalente',value]]);
  emCase(9,'ohm',{voltage:9,resistance:12},[['Corriente (A)',.75],['Potencia (W)',6.75]]);
  for(const[connection,value]of [['series',60],['parallel',60/11]])emCase(10,'equivalent',{values:'10,20,30',kind:'resistor',connection,inputUnit:'Ω',outputUnit:'Ω'},[['Equivalente',value]]);
  emCase(11,'wire',{resistivity:1.7e-8,length:50,area:'',diameter:.001,voltage:''},[['Resistencia (Ω)',3.4/emPi]]);
  emCase(12,'lorentz',{charge:1.6e-19,velocity:'3000000,0,0',electricVector:'0,0,0',magneticVector:'0,0,.5'},[['Vector fuerza (N)',[0,-2.4e-13,0]],['Magnitud de fuerza (N)',2.4e-13]]);
  assert.match(getElementById('emplus-fields').innerHTML,/id="emplus-velocity"[^>]+type="text"/);
  emCase(13,'wirefield',{current:10,position:.05},[['Campo B (T)',4e-5]]);
  emCase(14,'magneticforce',{current:5,length:.2,field:.4,angle:90},[['Magnitud de fuerza (N)',.4]]);
  emCase(15,'fluxchange',{turns:100,firstFlux:.02,lastFlux:.05,time:.1},[['FEM (V)',-30]]);
  emCase(16,'rc',{resistance:2000,capacitance:5e-6,voltage:1,time:0,fraction:.1},[['Constante de tiempo (s)',.01]]);
  emCase(17,'rlc',{resistance:1,inductance:.2,capacitance:10e-6,frequency:60,voltage:1},[['XL (Ω)',24*emPi],['XC (Ω)',1/(.0012*emPi)]]);
  emCase(18,'ring',{charge:10e-9,radius:.1,position:.2},[['Campo E (N/C)',emK*10e-9*.2/(.05**1.5)]]);
  for(const[paired,value]of [['un plano',3e-6/(2*emEps)],['dos planos',3e-6/emEps]])emCase(19,'plane',{density:3e-6,paired},[['Campo E (N/C)',value]]);
  for(const[position,value]of [[.1,0],[.3,emK*5e-9/.09],[.2,emK*5e-9/.04]])emCase(20,'conductingsphere',{charge:5e-9,radius:.2,position},[['Campo E (N/C)',value],['Potencial (V)',emK*5e-9/Math.max(.2,position)]]);
  emCase(21,'dipole',{charge:2e-9,distance:.01,position:.5},[['Momento dipolar (C·m)',2e-11],['Potencial (V)',emK*2e-11/(.25-.005**2)],['Potencial lejano aproximado (V)',emK*2e-11/.25]],['Aproximación solo si']);
  const em22a=emCase('22 ejemplo +','nodalfloating',{nodes:4,resistors:'1,3,4\n2,3,2\n3,0,6',sources:'1,0,12\n2,0,6',injections:''},[['Corrientes de ramas (A)',[15/11,-3/11,12/11]]],['topología y polaridad explícitas','Residuos KCL (A)','Residuos de fuentes (V)']);
  const em22b=emCase('22 ejemplo −','nodalfloating',{nodes:4,resistors:'1,3,4\n2,3,2\n3,0,6',sources:'1,0,12\n2,0,-6',injections:''},[['Corrientes de ramas (A)',[3,-3,0]]]);
  assert.notEqual(em22a,em22b);
  emCase(23,'rc',{resistance:1000,capacitance:10e-6,voltage:100,time:.005,fraction:.1},[['Voltaje de descarga (V)',100*Math.exp(-.5)],['Tiempo a fracción residual (s)',.01*Math.log(10)]]);
  emCase(24,'rc',{resistance:5000,capacitance:2e-6,voltage:12,time:.01,fraction:.1},[['Carga durante carga (C)',24e-6*(1-Math.exp(-1))],['Corriente de carga (A)',.0024*Math.exp(-1)]]);
  emCase(25,'dielectriccapacitor',{capacitance:5e-6,voltage:100,er:3,connected:'isolated'},[['Capacitancia (F)',15e-6],['Voltaje (V)',100/3],['Energía (J)',.025/3]]);
  emCase(26,'solenoidfield',{density:1000,current:2,er:1},[['Campo B (T)',emMu*2000],['Densidad de energía magnética (J/m³)',emMu*2e6]]);
  for(const[position,value]of [[.001,emMu*8*.001/(2*emPi*.002**2)],[.004,emMu*8/(2*emPi*.004)]])emCase(27,'cable',{current:8,radius:.002,position},[['Campo B (T)',value]]);
  emCase(28,'loopaxis',{current:3,turns:1,radius:.05,position:.1},[['B en el centro (T)',emMu*3/.1],['B en z (T)',emMu*3*.05**2/(2*(.05**2+.1**2)**1.5)]]);
  assert.match(getElementById('emplus-result').innerHTML,/emplus-output-magneticField/);getElementById('emplus-output-magneticField').value='mT';actions.physicsOutputUnitChanged('emplus:magneticField');assert.match(getElementById('emplus-converted-magneticField').innerHTML,/B en z:/,getElementById('emplus-converted-magneticField').textContent);assert.match(getElementById('emplus-converted-magneticField').innerHTML,/mT/);
  emCase(29,'particle',{charge:1.602176634e-19,mass:1.67262192369e-27,speed:1e6,field:.2},[['Radio de órbita (m)',1.67262192369e-27*1e6/(1.602176634e-19*.2)],['Período (s)',2*emPi*1.67262192369e-27/(1.602176634e-19*.2)]]);
  emCase(30,'looptorque',{turns:50,current:2,width:.1,height:.2,field:.5,angle:30},[['Torque (N·m)',Math.sqrt(3)/2]]);
  emCase(31,'hall',{current:5,field:.8,density:8.5e28,charge:-1.602176634e-19,thickness:.001},[['Magnitud de voltaje Hall (V)',4/(8.5e28*1.602176634e-19*.001)]],['Convención']);
  emCase(32,'solenoidinductance',{turns:500,length:.25,area:.0004,current:0,er:1},[['Autoinductancia (H)',emMu*400]]);
  emCase(33,'rl',{resistance:10,inductance:.5,voltage:20,time:.1},[['Corriente de subida (A)',2*(1-Math.exp(-2))],['Energía final de bobina (J)',1]]);
  emCase(34,'lc',{inductance:.02,capacitance:5e-6,charge:0,time:0},[['Frecuencia (Hz)',1/(2*emPi*Math.sqrt(1e-7))],['Período (s)',2*emPi*Math.sqrt(1e-7)]]);
  emCase(35,'potentialfield',{expression:'3*x^2*y-z^3',point:'1,2,1'},[['Vector E (N/C)',[-12,-3,3]],['Densidad de carga ρ (C/m³)',-6*emEps]],['Componentes simbólicas de E','Segundas parciales']);
  assert.match(getElementById('emplus-fields').innerHTML,/id="emplus-expression"[^>]+type="text"/);
  emCase(36,'divergence',{expressions:'2*x\n3*y^2\nz',point:'1,1,1'},[['ρ/ε₀ = divergencia (V/m²)',9],['Densidad de carga ρ (C/m³)',9*emEps]]);
  for(const[position,value]of [[.05,2e-6*.05/(3*emEps)],[.2,emK*(4*emPi*.1**3*2e-6/3)/.04],[0,0]])emCase(37,'solidsphere',{density:2e-6,radius:.1,position},[['Campo E (N/C)',value]],position===0?[emFmt(2*emPi*emK*2e-6*.1**2)]:[]);
  for(const[position,value]of [[.05,1e-6*.05**2/(3*emEps*.1)],[.2,1e-6*.1**2/(3*emEps*.2)]])emCase('38 ejemplo','radialcylinder',{rho:1e-6,radius:.1,position},[['Campo E (N/C)',value]],['ρ₀r²','ρ₀R²']);
  emCase(39,'selfsphere',{charge:2e-9,radius:.05},[['Energía (J)',3*emK*4e-18/(5*.05)]]);
  for(const er of [1,2.5])emCase(40,'coaxial',{inner:.001,outer:.004,length:.5,er,voltage:100},[['Capacitancia (F)',er*emPi*emEps/Math.log(4)],['Energía (J)',5000*er*emPi*emEps/Math.log(4)]]);
  emCase(41,'layered',{area:.01,layers:'.001,2\n.002,4',voltage:0},[['Capacitancia (F)',10*emEps]]);
  for(const[position,potential,field]of [[0,0,-10000-1e-6*.01/(2*emEps)],[.005,50+1e-6*.01**2/(8*emEps),-10000],[.01,100,-10000+1e-6*.01/(2*emEps)]])emCase(42,'poisson',{length:.01,left:0,right:100,rho:1e-6,position},[['Potencial (V)',potential],['Campo E (N/C)',field]],['Solución V(x)','Solución E(x)']);
  const emX=24*emPi-1/(.0024*emPi),emZ=Math.hypot(50,emX),emAC={resistance:50,inductance:.2,capacitance:20e-6,frequency:60,voltage:120};
  emCase(43,'rlc',emAC,[['Impedancia (Ω)',emZ],['Corriente (A)',120/emZ],['Fase (rad)',Math.atan2(emX,50)],['Potencia media (W)',120**2*50/(2500+emX**2)],['Frecuencia de resonancia (Hz)',250/emPi]],['RMS']);
  emCase(44,'rlc',emAC,[['Factor Q',2],['Ancho de banda (Hz)',125/emPi],['Corriente RMS en resonancia (A)',2.4]]);
  emCase(45,'fluxemf',{turns:20,width:.2,height:.3,field:.5,omega:100,time:.01},[['FEM máxima (V)',60],['FEM (V)',-60*Math.cos(1)]]);
  emCase(46,'railbar',{field:.3,length:.5,speed:4,resistance:2},[['FEM (V)',.6],['Corriente (A)',.3],['Fuerza magnética (N)',.045],['Potencia (W)',.18],['Potencia mecánica (W)',.18]]);
  emCase(47,'toroidinductance',{turns:800,radius:.1,area:.0002,current:3,er:1},[['Autoinductancia (H)',.000256],['Energía (J)',.001152]]);
  emCase(48,'lc',{inductance:.1,capacitance:10e-6,charge:100e-6,time:.001},[['Carga (C)',100e-6*Math.cos(1)],['Corriente (A)',-.1*Math.sin(1)],['Energía total (J)',.0005]],['Solución q(t)','Solución I(t)','I(0)=0']);
  emCase(49,'rlctransient',{resistance:20,inductance:.5,capacitance:50e-6,charge:0,current:0,time:0},[['Constante de decaimiento α (s⁻¹)',20],['Frecuencia amortiguada ω′ (rad/s)',Math.sqrt(39600)]],['subamortiguado']);
  emCase(50,'displacementplates',{radius:.05,position:.02,rate:1e12},[['Corriente de desplazamiento (A)',emEps*emPi*.05**2*1e12],['Campo B a radio r (T)',emMu*emEps*.02*1e12/2]]);
  const emRcSI=emCase('23 unidades','rc',{resistance:1000,capacitance:10e-6,voltage:100,time:.005,fraction:.1},[]);
  for(const[key,kind,unit,value]of [['resistance','resistance','kΩ',1],['capacitance','capacitance','µF',10],['time','time','ms',5]]) {
    getElementById(`emplus-${key}-${kind}-unit`).value=unit;
    actions.emPlusUnitChanged(`${key}:${kind}`);
    assert.equal(Number(getElementById(`emplus-${key}`).value),value);
  }
  actions.emPlusCalculate();assert.equal(getElementById('emplus-result').innerHTML,emRcSI);
  const emWireSI=emCase('11 unidades','wire',{resistivity:1.7e-8,length:50,area:'',diameter:.001,voltage:''},[]);
  getElementById('emplus-diameter-length-unit').value='mm';actions.emPlusUnitChanged('diameter:length');
  assert.equal(Number(getElementById('emplus-diameter').value),1);
  actions.emPlusCalculate();assert.equal(getElementById('emplus-result').innerHTML,emWireSI);
  getElementById('emplus-area').value='1e-6';actions.emPlusCalculate();assert.match(getElementById('emplus-result').textContent,/área vacía/);
  emCase('35 unidades','potentialfield',{expression:'3*x^2*y-z^3',point:'1,2,1'},[]);
  getElementById('emplus-point-length-unit').value='cm';actions.emPlusUnitChanged('point:length');
  assert.equal(getElementById('emplus-point').value,'100, 200, 100');
  actions.emPlusCalculate();assert.match(getElementById('emplus-result').innerHTML,/<dd>\(-12, -3, 3\)<\/dd>/);
  getElementById('emplus-expression').value='1/x';actions.emPlusCalculate();assert.match(getElementById('emplus-result').textContent,/Familia/);
  emCase('overflow','selfsphere',{charge:1e100,radius:.05},[]);
  getElementById('emplus-charge').value='1e200';actions.emPlusCalculate();assert.match(getElementById('emplus-result').textContent,/fuera del rango/);
  actions.closeModule('emplus');
  assert.match(getElementById('submod-cards').innerHTML,/data-arg="em-basics"/);
  actions.closeSubmod();
  actions.emPlusOpenPanel('electrostatics');getElementById('emplus-mode').value='poisson2d';actions.emPlusSelect();
  for(const[key,value]of Object.entries({width:1,height:1,rho:-4*8.854e-12,leftBoundary:'y^2',rightBoundary:'1+y^2',bottomBoundary:'x^2',topBoundary:'x^2+1',nx:12,ny:12,tolerance:1e-8,maxIterations:5000}))getElementById(`emplus-${key}`).value=String(value);
  actions.emPlusCalculate();assert.equal(getElementById('emplus-result').classList.contains('tool-error'),false,getElementById('emplus-result').textContent);assert.match(getElementById('emplus-result').innerHTML,/Convergió/);assert.match(getElementById('emplus-result').innerHTML,/Mapa de potencial/);assert.match(getElementById('emplus-result').innerHTML,/fronteras de Dirichlet/);
  getElementById('emplus-topBoundary').value='0';actions.emPlusCalculate();assert.match(getElementById('emplus-result').textContent,/esquina/);
  for (const [id, value] of Object.entries({
    'em-q1': '0.000001', 'em-q2': '0.000001',
    'em-q1x': '0', 'em-q1y': '0', 'em-q1z': '0',
    'em-q2x': '1', 'em-q2y': '0', 'em-q2z': '0',
  })) getElementById(id).value = value;
  actions.emCalcCoulomb();
  assert.match(getElementById('em-res-coulomb').innerHTML, /Fuerza de Coulomb/);
  assert.match(getElementById('em-res-coulomb').innerHTML, /Distancia r/);
  actions.emInit();
  assert.match(getElementById('em-pExtra').innerHTML, /emCalcRC/);
  for(const [id,value] of Object.entries({
    'em-extra-ohm-voltage':'12','em-extra-ohm-current':'2','em-extra-ohm-resistance':'',
  })) getElementById(id).value=value;
  actions.emCalcOhm();
  assert.match(getElementById('em-extra-result-ohm').innerHTML, /24 W/);

  for (const [id, value] of Object.entries({
    'tri-px':'0', 'tri-py':'0', 'tri-pz':'0',
    'tri-qx':'3', 'tri-qy':'0', 'tri-qz':'0',
    'tri-rx':'0', 'tri-ry':'4', 'tri-rz':'0',
  })) getElementById(id).value = value;
  actions.triCalc();
  assert.match(getElementById('tri-res').innerHTML, /Área/);
  assert.equal((getElementById('pV').innerHTML.match(/badge-on/g) || []).length, 3);
  assert.equal(actions._triVecsBackup, undefined);
  assert.equal(actions._alInitDone, undefined);
  getElementById('tri-restore-btn').onclick();
  assert.equal((getElementById('pV').innerHTML.match(/badge-on/g) || []).length, 0);

  actions.addV();
  const vectorInput={dataset:{action:'uV',event:'input',id:'0',key:'vx'},value:'0.5',closest(){return this;}};
  delegatedEvents.get('input')({type:'input',target:vectorInput});
  getElementById('pM').classList.add('on');
  actions.toggleFrac();
  assert.match(getElementById('pM').innerHTML, /\|C\| = 3\/2/);

  getElementById('iu').value = 'x';
  getElementById('ie').value = 'C=x';
  actions.runSolve();
  assert.match(getElementById('pE').innerHTML, /x resuelto/);

  actions.runUnkSolve();
  assert.match(getElementById('pI').innerHTML, /x = -3/);
});
