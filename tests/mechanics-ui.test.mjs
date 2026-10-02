import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createAppHarness } from './helpers/app-harness.mjs';

test('mecánica: auditoría de enunciados y paneles', async () => {
  const harness = await createAppHarness();
  const { history, getElementById } = harness;
  const actions = harness.actions;
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const pi = Math.PI;
  // El recorrido original llegaba aquí desde el menú Matemáticas → Física; el historial lo reproduce.
  actions.openSubmod('math');
  actions.openSubmod('fi');
  actions.openSubmod('mech');
  assert.match(getElementById('submod-back').innerHTML, /Física/);
  for (const id of ['mech-motion','mech-projectile','mech-dynamics'])
    assert.match(getElementById('submod-cards').innerHTML, new RegExp(`data-arg="${id}"`));
  for (const [card,mode,input,expected] of [
    ['mechplus-forces','cables',{weight:'100',left:'30',right:'45'},/Tensión izquierda/],
    ['mechplus-motion','loop',{height:'5',radius:'2'},/Contacto en cima/],
    ['mechplus-collisions','collision',{m1:'2',v1:'3',m2:'1',v2:'0',e:'1'},/Velocidad final 1/],
    ['mechplus-rotation','orbit',{mass:'5.972e24',radius:'6771000',satellite:'1000'},/Período/],
    ['mechplus-rotation','rolling',{shape:'solidCylinder',mass:'10',radius:'0.2',angle:'30',distance:'3',friction:''},/μ estática mínima/],
    ['mechplus-rotation','skater',{initialInertia:'3',initialOmega:'2',finalInertia:'1.2'},/Cambio de energía/],
    ['mechplus-rotation','hingedrod',{mass:'2',length:'1'},/α inicial/],
    ['mechplus-rotation','apsides',{periapsisRadius:'10000000',periapsisSpeed:'9000',apoapsisRadius:'20000000'},/4500/],
  ]) {
    assert.match(getElementById('submod-cards').innerHTML,new RegExp(`data-arg="${card}"`));
    actions.launchSubmod(card);
    assert.equal(getElementById('mechplus-app').classList.contains('visible'),true);
    getElementById('mechplus-mode').value=mode;
    actions.mechPlusSelect();
    for (const [key,value] of Object.entries(input)) getElementById(`mechplus-${key}`).value=value;
    if(mode==='cables') {
      const unit=getElementById('mechplus-weight-force-unit');
      unit.value='lbf';unit.dataset.previous='N';
      actions.mechPlusUnitChanged('weight:force');
      assert.ok(Math.abs(Number(getElementById('mechplus-weight').value)-100/4.4482216152605)<1e-8);
    }
    actions.mechPlusCalculate();
    assert.match(getElementById('mechplus-result').innerHTML,expected);
    actions.closeModule('mechplus');
  }
  actions.launchSubmod('mechplus-forces');
  const mechCase=(id,mode,inputs,expected)=>{
    const group=['circular','river','bank','loop','trajectory','galileo','rotating'].includes(mode)?'motion':
      ['collision','collision2d','center','kinetic','ballistic','impulse'].includes(mode)?'collisions':
      ['gravity','inertia','rolling','skater','hingedrod','apsides','orbit','angular'].includes(mode)?'rotation':'forces';
    actions.mechPlusOpenPanel(group);
    assert.ok(getElementById('mechplus-mode').innerHTML.includes(`value="${mode}"`),`Mecánica ${id}: operación en menú ${group}`);
    getElementById('mechplus-mode').value=mode;actions.mechPlusSelect();
    const markup=getElementById('mechplus-fields').innerHTML;
    for(const match of markup.matchAll(/id="(mechplus-[^"]+-unit)"/g))getElementById(match[1]).value='';
    for(const [key,value]of Object.entries(inputs)){
      assert.ok(markup.includes(`id="mechplus-${key}"`),`Mecánica ${id}: campo ${key}`);
      getElementById(`mechplus-${key}`).value=String(value);
    }
    getElementById('mechplus-result').innerHTML='';actions.mechPlusCalculate();
    assert.equal(getElementById('mechplus-result').classList.contains('tool-error'),false,`Mecánica ${id}: ${getElementById('mechplus-result').textContent}`);
    const html=getElementById('mechplus-result').innerHTML;
    for(const value of expected){const text=typeof value==='number'?String(Number(value.toPrecision(10))):value;assert.ok(html.includes(text),`Mecánica ${id}: falta ${text} en ${html}`);}
    return html;
  };
  const mechG=9.80665,mechBigG=6.67430e-11;
  mechCase(1,'vectors',{first:'3,-2,4',second:'1,5,-2'},['(4, 3, 2)','(2, -7, 6)',Math.sqrt(29)]);
  mechCase(2,'vectors',{first:'2,1,-3',second:'4,-2,1'},['A·B</dt><dd>3','(-5, -14, -8)']);
  mechCase(3,'polar',{weight:50,angle:37},[50*Math.cos(37*pi/180),50*Math.sin(37*pi/180),'Fuerza resultante (N)']);
  mechCase(4,'forces',{rows:'0,20,0.4,0'},['Torque (N·m)</dt><dd>8']);
  mechCase(5,'forces',{rows:'30,0,0,0\n0,40,0,0'},['Magnitud (N)</dt><dd>50',Math.atan2(40,30)*180/pi]);
  mechCase(10,'circular',{radius:.5,omega:120,alpha:0,time:0},[120]);
  getElementById('mechplus-omega-angularSpeed-unit').value='rpm';actions.mechPlusCalculate();
  assert.ok(getElementById('mechplus-result').innerHTML.includes(String(Number((4*pi).toPrecision(10)))));
  assert.ok(getElementById('mechplus-result').innerHTML.includes(String(Number((8*pi**2).toPrecision(10)))));
  mechCase(12,'work',{weight:30,distance:5,angle:60},['Trabajo (J)</dt><dd>75']);
  mechCase(14,'power',{energy:5000,time:20},['250','Potencia media (W)']);
  mechCase(15,'impulse',{mass:1500,v1:20,v2:10},['30000','-15000','Impulso (N·s)']);
  mechCase(16,'inertia',{shape:'disk',mass:4,size:.3},['0.18','Inercia (kg·m²)']);
  mechCase(17,'gravity',{m1:5e24,m2:7e22,distance:3.8e8},[mechBigG*5e24*7e22/(3.8e8)**2,'Fuerza gravitacional (N)']);
  mechCase(18,'vectors',{first:'1,2,2',second:'2,-1,2'},[Math.acos(4/9)*180/pi]);
  mechCase(19,'vectors',{first:'1,2,3',second:'2,0,1'},[Math.sqrt(45),'Área del paralelogramo']);
  mechCase(20,'cables',{weight:100,left:30,right:45},[100*Math.cos(pi/4)/Math.sin(5*pi/12),100*Math.cos(pi/6)/Math.sin(5*pi/12)]);
  assert.match(getElementById('mechplus-result').innerHTML,/Equilibrio de cables/);getElementById('mechplus-output-force').value='kN';actions.physicsOutputUnitChanged('mechplus:force');assert.match(getElementById('mechplus-converted-force').innerHTML,/Tensión izquierda: 0\.0/);assert.match(getElementById('mechplus-converted-force').innerHTML,/kN/);
  mechCase(21,'beam',{length:6,weight:200,loads:'300,2'},['Reacción izquierda (N)</dt><dd>300','Reacción derecha (N)</dt><dd>200']);
  mechCase(22,'trajectory',{expressions:'3*t^2\n2*t-t^3',time:2},['(12, -10)','(6, -12)',Math.sqrt(244),'v(t) (m/s)']);
  mechCase(23,'river',{boat:5,current:3},[Math.asin(.6)*180/pi,'Rapidez perpendicular (m/s)</dt><dd>4']);
  const planeAccel=mechG*(.5-.2*Math.sqrt(3)/2);
  mechCase(24,'incline',{mass:10,angle:30,friction:.2,distance:4},[planeAccel,Math.sqrt(8/planeAccel)]);
  mechCase(25,'atwood',{m1:5,m2:3,inertia:0,pulleyMass:'',radius:.2},[mechG/4,15*mechG/4]);
  mechCase(26,'table',{m1:4,m2:6,friction:.1},[.56*mechG,2.64*mechG]);
  mechCase(27,'collision',{m1:3,v1:4,m2:2,v2:0,e:0},['2.4','9.6']);
  mechCase(28,'collision',{m1:2,v1:5,m2:3,v2:-2,e:1},['-3.4','3.6']);
  mechCase(29,'spring',{stiffness:200,distance:.1,mass:.5},['Rapidez (m/s)</dt><dd>2']);
  mechCase(30,'loop',{height:5,radius:2},[Math.sqrt(10*mechG),Math.sqrt(2*mechG),'Contacto en cima</dt><dd>sí']);
  mechCase(31,'center',{particles:'2,0,0\n3,4,0\n5,0,6'},['(1.2, 3)']);
  mechCase(32,'angular',{mass:2,position:'3,4,0',velocity:'-1,2,0'},['(0, 0, 20)','kg·m²/s']);
  mechCase(33,'rolling',{mass:10,radius:.2,angle:30,distance:3,shape:'solidCylinder',friction:''},[mechG/3,Math.sqrt(18/mechG),'sin deslizar']);
  mechCase(34,'orbit',{mass:5.97e24,radius:7e6,satellite:''},[Math.sqrt(mechBigG*5.97e24/7e6),2*pi*Math.sqrt((7e6)**3/(mechBigG*5.97e24))]);
  mechCase(36,'circular',{radius:.8,omega:2,alpha:1.5,time:4},['20','1.2','51.2',Math.hypot(1.2,51.2)]);
  const bankAngle=Math.atan(400/(80*mechG));
  mechCase(37,'bank',{radius:80,speed:20,friction:.3},[bankAngle*180/pi,Math.sqrt(80*mechG*(Math.tan(bankAngle)+.3)/(1-.3*Math.tan(bankAngle)))]);
  mechCase(38,'orbit',{mass:5.97e24,radius:6.37e6,satellite:''},[Math.sqrt(2*mechBigG*5.97e24/6.37e6),'Rapidez de escape']);
  mechCase(38,'orbit',{mass:5.97e24,radius:1.5e7,satellite:500},[-mechBigG*5.97e24*500/3e7]);
  mechCase(39,'potential',{coefficients:'1,-6,9,0'},['x=1 m; U″=-6 J/m²; inestable','x=3 m; U″=6 J/m²; estable']);
  mechCase(40,'collision2d',{m1:2,vi1:'6,0',m2:1,vi2:'0,0',vf1:'',vfSpeed:4,vfAngle:30},[12-4*Math.sqrt(3),'-4)']);
  mechCase(41,'ballistic',{m1:.02,speed:300,m2:2},[300/101,(300/101)**2/(2*mechG),'momentum conservado']);
  mechCase(42,'kinetic',{particles:'2,0,0,3,0\n3,0,0,-1,2'},['(0.6, 1.2)','Masa reducida (kg)</dt><dd>1.2','Energía cinética relativa (J)</dt><dd>12']);
  mechCase(43,'atwood',{m1:4,m2:2,inertia:'',pulleyMass:2,radius:.1},[2*mechG/7,20*mechG/7,18*mechG/7,'Inercia (kg·m²)</dt><dd>0.01']);
  mechCase(44,'skater',{initialInertia:3,initialOmega:2,finalInertia:1.2},['ω final (rad/s)</dt><dd>5','Cambio de energía (J)</dt><dd>9']);
  mechCase(45,'inertia',{shape:'rodEnd',mass:3,size:1.2},['1.44']);
  mechCase(45,'inertia',{shape:'rodCenter',mass:3,size:1.2},['0.36']);
  mechCase(46,'hingedrod',{mass:2,length:1},[1.5*mechG,Math.sqrt(3*mechG)]);
  mechCase(47,'apsides',{periapsisRadius:1e7,periapsisSpeed:9000,apoapsisRadius:2e7},['90000000000','4500']);
  mechCase(48,'rotating',{velocity:'3,4',position:'1,0',omega:2},['Velocidad relativa (m/s)</dt><dd>(3, 2)']);
  mechCase(49,'galileo',{position:'100,0',velocity:'30,10',frame:'20,0',time:5},['Posición (m)</dt><dd>(0, 0)','Velocidad (m/s)</dt><dd>(10, 10)']);
  mechCase(50,'kinetic',{particles:'1,0,0,2,0\n2,1,0,0,3\n3,0,2,-1,1'},['Energía cinética total (J)</dt><dd>14',41/6,43/6,'Momento angular (kg·m²/s)</dt><dd>12']);
  mechCase('vector nulo','vectors',{first:'0,0,0',second:'1,0,0'},['Indefinido para vector nulo']);
  const ballisticSI=mechCase('unidades','ballistic',{m1:.02,speed:300,m2:2},[]);
  const bulletUnit=getElementById('mechplus-m1-mass-unit');bulletUnit.dataset.previous='kg';bulletUnit.value='g';
  actions.mechPlusUnitChanged('m1:mass');actions.mechPlusCalculate();
  assert.equal(Number(getElementById('mechplus-m1').value),20);
  assert.equal(getElementById('mechplus-result').innerHTML,ballisticSI);
  getElementById('mechplus-mode').value='power';actions.mechPlusSelect();
  getElementById('mechplus-energy').value='1e308';getElementById('mechplus-time').value='1e-308';
  actions.mechPlusCalculate();assert.match(getElementById('mechplus-result').textContent,/rango numérico/);
  getElementById('mechplus-mode').value='trajectory';actions.mechPlusSelect();
  getElementById('mechplus-expressions').value='sqrt(t)\nt';getElementById('mechplus-time').value='0';
  actions.mechPlusCalculate();assert.match(getElementById('mechplus-result').textContent,/dominio/);
  actions.closeModule('mechplus');
  const mechBasic=(id,panel,inputs,expected)=>{
    const idSets={motion:['x0','x','v0','v','a','t'],projectile:['speed','angle','vx','vy','destination','height','landing','flight-time','g'],dynamics:['mass','accel','force','energy-speed','energy-height','energy-g','kinetic','potential','total']};
    for(const key of idSets[panel]){getElementById(`mech-${key}`).value='';getElementById(`mech-${key}-unit`).value='';}
    for(const [key,value]of Object.entries(inputs))getElementById(`mech-${key}`).value=String(value);
    getElementById(`mech-${panel}-target`).value='all';
    if(panel==='motion')getElementById('mech-mode').value='mrua';
    actions[panel==='motion'?'mechCalculateMotion':panel==='projectile'?'mechCalculateProjectile':'mechCalculateDynamics']();
    assert.equal(getElementById(`mech-${panel}-result`).classList.contains('tool-error'),false,`Mecánica ${id}: ${getElementById(`mech-${panel}-result`).textContent}`);
    const html=getElementById(`mech-${panel}-result`).innerHTML;
    for(const text of expected)assert.ok(html.includes(text),`Mecánica ${id}: falta ${text} en ${html}`);
  };
  actions.launchSubmod('mech-motion');
  mechBasic(6,'motion',{x0:20,v0:15,a:0,t:12},['200 m']);
  mechBasic(7,'motion',{x0:0,v0:5,a:2,t:6},['17 m/s','66 m']);
  mechBasic(8,'motion',{x0:45,x:0,v0:0,a:-mechG},[String(Number(Math.sqrt(90/mechG).toFixed(6))),String(Number((-Math.sqrt(90*mechG)).toFixed(6)))]);
  actions.closeModule('mech');actions.launchSubmod('mech-dynamics');
  mechBasic(11,'dynamics',{mass:8,force:24},['3 m/s²']);
  mechBasic(13,'dynamics',{mass:2,'energy-speed':6},['36 J']);
  actions.closeModule('mech');actions.launchSubmod('mech-projectile');
  mechBasic(9,'projectile',{speed:20,angle:30,height:0,landing:0,g:mechG},[String(Number((400*Math.sin(pi/3)/mechG).toFixed(6))),String(Number((50/mechG).toFixed(6)))]);
  const guide35Time=(25*Math.sin(40*pi/180)+Math.sqrt((25*Math.sin(40*pi/180))**2+40*mechG))/mechG;
  mechBasic(35,'projectile',{speed:25,angle:40,height:20,landing:0,g:mechG},[String(Number(guide35Time.toFixed(6))),String(Number((25*Math.cos(40*pi/180)*guide35Time).toFixed(6))),String(Number(Math.sqrt(625+40*mechG).toFixed(6)))]);
  const impactHTML=getElementById('mech-projectile-state').innerHTML;
  assert.ok(impactHTML.includes(String(Number((25*Math.cos(40*pi/180)).toFixed(6)))));
  assert.ok(impactHTML.includes(String(Number((-Math.sqrt((25*Math.sin(40*pi/180))**2+40*mechG)).toFixed(6)))));
  actions.closeModule('mech');
  actions.launchSubmod('mech-motion');
  assert.equal(getElementById('mech-app').classList.contains('visible'), true);
  assert.equal(getElementById('mech-motion-card').hidden, false);
  assert.equal(getElementById('mech-projectile-card').hidden, true);
  for (const [id, value] of Object.entries({
    'mech-x0':'0', 'mech-v0':'10', 'mech-a':'2', 'mech-t':'5',
    'mech-x':'', 'mech-v':'', 'mech-speed':'10', 'mech-angle':'45', 'mech-vx':'', 'mech-vy':'', 'mech-destination':'', 'mech-height':'0', 'mech-landing':'0', 'mech-flight-time':'', 'mech-g':'10',
    'mech-mass':'2', 'mech-accel':'3', 'mech-energy-speed':'4',
    'mech-force':'', 'mech-energy-height':'5', 'mech-energy-g':'10', 'mech-kinetic':'', 'mech-potential':'', 'mech-total':'',
  })) getElementById(id).value = value;
  actions.mechCalculateMotion();
  assert.match(getElementById('mech-motion-result').innerHTML, /75/);
  getElementById('mech-v0-unit').dataset.previous = 'm/s';
  getElementById('mech-v0-unit').value = 'mph';
  actions.mechUnitChanged('motion:v0');
  assert.ok(Math.abs(Number(getElementById('mech-v0').value) - 22.3693629) < 1e-5);
  actions.mechCalculateMotion();
  assert.match(getElementById('mech-motion-result').innerHTML, /75/);
  getElementById('mech-motion-slider').value = '2';
  actions.mechTimeChanged('motion:slider');
  assert.match(getElementById('mech-motion-state').innerHTML, /24/);
  actions.closeModule('mech');
  assert.match(getElementById('submod-title').innerHTML, /Mecánica/);
  actions.launchSubmod('mech-projectile');
  assert.equal(getElementById('mech-projectile-card').hidden, false);
  assert.equal(getElementById('mech-motion-card').hidden, true);
  actions.mechCalculateProjectile();
  assert.match(getElementById('mech-projectile-result').innerHTML, /Trayectoria y vectores/);
  getElementById('mech-projectile-slider').value = '0.5';
  actions.mechTimeChanged('projectile:slider');
  assert.match(getElementById('mech-projectile-state').innerHTML, /vₓ/);
  actions.closeModule('mech');
  history.forward();
  assert.equal(getElementById('mech-app').classList.contains('visible'), true);
  assert.equal(getElementById('mech-projectile-card').hidden, false);
  history.back();
  actions.launchSubmod('mech-dynamics');
  assert.equal(getElementById('mech-dynamics-card').hidden, false);
  actions.mechCalculateDynamics();
  assert.match(getElementById('mech-dynamics-result').innerHTML, /116/);
  actions.closeModule('mech');
  actions.closeSubmod();
  assert.match(getElementById('submod-title').innerHTML, /Física/);
  actions.closeSubmod();
});
