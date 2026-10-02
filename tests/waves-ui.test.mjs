import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createAppHarness } from './helpers/app-harness.mjs';

test('ondas: auditoría de enunciados, unidades y animación', async () => {
  const harness = await createAppHarness();
  const { getElementById } = harness;
  const actions = harness.actions;
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  actions.openSubmod('waves');
  for (const id of ['waves-oscillations','waves-mechanical','waves-optics'])
    assert.match(getElementById('submod-cards').innerHTML,new RegExp(`data-arg="${id}"`));
  actions.launchSubmod('waves-oscillations');
  getElementById('waves-mode').value='harmonic';
  actions.wavesSelect();
  for (const [id,value] of Object.entries({a:'0.05',w:String(4*Math.PI),phase:String(Math.PI/3),time:'0.5',k:''}))
    getElementById(`waves-${id}`).value=value;
  actions.wavesCalculate();
  assert.match(getElementById('waves-result').innerHTML,/f = ω\/\(2π\) = 2 Hz/);
  getElementById('waves-mode').value='lc';
  actions.wavesSelect();
  for (const [id,value] of Object.entries({l:'0.1',c:'0.0001',q:'0.001',time:'0.005'})) getElementById(`waves-${id}`).value=value;
  actions.wavesCalculate();
  assert.match(getElementById('waves-result').innerHTML,/E total/);
  actions.closeModule('waves');
  actions.launchSubmod('waves-mechanical');
  getElementById('waves-mode').value='traveling';
  actions.wavesSelect();
  for (const [id,value] of Object.entries({a:'0.02',k:'3',w:'12',x:'0',time:'0'}))
    getElementById(`waves-${id}`).value=value;
  actions.wavesCalculate();
  assert.match(getElementById('waves-result').innerHTML,/v = ω\/k = 4 m\/s/);
  getElementById('waves-mode').value='tube';
  actions.wavesSelect();
  for (const [id,value] of Object.entries({length:'1',speed:'340',boundary:'closed-open',count:'3'})) getElementById(`waves-${id}`).value=value;
  actions.wavesCalculate();
  assert.match(getElementById('waves-result').innerHTML,/85 Hz/);
  actions.closeModule('waves');
  actions.launchSubmod('waves-optics');
  getElementById('waves-mode').value='em';
  actions.wavesSelect();
  getElementById('waves-electric').value='300';
  actions.wavesCalculate();
  assert.match(getElementById('waves-result').innerHTML,/Presión absorbente/);
  getElementById('waves-mode').value='grating';
  actions.wavesSelect();
  assert.match(getElementById('waves-fields').innerHTML,/waves-lambda-unit/);
  for (const [id,value] of Object.entries({separation:'0.000002',lambda:'0.00000055',minimum:'0.00000038',maximum:'0.00000075'})) getElementById(`waves-${id}`).value=value;
  actions.wavesCalculate();
  assert.match(getElementById('waves-result').innerHTML,/m=5/);
  // Cada enunciado de Ondas se recorre con sus datos, incluyendo las salidas
  // antes ausentes. Este DOM simulado no acredita revisión visual/offline.
  const waveCase=(id,mode,inputs,expected)=>{
    const group=['harmonic','spring','pendulum','rod','phasors','beats','decay','lc','lissajous'].includes(mode)?'oscillations':
      ['em','emrelation','refraction','polarizers','young','film','rings','multislit','grating'].includes(mode)?'optics':'mechanical';
    actions.wavesOpenPanel(group);
    assert.ok(getElementById('waves-mode').innerHTML.includes(`value="${mode}"`),`Ondas ${id}: operación en menú ${group}`);
    getElementById('waves-mode').value=mode;
    actions.wavesSelect();
    for(const [key,value] of Object.entries(inputs)){
      assert.ok(getElementById('waves-fields').innerHTML.includes(`id="waves-${key}"`),`Ondas ${id}: campo ${key}`);
      getElementById(`waves-${key}`).value=String(value);
      getElementById(`waves-${key}-unit`).value=''; // SI sin selector simulado previo.
    }
    getElementById('waves-result').innerHTML='';
    actions.wavesCalculate();
    assert.equal(getElementById('waves-result').classList.contains('tool-error'),false,`Ondas ${id}: ${getElementById('waves-result').textContent}`);
    const html=getElementById('waves-result').innerHTML;
    for(const value of expected){
      const text=typeof value==='number'?String(Number(value.toPrecision(10))):value;
      assert.ok(html.includes(text),`Ondas ${id}: falta ${text} en ${html}`);
    }
    return html;
  };
  const pi=Math.PI,waveC=299792458,waveG=9.80665;
  const harmonicInputs={a:.05,w:4*pi,phase:pi/3,time:.5,k:''};
  waveCase(1,'harmonic',harmonicInputs,['A = 0.05','ω =',pi/3,'2 Hz','0.5 s','0.025 m']);
  assert.match(getElementById('waves-result').innerHTML,/waves-output-frequency/);getElementById('waves-output-frequency').value='kHz';actions.physicsOutputUnitChanged('waves:frequency');assert.match(getElementById('waves-converted-frequency').innerHTML,/Frecuencia: 0\.002 kHz/);
  waveCase(2,'spring',{m:.5,k:200,b:0,force:'',drive:''},['20 rad/s',10/pi,pi/10,'Q = ∞']);
  waveCase(3,'pendulum',{length:1.5,g:waveG,moment:'',mass:'',distance:''},[2*pi*Math.sqrt(1.5/waveG),'ángulos pequeños']);
  waveCase(4,'lc',{l:.01,c:1e-6,q:0,time:0},[5000/pi,'Hz']);
  waveCase(5,'harmonic',{...harmonicInputs,a:.2,k:100},['E = ½kA² = 2 J']);
  waveCase(6,'harmonic',{...harmonicInputs,a:.1,w:10},['1 m/s','10 m/s²']);
  waveCase(7,'traveling',{a:.02,k:3,w:12,x:0,time:0},['k = 3','ω = 12',2*pi/3,6/pi,'4 m/s']);
  waveCase(8,'relation',{speed:343,frequency:440,lambda:''},[343/440,'m']);
  waveCase(9,'string',{tension:50,density:.01,mass:'',speed:'',length:''},[Math.sqrt(5000),'m/s']);
  waveCase(10,'intensity',{intensity:1e-6,reference:1e-12},['60 dB','10 log₁₀']);
  waveCase(11,'doppler',{frequency:500,speed:343,source:30,observer:0,wall:0},[500*343/313,'Hz']);
  waveCase(12,'beats',{f1:440,f2:446},['6 Hz']);
  waveCase(13,'emrelation',{frequency:100e6,lambda:''},[waveC/1e8,'m']);
  waveCase(13,'emrelation',{frequency:'',lambda:550e-9},[waveC/550e-9,'Hz']);
  waveCase(14,'em',{electric:100},[.5*8.8541878128e-12*waveC*10000,'W/m²']);
  waveCase(15,'string',{speed:240,length:1.2,tension:'',density:'',mass:''},['100, 200, 300 Hz','extremos fijos']);
  const youngInputs={lambda:600e-9,separation:.2e-3,screen:1.5,bright:1,dark:0,index:'',thickness:''};
  waveCase(16,'young',youngInputs,['0.0045 m']);
  const refractionInputs={n:1.5,lambda:600e-9,n1:1,n2:1.5};
  waveCase(17,'refraction',refractionInputs,[waveC/1.5,400e-9]);
  waveCase(18,'rod',{length:1,g:waveG},[2*pi*Math.sqrt(2/(3*waveG)),'I = mL²/3','articulada']);
  const springInputs={m:.5,k:50,b:2,force:'',drive:''};
  waveCase(19,'spring',springInputs,['underdamped','10 rad/s','2 s⁻¹',Math.sqrt(96)]);
  waveCase(20,'spring',{...springInputs,b:15},['overdamped',-15+Math.sqrt(125),-15-Math.sqrt(125),'10 kg/s','C₁e^(r₁t)+C₂e^(r₂t)']);
  waveCase(21,'spring',springInputs,['Q = 2.5',4*pi/Math.sqrt(96)]);
  waveCase(22,'spring',{m:1,k:100,b:2,force:10,drive:8},[10/Math.sqrt(1552),Math.atan2(16,36),'desfase']);
  waveCase(23,'spring',{m:1,k:100,b:2,force:10,drive:8},[6400/1552,10/Math.sqrt(396),'A máxima']);
  waveCase(24,'phasors',{pairs:`3, 0\n4, ${pi/2}`},['Amplitud = √(X²+Y²) = 5',Math.atan2(4,3)]);
  waveCase(25,'beats',{f1:100,f2:104},['4 Hz','102 Hz','2 cos(π(f₁−f₂)t)']);
  waveCase(26,'lissajous',{ax:3,ay:4,wx:1,wy:1,phase:pi/2,time:0},['X=x/3','Y=y/4','Elipse']);
  waveCase(26,'lissajous',{ax:1,ay:1,wx:2,wy:3,phase:pi/2,time:0},[2/3,'trazado paramétrico']);
  waveCase(27,'dispersion',{lambda:10,g:waveG},[Math.sqrt(waveG*10/(2*pi)),Math.sqrt(waveG*10/(2*pi))/2]);
  waveCase(28,'traveling',{a:.1,k:2*pi,w:8*pi,x:.25,time:.1},[.8*pi,-6.4*pi**2*Math.sin(-.3*pi),'velocidad transversal máxima']);
  waveCase(29,'string',{tension:80,density:'',mass:.1,length:5,speed:''},['μ = masa/L = 0.02',Math.sqrt(4000),Math.sqrt(40)]);
  waveCase(30,'stringpower',{density:.02,w:200,a:.01,speed:30},['1.2 W']);
  const materialInputs={modulus:200e9,density:7850,gamma:1.4,temperature:293.15,molar:.029,source:680};
  waveCase(31,'material',materialInputs,[Math.sqrt(1.4*8.314462618*293.15/.029),'Gas ideal']);
  waveCase(31,'material',{...materialInputs,gamma:1.67,molar:.004},[Math.sqrt(1.67*8.314462618*293.15/.004)]);
  const soundInputs={levels:'60,63',power:50,distance:10,target:60};
  waveCase(32,'sound',soundInputs,[60+10*Math.log10(1+10**.3),'nivel total']);
  waveCase(32,'sound',{...soundInputs,levels:Array(10).fill(60).join(',')},['nivel total = 70 dB']);
  waveCase(33,'doppler',{frequency:600,speed:343,source:20,observer:-10,wall:0},[600*333/323,'observador hacia fuente']);
  waveCase(34,'tube',{length:.85,speed:343,boundary:'open-open',count:3},[343/1.7,2*343/1.7,3*343/1.7]);
  waveCase(34,'tube',{length:.85,speed:343,boundary:'closed-open',count:3},[343/3.4,3*343/3.4,5*343/3.4]);
  waveCase(35,'boundary',{tension:100,mu1:.01,mu2:.04},[-1/3,2/3,1/9,8/9,'R+T = 1']);
  waveCase(36,'doppler',{frequency:1000,speed:343,source:0,observer:0,wall:10},[1000*353/333,'Eco de pared móvil']);
  waveCase(37,'mach',{source:680,speed:343},[680/343,Math.asin(343/680)*180/pi,'Semiángulo']);
  waveCase(38,'decay',{initial:.1,final:.02,cycles:5,period:.5},[Math.log(5)/5,Math.log(5)/2.5,Math.sqrt((4*pi)**2+(Math.log(5)/2.5)**2)/(2*Math.log(5)/2.5),'subamortiguado']);
  waveCase(39,'spring',{m:2,k:800,b:8,force:20,drive:''},[Math.sqrt(392),20/Math.sqrt(25344),'Δω = b/m = 4',4*392*400/25344,'P máxima = 25 W']);
  const phasorX=3.5+3*Math.sqrt(3)/4,phasorY=3*Math.sqrt(3)/2-.75;
  waveCase(40,'phasors',{pairs:`2,0\n3,${pi/3}\n1.5,${-pi/6}`},[Math.hypot(phasorX,phasorY),Math.atan2(phasorY,phasorX)]);
  waveCase(41,'lissajous',{ax:2,ay:3,wx:1,wy:1,phase:-pi/3,time:0},['(-1)XY = 0.75','X=x/2','Y=y/3']);
  waveCase(42,'standing',{a:.04,k:5*pi,w:200*pi,length:.5},['40 m/s','0.4 m','0, 0.2, 0.4','0.1, 0.3, 0.5','amplitud 0.02 m','sen(kx−ωt) + (A/2) sen(kx+ωt)']);
  waveCase(43,'material',materialInputs,[Math.sqrt(200e9/7850)]);
  waveCase(43,'material',{...materialInputs,modulus:2.2e9,density:1000},[Math.sqrt(2.2e6)]);
  waveCase(44,'sound',soundInputs,[1/(8*pi),10*Math.log10(1/(8*pi*1e-12)),Math.sqrt(50/(4*pi*1e-6))]);
  waveCase(45,'em',{electric:300},[300/waveC,.5*8.8541878128e-12*waveC*90000,.5*8.8541878128e-12*90000,'Vector medio','k̂']);
  waveCase(46,'refraction',{...refractionInputs,n:1.33,lambda:500e-9},[waveC/1.33,500e-9/1.33,'R = ((n₁−n₂)/(n₁+n₂))² = 0.04; T = 1−R = 0.96']);
  waveCase(47,'polarizers',{intensity:100,angles:'0,45,90'},['50, 25, 12.5','final = 12.5 W/m²']);
  waveCase(48,'young',{...youngInputs,lambda:550e-9,separation:.3e-3,screen:2,bright:3,dark:1,index:1.5,thickness:10e-6},['0.011 m','0.0055 m',1/30,'primera franja oscura: orden 0']);
  waveCase(49,'film',{n:1.33,thickness:300e-9,minimum:'',maximum:''},['λ₀(m) = 4nt/(2m+1)','Sin banda espectral']);
  waveCase(49,'film',{n:1.33,thickness:300e-9,minimum:380e-9,maximum:750e-9},[532e-9,'m=1']);
  waveCase(50,'rings',{radius:1,lambda:589e-9,order:5},[Math.sqrt(2.945e-6),'Radio oscuro m=5']);
  waveCase(50,'rings',{radius:1,lambda:589e-9,order:3},[Math.sqrt(2.0615e-6),'Radio brillante m=3','brillante m=0 es el primero']);
  const waveUnits=(id,mode,inputs,conversions)=>{
    const si=waveCase(id,mode,inputs,[]);
    for(const [key,value,unit] of conversions){
      assert.ok(getElementById('waves-fields').innerHTML.includes(`id="waves-${key}-unit"`));
      getElementById(`waves-${key}`).value=String(value);
      getElementById(`waves-${key}-unit`).value=unit;
    }
    actions.wavesCalculate();
    assert.equal(getElementById('waves-result').innerHTML,si,`Ondas ${id}: conversión de unidades`);
  };
  waveUnits(4,'lc',{l:.01,c:1e-6,q:0,time:0},[['l',10,'mH'],['c',1,'µF'],['time',0,'ms']]);
  waveUnits(1,'harmonic',harmonicInputs,[['a',5,'cm'],['phase',60,'°'],['time',500,'ms']]);
  waveUnits(19,'spring',springInputs,[['m',500,'g'],['k',.05,'kN/m'],['b',2000,'g/s']]);
  waveUnits(31,'material',materialInputs,[['modulus',200,'GPa'],['density',7.85,'g/cm³'],['temperature',20,'°C'],['molar',29,'g/mol']]);
  waveUnits(35,'boundary',{tension:100,mu1:.01,mu2:.04},[['tension',.1,'kN'],['mu1',10,'g/m'],['mu2',40,'g/m']]);
  getElementById('waves-mode').value='decay';actions.wavesSelect();
  for(const [key,value] of Object.entries({initial:.1,final:.2,cycles:5,period:.5}))getElementById(`waves-${key}`).value=String(value);
  actions.wavesCalculate();
  assert.match(getElementById('waves-result').textContent,/superar/);
  getElementById('waves-mode').value='relation';actions.wavesSelect();
  for(const [key,value] of Object.entries({speed:343,frequency:440,lambda:1}))getElementById(`waves-${key}`).value=String(value);
  actions.wavesCalculate();
  assert.match(getElementById('waves-result').textContent,/solo una/);
  getElementById('waves-mode').value='grating';actions.wavesSelect();
  for (const [id,value,unit] of [['separation','2','µm'],['lambda','550','nm'],['minimum','380','nm'],['maximum','750','nm']]) {
    getElementById(`waves-${id}`).value=value;
    getElementById(`waves-${id}-unit`).value=unit;
  }
  actions.wavesCalculate();
  assert.match(getElementById('waves-result').innerHTML,/m=5/);
  actions.closeModule('waves');
  actions.closeSubmod();
});
