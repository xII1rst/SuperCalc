import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppHarness } from './helpers/app-harness.mjs';

test('análisis numérico: paneles y auditoría de los 50 ejercicios', async () => {
  const harness = await createAppHarness();
  const { getElementById } = harness;
  const actions = harness.actions;
  actions.openSubmod('num');
  for (const id of ['num-errors','num-precision','num-roots','num-linear','num-system2d','num-interpolation','num-derivative','num-quadrature','num-ode'])
    assert.match(getElementById('submod-cards').innerHTML,new RegExp(`data-arg="${id}"`));
  actions.launchSubmod('num-errors');
  getElementById('num-exact').value=String(Math.PI);
  getElementById('num-approx').value=String(22/7);
  getElementById('num-digits').value='5';
  actions.numCalcErrors();
  assert.match(getElementById('num-result').innerHTML,/error relativo/);
  actions.closeModule('num');
  actions.launchSubmod('num-precision');
  for(const [id,value] of Object.entries({'num-precision-values':'10000, 3.14159, 10000','num-precision-ops':'+, -','num-precision-digits':'4','num-precision-mode':'round'}))
    getElementById(id).value=value;
  actions.numCalcPrecision();
  assert.match(getElementById('num-result').innerHTML,/resultado simulado = 0/);
  assert.match(getElementById('num-result').innerHTML,/error absoluto = 3\.14159/);
  for(const [id,value] of Object.entries({'num-precision-values':'12.34, 0.05678','num-precision-ops':'+','num-precision-digits':'4','num-precision-mode':'chop'}))
    getElementById(id).value=value;
  actions.numCalcPrecision();
  assert.match(getElementById('num-result').innerHTML,/resultado simulado = 12\.39/);
  getElementById('num-precision-mode').value='round';
  actions.numCalcPrecision();
  assert.match(getElementById('num-result').innerHTML,/resultado simulado = 12\.4/);
  actions.closeModule('num');
  actions.launchSubmod('num-roots');
  getElementById('num-root-reference').value='';
  for (const [id,value] of Object.entries({'num-root-method':'bisection','num-root-f':'x^3-x-2','num-root-a':'1','num-root-b':'2','num-root-stop':'steps','num-root-n':'3','num-root-tol':'0.000001'}))
    getElementById(id).value=value;
  actions.numCalcRoots();
  assert.match(getElementById('num-result').innerHTML,/1\.625/);
  getElementById('num-root-method').value='bairstow';
  for (const [id,value] of Object.entries({'num-root-coefficients':'4, 0, -5, 0, 1','num-root-r':'0','num-root-s':'1','num-root-n':'20'})) getElementById(id).value=value;
  actions.numCalcRoots();
  assert.match(getElementById('num-result').innerHTML,/Bairstow/);
  actions.closeModule('num');
  actions.launchSubmod('num-linear');
  getElementById('num-linear-criterion').value='both';
  for (const [id,value] of Object.entries({'num-linear-a':'4, -1\n-1, 4','num-linear-b':'3, 6','num-linear-x0':'0, 0','num-linear-method':'jacobi','num-linear-stop':'steps','num-linear-n':'2'}))
    getElementById(id).value=value;
  actions.numCalcLinear();
  assert.match(getElementById('num-result').innerHTML,/1\.6875/);
  getElementById('num-linear-method').value='lu';
  actions.numCalcLinear();
  assert.match(getElementById('num-result').innerHTML,/PA=LU/);
  getElementById('num-linear-a').value='0.0003, 3\n1, 1';
  getElementById('num-linear-b').value='2.0001, 1';
  getElementById('num-linear-method').value='finite-gauss';
  getElementById('num-finite-digits').value='4';
  getElementById('num-finite-mode').value='round';
  actions.numCalcLinear();
  assert.match(getElementById('num-result').innerHTML,/Gauss con precisión finita/);
  assert.match(getElementById('num-result').innerHTML,/0\.3333/);
  assert.match(getElementById('num-result').innerHTML,/Intercambiar filas 1 y 2/);
  actions.closeModule('num');
  actions.launchSubmod('num-system2d');
  for(const [id,value] of Object.entries({'num-system-f':'x^2+y^2-5','num-system-g':'x-y-1','num-system-x0':'2.1','num-system-y0':'0.9','num-system-n':'10','num-system-tol':'0.000000001'}))
    getElementById(id).value=value;
  actions.numCalcSystem2D();
  assert.match(getElementById('num-result').innerHTML,/Convergió/);
  assert.match(getElementById('num-result').innerHTML,/\(2, 1\)/);
  for(const [id,value] of Object.entries({'num-system-f':'x^2+y^2-4','num-system-g':'x*y-1','num-system-x0':'2','num-system-y0':'0.5','num-system-n':'1'}))
    getElementById(id).value=value;
  actions.numCalcSystem2D();
  assert.match(getElementById('num-result').innerHTML,/1\.933333/);
  assert.match(getElementById('num-result').innerHTML,/0\.516666/);
  actions.closeModule('num');
  actions.launchSubmod('num-interpolation');
  for (const [id,value] of Object.entries({'num-points':'0, 1\n1, 3\n2, 7','num-interp-method':'newton','num-interp-x':'1.5'}))
    getElementById(id).value=value;
  actions.numCalcInterpolation();
  assert.match(getElementById('num-result').innerHTML,/4\.75/);
  getElementById('num-interp-method').value='error';
  getElementById('num-points').value=[1,2,3].map(x=>`${x}, ${Math.log(x)}`).join('\n');
  getElementById('num-interp-x').value='2.5';
  getElementById('num-interp-reference').value='ln(x)';
  getElementById('num-interp-bound').value='2';
  actions.numCalcInterpolation();
  assert.match(getElementById('num-result').innerHTML,/cota teórica ≤ 0\.125/);
  assert.match(getElementById('num-result').innerHTML,/error real/);
  getElementById('num-interp-method').value='exponential';
  getElementById('num-points').value='0, 2\n1, 5.43656365691809\n2, 14.7781121978613';
  actions.numCalcInterpolation();
  assert.match(getElementById('num-result').innerHTML,/Ajuste exponencial/);
  actions.closeModule('num');
  actions.launchSubmod('num-derivative');
  for (const [id,value] of Object.entries({'num-diff-f':'ln(x)','num-diff-x':'2','num-diff-h':'0.1','num-diff-method':'five'}))
    getElementById(id).value=value;
  actions.numCalcDerivative();
  assert.match(getElementById('num-result').innerHTML,/refinamientos/);
  actions.closeModule('num');
  actions.launchSubmod('num-quadrature');
  getElementById('num-quad-reference').value='';
  for(const [id,value] of Object.entries({'num-quad-f':'sin(x)','num-quad-a':'0','num-quad-b':String(Math.PI),'num-quad-n':'10','num-quad-method':'simpson','num-quad-bound':'1'}))
    getElementById(id).value=value;
  actions.numCalcQuadrature();
  assert.match(getElementById('num-result').innerHTML,/Cota teórica/);
  assert.match(getElementById('num-result').innerHTML,/M₄/);
  for(const [id,value] of Object.entries({'num-quad-f':'exp(x)','num-quad-a':'0','num-quad-b':'1','num-quad-mode':'target','num-quad-target':'0.000001','num-quad-method':'trapezoid','num-quad-bound':String(Math.E)}))
    getElementById(id).value=value;
  actions.numCalcQuadrature();
  assert.match(getElementById('num-result').innerHTML,/n mínimo.*476/);
  getElementById('num-quad-method').value='simpson';
  actions.numCalcQuadrature();
  assert.match(getElementById('num-result').innerHTML,/n mínimo.*12/);
  for(const [id,value] of Object.entries({'num-quad-f':'ln(x)','num-quad-a':'1','num-quad-b':'3','num-quad-target':'0.00000001','num-quad-bound':'6'}))
    getElementById(id).value=value;
  actions.numCalcQuadrature();
  assert.match(getElementById('num-result').innerHTML,/n mínimo.*102/);
  actions.closeModule('num');
  actions.launchSubmod('num-ode');
  for (const [id,value] of Object.entries({'num-ode-f':'x+y','num-ode-x0':'0','num-ode-y0':'1','num-ode-h':'0.1','num-ode-n':'2','num-ode-method':'euler','num-ode-startup':'rk4','num-ode-reference':'','num-ode-lambda':''}))
    getElementById(id).value=value;
  actions.numCalcODE();
  assert.match(getElementById('num-result').innerHTML,/1\.22/);
  getElementById('num-ode-lambda').value='-1';
  actions.numCalcODE();
  assert.match(getElementById('num-result').innerHTML,/Prueba separada/);
  for(const [id,value] of Object.entries({'num-ode-f':'y','num-ode-x0':'0','num-ode-y0':'1','num-ode-h':'0.25','num-ode-n':'4','num-ode-method':'compare','num-ode-reference':'exp(x)','num-ode-lambda':''}))
    getElementById(id).value=value;
  actions.numCalcODE();
  assert.match(getElementById('num-result').innerHTML,/Comparación de PVI/);
  assert.match(getElementById('num-result').innerHTML,/2\.44140625/);
  assert.match(getElementById('num-result').innerHTML,/Adams–Bashforth 2/);
  for(const [id,value] of Object.entries({'num-ode-f':'x-y','num-ode-x0':'0','num-ode-y0':'1','num-ode-h':'0.1','num-ode-n':'4','num-ode-method':'ab2','num-ode-startup':'rk2','num-ode-reference':''}))
    getElementById(id).value=value;
  actions.numCalcODE();
  assert.match(getElementById('num-result').innerHTML,/RK2 punto medio en el primer paso/);
  assert.match(getElementById('num-result').innerHTML,/0\.74266625/);
  getElementById('num-ode-reference').value='2*exp(x)';
  actions.numCalcODE();
  assert.match(getElementById('num-result').textContent,/no satisface el valor inicial/);
  actions.closeModule('num');
  actions.launchSubmod('num-system',false);
  for(const[key,value]of Object.entries({'num-system-vars':'x,y,z','num-system-expressions':'x^2+y^2+z^2-3\nx-y\ny-z','num-system-initial':'1.2,.9,.8','num-system-iterations':'30','num-system-tolerance':'1e-9'}))getElementById(key).value=value;
  actions.numCalcSystem();assert.match(getElementById('num-result').innerHTML,/Convergió/);assert.match(getElementById('num-result').innerHTML,/\[1, 1, 1\]/);assert.match(getElementById('num-result').innerHTML,/∂\/∂z/);
  actions.launchSubmod('num-stability',false);
  for(const[key,value]of Object.entries({'num-stability-matrix':'-2,1\n0,-1','num-stability-step':'.2','num-stability-method':'euler'}))getElementById(key).value=value;
  actions.numCalcSystemStability();assert.match(getElementById('num-result').innerHTML,/Estable asintóticamente/);
  getElementById('num-stability-matrix').value='0,-1\n1,0';actions.numCalcSystemStability();assert.match(getElementById('num-result').innerHTML,/Inconcluso/);
  const numericalCovered=new Set();
  const numericalDefaults={
    roots:{method:'bisection',f:'x^3-x-2',df:'',a:1,b:2,stop:'steps',n:3,tol:1e-6,reference:'',coefficients:'4,0,-5,0,1',r:0,s:1},
    linear:{a:'4,-1\n-1,4',b:'3,6',x0:'0,0',method:'jacobi',stop:'steps',n:2,tol:1e-6,criterion:'both'},
    interpolation:{method:'newton',x:1.5,reference:'',bound:2,'bound-mode':'given'},
    quadrature:{f:'x^2',a:0,b:1,n:4,method:'trapezoid',mode:'subintervals',target:1e-6,bound:1000,'bound-mode':'given',reference:''},
    ode:{f:'y',x0:0,y0:1,h:.1,n:2,method:'euler',startup:'rk4',reference:'',lambda:''},
  };
  const numericalPrefixes={roots:'root',linear:'linear',interpolation:'interp',quadrature:'quad',ode:'ode',taylor:'taylor',derivative:'diff'};
  function numericalCase(id,panel,action,fields,patterns){
    actions.numOpenPanel(panel);
    const markup=getElementById('num-content').innerHTML;
    assert.match(markup,new RegExp(`data-action="${action}"`));
    for(const [key,value] of Object.entries({...numericalDefaults[panel],...fields})){
      const control=key.startsWith('num-')?key:`num-${numericalPrefixes[panel]}-${key}`;
      assert.match(markup,new RegExp(`id="${control}"`),`Análisis ${id}: campo ${control}`);
      getElementById(control).value=String(value);
    }
    actions[action]();
    assert.equal(getElementById('num-result').classList.contains('tool-error'),false,`Análisis ${id}: ${getElementById('num-result').textContent}`);
    for(const pattern of patterns)assert.match(getElementById('num-result').innerHTML,pattern,`Análisis ${id}`);
    numericalCovered.add(id);
  }
  const nr=(id,fields,patterns)=>numericalCase(id,'roots','numCalcRoots',fields,patterns);
  const nl=(id,fields,patterns)=>numericalCase(id,'linear','numCalcLinear',fields,patterns);
  const ni=(id,fields,patterns)=>numericalCase(id,'interpolation','numCalcInterpolation',fields,patterns);
  const nq=(id,fields,patterns)=>numericalCase(id,'quadrature','numCalcQuadrature',fields,patterns);
  const no=(id,fields,patterns)=>numericalCase(id,'ode','numCalcODE',fields,patterns);
  numericalCase(1,'errors','numCalcErrors',{'num-exact':Math.PI,'num-approx':22/7,'num-digits':5},[/0\.001264489/]);
  numericalCase(2,'errors','numCalcErrors',{'num-exact':2.718281828,'num-approx':2.718281828,'num-digits':5},[/2\.7183/,/0\.000018172/]);
  for(const [mode,answer] of [['chop',/12\.39/],['round',/12\.4/]])numericalCase(3,'precision','numCalcPrecision',{'num-precision-values':'12.34,.05678','num-precision-ops':'+','num-precision-digits':4,'num-precision-mode':mode},[answer]);
  nr(4,{},[/1\.625/]);nr(5,{method:'count',tol:1e-4},[/N mínimo = 14/]);
  nr(6,{method:'newton',f:'x^2-2',a:1.5,n:2},[/1\.414215686/,/simbólica/]);
  nr(7,{method:'newton',f:'cos(x)-x',a:.5,n:2},[/0\.7391416661/]);
  nl(8,{a:'2,3\n4,-1',b:'8,2',x0:'0,0',method:'finite-gauss','num-finite-digits':15,'num-finite-mode':'round'},[/\[1, 2\]/,/Eliminar fila/]);
  nl(9,{},[/1\.6875/]);
  ni(10,{'num-points':'1,2\n3,8',method:'lagrange',x:2},[/p\(2\) = 5/,/\[-1, 3\]/]);
  ni(11,{'num-points':'0,1\n1,3\n2,7'},[/\[1, 1, 1\]/,/Diferencias divididas/]);
  ni(12,{'num-points':'1,2\n2,3\n3,5\n4,4',method:'fit','num-fit-degree':1},[/\[1\.5, 0\.8\]/]);
  for(const [method,answer] of [['forward',/1\.051709181/],['central',/1\.0016675/]])numericalCase(13,'derivative','numCalcDerivative',{f:'exp(x)',x:0,h:.1,method},[answer,/error real/]);
  nq(14,{f:'x^2',b:2,n:1,reference:8/3},[/Trapecio = 4/,/error real = 1\.333333333/]);
  nq(15,{f:'sin(x)',b:Math.PI,n:2,method:'simpson','bound-mode':'auto',reference:2},[/Simpson = 2\.094395102/]);
  no(16,{f:'x+y'},[/1\.22/]);
  numericalCase(17,'taylor','numCalcTaylor',{f:'exp(x)',center:0,x:.5,degree:3},[/1\.645833333/,/cota ≤ 0\.004293544976/]);
  numericalCase(18,'taylor','numCalcTaylor',{f:'sin(x)',center:0,x:.3,degree:5},[/0\.29552025/,/cota/]);
  nr(19,{f:'exp(-x)-x',a:0,b:1,n:5},[/0\.59375/]);
  nr(20,{method:'newton',f:'x^3-2x-5',a:2,n:3},[/2\.094551482/]);
  nr(21,{method:'bairstow',coefficients:'-2,2,-1,1',r:.5,s:-1,n:1},[/r siguiente/,/s siguiente/,/x²−\(-4\)x−\(-1\.75\)/,/No convergió/]);
  nl(22,{a:'2,1,1\n4,3,3\n8,7,9',b:'4,10,24',x0:'0,0,0',method:'lu'},[/x = \[1, 1, 1\]/,/det\(A\) = 4/]);
  nl(23,{a:'.0003,3\n1,1',b:'2.0001,1',method:'finite-gauss','num-finite-digits':4,'num-finite-mode':'round'},[/\[0, 0\.6666\]/,/\[0\.3333, 0\.6667\]/]);
  const numerical3={a:'10,1,-1\n1,10,1\n-1,1,10',b:'11,12,10',x0:'0,0,0',n:3};
  nl(24,numerical3,[/\[1\.1, 0\.993, 1\.009\]/]);
  nl(25,{...numerical3,method:'seidel'},[/\[1\.1019241, 0\.98880449, 1\.011311961\]/]);
  numericalCase(26,'system2d','numCalcSystem2D',{'num-system-f':'x^2+y^2-4','num-system-g':'x*y-1','num-system-x0':2,'num-system-y0':.5,'num-system-n':1,'num-system-tol':1e-9},[/1\.933333333/,/0\.5166666667/]);
  ni(27,{'num-points':'0,1\n1,3\n2,2\n3,5',method:'lagrange'},[/2\.4375/,/Coeficientes en potencias/]);
  ni(28,{'num-points':'1,0\n2,.6931\n3,1.0986\n4,1.3863',x:2.5},[/0\.9211875/]);
  ni(29,{'num-points':'-2,4.1\n-1,1.2\n0,.1\n1,.9\n2,4.2',method:'fit','num-fit-degree':2},[/0\.05714285714, -0\.01, 1\.021428571/]);
  ni(30,{'num-points':[[0,3.1],[Math.PI/2,1.9],[Math.PI,.9],[3*Math.PI/2,2.1]].map(p=>p.join(',')).join('\n'),method:'sinusoidal','num-fit-omega':1,'num-fit-offset':'yes'},[/c=2, a=-0\.1, b=1\.1/]);
  for(const [method,answer] of [['central',/0\.5004172928/],['five',/0\.4999974775/]])numericalCase(31,'derivative','numCalcDerivative',{f:'ln(x)',x:2,h:.1,method},[answer,/error real/]);
  nq(32,{f:'exp(-x^2)',n:4},[/0\.7429840978/]);nq(33,{f:'exp(-x^2)',n:4,method:'simpson'},[/0\.7468553798/]);
  no(34,{f:'y-x^2+1',y0:.5,h:.2,n:2,reference:'(x+1)^2-.5*exp(x)'},[/1\.152/,/y\(0\.4\)/]);
  no(34,{f:'y-x^2+1',y0:.5,h:.2,n:1,method:'rk4',reference:'(x+1)^2-.5*exp(x)'},[/0\.8292933333/,/y\(0\.2\)/]);
  for(const [method,n] of [['trapezoid',476],['simpson',12]])nq(35,{f:'exp(x)',method,mode:'target','bound-mode':'auto'},[new RegExp(`n mínimo.*${n}`),/M = 2\.718281828/]);
  nq(36,{f:'ln(x)',a:1,b:3,method:'simpson',mode:'target',target:1e-8,'bound-mode':'auto'},[/n mínimo.*102/,/M = 6/,/Para x≥1/]);
  nr(37,{method:'newton',f:'x^2-2',a:1,n:4,reference:Math.SQRT2},[/Orden observado/,/eᵢ₊₁\/eᵢ²/]);
  nr(38,{method:'bairstow',coefficients:'2,-6,7,-4,1',r:1.5,s:-1.5,n:3},[/No convergió/,/2\.018016985/]);
  nr(38,{method:'bairstow',coefficients:'2,-6,7,-4,1',r:1.5,s:-1.5,n:200,tol:1e-13},[/Estado: converged/,/Raíces obtenidas/]);
  nl(39,{a:'3,-1,2\n1,4,-1\n2,1,5',b:'4,3,8',x0:'0,0,0',method:'lu'},[/det\(A\) = 56/,/0\.875/]);
  nl(39,{a:'3,-1,2\n1,4,-1\n2,1,5',b:'1,0,0',x0:'0,0,0',method:'lu'},[/\[0\.375, -0\.125, -0\.125\]/]);
  nl(40,{a:'4,1,1\n1,5,2\n1,2,6',b:'6,8,9',x0:'0,0,0',method:'seidel',stop:'tolerance',tol:.01,criterion:'change'},[/dominancia estricta/,/solo cambio/,/0\.9997160132/]);
  numericalCase(41,'system2d','numCalcSystem2D',{'num-system-f':'x^2+y^2-4','num-system-g':'x^2-y-1','num-system-x0':1.5,'num-system-y0':1.5,'num-system-n':2,'num-system-tol':1e-9},[/1\.517502165/,/1\.302801724/]);
  ni(42,{'num-points':[1,2,3].map(x=>`${x},${Math.log(x)}`).join('\n'),method:'error',x:2.5,reference:'ln(x)','bound-mode':'auto'},[/cota teórica ≤ 0\.125/,/M = 2/,/error real = 0\.0155492618/]);
  ni(43,{'num-points':'0,1\n1,2\n2,9\n3,28\n4,65',x:2.5},[/\[1, 0, 0, 1, 0\]/,/16\.625/]);
  ni(44,{'num-points':'0,2.1\n1,3.3\n2,5.4\n3,8.9',method:'exponential'},[/mínimos cuadrados sobre ln\(y\)/,/Residuo y−ŷ/]);
  ni(45,{'num-points':'0,1.1\n.25,.9\n.5,-1.05\n.75,-.95',method:'sinusoidal','num-fit-omega':2*Math.PI,'num-fit-offset':'no'},[/c=0, a=0\.925, b=1\.075/]);
  no(46,{f:'-2y+x',method:'rk4',reference:'x/2-.25+1.25*exp(-2x)'},[/0\.6879053389/,/error real/]);
  no(47,{f:'x-y',method:'ab2',n:4,startup:'rk2'},[/RK2 punto medio/,/0\.74266625/]);
  no(48,{h:.25,n:4,method:'compare',reference:'exp(x)'},[/2\.44140625/,/error real/,/RK4/]);
  for(const [h,value,stability] of [[.1,/-32/,/inestable/],[.05,/-0\.03125/,/estable/],[.02,/0\.01024/,/estable/]])no(49,{f:'-30y',h,n:5,lambda:-30,reference:'exp(-30x)'},[value,stability]);
  for(const method of ['newton','bisection'])nr(50,{method,f:'x^3-6x^2+11x-6.1',a:method==='newton'?3.5:2.5,b:3.5,stop:'tolerance'},[/converged/,/3\.04668/]);
  assert.deepEqual([...numericalCovered].sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i+1));
});
