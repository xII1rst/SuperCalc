import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createAppHarness } from './helpers/app-harness.mjs';

test('cálculo: estudio multivariable, EDO, bancos diferencial e integral y herramientas', async () => {
  const harness = await createAppHarness();
  const { delegatedEvents, getElementById } = harness;
  const actions = harness.actions;
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const multivariableCovered=new Set();
  function multiCase(id,mode,input,expected=[],patterns=[]){
    actions.studyOpenPanel('multivariable');
    assert.ok(getElementById('study-mode').innerHTML.includes(`value="${mode}"`),`Multivariable ${id}: menú`);
    getElementById('study-mode').value=mode;actions.studySelect();
    const markup=getElementById('study-fields').innerHTML;
    for(const [key,value] of Object.entries(input)){assert.ok(markup.includes(`id="study-${key}"`));getElementById(`study-${key}`).value=String(value);}
    actions.studyCalculate();
    assert.equal(getElementById('study-result').classList.contains('tool-error'),false,`Multivariable ${id}: ${getElementById('study-result').textContent}`);
    const output=getElementById('study-result').innerHTML;
    for(const [label,value,tol=1e-8] of expected){const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=output.match(new RegExp(`<dt>${escaped}</dt><dd>([^<]+)</dd>`));assert.ok(match,`${id}: ${label}`);assert.ok(Math.abs(Number(match[1])-value)<=tol*Math.max(1,Math.abs(value)),`${id}: ${label}: ${match[1]} vs ${value}`);}
    for(const pattern of patterns)assert.match(output,pattern,`Multivariable ${id}`);
    multivariableCovered.add(id);
  }
  const md=(id,expr,variables,point,direction='',expected=[],patterns=[])=>multiCase(id,'mdifferential',{expr,variables,point,direction},expected,patterns);
  const mr=(id,integrand,start,end,lower,upper,value,tol=3e-5)=>multiCase(id,'region',{integrand,start,end,lower,upper,nx:200,ny:200},[['Valor',value,tol]]);
  const mt=(id,mode,integrand3,outerEnd,middleUpper,innerLower,innerUpper,value,tol=1e-6)=>multiCase(id,mode,{integrand3,outerStart:0,outerEnd,middleLower:'0',middleUpper,innerLower,innerUpper,n3:40},[['Valor',value,tol]]);
  const ms=(id,xexpr,yexpr,zexpr,integrand3,uEnd,vEnd,value,tol=4e-6)=>multiCase(id,'paramsurface',{xexpr,yexpr,zexpr,integrand3,uStart:0,uEnd,vStart:0,vEnd,n2:40},[['Valor',value,tol]]);
  for(const id of [1,2])multiCase(id,'mvectors',{u:'1,2,3',v:'4,-1,2'},[['Producto escalar',8],['Norma de u',Math.sqrt(14)]],[/\[7, 10, -9\]/]);
  md(3,'x^2*y-3*y','x,y','2,-1','',[['Valor',-1]]);
  md(4,'x^3*y^2-5*x*y+y^4','x,y','2,-1','',[],[/\[17, -30\]/,/Derivadas parciales/]);
  md(5,'x^2+y^2+z^2','x,y,z','1,2,2','',[],[/\[2, 4, 4\]/]);
  md(6,'x*y','x,y','1,2','3,4',[['Derivada direccional',2]],[/\[0\.6, 0\.8\]/]);
  multiCase(7,'mlimit',{expr:'(x^2+y)/(x+y)',x:1,y:2},[['Valor',1]],[/proved/]);
  multiCase(8,'mimplicit',{expr:'x^2+y^2-z',point:'1,1,2'},[['∂z/∂x',2],['∂z/∂y',2]],[/\[2, 2, -1\]/]);
  mr(9,'x+y',0,1,'0','2',3);mr(10,'y',0,1,'0','x',1/6);
  multiCase(11,'mcurve',{maps:'cos(t)\nsin(t)\nt',time:0,start:0,end:'2*π',n:200},[['Longitud',2*Math.PI*Math.SQRT2]]);
  multiCase(12,'mcurve',{maps:'t^2\nt^3\n2*t',time:1,start:0,end:1,n:200},[],[/\[2, 3, 2\]/,/\[2, 6, 0\]/]);
  md(13,'exp(x*y)','x,y','1,2','',[],[/Hessiano/,/22\.1671683/]);
  multiCase(14,'mcritical',{expr:'x^2+y^2-4*x+6*y'},[],[/\[2, -3\]/,/Valor: -13/,/mínimo/,/único punto crítico/]);
  multiCase(15,'mplane',{point:'1,0,2',normal:'2,-1,3'},[['Constante',8]],[/\(2\)x \+ \(-1\)y \+ \(3\)z = 8/]);
  multiCase(16,'mvectors',{u:'1,2,2',v:'2,-1,2'},[['Ángulo (grados)',Math.acos(4/9)*180/Math.PI]]);
  multiCase(17,'mchain',{expr:'x^2*y',maps:'t\nt^3',variables:'t',point:'1'},[],[/Derivadas por cadena<\/dt><dd>\[5\]/]);
  multiCase(18,'mlimit',{expr:'(x^2-y^2)/(x^2+y^2)',x:0,y:0},[],[/disproved/,/límites distintos/]);
  multiCase(19,'mlimit',{expr:'x^2*y/(x^2+y^2)',x:0,y:0},[['Valor',0]],[/encaje radial/,/δ=/]);
  multiCase(20,'mcritical',{expr:'x^3-3*x*y+y^3'},[],[/\[0, 0\]/,/silla/,/\[1, 1\]/,/Valor: -1/,/únicas soluciones reales/]);
  multiCase(21,'mconstraint',{expr:'x*y',constraint:'x+2*y',constant:8},[],[/\[4, 2\]/,/Valor: 8/,/máximo global/,/Multiplicador λ: 2/]);
  multiCase(22,'mimplicit',{expr:'x^2+y^2+z^2-3*x*y*z',point:'1,1,1'},[['∂z/∂x',-1]]);
  md(23,'x*exp(y*z)','x,y,z','1,0,2','',[['Tasa máxima',Math.sqrt(5)]],[/\[1, 2, 0\]/]);
  mr(24,'x*y',0,1,'x^2','x',1/24);
  multiCase(25,'mpolar',{integrand:'exp(-(x^2+y^2))',lower:'0',upper:'2',start:0,end:'2*π',nx:200,ny:200},[['Valor',Math.PI*(1-Math.exp(-4)),3e-5]],[/jacobiano r/]);
  mt(26,'triplecart','z',1,'1-x','0','1-x-y',1/24);
  multiCase(27,'mline',{field:'x^2+y^2',maps:'2*cos(t)\n2*sin(t)\n0',type:'scalar',start:0,end:'2*π',n:200},[['Valor',16*Math.PI]]);
  multiCase(28,'mline',{field:'y\nx\n0',maps:'t\nt^2\n0',type:'vector',start:0,end:1,n:200},[['Valor',1]]);
  multiCase(29,'mpotential',{fieldX:'2*x*y',fieldY:'x^2',from:'0,0',to:'1,2'},[['Valor',2]],[/Identidad de coeficientes/,/simplemente conexo/,/Potencial/]);
  multiCase(30,'mgreen',{fieldX:'-y',fieldY:'x',coordinates:'polar',lower:'0',upper:'3',start:0,end:'2*π',orientation:'positive',n:200},[['Valor',18*Math.PI]],[/antihoraria/]);
  multiCase(31,'mimplicit',{expr:'x^2+2*y^2+3*z^2-21',point:'4,-1,1'},[],[/\[8, -4, 6\]/,/Plano tangente/]);
  multiCase(32,'mconstraint',{expr:'x^2+2*y^2',constraint:'x^2+y^2',constant:1},[],[/\[1, 0\]/,/\[-1, 0\]/,/\[0, 1\]/,/\[0, -1\]/,/mínimo global/,/máximo global/]);
  multiCase(33,'mjacobian',{maps:'u^2-v^2\n2*u*v',point:'1,2'},[['Determinante',20]],[/Fórmulas/]);
  mr(34,'1',-2,2,'x^2','4',32/3);
  mt(35,'triplecyl','1',2,'2*π','0','r^2',8*Math.PI);
  mt(36,'triplesph','1',3,'π','0','2*π',36*Math.PI);
  mt(37,'triplesph','x^2+y^2+z^2',2,'π','0','2*π',128*Math.PI/5);
  mt(38,'triplecyl','1',3,'2*π','r','3',9*Math.PI);
  multiCase(39,'lamina',{density:'x+y',lower:'0',upper:'1-x',start:0,end:1,nx:200,ny:200},[['Masa',1/3,3e-6],['Centro de masa x̄',3/8,5e-6],['Centro de masa ȳ',3/8,5e-6]]);
  multiCase(40,'laminapolar',{density:'1',lower:'0',upper:'2',start:0,end:'2*π',nx:200,ny:200},[['Momento Iz = ∫(x²+y²) dm',8*Math.PI,2e-5]]);
  multiCase(41,'mgreen',{fieldX:'x*y',fieldY:'x^2',coordinates:'cartesian',lower:'0',upper:'2*x',start:0,end:1,orientation:'positive',n:200},[['Valor',2/3,5e-6]],[/antihoraria/]);
  ms(42,'u*cos(v)','u*sin(v)','u^2','1',2,'2*π',Math.PI*(17*Math.sqrt(17)-1)/6);
  ms(43,'2*sin(u)*cos(v)','2*sin(u)*sin(v)','2*cos(u)','z','π/2','2*π',8*Math.PI);
  ms(44,'sin(u)*cos(v)','sin(u)*sin(v)','cos(u)','x^2+y^2','π','2*π',8*Math.PI/3);
  ms(45,'u*cos(v)','u*sin(v)','v','1',1,'2*π',Math.PI*(Math.SQRT2+Math.asinh(1)));
  multiCase(46,'twoconstraints',{radiusSquared:2,planeA:1,planeB:0,planeC:1,planeD:1,objectiveX:1,objectiveY:1,objectiveZ:1},[],[/1\.414213562/,/stationarityResidual/]);
  multiCase(47,'planenorm',{planeA:1,planeB:1,planeC:1,planeD:3},[],[/Punto: \[1, 1, 1\]/,/Valor: 3/,/no existe/]);
  multiCase(48,'mchain',{expr:'x^2+y*z',maps:'u*v\nu+v\nu-v',variables:'u,v',point:'1,2'},[],[/Derivadas por cadena<\/dt><dd>\[10, 0\]/]);
  multiCase(49,'harmoniclog',{scale:1,x:1,y:2},[['Laplaciano Δu',0]],[/origen/]);
  multiCase(50,'trilinearpath',{coefficient:1,from:'1,1,1',to:'2,3,4'},[['Integral de línea',23]],[/∇\(k xyz\)/]);
  multiCase(9,'region',{order:'dx-dy',integrand:'x+y',start:0,end:1,lower:'0',upper:'1-y',nx:200,ny:200},[['Valor',1/3,3e-5]],[/jacobiano 1/,/role="img"/,/dA=dx dy/]);
  getElementById('study-order').value='dy-dx';
  assert.deepEqual([...multivariableCovered].sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i+1));
  for(const [key,value] of Object.entries({'cons-fx':'0','cons-fy':'x^2','cons-x0':0,'cons-y0':0}))getElementById(key).value=String(value);
  actions.calcConservative();assert.match(getElementById('res-cons').innerHTML,/No/);assert.match(getElementById('res-cons').innerHTML,/polinomio cero/);
  for(const [key,value] of Object.entries({'th-p':'-y','th-q':'x','th-x1':0,'th-x2':1,'th-y1':0,'th-y2':1,'th-fx':'-y','th-fy':'x','th-fz':'0','th-r':1}))getElementById(key).value=String(value);
  actions.calcTheorems();
  const theoremResult=getElementById('res-theorems').innerHTML;
  assert.match(theoremResult,/Green/);assert.match(theoremResult,/antihorario/);assert.match(theoremResult,/Gauss 2D/);
  assert.match(theoremResult,/Stokes/);assert.match(theoremResult,/6\.2831853/);assert.match(theoremResult,/Integral de borde/);
  getElementById('th-fz').value='sqrt(z)';actions.calcTheorems();assert.match(getElementById('res-theorems').innerHTML,/Stokes:.*polin/i);
  actions.openSubmod('ca');
  const calcCards=getElementById('submod-cards').innerHTML;
  for(const id of ['calc-dif','calc-int','calc-cur','calc-mul','calc-edo','calc-graf'])
    assert.match(calcCards,new RegExp(`data-arg="${id}"`));
  for(const [card,mode,input,expected] of [
    ['study-differential','continuity',{segments:'x^2+k\n3*x-1',cuts:'2'},/k: 1/],
    ['study-integral','series',{center:'2',radius:'2',power:'2'},/Extremo derecho/],
    ['study-multivariable','plane',{expr:'x^2+y^2',x:'1',y:'1',step:'0.00001'},/Gradiente/],
    ['study-ode','forced',{damping:'0',stiffness:'1',force:'2',omega:'1',y0:'0',v0:'0',time:'1'},/Resonancia/],
    ['study-ode','linearvariable',{a:'2',b:'1',m:'3',x0:'1',y0:'0',x:'2'},/Factor integrante/],
    ['study-ode','bernoullilinear',{p:'1',q:'1',constant:'0',x:'1'},/Solución y\(x\)/],
    ['study-ode','cooling',{ambient:'20',initialTemperature:'90',observedTemperature:'60',observationTime:'10',time:'20'},/42\.85714286/],
    ['study-ode','logistic',{rate:'0.1',capacity:'500',x0:'0',y0:'50',x:'10'},/Equilibrio/],
    ['study-ode','rlcircuit',{inductance:'2',resistance:'10',voltage:'12',initialCurrent:'0',time:'1'},/Constante de tiempo/],
    ['study-ode','orthogonal',{power:'2',x:'1',y:'1'},/x²\+\(2\)y²=C/],
    ['study-ode','thirdrepeated',{root:'1',amplitude:'1',c0:'0',c1:'0',c2:'0',x:'1'},/Tercera derivada/],
    ['study-ode','laplacesystem',{matrix:'2, -1, 1, 0',initial:'1, 0',time:'1'},/Transformada X\(s\)/],
    ['study-ode','eigenmodes',{diagonal:'1',coupling:'2',initial:'1, 0',time:'1'},/Autovectores/],
    ['study-ode','separable',{a:'3',xp:'2',yp:'0',x0:'0',y0:'2',x:'2'},/10/],
    ['study-ode','separable',{a:'1',xp:'-1',yp:'1',x0:'1',y0:'2',x:'3'},/6/],
    ['study-ode','separable',{a:'1',xp:'1',yp:'-1',x0:'0',y0:'2',x:'2'},/2\.828427125/],
    ['study-ode','exactode',{mterms:'3, 1, 1\n1, 0, 2',nterms:'1, 2, 0\n1, 1, 1',factorX:'1',factorY:'0'},/x\^3·y \+ 0\.5·x\^2·y\^2 = C/],
    ['study-ode','laplace',{kind:'timeSine',parameter:'2'},/4s\/\(s²\+4\)²/],
    ['study-ode','laplace',{kind:'timeSquared',parameter:'2'},/2\/s³/],
    ['study-ode','laplace',{kind:'sine',parameter:'3'},/3\/\(s²\+9\)/],
    ['study-ode','laplacesum',{rate:'2',timeCoefficient:'3'},/1\/\(s−\(2\)\) \+ \(3\)\/s²/],
    ['study-ode','laplaceinversepower',{coefficient:'6',shift:'0',order:'4',time:'2'},/Solución en tiempo/],
    ['study-ode','laplaceinversepower',{coefficient:'1',shift:'4',order:'1',time:'0.5'},/Solución en tiempo/],
    ['study-ode','laplaceinversequadratic',{numeratorSlope:'1',numeratorConstant:'3',linearCoefficient:'4',constantCoefficient:'13',time:'0.5'},/par conjugado/],
    ['study-ode','laplacefirstorder',{p:'-3',amplitude:'1',rate:'2',initialValue:'1',time:'1'},/Solución en tiempo/],
    ['study-ode','laplacefirstorder',{p:'2',amplitude:'1',rate:'-1',initialValue:'0',time:'1'},/Familia general/],
    ['study-ode','forced',{damping:'0',stiffness:'4',force:'1',omega:'2',y0:'0',v0:'0',time:'1'},/Resonancia/],
    ['study-ode','laplacerepeated',{root:'1',amplitude:'1',power:'0',y0:'0',v0:'0',time:'1'},/Solución en tiempo/],
    ['study-ode','laplaceharmonic',{damping:'0',stiffness:'4',cosineForce:'0',sineForce:'1',omega:'1',y0:'0',v0:'0',time:'1'},/Transformada/],
    ['study-ode','laplaceharmonic',{damping:'2',stiffness:'2',cosineForce:'0',sineForce:'0',omega:'1',y0:'1',v0:'0',time:'1'},/Solución en tiempo/],
    ['study-ode','laplaceharmonic',{damping:'2',stiffness:'5',cosineForce:'10',sineForce:'0',omega:'1',y0:'0',v0:'0',time:'1'},/Solución en tiempo/],
    ['study-ode','laplacerepeated',{root:'1',amplitude:'1',power:'1',y0:'0',v0:'0',time:'1'},/Solución en tiempo/],
  ]) {
    assert.match(calcCards,new RegExp(`data-arg="${card}"`));
    actions.launchSubmod(card);
    getElementById('study-mode').value=mode;
    actions.studySelect();
    for(const [key,value] of Object.entries(input)) getElementById(`study-${key}`).value=value;
    actions.studyCalculate();
    assert.match(getElementById('study-result').innerHTML,expected);
    actions.closeModule('study');
  }
  const odeCovered=new Set();
  function odeCase(id,mode,input,expected=[],patterns=[]){
    actions.studyOpenPanel('ode');
    assert.ok(getElementById('study-mode').innerHTML.includes(`value="${mode}"`),`EDO ${id}: menú`);
    getElementById('study-mode').value=mode;actions.studySelect();
    const markup=getElementById('study-fields').innerHTML;
    for(const[key,value]of Object.entries(input)){assert.ok(markup.includes(`id="study-${key}"`),`EDO ${id}: ${key}`);getElementById(`study-${key}`).value=String(value);}
    getElementById('study-result').innerHTML='';actions.studyCalculate();
    const result=getElementById('study-result');assert.equal(result.classList.contains('tool-error'),false,`EDO ${id}: ${result.textContent}`);
    for(const[label,value]of expected){const escaped=label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const match=result.innerHTML.match(new RegExp(`<dt>${escaped}</dt><dd>([^<]+)</dd>`));assert.ok(match,`EDO ${id}: ${label}`);assert.ok(Math.abs(Number(match[1])-value)<1e-8*Math.max(1,Math.abs(value)),`EDO ${id}: ${match[1]} vs ${value}`);}
    for(const pattern of patterns)assert.match(result.innerHTML,pattern,`EDO ${id}`);odeCovered.add(id);
  }
  const os=(id,a,xp,yp,x0,y0,x,value)=>odeCase(id,'separable',{a,xp,yp,x0,y0,x},[['Valor',value]],[/Familia general/]);
  const oh=(id,damping,stiffness,y0,v0,x,value)=>odeCase(id,'ohomogeneous',{damping,stiffness,y0,v0,x},[['Valor',value]],[/Familia general/,/Comprobación de condiciones iniciales/]);
  const ox=(id,mterms,nterms,factorX=0)=>odeCase(id,'exactode',{mterms,nterms,factorX,factorY:0},[],[/Solución implícita/,/ = C/]);
  const ol=(id,p,amplitude,rate,initialValue,time,value)=>odeCase(id,'laplacefirstorder',{p,amplitude,rate,initialValue,time},[['Valor',value]],[/Familia general/]);
  const op=(id,damping,stiffness,rate,coefficients,value)=>odeCase(id,'opolyexp',{damping,stiffness,rate,coefficients,y0:0,v0:0,x:1},[['Valor',value],['F(x,y)',0]],[/Coeficientes de la particular/,/Pasos/]);
  const oa=(id,damping,stiffness,cosineForce,sineForce,y0,v0,value)=>odeCase(id,'laplaceharmonic',{damping,stiffness,cosineForce,sineForce,omega:1,y0,v0,time:1},[['Valor',value]],[/Transformada/]);
  odeCase(1,'oclassify',{equation:"(y'')^3+2*y'=x"},[['Orden',2],['Grado',3]]);
  odeCase(2,'oclassify',{equation:"(y''')^2+(y')^4=exp(x)"},[['Orden',3],['Grado',2]]);
  os(3,3,2,0,0,2,2,10);os(4,2,1,1,0,1,1,Math.E);os(5,1,-1,1,1,2,3,6);
  ol(6,2,1,-1,0,1,Math.exp(-1)-Math.exp(-2));
  oh(7,-5,6,1,0,1,-2*Math.exp(3)+3*Math.exp(2));oh(8,0,4,1,0,1,Math.cos(2));oh(9,0,-9,1,0,1,Math.cosh(3));
  odeCase(10,'ofamily',{kind:'exponential',rate:3,point:'1,1'},[],[/y′−\(3\)y=0/]);
  os(11,1,1,-1,0,2,2,Math.sqrt(8));
  ox(12,'2,1,0\n1,0,1','1,1,0\n2,0,1');
  for(const[kind,parameter,expected]of [['timeSquared',1,/2\/s³/],['sine',3,/3\/\(s²\+9\)/]])odeCase(13,'laplace',{kind,parameter},[],[expected]);
  odeCase(14,'laplacesum',{rate:2,timeCoefficient:3},[],[/1\/\(s−\(2\)\) \+ \(3\)\/s²/]);
  for(const[coefficient,shift,order,time,value]of [[1,4,1,1,Math.exp(-4)],[6,0,4,2,8]])odeCase(15,'laplaceinversepower',{coefficient,shift,order,time},[['Valor',value]]);
  os(16,1,0,1,0,5,1,5*Math.E);oh(17,2,1,1,0,1,2/Math.E);
  odeCase(18,'linearvariable',{a:-1,b:1,m:0,x0:1,y0:0,x:2},[['Valor',2*Math.log(2)]],[/ln\|x\|/]);
  ox(19,'2,1,1\n3,0,0','1,2,0\n-1,0,0');ox(20,'3,1,1\n1,0,2','1,2,0\n1,1,1',1);
  odeCase(20,'exactode',{factorMode:'search',mterms:'3,1,1\n1,0,2',nterms:'1,2,0\n1,1,1',factorX:0,factorY:0},[],[/x\^1 y\^0/,/μ≠0/]);
  getElementById('study-factorMode').value='given';
  odeCase(21,'linearvariable',{a:2,b:1,m:3,x0:1,y0:0,x:2},[['Valor',2.625]],[/Familia general/]);
  odeCase(22,'bernoullilinear',{p:1,q:1,constant:2,x:1},[['Valor',1/(2+2*Math.E)]],[/y≡0/]);
  oh(23,-4,4,1,0,1,-Math.exp(2));oh(24,2,5,1,0,1,Math.exp(-1)*(Math.cos(2)+.5*Math.sin(2)));
  op(25,-3,2,0,'0,4',5+Math.exp(2)-4*Math.E);op(26,0,-1,2,'1',Math.exp(2)/3-Math.E/2+Math.exp(-1)/6);
  odeCase(27,'laplaceinversequadratic',{numeratorSlope:1,numeratorConstant:3,linearCoefficient:4,constantCoefficient:13,time:.5},[['Valor',Math.exp(-1)*(Math.cos(1.5)+Math.sin(1.5)/3)]]);
  oh(28,1,-6,1,-2,1,.2*Math.exp(2)+.8*Math.exp(-3));
  odeCase(29,'laplace',{kind:'timeSine',parameter:2},[],[/4s\/\(s²\+4\)²/]);ol(30,-3,1,2,1,1,2*Math.exp(3)-Math.exp(2));
  odeCase(31,'ofamily',{kind:'circles',rate:0,point:'2,1'},[['dy/dx',-.75]],[/2xy y′=y²−x²/]);
  odeCase(32,'systemode',{matrix:'1,2,3,2',initial:'1,0',time:1},[],[/y″−\(3\)y′\+\(-4\)y=0/,/Familia general/]);
  odeCase(33,'osubstitution',{a:1,b:1,c:2,d:-1,x:1,y:2},[['dy/dx',-.8]],[/u=2/,/ln\|/]);
  odeCase(34,'ofamily',{kind:'repeated',rate:2,point:'1,1'},[],[/y″−\(4\)y′\+\(4\)y=0/]);
  odeCase(35,'ovarreciprocal',{root:1,amplitude:1,c0:0,c1:0,x:2},[['Valor',2*Math.exp(2)*Math.log(2)],['F(x,y)',0]],[/W=e/,/x&gt;0 o x&lt;0/]);
  odeCase(36,'ovartan',{amplitude:1,omega:1,c0:0,c1:0,x:.5},[['Valor',-Math.cos(.5)*Math.log(1/Math.cos(.5)+Math.tan(.5))],['F(x,y)',0]],[/W=ω/,/polos/]);
  odeCase(37,'forced',{damping:0,stiffness:4,force:1,omega:2,y0:0,v0:0,time:1},[['Valor',Math.sin(2)/4]],[/Familia general/,/t·sen\(2t\)/]);
  op(38,-2,1,1,'1',Math.E/2);
  oa(39,0,4,0,1,0,0,Math.sin(1)/3-Math.sin(2)/6);oa(40,2,2,0,0,1,0,Math.exp(-1)*(Math.cos(1)+Math.sin(1)));
  odeCase(41,'laplacerepeated',{root:1,amplitude:1,power:1,y0:0,v0:0,time:1},[['Valor',Math.E/6]],[/Familia general/]);
  odeCase(42,'laplacesystem',{matrix:'2,-1,1,0',initial:'1,0',time:1},[],[/\[5\.436563657, 2\.718281828\]/,/Transformada X\(s\)/]);
  odeCase(43,'eigenmodes',{diagonal:1,coupling:2,initial:'1,0',time:1},[],[/Autovalores<\/dt><dd>\[3, -1\]/,/Autovectores/]);
  odeCase(44,'oforcedsystem',{matrix:'3,-1,1,1',forcingSlope:'1,0',forcingConstant:'0,0',initial:'0,0',time:1},[],[/Pendiente de la particular<\/dt><dd>\[-0\.25, 0\.25\]/,/y″−\(4\)y′\+\(4\)y=\(1\)t/]);
  odeCase(45,'cooling',{ambient:20,initialTemperature:90,observedTemperature:60,observationTime:10,time:20},[['Valor',300/7]]);
  odeCase(46,'logistic',{rate:.1,capacity:500,x0:0,y0:50,x:10},[['Valor',500/(1+9*Math.exp(-1))]]);
  odeCase(47,'rlcircuit',{inductance:2,resistance:10,voltage:12,initialCurrent:0,time:1},[['Valor',1.2*(1-Math.exp(-5))],['Equilibrio',1.2]]);
  oa(48,2,5,10,0,0,0,2*Math.cos(1)+Math.sin(1)+Math.exp(-1)*(-2*Math.cos(2)-1.5*Math.sin(2)));
  odeCase(49,'orthogonal',{power:2,x:1,y:1},[],[/x²\+\(2\)y²=C/]);
  odeCase(50,'thirdrepeated',{root:1,amplitude:1,c0:0,c1:0,c2:0,x:1},[['Valor',Math.E/6],['F(x,y)',0]],[/C₀\+C₁x\+C₂x²/]);
  assert.deepEqual([...odeCovered].sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i+1));
  actions.launchSubmod('study-multivariable');
  for(const [mode,inputs,expected] of [
    ['lamina',{density:'x+y',lower:'0',upper:'1-x',start:'0',end:'1',nx:'120',ny:'120'},/Centro de masa x̄<\/dt><dd>0\.375/],
    ['laminapolar',{density:'1',lower:'0',upper:'2',start:'0',end:'2*π',nx:'120',ny:'120'},/Momento Iz = ∫\(x²\+y²\) dm/],
    ['twoconstraints',{radiusSquared:'2',planeA:'1',planeB:'0',planeC:'1',planeD:'1',objectiveX:'1',objectiveY:'1',objectiveZ:'1'},/Máximo global/],
    ['planenorm',{planeA:'1',planeB:'1',planeC:'1',planeD:'3'},/Mínimo global/],
    ['harmoniclog',{scale:'1',x:'1',y:'2'},/Laplaciano Δu/],
    ['trilinearpath',{coefficient:'1',from:'1, 1, 1',to:'2, 3, 4'},/Integral de línea<\/dt><dd>23/],
    ['paramflux',{xexpr:'u',yexpr:'v',zexpr:'0',fieldX:'0',fieldY:'0',fieldZ:'1',uStart:'0',uEnd:'1',vStart:'0',vEnd:'1',orientation:'uv',n2:'20'},/Flujo orientado<\/dt><dd>1/],
  ]) {
    getElementById('study-mode').value=mode;
    actions.studySelect();
    for(const [key,value] of Object.entries(inputs)) getElementById(`study-${key}`).value=value;
    actions.studyCalculate();
    assert.equal(getElementById('study-result').classList.contains('tool-error'),false,getElementById('study-result').textContent);
    assert.match(getElementById('study-result').innerHTML,expected);
  }
  for(const [mode,inputs,expected] of [
    ['triplecart',{integrand3:'z',outerStart:'0',outerEnd:'1',middleLower:'0',middleUpper:'1-x',innerLower:'0',innerUpper:'1-x-y',n3:'20'},/0\.04166666667/],
    ['triplecyl',{integrand3:'1',outerStart:'0',outerEnd:'2',middleLower:'0',middleUpper:'2*π',innerLower:'0',innerUpper:'r^2',n3:'20'},/25\.13274/],
    ['triplesph',{integrand3:'1',outerStart:'0',outerEnd:'3',middleLower:'0',middleUpper:'π',innerLower:'0',innerUpper:'2*π',n3:'20'},/113\.09/],
  ]) {
    getElementById('study-mode').value=mode;
    actions.studySelect();
    for(const [key,value] of Object.entries(inputs)) getElementById(`study-${key}`).value=value;
    actions.studyCalculate();
    assert.match(getElementById('study-result').innerHTML,expected);
  }
  getElementById('study-mode').value='paramsurface';
  actions.studySelect();
  for(const [key,value] of Object.entries({xexpr:'u*cos(v)',yexpr:'u*sin(v)',zexpr:'u^2',integrand3:'1',uStart:'0',uEnd:'2',vStart:'0',vEnd:'2*π',n2:'40'}))
    getElementById(`study-${key}`).value=value;
  actions.studyCalculate();
  assert.equal(getElementById('study-result').classList.contains('tool-error'),false,getElementById('study-result').textContent);
  assert.match(getElementById('study-result').innerHTML,/36\.1769/);
  for(const [key,value] of Object.entries({xexpr:'2*sin(u)*cos(v)',yexpr:'2*sin(u)*sin(v)',zexpr:'2*cos(u)',integrand3:'z',uEnd:'1.5707963267948966'}))
    getElementById(`study-${key}`).value=value;
  actions.studyCalculate();
  assert.match(getElementById('study-result').innerHTML,/25\.13274/);
  actions.closeModule('study');
  for(const [id,panel] of [
    ['calc-dif','Dif'],['calc-int','Int'],['calc-cur','Cur'],
    ['calc-mul','Mul'],['calc-edo','Edo'],['calc-graf','Graf'],
  ]){
    const card={dataset:{action:'launchSubmod',arg:id},closest(){return this;}};
    delegatedEvents.get('click')({type:'click',target:card});
    assert.equal(getElementById('calc-p'+panel).classList.contains('on'),true,id);
    actions.closeModule('calc');
    assert.equal(getElementById('submod-title').innerHTML.includes('Cálculo'), true);
  }

  actions.closeSubmod();
  // Auditoría del banco Integral: rutas reales de cálculo, CAS y Aplicaciones.
  actions.openSubmod('ca');actions.launchSubmod('calc-int');
  assert.equal(getElementById('calc-pInt').classList.contains('on'),true);
  // Los 50 enunciados diferenciales deben tener un recorrido verificable.
  const difCovered=new Set();
  const difNumber=value=>String(Number(value.toPrecision(10)));
  function difAction(id,action,inputs,target,texts) {
    for(const[key,value]of Object.entries(inputs)) {
      assert.ok(html.includes(`id="${key}"`),`Diferencial ${id}: campo ${key}`);
      getElementById(key).value=String(value);
    }
    getElementById(target).innerHTML='';actions[action]();
    const output=getElementById(target).innerHTML;
    for(const text of texts)assert.ok(output.includes(text),`Diferencial ${id}: ${text}\n${output}`);
    difCovered.add(id);return output;
  }
  function difStudy(id,mode,input,expected=[],extra=[]) {
    actions.studyOpenPanel('differential');
    assert.ok(getElementById('study-mode').innerHTML.includes(`value="${mode}"`),`Diferencial ${id}: menú ${mode}`);
    getElementById('study-mode').value=mode;actions.studySelect();
    for(const[key,value]of Object.entries(input)) {
      assert.ok(getElementById('study-fields').innerHTML.includes(`id="study-${key}"`),`Diferencial ${id}: ${key}`);
      getElementById(`study-${key}`).value=String(value);
    }
    getElementById('study-result').innerHTML='';actions.studyCalculate();
    const result=getElementById('study-result');
    assert.equal(result.classList.contains('tool-error'),false,`Diferencial ${id}: ${result.textContent}`);
    for(const[label,value]of expected)assert.ok(result.innerHTML.includes(`<dt>${label}</dt><dd>${difNumber(value)}</dd>`),`Diferencial ${id}: ${label}\n${result.innerHTML}`);
    for(const text of extra)assert.ok(result.innerHTML.includes(text),`Diferencial ${id}: ${text}\n${result.innerHTML}`);
    difCovered.add(id);return result.innerHTML;
  }
  for(const[id,expression,text]of [
    [1,'(3n+1)/(n+5)','3/1 = 3'],[2,'(2n^2-n)/(n^2+4)','2/1 = 2'],[3,'(1+2/n)^n','e^(2)'],
    [45,'(1+1/(2n))^(3n)','e^(1.5)'],[46,'(2n+cos(n))/(n+1)','teorema del encaje'],
  ])difAction(id,'seqAnalyzeTerminos',{'seq-expr':expression,'seq-n':5},'seq-result',['Límite demostrado',text]);
  difAction(44,'seqAnalyzeRadical',{'seq-rec-c':2,'seq-rec-a1':1,'seq-rec-n':6},'seq-result',['Límite demostrado','convergencia monótona','≈ 2']);
  for(const[id,expression,to,text]of [
    [4,'(x^2-9)/(x-3)',3,'6'],[5,'(5*x^2+3*x)/(2*x^2-1)','Infinity','5/2'],[10,'sin(4*x)/(2*x)',0,'2'],
    [18,'(1-cos(x))/x^2',0,'1/2'],[19,'sqrt(x^2+3*x)-x','Infinity','3/2'],[20,'(e^x-1-x)/x^2',0,'1/2'],
    [39,'1/sin(x)-1/x',0,'0'],[40,'cos(x)^(1/x^2)',0,'e^(-1/2)'],
  ])difAction(id,'calcLimit',{'dif-lim-fx':expression,'dif-lim-a':to,'dif-lim-side':'both','dif-lim-var':'x'},'res-lim',[text]);
  for(const[id,expression,order,point,value]of [
    [6,'4*x^3-5*x^2+7*x-2',1,0,7],[7,'x^2*sin(x)',1,0,0],[8,'ln(3*x^2+1)',1,1,1.5],[9,'(x+1)/(x-1)',1,2,-2],
    [13,'x^4-3*x^2+2',2,0,-6],[17,'e^(5*x)*cos(x)',1,0,5],[21,'x^x',1,1,1],[22,'atan(x^2)',1,1,1],
    [23,'x^sin(x)',1,1,Math.sin(1)],[41,'x*e^(2*x)',4,0,32],
  ]) {
    const result=difAction(id,'calcDerivative',{'dif-der-fx':expression,'dif-der-ord':order,'dif-der-pt':point,'dif-der-var':'x'},'res-der',['Reglas utilizadas','Condiciones de la fórmula']);
    const rendered=[...result.matchAll(/class="calc-res-val">([^<]+)/g)].at(-1)?.[1];
    assert.ok(Math.abs(parseFloat(rendered)-value)<1e-7,`Diferencial ${id}: valor ${rendered}`);
  }
  for(const[id,expr,x,y,rate,text]of [
    [14,'x^2+y^2-25',3,4,'','>-0.75 → -3/4<'],[25,'x^3+y^3-6*x*y',3,3,'','>-1<'],
    [34,'x^2+y^2-25',3,4,2,'>-1.5 → -3/2<'],[48,'x^2+x*y+y^2-7',2,1,'','y = (-1.25)x + 3.5'],
  ])difAction(id,'calcImplicit',{'dif-imp-fxy':expr,'dif-imp-x0':x,'dif-imp-y0':y,'dif-imp-dxdt':rate},'res-imp',[text,'Verificación del punto','Hipótesis']);
  difStudy(11,'linearization',{expr:'x^2+3*x',x0:2,increment:0},[['dy/dx',7],['Intersección con eje y',-4]],['Recta tangente','[2, 10]']);
  difStudy(12,'continuity',{segments:'x^2+k\n3*x-1',cuts:'2'},[],['k: 1','Comprobación izquierda/derecha']);
  difStudy(15,'functionanalysis',{expr:'x^3-12*x',scope:'locales',start:-4,end:4,minimumY:-20,maximumY:20},[],['x: -2','Valor: 16','máximo local','x: 2','Valor: -16','mínimo local','Signos de f′']);
  difStudy(16,'linearization',{expr:'sqrt(x^2+1)',x0:1,increment:.1},[['Diferencial dy',.1/Math.SQRT2]],['Error absoluto en el punto','Aproximación local']);
  difStudy(24,'parametric',{xexpr:'t^2-1',yexpr:'t^3+t',time:1},[['dy/dx',2],['d²y/dx²',.5]],['Derivadas x′, y′','2t','3t^2 + 1']);
  difStudy(26,'functionanalysis',{expr:'x^3-3*x^2+1',scope:'intervalo',start:-1,end:3,minimumY:-4,maximumY:2},[],['Mínimo global: [x: -1; Valor: -3, x: 2; Valor: -3]','Máximo global: [x: 0; Valor: 1, x: 3; Valor: 1]','Todos los candidatos']);
  difStudy(27,'theorem',{expr:'x^2-4*x+3',start:1,end:3,kind:'rolle'},[['f(a)',0],['f(b)',0]],['hipótesis verificadas','[2]','continuo en [a,b]','diferenciable en (a,b)']);
  difStudy(28,'theorem',{expr:'sqrt(x)',start:1,end:9,kind:'mvt'},[['Pendiente de la secante',.25]],['[4]','continua para x≥0']);
  difStudy(29,'functionanalysis',{expr:'x^4-4*x^3',scope:'locales',start:-2,end:5,minimumY:-30,maximumY:20},[],['estacionario sin extremo','x: 3','Valor: -27','cóncava hacia arriba','cóncava hacia abajo','x: 2; Valor: -16']);
  difStudy(30,'linearization',{expr:'x^(1/3)',x0:8,increment:.06},[['Diferencial dy',.005],['Aproximación lineal',2.005]],['Valor evaluado','Error absoluto en el punto']);
  difStudy(31,'exponentialanalysis',{expr:'x',rate:-1},[],['x: 1','máximo local',`Segunda derivada: ${difNumber(-1/Math.E)}`]);
  difStudy(32,'functionanalysis',{expr:'(2*x^2+1)/(x-1)',scope:'locales',start:-3,end:4,minimumY:-15,maximumY:15},[],['oblicua','[2, 2]','asíntota vertical','−∞','+∞']);
  difStudy(33,'continuity',{segments:'x+2*a\n3*a*x+b\n6*x-2*b',cuts:'-2,1'},[],['a: 0.4444444444','b: 1.555555556','Comprobación izquierda/derecha']);
  difStudy(35,'reciprocalminimum',{a:1,b:128,p:2,q:1},[['x',4],['Mínimo global',48],['Segunda derivada',6]],['mínimo global único','x&gt;0']);
  difStudy(36,'ellipserectangle',{a:4,b:3},[['Ancho',4*Math.SQRT2],['Altura',3*Math.SQRT2],['Área máxima',24]],['paralelos a los ejes','Máximo en θ=π/4']);
  const cylinderRadius=Math.cbrt(250/Math.PI);
  difStudy(37,'cylinderminimum',{volume:500,lids:2},[['Radio',cylinderRadius],['Altura',2*cylinderRadius],['Área mínima',6*Math.PI*cylinderRadius**2]],['2 tapas','cm³','cm²','mínimo global']);
  difStudy(38,'nearestparabola',{a:1,u:0,v:3},[['Distancia mínima',Math.sqrt(11)/2]],['x: -1.58113883','x: 1.58113883','y: 2.5','Distancia²: 2.75','Todos los candidatos','mínimos empatados']);
  const graph42=difStudy(42,'functionanalysis',{expr:'x/(x^2+1)',scope:'locales',start:-6,end:6,minimumY:-1,maximumY:1},[],['impar','x: -1','Valor: -0.5','x: 1','Valor: 0.5','Inflexiones','1.732050808','horizontal','[0]','role="img"']);
  assert.doesNotMatch(graph42,/indefinido|NaN/);
  const graph43=difStudy(43,'functionanalysis',{expr:'(x^2-4)/(x^2-1)',scope:'locales',start:-6,end:6,minimumY:-10,maximumY:10},[],['ℝ excepto -1, 1','Valor: 4','horizontal','[1]','cóncava hacia abajo','cóncava hacia arriba','−∞','+∞','data-asymptote="vertical"']);
  assert.equal((graph43.match(/data-asymptote="vertical"/g)||[]).length,2);
  difStudy(47,'parametric',{xexpr:'e^t*cos(t)',yexpr:'e^t*sin(t)',time:'π/6'},[['dy/dx',2+Math.sqrt(3)]],['Derivadas x′, y′']);
  difStudy(49,'sineparameter',{b:1/3,frequency:3,point:'π/3'},[['Coeficiente a',2],['Segunda derivada',-Math.sqrt(3)]],['máximo local','f′(x₀)=0']);
  difStudy(50,'exponentialparameter',{target:8},[],['[-4, 4]','L’Hôpital dos veces','k²/2']);
  assert.deepEqual([...difCovered].sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i+1));
  // También actualizar las rutas previas de análisis y aplicaciones.
  getElementById('dif-ana-fx').value='(x^2-4)/(x^2-1)';actions.calcAnalysis();
  assert.match(getElementById('res-ana').innerHTML,/Signos de f″ y concavidad/);
  assert.match(getElementById('res-ana').innerHTML,/role="img"/);
  assert.doesNotMatch(getElementById('res-ana').innerHTML,/Ninguno en|NaN/);
  getElementById('app-form-container').querySelectorAll=()=>[...getElementById('app-form-container').innerHTML.matchAll(/<input[^>]*id="([^"]+)"/g)].map(m=>getElementById(m[1]));
  for(const [mode,action,input,text]of [
    ['tan','appTangent',{'app-tan-fx':'x^2+3*x','app-tan-x0':2},'y = 7x - 4'],
    ['opt','appOptimize',{'app-opt-fx':'x^3-3*x^2+1','app-opt-a':-1,'app-opt-b':3},'x≈-1, f(x)≈-3'],
    ['mvt','appMVT',{'app-mvt-fx':'sqrt(x)','app-mvt-a':1,'app-mvt-b':9},'c ≈ 4'],
  ]) {
    actions.setApp(mode);
    for(const [key,value]of Object.entries(input)){
      assert.ok(getElementById('app-form-container').innerHTML.includes(`id="${key}"`));getElementById(key).value=String(value);
    }
    actions[action]();assert.ok(getElementById('app-res').innerHTML.includes(text));
  }

  const intFmt=value=>String(Number(value.toPrecision(10)));
  function intAction(id,action,inputs,target,texts) {
    for(const[key,value]of Object.entries(inputs)) {
      assert.ok(html.includes(`id="${key}"`),`Integral ${id}: campo ${key}`);
      getElementById(key).value=String(value);
    }
    getElementById(target).innerHTML='';actions[action]();
    const output=getElementById(target).innerHTML;
    for(const text of texts)assert.ok(output.includes(text),`Integral ${id}: ${text}\n${output}`);
    return output;
  }
  function intStudy(id,mode,input,expected,extra=[]) {
    actions.studyOpenPanel('integral');
    assert.ok(getElementById('study-mode').innerHTML.includes(`value="${mode}"`),`Integral ${id}: menú ${mode}`);
    getElementById('study-mode').value=mode;actions.studySelect();
    for(const[key,value]of Object.entries(input)) {
      assert.ok(getElementById('study-fields').innerHTML.includes(`id="study-${key}"`),`Integral ${id}: ${key}`);
      getElementById(`study-${key}`).value=String(value);
    }
    getElementById('study-result').innerHTML='';actions.studyCalculate();
    const result=getElementById('study-result');
    assert.equal(result.classList.contains('tool-error'),false,`Integral ${id}: ${result.textContent}`);
    for(const[label,value]of expected)assert.ok(result.innerHTML.includes(`<dt>${label}</dt><dd>${intFmt(value)}</dd>`),`Integral ${id}: ${label}\n${result.innerHTML}`);
    for(const text of extra)assert.ok(result.innerHTML.includes(text),`Integral ${id}: ${text}`);
    return result.innerHTML;
  }
  for(const[id,expr,result]of [
    [1,'6*x^2-4*x+3','2*x^3 - 2*x^2 + 3*x'],[2,'1/x+e^x','ln|x| + e^(x)'],[3,'cos(3*x)','sin(3*x)/3'],
    [4,'x*sqrt(x^2+1)','1/3*(x^2 + 1)^(3/2)'],[5,'2*x*e^(x^2)','e^(x^2)'],[13,'tan(x)','-ln|cos(x)|'],
    [17,'(x^3+2)/x^2','1/2*x^2 - 2*x^(-1)'],[18,'x*e^x','x*e^(x) - e^(x)'],[19,'x^2*ln(x)','1/3*ln(x)*x^3 - 1/9*x^3'],
    [20,'sin(x)^2','x/2 - sin(2*x)/4'],[21,'sin(x)^3*cos(x)^2','-(1/3*(cos(x))^3) + 1/5*(cos(x))^5'],
    [22,'(3*x+5)/((x-1)*(x+2))','1/3*ln|x + 2| + 8/3*ln|x - 1|'],[23,'1/(x^2*sqrt(x^2+4))','-sqrt(x^2 + 4)/(4*x)'],
    [24,'e^x*cos(x)','e^(x)*(cos(x) + sin(x))/2'],[35,'1/(x^3+x)','ln|x - 0| - 1/2*ln|x^2 + 1|'],
    [36,'1/(x^2+4*x+13)','1/3*atan((x + 2)/3)'],[37,'e^(sqrt(x))','2*(sqrt(x) - 1)*e^(sqrt(x))'],
    [38,'x^2*sin(x)','-x^2*cos(x) + 2*x*sin(x) + 2*cos(x)'],[39,'sec(x)^3','(sec(x)*tan(x) + ln|sec(x) + tan(x)|)/2'],
  ])intAction(id,'calcIntegrateCAS',{'int-cas-fx':expr},'res-cas',[result+' + C','Pasos']);
  intAction('1 panel indefinida','calcIntegralIndef',{'int-indef-fx':'6*x^2-4*x+3'},'res-indef',['2*x^3 - 2*x^2 + 3*x + C','Pasos']);
  for(const[id,expr,a,b,text]of [[6,'3*x^2+1',0,2,'10'],[7,'sqrt(x)',1,4,'14/3'],[8,'sen(x)',0,String(Math.PI),'2'],[11,'x^2',0,3,'3'],[14,'x/(x^2+1)',0,1,'0.34657359'],[15,'x^2',0,3,'9']])
    intAction(id,'calcIntegralDef',{'int-def-fx':expr,'int-def-a':a,'int-def-b':b},'res-def',[text,'Antiderivada','Pasos','Valor promedio']);
  intStudy(9,'primitivepvi',{expr:'6*x^2-2',x0:1,y0:4,x:2},[['C desde la condición inicial',4],['Valor',16],['Verificación y(x₀)',4]],['2*x^3 - 2*x','Pasos']);
  intAction(10,'calcIntegralNumeric',{'int-def-fx':'x^2','int-def-a':0,'int-def-b':4,'int-num-n':4,'int-num-method':'right'},'res-def-num',['30','h·Σ','Malla y valores','Error absoluto frente a referencia']);
  intStudy(12,'tfc',{expr:'sin(t)',lower:'0',upper:'x^2',x:1},[['Derivada',2*Math.sin(1)]],['Fórmula de la derivada','sin((x^2))','2x']);
  intAction(16,'calcIntegralNumeric',{'int-def-fx':'1/x','int-def-a':1,'int-def-b':3,'int-num-n':4,'int-num-method':'trapezoid'},'res-def-num',['1.11666667','h·[','Malla y valores']);
  for(const[id,expr,a,b,text]of [[25,'1/x^2',1,'∞','1'],[26,'1/sqrt(x)',0,1,'2'],[40,'x*e^(-x)',0,'∞','1'],[41,'ln(x)/x^2',1,'∞','1']])
    intAction(id,'calcIntegralDef',{'int-def-fx':expr,'int-def-a':a,'int-def-b':b},'res-def',[text,'límite analítico','Pasos']);
  intAction(27,'calcIntegralApp',{'intapp-type':'area','intapp-fx':'2*x','intapp-gx':'x^2','intapp-a':0,'intapp-b':2},'res-intapp',['4/3','u²']);
  for(const[id,expr,a,b,axis,text]of [[28,'sqrt(x)',0,4,'x','25.13274123'],[29,'x^2',0,2,'y','25.13274123']])
    intAction(id,'calcRevolutionVolume',{'int-rev-mode':'direct','int-rev-fx':expr,'int-rev-gx':'','int-rev-a':a,'int-rev-b':b,'int-rev-axis':axis},'res-rev',[text,'Volumen V',axis==='y'?'Cascarones':'Discos']);
  intStudy(30,'arc',{expr:'x^(3/2)',start:0,end:4,n:400},[['Longitud',8*(10**1.5-1)/27]],['Derivada','Diferencia entre mallas']);
  intAction(31,'calcPolar',{'polar-op':'area','polar-r':'2*(1+cos(t))','polar-a':0,'polar-b':Math.PI*2},'res-polar',['18.84955592','Área polar']);
  intAction(32,'calcIntegralNumeric',{'int-def-fx':'1/(1+x^2)','int-def-a':0,'int-def-b':1,'int-num-n':4,'int-num-method':'simpson'},'res-def-num',['0.78539216','π/4','Error absoluto frente a referencia','Malla y valores']);
  intStudy(33,'series',{center:0,radius:3,power:1},[['Radio',3]],['x: -3; converge: sí; absoluta: no','x: 3; converge: no']);
  intStudy(34,'comparisonseries',{a:2,b:1,power:3},[['Exponente de comparación',2]],['converge','3/n^2','p=2']);
  intAction(42,'calcRevolutionVolume',{'int-rev-mode':'add','int-rev-fx':'x','int-rev-gx':'x^2','int-rev-a':0,'int-rev-b':1,'int-rev-axis':'x-shift','int-rev-shift':2,'int-rev-m':1,'int-rev-offset':0},'res-rev',['1.67551608','Primitiva de la sección','Evaluación simbólica','8/15']);
  intStudy(43,'surface',{expr:'x^3',start:0,end:1,axis:'x',n:400},[['Área',Math.PI*(10**1.5-1)/27]],['Diferencia entre mallas']);
  intAction(44,'calcPolar',{'polar-op':'arc','polar-r':'e^t','polar-a':0,'polar-b':Math.PI},'res-polar',[String(Number((Math.SQRT2*(Math.exp(Math.PI)-1)).toFixed(8))),'Longitud de arco']);
  intStudy(45,'polararea',{outer:'3*cos(x)',inner:'1+cos(x)',start:-Math.PI/3,end:Math.PI/3,n:400},[['Área',Math.PI]]);
  intStudy(46,'taylorterms',{expr:'ln(1+x)',center:0,terms:4,x:.1},[['Valor',.1-.1**2/2+.1**3/3-.1**4/4]],['k: 1; coef: 1','k: 4; coef: -0.25','Error absoluto en el punto']);
  intStudy(47,'taylorterms',{expr:'cos(x)',center:'π/3',terms:4,x:Math.PI/3},[['Valor',.5]],['k: 0; coef: 0.5','k: 3; coef: 0.1443375673']);
  intStudy(48,'series',{center:2,radius:2,power:2},[['Radio',2]],['x: 0; converge: sí; absoluta: sí','x: 4; converge: sí; absoluta: sí']);
  intStudy(49,'integrallimit',{amplitude:1,rate:1,power:2},[['Límite',1/3]],['L’Hôpital','TFC','sen u/u']);
  intStudy(50,'telescoping',{offset:2},[['Suma',.75]],['1/[n(n+2)]']);
  intAction('singularidad','calcIntegralDef',{'int-def-fx':'1/x^2','int-def-a':-1,'int-def-b':1},'res-def',['Singularidad interior']);
  intAction('serie no demostrada','calcSeries',{'series-type':'ratio','series-term':'sin(n)'},'res-series',['Inconcluso','no demuestra el límite']);
  intAction('raíz (n/(2n+1))^n','calcSeries',{'series-type':'root','series-term':'(n/(2n+1))^n'},'res-series',['Prueba de la raíz','Converge','= 0.5']);
  intAction('integral 1/(n ln² n)','calcSeries',{'series-type':'integral','series-term':'1/(n*ln(n)^2)','series-N':'2'},'res-series',['Prueba de la integral','Converge','−1/ln(x)','Hipótesis']);
  intAction('alternante 1/n','calcSeries',{'series-type':'alt','series-term':'1/n','series-N':'10'},'res-series',['Converge condicionalmente','S_N','b_(N+1)','Leibniz']);
  actions.closeModule('study');actions.closeModule('calc');actions.launchSubmod('calc-int');
  getElementById('int-def-fx').value = 'x^2';
  getElementById('int-def-a').value = '0';
  getElementById('int-def-b').value = '1';
  actions.calcIntegralDef();
  assert.match(getElementById('res-def').innerHTML, /0\.333 → 1\/3/);

  getElementById('int-rev-fx').value='x';
  getElementById('int-rev-mode').value='direct';
  actions.calcRevolutionModeChanged();
  assert.equal(getElementById('rev-add-fields').hidden,true);
  getElementById('int-rev-gx').value='';
  getElementById('int-rev-a').value='0';
  getElementById('int-rev-b').value='1';
  getElementById('int-rev-axis').value='x';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/1\.04719755 u³/);
  getElementById('int-rev-axis').value='y';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/2\.0943951 u³/);
  getElementById('int-rev-a').value='-1';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/no puede cruzar x = 0/);

  getElementById('int-rev-fx').value='x^2';
  getElementById('int-rev-mode').value='add';
  actions.calcRevolutionModeChanged();
  assert.equal(getElementById('rev-add-fields').hidden,false);
  getElementById('int-rev-gx').value='sqrt(x)';
  getElementById('int-rev-a').value='0';
  getElementById('int-rev-axis').value='x';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/0\.9424778 u³/);
  assert.match(getElementById('res-rev').innerHTML,/Intersecciones/);
  assert.match(getElementById('res-rev').innerHTML,/\(0, 0\).*\(1, 1\)/);
  getElementById('int-rev-gx').value='sqrt(';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/Segunda función inválida/);
  getElementById('int-rev-fx').value='y=-mx+b';
  getElementById('int-rev-gx').value='y=1';
  getElementById('int-rev-m').value='1';
  getElementById('int-rev-offset').value='2';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/4\.1887902 u³/);
  assert.match(getElementById('res-rev').innerHTML,/\(1, 1\)/);
  getElementById('int-rev-gx').value='';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/Ingresa la segunda función/);
  getElementById('int-rev-fx').value='x';
  getElementById('int-rev-gx').value='x^2';
  getElementById('int-rev-axis').value='x-shift';
  getElementById('int-rev-shift').value='2';
  actions.calcRevolutionAxisChanged();
  assert.equal(getElementById('rev-shift-fields').hidden,false);
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/1\.67551608 u³/);
  assert.match(getElementById('res-rev').innerHTML,/y = 2/);
  getElementById('int-rev-gx').value='0';
  getElementById('int-rev-axis').value='y-shift';
  getElementById('int-rev-shift').value='-1';
  actions.calcRevolutionAxisChanged();
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/5\.23598776 u³/);
  getElementById('int-rev-shift').value='0.5';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/no puede cruzar el eje de giro/);
  getElementById('int-rev-axis').value='x';
  actions.calcRevolutionAxisChanged();
  assert.equal(getElementById('rev-shift-fields').hidden,true);
  getElementById('int-rev-mode').value='direct';
  actions.calcRevolutionModeChanged();
  getElementById('int-rev-fx').value='x';
  getElementById('int-rev-gx').value='sqrt(';
  getElementById('int-rev-m').value='invalid';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/1\.04719755 u³/);
  getElementById('int-rev-fx').value='y=-mx+b';
  actions.calcRevolutionVolume();
  assert.match(getElementById('res-rev').innerHTML,/selecciona Agregar función/);

  getElementById('mul-grad-fxy').value = 'x+y';
  getElementById('mul-grad-x0').value = '1';
  getElementById('mul-grad-y0').value = '2';
  actions.calcGradient();
  assert.match(getElementById('res-grad').innerHTML, /1\.41421/);

  getElementById('dif-imp-fxy').value = 'x^2+y^2-25';
  getElementById('dif-imp-x0').value = '3';
  getElementById('dif-imp-y0').value = '4';
  actions.calcImplicit();
  assert.doesNotMatch(getElementById('res-imp').innerHTML, /Función inválida/);
  assert.match(getElementById('res-imp').innerHTML, /dy\/dx en \(3,4\)/);
  getElementById('dif-imp-dxdt').value='2';
  actions.calcImplicit();
  assert.match(getElementById('res-imp').innerHTML,/Tasa relacionada dy\/dt/);
  assert.match(getElementById('res-imp').innerHTML,/>-1\.5/);
  getElementById('dif-imp-dxdt').value='';
  getElementById('dif-imp-fxy').value='x^3+y^3-6*x*y';
  getElementById('dif-imp-x0').value='3';
  getElementById('dif-imp-y0').value='3';
  actions.calcImplicit();
  assert.match(getElementById('res-imp').innerHTML,/>-1<\/div>/);
  getElementById('dif-imp-fxy').value='x^2+x*y+y^2-7';
  getElementById('dif-imp-x0').value='2';
  getElementById('dif-imp-y0').value='1';
  actions.calcImplicit();
  assert.match(getElementById('res-imp').innerHTML,/y = \(-1\.25\)x \+ 3\.5/);
  getElementById('dif-imp-fxy').value='x^2+y^2-25';
  getElementById('dif-imp-x0').value='3';
  getElementById('dif-imp-y0').value='3';
  actions.calcImplicit();
  assert.match(getElementById('res-imp').innerHTML,/no satisface/);
  assert.doesNotMatch(getElementById('res-imp').innerHTML,/Recta tangente/);
  getElementById('dif-imp-x0').value='5';
  getElementById('dif-imp-y0').value='0';
  actions.calcImplicit();
  assert.match(getElementById('res-imp').innerHTML,/Tangente vertical/);
  assert.match(getElementById('res-imp').innerHTML,/x = 5/);

});
