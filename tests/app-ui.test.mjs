import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { THEORY } from '../js/content/theory.mjs';
import { createAppHarness, listAppSources } from './helpers/app-harness.mjs';

test('el punto de entrada ES conserva los eventos y cálculos principales', async () => {
  const harness = await createAppHarness();
  const { sandbox, context, headLinks, delegatedEvents, history, savedTheme, getElementById } = harness;
  assert.equal(headLinks.find(link => link.rel === 'icon')?.href, 'data:image/png;base64,AA==');
  assert.equal(headLinks.find(link => link.rel === 'apple-touch-icon')?.href, 'data:image/png;base64,AA==');
  const actions=harness.actions;
  getElementById('graf-canvas-wrap').style.display='none';
  assert.equal(actions.toggleTheme(),'light');
  assert.equal(sandbox.document.documentElement.dataset.theme,'light');
  assert.equal(savedTheme.get('sc-theme'),'light');
  await Promise.resolve();
  assert.equal(typeof harness.updateFound, 'function');
  harness.updateFound();
  harness.stateChanged();
  assert.match(getElementById('update-banner').innerHTML, /Actualizar/);

  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const allSource = (await Promise.all((await listAppSources()).map(url => readFile(url, 'utf8')))).join('\n');
  assert.doesNotMatch(html+allSource,/\bon(?:click|input|change|pointerdown|keydown|keyup|submit)="/);
  assert.doesNotMatch(allSource,/\balert\s*\(/);
  const handlers = new Set([...((html+allSource).matchAll(/\bdata-action="([\w$]+)"/g))]
    .map(match=>match[1]));
  for (const match of allSource.matchAll(/\bfn:'(app\w+)'/g)) handlers.add(match[1]);
  assert.ok(handlers.size > 100);
  for (const name of handlers) {
    assert.equal(typeof actions[name], 'function', `Falta la acción ${name}`);
  }
  assert.equal(typeof delegatedEvents.get('click'),'function');
  assert.equal(typeof delegatedEvents.get('input'),'function');
  assert.equal(context.matCalcOps,undefined);
  assert.equal(actions.matOpsState, undefined);
  assert.equal(typeof actions.matOpsSetScalar, 'function');

  getElementById('mat-sm').value='2';
  getElementById('mat-sn').value='3';
  getElementById('mat-smet').value='gauss';
  actions.matBuildSis();
  for(const [id,value] of Object.entries({
    'ms-0-0':'1','ms-0-1':'1','ms-0-2':'1','ms-0-3':'2',
    'ms-1-0':'2','ms-1-1':'2','ms-1-2':'2','ms-1-3':'4',
  })) getElementById(id).value=value;
  actions.matCalcSis();
  assert.match(getElementById('mat-res-sis').innerHTML,/Infinitas soluciones/);
  getElementById('mat-space-m').value='3';
  getElementById('mat-space-n').value='4';
  actions.matBuildSpace();
  const spaceRows=[[1,2,0,1],[0,1,1,2],[1,3,1,3]];
  spaceRows.forEach((row,r)=>row.forEach((value,c)=>{getElementById(`sp-${r}-${c}`).value=String(value);}));
  actions.matCalcSpace();
  assert.match(getElementById('mat-res-space').innerHTML,/rango\(A\) = 2; nulidad\(A\) = 2/);
  assert.match(getElementById('mat-res-space').innerHTML,/Base del núcleo/);
  getElementById('sp-0-0').value='';
  actions.matCalcSpace();
  assert.match(getElementById('mat-res-space').innerHTML,/Entrada inválida en fila 1/);

  getElementById('int-def-fx').value='x²';
  getElementById('int-def-a').value='0';
  getElementById('int-def-b').value='4';
  getElementById('int-num-n').value='4';
  getElementById('int-num-method').value='right';
  actions.calcIntegralNumeric();
  assert.match(getElementById('res-def-num').innerHTML,/30/);
  actions.previewCalcExpression({value:'sen(x²)',dataset:{preview:'preview-dif-der'}});
  assert.match(getElementById('preview-dif-der').textContent,/sin\(x\^2\)/);

  for(const [id,value] of Object.entries({
    'edo-2do-a':'1','edo-2do-b':'0','edo-2do-c':'1',
    'edo-2do-y0':'0','edo-2do-dy0':'1',
  })) getElementById(id).value=value;
  actions.calcEDO2nd();
  assert.match(getElementById('res-edo2').innerHTML,/C₂ = .*1/);
  assert.match(getElementById('res-edo2').innerHTML,/Solución del ejercicio/);
  for(const [id,value] of Object.entries({
    'edo-sep-rhs':'y','edo-sep-x0':'0','edo-sep-y0':'1',
    'edo-sep-xfinal':'1','edo-sep-steps':'4',
  })) getElementById(id).value=value;
  actions.calcEDOSep();
  assert.match(getElementById('res-sep').innerHTML,/refinado con 8 pasos/);
  assert.match(getElementById('res-sep').innerHTML,/y\(1\)/);

  actions.openSubmod('math');
  const mathCards=getElementById('submod-cards').innerHTML;
  for (const id of ['al','ca','num','logic','stats','prob','exp'])
    assert.match(mathCards,new RegExp(`data-arg="${id}"`));
  assert.match(mathCards,/data-arg="theory-math"/);
  // Fichas teóricas: cada enlace apunta a una herramienta real del menú.
  const catalog=actions.routeCatalog();
  for (const subject of THEORY) for (const unit of subject.units) {
    for (const item of [...unit.topics,...unit.cards]) if (item.tool) assert.ok(catalog.has(item.tool),`${unit.id}: enlace desconocido ${item.tool}`);
  }
  actions.launchSubmod('theory-math');
  assert.ok(getElementById('theory-app').classList.contains('visible'));
  assert.match(getElementById('theory-subject').innerHTML,/Cálculo Diferencial[\s\S]*Lógica Matemática/);
  assert.doesNotMatch(getElementById('theory-subject').innerHTML,/Electromagnetismo/);
  assert.match(getElementById('theory-units').innerHTML,/Unidad 1\. Sucesiones/);
  assert.match(getElementById('theory-units').innerHTML,/data-action="theoryGo" data-arg="#\/al\/seq"[^>]*>Sucesiones y progresiones/);
  assert.match(getElementById('theory-summary').textContent,/^\d+ subtemas: \d+ cubiertos/);
  getElementById('theory-subject').value='logica';
  actions.theorySelect();
  assert.match(getElementById('theory-units').innerHTML,/Flujo máximo y corte mínimo/);
  actions.theoryGo('#/logic/logic-graphs');
  assert.ok(!getElementById('theory-app').classList.contains('visible'));
  assert.ok(getElementById('logic-app').classList.contains('visible'));
  actions.closeModule('logic');
  actions.launchSubmod('theory-fi');
  assert.match(getElementById('theory-subject').innerHTML,/Electromagnetismo[\s\S]*Ondas/);
  assert.equal(getElementById('theory-back').textContent,'Física');
  actions.closeModule('theory');
  // Atrás desde el menú de la herramienta vuelve a la ficha, y luego al menú de Matemáticas.
  actions.closeSubmod();
  assert.ok(getElementById('theory-app').classList.contains('visible'));
  actions.closeModule('theory');
  assert.ok(!getElementById('theory-app').classList.contains('visible'));
  assert.match(getElementById('submod-title').innerHTML,/Matemáticas/);
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
  const logicCovered=new Set();
  const logicDefaults={bases:{mode:'convert',a:'156',b:'0',from:10,to:2,width:8,op:'add'},sets:{mode:'sets',a:'1,2,3,4',b:'4,5',pairs:'1,1',n:4,m:4,outer:'forall',inner:'exists','infinite-domain':'Z',sizes:'30,25',intersections:'10',triple:0,universe:'60',predicate:'x^2<10',slope:2,intercept:1,power:2},propositions:{mode:'table',expression:'p∧¬q',premises:'p→q',conclusion:'q',induction:'squares',n:10},boolean:{mode:'minimal',source:'minterms',expression:'(A∨B)∧(¬A∨C)',names:'A,B,C',minterms:'1,3,5,6,7',dontcare:''},graphs:{mode:'summary',edges:'A B\nA C\nB C\nC D\nD E',start:'A',target:'E',directed:'undirected',sequence:'4,3,3,2,2',tree:'{}','count-edges':7,'count-vertices':6,'count-left':3,'count-right':4,'count-leaves':8}};
  const logicPrefix={bases:'base',sets:'set',propositions:'prop',boolean:'bool',graphs:'graph'};
  const logicAction={bases:'logicCalculateBases',sets:'logicCalculateSets',propositions:'logicCalculateProposition',boolean:'logicCalculateBoolean',graphs:'logicCalculateGraph'};
  function logicCase(id,panel,fields,patterns){
    actions.logicOpenPanel(panel);const markup=getElementById('logic-content').innerHTML;
    assert.match(markup,new RegExp(`data-action="${logicAction[panel]}"`));
    for(const [key,value] of Object.entries({...logicDefaults[panel],...fields})){const control=`logic-${logicPrefix[panel]}-${key}`;assert.ok(markup.includes(`id="${control}"`),`Lógica ${id}: ${control}`);getElementById(control).value=String(value);}
    actions[logicAction[panel]]();assert.equal(getElementById('logic-result').classList.contains('tool-error'),false,`Lógica ${id}: ${getElementById('logic-result').textContent}`);
    const html=getElementById('logic-result').innerHTML;for(const pattern of patterns)assert.match(html,pattern,`Lógica ${id}`);logicCovered.add(id);
  }
  const lb=(id,fields,patterns)=>logicCase(id,'bases',fields,patterns);
  const ls=(id,fields,patterns)=>logicCase(id,'sets',fields,patterns);
  const lp=(id,fields,patterns)=>logicCase(id,'propositions',fields,patterns);
  const lk=(id,fields,patterns)=>logicCase(id,'boolean',fields,patterns);
  const lg=(id,fields,patterns)=>logicCase(id,'graphs',fields,patterns);
  lb(1,{},[/10011100/]);lb(2,{a:'10110101',from:2,to:10},[/181/]);lb(3,{a:'A3F',from:16,to:10},[/2623/]);lb(4,{a:'725',from:8,to:2},[/111010101/]);
  lb(5,{mode:'arithmetic',a:'1101',b:'1011',from:2,op:'add'},[/11000/]);lb(6,{mode:'arithmetic',a:'1010',b:'101',from:2,op:'multiply'},[/110010/]);
  ls(7,{a:'1,2,3,4,5',b:'4,5,6,7'},[/1, 2, 3, 4, 5, 6, 7/,/4, 5/,/1, 2, 3, 6, 7/]);
  ls(8,{mode:'count',n:6,m:0},[/subconjuntos de A = 64/]);ls(8,{mode:'count',n:4,m:5},[/\|A×B\| = 20/]);
  lp(9,{expression:'p∧¬q'},[/4 asignaciones/,/<th>p<\/th><th>q<\/th>/]);lp(10,{expression:'(p→q)↔(¬p∨q)'},[/tautology/]);
  lp(11,{mode:'negations'},[/¬\(p∧q\) ⇔ ¬p∨¬q/,/∃x\(x≤2\)/,/doble negación/]);
  ls(12,{mode:'predicate',a:'1,2,3,4',predicate:'x^2<10'},[/∀x P\(x\): falso/,/∃x P\(x\): verdadero/,/contraejemplo: 4/]);
  lk(13,{source:'formula',names:'A,B',expression:'A∧(A∨B)'},[/F = A\./]);lp(14,{expression:'A∧B∨¬A'},[/4 asignaciones/,/contingent/]);
  lg(15,{mode:'counts'},[/2E<\/td><td>14/,/n\(n−1\)\/2<\/td><td>15/]);lg(16,{mode:'counts','count-vertices':15,'count-leaves':8},[/n−1<\/td><td>14/,/2L−1<\/td><td>15/]);
  ls(17,{mode:'relation',a:'1,2,3',pairs:'1,1\n1,2\n2,3'},[/Dominio observado = \{1, 2\}/,/rango = \{1, 2, 3\}/,/Contraejemplo/]);
  lb(18,{a:'0.6875',from:10,to:2},[/0\.1011/]);lb(18,{a:'101.011',from:2,to:10},[/5\.375/]);
  lb(19,{mode:'arithmetic',a:'3B7',b:'1F9',from:16,op:'subtract'},[/1BE/]);lb(20,{mode:'arithmetic',a:'11101',b:'101',from:2,op:'divide'},[/Resultado en base 2: 101;/,/residuo = 100/]);
  const logicParity=[];for(let x=1;x<=4;x++)for(let y=1;y<=4;y++)if((x+y)%2===0)logicParity.push(`${x},${y}`);
  ls(21,{mode:'relation',a:'1,2,3,4',pairs:logicParity.join('\n')},[/Reflexiva: sí; simétrica: sí; transitiva: sí/,/\{1, 3\}/,/\{2, 4\}/]);
  ls(22,{mode:'composition',slope:2,intercept:1,power:2},[/g∘f = \(\(2\)x\+\(1\)\)\^2/,/f∘g = \(2\)x\^2\+\(1\)/,/f⁻¹ = \(x−\(1\)\)\/\(2\)/]);
  ls(23,{mode:'cardinality',sizes:'30,25',intersections:'10',universe:60},[/Unión = 45; complemento = 15/]);
  lp(24,{expression:'((p→q)∧(q→r))→(p→r)'},[/tautology/,/8 asignaciones/]);
  lp(25,{mode:'argument',premises:'p→q\nq→r\n¬r',conclusion:'¬p'},[/Válido/]);
  lp(26,{mode:'induction',induction:'squares',n:10},[/Caso base/,/\(k\+1\)\(k\+2\)\(2k\+3\)\/6/,/385/]);
  lp(27,{mode:'induction',induction:'power2',n:5},[/2\(3m\+1\)/]);
  lk(28,{mode:'karnaugh',minterms:'1,3,5,7'},[/F = C\./,/G1/,/1, 3, 5, 7/,/Celdas/]);
  lk(29,{mode:'karnaugh'},[/AB/,/C/,/G2/]);lk(30,{mode:'karnaugh',source:'maxterms',minterms:'0,2,4'},[/AB/,/C/]);
  lg(31,{},[/estado euleriano: trail/,/no es euleriano cerrado/,/role="img"/]);
  for(const mode of ['bfs','dfs'])lg(32,{mode},[/Orden: \{A, B, C, D, E\}/,/role="img"/]);
  const logicWeightedEdges='A B 4\nA C 2\nB C 1\nB D 5\nC D 8\nC E 10\nD E 2';
  lg(33,{mode:'dijkstra',edges:logicWeightedEdges},[/Distancia mínima = 10/,/A → C → B → D → E/,/role="img"/]);
  const logicGuideTree={value:8,left:{value:3,left:{value:1},right:{value:6,left:{value:4},right:{value:7}}},right:{value:10,right:{value:14,left:{value:13}}}};
  lg(34,{mode:'classifytree',edges:'A B\nA C\nB D\nB E\nC F\nC G',start:'A'},[/altura 2 aristas/,/perfecto: sí/,/role="img"/]);
  lg(34,{mode:'tree',tree:JSON.stringify(logicGuideTree)},[/8, 3, 1, 6, 4, 7, 10, 14, 13/,/1, 3, 4, 6, 7, 8, 10, 13, 14/,/1, 4, 7, 6, 3, 13, 14, 10, 8/,/role="img"/]);
  lb(35,{mode:'twos',a:'-45'},[/11010011/]);lb(35,{mode:'add',a:'100',b:'-45'},[/00110111/,/Desbordamiento: no/]);
  lb(36,{mode:'bits',a:'B7',b:'5C',from:16},[/00010100/,/11111111/,/11101011/,/01001000/]);
  ls(37,{mode:'cardinality',sizes:'50,40,30',intersections:'15,10,12',triple:5,universe:''},[/Unión = 88/]);
  ls(38,{mode:'count',n:4,m:4},[/Relaciones binarias en A = 65536/,/reflexivas = 4096/,/simétricas = 1024/,/equivalencias = 15/]);
  ls(39,{mode:'count',n:4,m:7},[/inyectivas = 840/]);ls(39,{mode:'count',n:5,m:3},[/sobreyectivas = 150/]);
  lp(40,{mode:'proof'},[/supuesto se descarga/,/∨E, 3 y ramas 4–6, 7–9/]);
  for(const domain of ['Z','N'])ls(41,{mode:'integers','infinite-domain':domain},[/∀x∃y/,/∃y∀x/,/x\+y≠0/,/Testigo o contraejemplo/]);
  lp(42,{mode:'induction',induction:'power7',n:5},[/6\(7m\+1\)/]);lp(42,{mode:'induction',induction:'odds',n:5},[/\(k\+1\)²/]);
  lp(43,{mode:'induction',induction:'factorial',n:4},[/24 &gt; 16/,/k\+1≥5&gt;2/]);
  lk(44,{mode:'karnaugh',names:'A,B,C,D',minterms:'0,1,2,5,8,9,10'},[/-0-0/,/-00-/,/0-01/,/G3/]);
  lk(45,{mode:'karnaugh',names:'A,B,C,D',minterms:'1,3,7,11,15',dontcare:'0,2,5'},[/X \(m0\)/,/Celdas \(incluye X\)/]);
  lk(46,{mode:'nand',source:'formula',expression:'(A∨B)∧(¬A∨C)'},[/compuertas = 4/,/Σm = 2, 3, 5, 7/,/role="img"/]);
  lk(46,{mode:'nor',source:'formula',expression:'(A∨B)∧(¬A∨C)'},[/Realización NOR/,/role="img"/]);
  lg(47,{mode:'kruskal',edges:'A B 7\nA D 5\nB C 8\nB D 9\nB E 7\nC E 5\nD E 15\nD F 6\nE F 8\nE G 9\nF G 11'},[/peso total = 39/,/role="img"/]);
  lg(48,{mode:'flow',edges:'s a 10\ns b 5\na b 15\na t 5\nb t 10',start:'s',target:'t',directed:'directed'},[/Flujo máximo = 15/,/corte mínimo = 15/,/arcos inversos/,/role="img"/]);
  lg(49,{mode:'havel',sequence:'4,3,3,2,2'},[/La secuencia es gráfica/]);lg(49,{mode:'counts','count-left':3,'count-right':4},[/m·n<\/td><td>12/]);
  lg(50,{mode:'huffman',sequence:'a 45, b 13, c 12, d 16, e 9, f 5'},[/224/,/role="img"/]);
  assert.deepEqual([...logicCovered].sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i+1));
  getElementById('logic-bool-source').value='minterms';
  getElementById('logic-bool-mode').value='minimal';
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
  actions.closeSubmod();
  actions.openSubmod('logic');
  for (const id of ['logic-bases','logic-sets','logic-propositions','logic-boolean','logic-graphs'])
    assert.match(getElementById('submod-cards').innerHTML,new RegExp(`data-arg="${id}"`));
  actions.launchSubmod('logic-bases');
  for (const [id,value] of Object.entries({'logic-base-mode':'convert','logic-base-a':'156','logic-base-b':'0','logic-base-from':'10','logic-base-to':'2','logic-base-width':'8'}))
    getElementById(id).value=value;
  actions.logicCalculateBases();
  assert.match(getElementById('logic-result').innerHTML,/10011100/);
  getElementById('logic-base-mode').value='arithmetic';
  getElementById('logic-base-op').value='multiply';
  getElementById('logic-base-a').value='1010';
  getElementById('logic-base-b').value='101';
  getElementById('logic-base-from').value='2';
  actions.logicCalculateBases();
  assert.match(getElementById('logic-result').innerHTML,/110010/);
  actions.closeModule('logic');
  actions.launchSubmod('logic-sets');
  for (const [id,value] of Object.entries({'logic-set-mode':'sets','logic-set-a':'1, 2, 3','logic-set-b':'3, 4'}))
    getElementById(id).value=value;
  actions.logicCalculateSets();
  assert.match(getElementById('logic-result').innerHTML,/A∩B = \{3\}/);
  getElementById('logic-set-mode').value='quantified';
  getElementById('logic-set-a').value='a, b';
  getElementById('logic-set-pairs').value='a,a\nb,b';
  getElementById('logic-set-outer').value='forall';
  getElementById('logic-set-inner').value='exists';
  actions.logicCalculateSets();
  assert.match(getElementById('logic-result').innerHTML,/∀x ∃y/);
  getElementById('logic-set-mode').value='integers';
  getElementById('logic-set-infinite-domain').value='N';
  actions.logicCalculateSets();
  assert.match(getElementById('logic-result').innerHTML,/ℕ=\{0,1,2,…\}/);
  assert.match(getElementById('logic-result').innerHTML,/∃x∀y/);
  actions.closeModule('logic');
  actions.launchSubmod('logic-propositions');
  getElementById('logic-prop-mode').value='table';
  getElementById('logic-prop-expression').value='(p→q)↔(¬p∨q)';
  actions.logicCalculateProposition();
  assert.match(getElementById('logic-result').innerHTML,/tautology/);
  getElementById('logic-prop-mode').value='forms';
  getElementById('logic-prop-expression').value='p→q';
  actions.logicCalculateProposition();
  assert.match(getElementById('logic-result').innerHTML,/FNC/);
  getElementById('logic-prop-mode').value='induction';
  getElementById('logic-prop-induction').value='factorial';
  getElementById('logic-prop-n').value='4';
  actions.logicCalculateProposition();
  assert.match(getElementById('logic-result').innerHTML,/4!=24/);
  assert.match(getElementById('logic-result').innerHTML,/k\+1≥5/);
  getElementById('logic-prop-mode').value='proof';
  actions.logicCalculateProposition();
  assert.match(getElementById('logic-result').innerHTML,/Prueba formal guiada/);
  assert.match(getElementById('logic-result').innerHTML,/ramas 4–6, 7–9/);
  actions.closeModule('logic');
  actions.launchSubmod('logic-boolean');
  getElementById('logic-bool-names').value='A, B, C';
  getElementById('logic-bool-minterms').value='1, 3, 5, 7';
  getElementById('logic-bool-dontcare').value='';
  actions.logicCalculateBoolean();
  assert.match(getElementById('logic-result').innerHTML,/F = C/);
  getElementById('logic-bool-mode').value='karnaugh';
  actions.logicCalculateBoolean();
  assert.match(getElementById('logic-result').innerHTML,/código Gray/);
  actions.closeModule('logic');
  actions.launchSubmod('logic-graphs');
  for (const [id,value] of Object.entries({'logic-graph-mode':'counts','logic-graph-count-edges':'7',
    'logic-graph-count-vertices':'6','logic-graph-count-left':'3','logic-graph-count-right':'4',
    'logic-graph-count-leaves':'8'})) getElementById(id).value=value;
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Suma de grados con 7 aristas/);
  assert.match(getElementById('logic-result').innerHTML,/Aristas de K3,4/);
  assert.match(getElementById('logic-result').innerHTML,/binario lleno/);
  for (const [id,value] of Object.entries({'logic-graph-mode':'dijkstra','logic-graph-edges':'A B 4\nA C 2\nB C 1\nB D 5\nC D 8\nC E 10\nD E 2','logic-graph-start':'A','logic-graph-target':'E','logic-graph-directed':'undirected'}))
    getElementById(id).value=value;
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Distancia mínima = 10/);
  assert.match(getElementById('logic-result').innerHTML,/Dijkstra: vértices fijados y camino mínimo/);
  assert.match(getElementById('logic-result').innerHTML,/<svg /);
  getElementById('logic-graph-mode').value='bfs';
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Vértice visitado/);
  getElementById('logic-graph-mode').value='flow';
  getElementById('logic-graph-edges').value='s a 10\ns b 5\na b 15\na t 5\nb t 10';
  getElementById('logic-graph-start').value='s';
  getElementById('logic-graph-target').value='t';
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Flujo máximo = 15/);
  assert.match(getElementById('logic-result').innerHTML,/Capacidad residual final/);
  assert.match(getElementById('logic-result').innerHTML,/Flujo máximo: lado alcanzable y corte mínimo/);
  getElementById('logic-graph-mode').value='matching';
  getElementById('logic-graph-left').value='A, B';
  getElementById('logic-graph-right').value='X, Y';
  getElementById('logic-graph-edges').value='A X\nB X\nB Y';
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Tamaño máximo = 2/);
  assert.match(getElementById('logic-result').innerHTML,/Aristas resaltadas: parejas elegidas/);
  getElementById('logic-graph-mode').value='petri';
  getElementById('logic-graph-marking').value='1, 0';
  getElementById('logic-graph-transitions').value='[{"name":"mover","input":[1,0],"output":[0,1]}]';
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Estados alcanzados: 2/);
  assert.match(getElementById('logic-result').innerHTML,/Red de alcanzabilidad de Petri/);
  getElementById('logic-graph-mode').value='tree';
  getElementById('logic-graph-tree').value='{"value":8,"left":{"value":3},"right":{"value":10}}';
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Árbol binario/);
  getElementById('logic-graph-mode').value='huffman';
  getElementById('logic-graph-sequence').value='a 45, b 13, c 12, d 16, e 9, f 5';
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Costo total = 224/);
  assert.match(getElementById('logic-result').innerHTML,/Árbol de Huffman/);
  actions.closeModule('logic');
  actions.closeSubmod();
  actions.openSubmod('al');
  assert.match(getElementById('submod-back').innerHTML, /Matemáticas/);
  const algebraCards=getElementById('submod-cards').innerHTML;
  assert.match(algebraCards,/Vectores y matrices/);
  assert.match(algebraCards,/Funciones y relaciones/);
  for(const id of ['vectors','geom','mat','linear','ineq','fn','seq'])
    assert.match(algebraCards,new RegExp(`data-arg="${id}"`));
  getElementById('geom-mode').value = 'linePoints';
  actions.launchSubmod('geom');
  assert.equal(getElementById('geom-app').classList.contains('visible'), true);
  assert.match(getElementById('geom-fields').innerHTML, /Primer punto P/);
  getElementById('geom-p').value='1, 2, 3';
  getElementById('geom-q').value='4, 0, 5';
  actions.geomCalculate();
  assert.match(getElementById('geom-result').innerHTML, /y = 2 − 2t/);
  getElementById('geom-mode').value='planePoint';
  actions.geomSelect();
  getElementById('geom-p').value='1, 2, 3';
  getElementById('geom-n').value='2, -1, 4';
  actions.geomCalculate();
  assert.match(getElementById('geom-result').innerHTML, /2x − y \+ 4z = 12/);
  getElementById('geom-mode').value = 'linePlane';
  actions.geomSelect();
  for (const [id, value] of Object.entries({p:'1, 0, 2',d:'1, 1, -1',n:'1, 2, 1',c:'7'}))
    getElementById(`geom-${id}`).value = value;
  actions.geomCalculate();
  assert.match(getElementById('geom-result').innerHTML, /\(3, 2, 0\)/);
  getElementById('geom-d').value = '0, 0, 0';
  actions.geomCalculate();
  assert.match(getElementById('geom-result').textContent, /dirección.*cero/);
  getElementById('geom-mode').value='distance';
  actions.geomSelect();
  for (const [id, value] of Object.entries({p:'1, 2, 3',n:'2, -1, 2',c:'4'}))
    getElementById(`geom-${id}`).value=value;
  actions.geomCalculate();
  assert.match(getElementById('geom-result').innerHTML, /2\/3/);
  getElementById('geom-mode').value='angle';
  actions.geomSelect();
  for (const [id, value] of Object.entries({n1:'1, 1, 1',c1:'3',n2:'2, -1, 1',c2:'5'}))
    getElementById(`geom-${id}`).value=value;
  actions.geomCalculate();
  assert.match(getElementById('geom-result').innerHTML, /Ángulo entre planos/);
  getElementById('geom-mode').value='planes';
  actions.geomSelect();
  for (const [id, value] of Object.entries({n1:'1, 1, 1',c1:'3',n2:'2, -1, 1',c2:'0'}))
    getElementById(`geom-${id}`).value=value;
  actions.geomCalculate();
  assert.match(getElementById('geom-result').innerHTML, /Recta de intersección/);
  actions.closeModule('geom');
  assert.equal(getElementById('geom-app').classList.contains('visible'), false);
  getElementById('linear-mode').value='gram';
  actions.launchSubmod('linear');
  assert.equal(getElementById('linear-app').classList.contains('visible'),true);
  assert.match(getElementById('linear-fields').innerHTML,/Vectores, uno por línea/);
  getElementById('linear-vectors').value='1, 1, 0\n1, 0, 1';
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/base ortonormal/);
  getElementById('linear-mode').value='coordinates';
  actions.linearSelect();
  getElementById('linear-basis').value='1, 1\n1, -1';
  getElementById('linear-target').value='3, 1';
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/\[2, 1\]/);
  getElementById('linear-mode').value='change';
  actions.linearSelect();
  getElementById('linear-from').value='1, 2\n0, 1';
  getElementById('linear-to').value='1, 1\n2, 3';
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/Matriz de transición/);
  getElementById('linear-mode').value='projection';
  actions.linearSelect();
  getElementById('linear-target').value='1, 2, 3';
  getElementById('linear-vectors').value='1, 0, 1\n0, 1, 1';
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/Proyección = \[1, 2, 3\]/);
  getElementById('linear-mode').value='transform';
  actions.linearSelect();
  getElementById('linear-matrix').value='1, 0, 3\n2, 1, -1';
  getElementById('linear-target').value='2, -1, 4';
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/\[14, -1\]/);
  getElementById('linear-mode').value='representation';
  actions.linearSelect();
  getElementById('linear-matrix').value='2, 1\n1, -1';
  getElementById('linear-from').value='1, 1\n0, 1';
  getElementById('linear-to').value='1, 0\n0, 1';
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/\[3, 1\]/);
  getElementById('linear-mode').value='diagonal';
  actions.linearSelect();
  getElementById('linear-matrix').value='3, 1\n0, 2';
  getElementById('linear-exponent').value='5';
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/211/);
  getElementById('linear-matrix').value='1, 1\n0, 1';
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/No se presenta una potencia/);
  getElementById('linear-mode').value='affine';
  actions.linearSelect();
  for(const [key,value] of Object.entries({a0:'1,1,1\n1,2,3\n1,3,0',at:'0,0,0\n0,0,0\n0,0,1',b0:'1,2,0',bu:'0,0,1'})) getElementById(`linear-${key}`).value=value;
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/u = 3/);
  getElementById('linear-mode').value='similarity';
  actions.linearSelect();
  getElementById('linear-first').value='1,2\n0,3';
  getElementById('linear-second').value='3,0\n0,1';
  actions.linearCalculate();
  assert.match(getElementById('linear-result').innerHTML,/AP−PB/);
  // Auditoría exacta de los 50 ejercicios de Álgebra Lineal.
  const algebraCovered=new Set();
  function algebraLinear(id,mode,input,texts) {
    assert.ok(html.includes(`<option value="${mode}">`),`Álgebra ${id}: menú ${mode}`);
    getElementById('linear-mode').value=mode;actions.linearSelect();
    for(const [key,value]of Object.entries(input)){
      assert.ok(getElementById('linear-fields').innerHTML.includes(`id="linear-${key}"`),`Álgebra ${id}: ${key}`);
      getElementById(`linear-${key}`).value=String(value);
    }
    const target=getElementById('linear-result');target.innerHTML='';actions.linearCalculate();
    assert.equal(target.classList.contains('tool-error'),false,`Álgebra ${id}: ${target.textContent}`);
    for(const text of texts)assert.ok(target.innerHTML.includes(text),`Álgebra ${id}: ${text}\n${target.innerHTML}`);
    algebraCovered.add(id);return target.innerHTML;
  }
  function algebraGeometry(id,mode,input,texts) {
    getElementById('geom-mode').value=mode;actions.geomSelect();
    for(const [key,value]of Object.entries(input)){
      assert.ok(getElementById('geom-fields').innerHTML.includes(`id="geom-${key}"`));getElementById(`geom-${key}`).value=String(value);
    }
    const target=getElementById('geom-result');target.innerHTML='';actions.geomCalculate();
    assert.equal(target.classList.contains('tool-error'),false,`Álgebra ${id}: ${target.textContent}`);
    for(const text of texts)assert.ok(target.innerHTML.includes(text),`Álgebra ${id}: ${text}\n${target.innerHTML}`);
    algebraCovered.add(id);return target.innerHTML;
  }
  function algebraGrid(prefix,values,container) {
    values.forEach((row,i)=>row.forEach((value,j)=>{
      const key=`${prefix}-${i}-${j}`;assert.ok(getElementById(container).innerHTML.includes(`id="${key}"`),`Campo ${key}`);getElementById(key).value=String(value);
    }));
  }
  function algebraMatrixRows(output,expected) {
    // Las filas numéricas renderizadas se comparan independientemente del espaciado.
    const rows=[...output.matchAll(/\[\s*([^\[\]<>]+)\s*\]/g)].map(m=>m[1].trim().split(/[,\s]+/).map(Number));
    for(const row of expected)assert.ok(rows.some(actual=>actual.length===row.length&&actual.every((x,i)=>Number.isFinite(x)&&Math.abs(x-row[i])<2e-3)),`Fila ${row}\n${output}`);
  }
  function algebraDet(id,A,action,expected,texts) {
    getElementById('mat-dn').value=String(A.length);actions.matBuildDet();algebraGrid('md',A,'mat-det-grid');actions[action]();
    const output=getElementById('mat-res-det').innerHTML;
    for(const text of texts)assert.ok(output.includes(text),`Álgebra ${id}: ${text}\n${output}`);
    if(Array.isArray(expected))algebraMatrixRows(output,expected);else assert.ok(output.includes(`>${expected}<`),`Álgebra ${id}: determinante`);
    algebraCovered.add(id);return output;
  }
  function algebraSystem(id,A,b,method,texts) {
    getElementById('mat-sm').value=String(A.length);getElementById('mat-sn').value=String(A[0].length);actions.matBuildSis();
    algebraGrid('ms',A.map((row,i)=>[...row,b[i]]),'mat-sis-grid');getElementById('mat-smet').value=method;actions.matCalcSis();
    const output=getElementById('mat-res-sis').innerHTML;
    for(const text of texts)assert.ok(output.includes(text),`Álgebra ${id}: ${text}\n${output}`);
    assert.doesNotMatch(output,/NaN|Sin solución/);algebraCovered.add(id);return output;
  }
  function algebraSpaces(id,A,texts) {
    getElementById('mat-space-m').value=String(A.length);getElementById('mat-space-n').value=String(A[0].length);actions.matBuildSpace();
    algebraGrid('sp',A,'mat-space-grid');actions.matCalcSpace();const output=getElementById('mat-res-space').innerHTML;
    for(const text of texts)assert.ok(output.includes(text),`Álgebra ${id}: ${text}\n${output}`);
    algebraCovered.add(id);return output;
  }
  function algebraEigen(id,A,values) {
    getElementById('mat-en').value=String(A.length);actions.matBuildEig();algebraGrid('me',A,'mat-eig-grid');actions.matCalcEig();
    const output=getElementById('mat-res-eig').innerHTML,actual=[...output.matchAll(/class="mat-eigen-val">([\d.\-]+)/g)].map(m=>Number(m[1]));
    assert.deepEqual(actual,values);assert.match(output,/\|\|Av − λv\|\|/);assert.doesNotMatch(output,/sin convergencia|NaN/);
    algebraCovered.add(id);return output;
  }
  function algebraOps(id,A,B,operation,expected) {
    getElementById('mat-op').value=operation;actions.matOpsReset();
    for(const [index,M]of [A,B].entries()){
      actions.matOpsSizeChange(index,'rows',String(M.length));actions.matOpsSizeChange(index,'cols',String(M[0].length));
    }
    algebraGrid('mo-0',A,'mat-ops-grids');algebraGrid('mo-1',B,'mat-ops-grids');actions.matCalcOps();
    const output=getElementById('mat-res-ops').innerHTML;algebraMatrixRows(output,expected);assert.match(output,/mat-step/);algebraCovered.add(id);
  }
  const algebraUV={u:'2,-1,3',v:'1,4,-2',a:3,b:-2,w:''};
  algebraLinear(1,'vectors',algebraUV,['u+v = [3, 3, 1]','au+bv = [4, -11, 13]','u·v = -8']);
  algebraLinear(2,'vectors',algebraUV,['u×v = [-10, 7, 9]','por cofactores']);
  algebraGeometry(3,'linePoints',{p:'1,2,3',q:'4,0,5'},['(3, -2, 2)','x = 1 + 3t','y = 2 − 2t','z = 3 + 2t']);
  algebraGeometry(4,'planePoint',{p:'1,2,3',n:'2,-1,4'},['2x − y + 4z = 12','n·(X − P) = 0']);
  algebraOps(5,[[1,2],[3,4]],[[0,1],[-1,2]],'add',[[1,3],[2,6]]);
  algebraOps(5,[[1,2],[3,4]],[[0,1],[-1,2]],'mul',[[-2,5],[-4,11]]);
  algebraOps(5,[[0,1],[-1,2]],[[1,2],[3,4]],'mul',[[3,4],[5,6]]);
  algebraDet(6,[[2,1,0],[1,3,1],[0,1,4]],'matCalcDet',18,['Expansión por cofactores','det M']);
  algebraDet(7,[[2,1],[5,3]],'matCalcInv',[[3,-1],[-5,2]],['A⁻¹','[I | A⁻¹]','residuo máximo']);
  algebraSystem(8,[[2,1],[1,-1]],[5,1],'gauss',['x<sub>1</sub> = 2','x<sub>2</sub> = 1','Gauss-Jordan — pasos']);
  algebraSystem(9,[[1,1,1],[2,-1,1],[1,2,-1]],[6,3,2],'gauss',['x<sub>1</sub> = 1','x<sub>2</sub> = 2','x<sub>3</sub> = 3']);
  algebraSystem(10,[[3,-2],[1,5]],[4,7],'cramer',['det(A) = 17','x<sub>1</sub> = 2','x<sub>2</sub> = 1','x1=det(A1)/det(A)']);
  algebraSpaces(11,[[1,2,3],[2,4,6],[1,0,1]],['rango(A) = 2','nulidad(A) = 1','Gauss-Jordan — pasos']);
  algebraLinear(12,'span',{vectors:'1,2\n3,6',target:'0,0'},['rango(G) = 1','Generadores dependientes','no forman base']);
  algebraLinear(13,'span',{vectors:'1,0,1\n0,1,1\n1,1,0',target:'0,0,0'},['rango(G) = 3','Generadores independientes','forman base del espacio ambiente']);
  algebraLinear(14,'formulas',{expressions:'x+y\nx-y',variables:'x,y',target:'0,0'},['T(x) = Ax = [0, 0]','rango(A) = 2; nulidad(A) = 0','conjunto vacío (núcleo {0})']);
  algebraLinear(15,'formulas',{expressions:'x+2*y\ny-z\n3*z',variables:'x,y,z',target:'1,2,3'},['T(x) = Ax = [5, -1, 9]','rango(A) = 3','Base de la imagen']);
  algebraEigen(16,[[4,1],[2,3]],[5,2]);
  algebraLinear(17,'vectors',{u:'3,4,12',v:'0,0,0',a:1,b:1,w:''},['||u|| = 13','unitario = [0.231, 0.308, 0.923]','unitario=u/||u||']);
  algebraGeometry(18,'distance',{p:'1,2,3',n:'2,-1,2',c:4},['2/3','||n|| = 3','d = |n·P − c|']);
  algebraGeometry(19,'linePlane',{p:'1,0,2',d:'1,1,-1',n:'1,2,1',c:7},['t = 2','(3, 2, 0)','t = (c − n·P)']);
  algebraGeometry(20,'angle',{n1:'1,1,1',c1:3,n2:'2,-1,1',c2:5},['cos θ = 0.471405','θ = 61.874494°','ángulo agudo']);
  algebraOps(21,[[1,2,0],[0,1,3],[2,0,1]],[[1,0,2],[3,1,0],[0,2,1]],'mul',[[7,2,2],[3,7,3],[2,2,5]]);
  algebraDet(22,[[1,2,0,1],[2,1,3,0],[0,1,1,2],[1,0,2,1]],'matCalcDet',-8,['Expansión por cofactores','j=1','j=4']);
  algebraDet(23,[[1,2,3],[0,1,4],[5,6,0]],'matCalcInv',[[-24,18,5],[20,-15,-4],[-5,4,1]],['[I | A⁻¹]','Gauss-Jordan','residuo máximo']);
  algebraLinear(24,'affine',{a0:'1,1,1\n1,2,3\n1,3,0',at:'0,0,0\n0,0,0\n0,0,1',b0:'1,2,0',bu:'0,0,1'},['t = 5','u = 3','rango(A) = 2','para otros u, incompatible','fuera de los valores críticos hay solución única']);
  algebraSystem(25,[[1,2,-1],[2,4,-2],[1,1,1]],[0,0,0],'gauss',['Infinitas soluciones','[-3, 2, 1]','x = [0, 0, 0]']);
  algebraLinear(26,'subspace',{matrix:'1,1,-1',rhs:'0'},['Subespacio: demostración y base','el cero pertenece','cierre bajo suma','cierre bajo escalares','[-1, 1, 0]','[1, 0, 1]','dimensión = 2']);
  algebraLinear(27,'span',{vectors:'1,2,3\n0,1,2',target:'4,5,6'},['El objetivo pertenece','coeficientes c = [4, -3]','Gc=v']);
  algebraSpaces(28,[[1,2,0,1],[2,4,1,3],[3,6,1,4]],['rango(A) = 2; nulidad(A) = 2','Columnas pivote originales: 1, 3','[1, 2, 3]','[0, 1, 1]']);
  algebraLinear(29,'coordinates',{basis:'1,1\n1,-1',target:'3,1'},['[v]ᵦ = [2, 1]','Resolver B·c = v']);
  algebraLinear(30,'gram',{vectors:'1,1,0\n1,0,1'},['[0.5, -0.5, 1]','base ortonormal','Rango = 2','Σ proy anteriores']);
  algebraSpaces(31,[[1,1,0],[0,1,1]],['rango(A) = 2; nulidad(A) = 1','[1, -1, 1]','Base de la imagen']);
  const represented=algebraLinear(32,'representationformulas',{expressions:'2*x+y\nx-y\n3*y',variables:'x,y',from:'1,1\n0,1',to:'1,0,0\n0,1,0\n0,0,1'},['C⁻¹ A B','[T]ᶜᵦ']);algebraMatrixRows(represented,[[3,1],[0,-1],[3,3]]);
  algebraEigen(33,[[2,0,0],[0,3,4],[0,4,9]],[11,2,1]);
  const diag34=algebraLinear(34,'diagonal',{matrix:'1,2\n2,1',exponent:0},['AP − PD','P =','D =','ker(A−λI)']);algebraMatrixRows(diag34,[[3,0],[0,-1]]);
  const diag35=algebraLinear(35,'diagonal',{matrix:'4,1,1\n1,4,1\n1,1,4',exponent:0},['AP − PD','P =','D =']);algebraMatrixRows(diag35,[[6,0,0],[0,3,0],[0,0,3]]);
  const diag36=algebraLinear(36,'orthogonal',{matrix:'2,2\n2,-1'},['PᵀP=I','PᵀAP=D','residuo PᵀP−I','columnas ortonormales']);algebraMatrixRows(diag36,[[3,0],[0,-2]]);
  const pow37=algebraLinear(37,'diagonal',{matrix:'3,1\n0,2',exponent:5},['A^5','Aᵏ = P Dᵏ P⁻¹']);algebraMatrixRows(pow37,[[243,211],[0,32]]);
  const change38=algebraLinear(38,'change',{from:'1,2\n0,1',to:'1,1\n2,3'},['[v]₂ = B₂⁻¹ B₁ [v]₁','B₂P − B₁']);algebraMatrixRows(change38,[[-1,-2],[1,1]]);
  const compose39=algebraLinear(39,'rotation',{angle:45,exponent:8,axis:'x'},['S∘T = ST','T^8','derecha a izquierda','ángulo en grados']);algebraMatrixRows(compose39,[[Math.SQRT1_2,-Math.SQRT1_2],[-Math.SQRT1_2,-Math.SQRT1_2],[1,0],[0,1]]);
  algebraSpaces(40,[[1,2,0,1],[0,1,1,2],[1,3,1,3]],['rango(A) = 2; nulidad(A) = 2','[2, -1, 1, 0]','[3, -2, 0, 1]','Base de la imagen']);
  algebraSystem(41,[[1,1,1,1],[1,-1,2,1],[2,1,-1,3],[1,2,1,-1]],[2,6,-1,1],'gauss',['x<sub>1</sub> = 1','x<sub>2</sub> = -1','x<sub>3</sub> = 2','x<sub>4</sub> = 0']);
  algebraSystem(42,[[1,2,1],[2,-1,3],[3,1,-1]],[4,-3,6],'cramer',['x<sub>1</sub> = 1','x<sub>2</sub> = 2','x<sub>3</sub> = -1','x3=det(A3)/det(A)']);
  algebraLinear(43,'detproperties',{determinant:5,order:3,scalar:2,exponent:3},['det(kA) = 40','det(A⁻¹) = 0.2','det(A^p) = 125','det(Aᵀ) = 5','det(adj A) = 25','k^n det A']);
  algebraLinear(44,'vectors',{u:'1,2,0',v:'0,1,3',a:1,b:1,w:'2,0,1'},['Producto triple orientado = 13','volumen = 13','volumen=|(u×v)·w|']);
  algebraLinear(45,'projection',{target:'1,2,3',vectors:'1,0,1\n0,1,1'},['Proyección = [1, 2, 3]','Distancia al subespacio = 0','Σ(b·qᵢ)qᵢ']);
  algebraLinear(46,'repeated',{a:2,d:3,c:1},['k = -0.25','valor propio doble λ = 2.5','multiplicidad geométrica = 1','Δ=(a−d)²+4ck=0']);
  algebraLinear(47,'similarity',{first:'1,2\n0,3',second:'3,0\n0,1'},['B=P⁻¹AP','AP=PB','P =','P⁻¹ =','Residuo máximo de AP−PB = 0']);
  algebraLinear(48,'images',{images:'1,2\n0,1\n3,-1',target:'2,-1,4'},['T(x) = Ax = [14, -1]','rango(A) = 2; nulidad(A) = 1','[-3, 7, 1]','Base de la imagen']);
  algebraGeometry(49,'planes',{n1:'1,1,1',c1:3,n2:'2,-1,1',c2:0},['Recta de intersección','d = (2, 1, -3)','n₁ × n₂']);
  const eig50=algebraEigen(50,[[0,1,0],[0,0,1],[6,-11,6]],[3,2,1]);assert.match(eig50,/\[-6, 11, -6, 1\]/);assert.doesNotMatch(eig50,/solo se calcula el par dominante/);
  assert.deepEqual([...algebraCovered].sort((a,b)=>a-b),Array.from({length:50},(_,i)=>i+1));
  // Entradas inválidas no se convierten en ceros y escalar cero es válido.
  getElementById('md-0-0').value='abc';actions.matCalcDet();assert.match(getElementById('mat-res-det').innerHTML,/Entrada inválida/);
  getElementById('mat-op').value='sca';actions.matOpsRebuild();actions.matOpsSizeChange(0,'rows','2');actions.matOpsSizeChange(0,'cols','2');algebraGrid('mo-0',[[1,2],[3,4]],'mat-ops-grids');actions.matOpsSetScalar('0');actions.matCalcOps();algebraMatrixRows(getElementById('mat-res-ops').innerHTML,[[0,0]]);

  getElementById('mat-op').value='add';actions.matOpsReset();
  getElementById('mat-sm').value='2';getElementById('mat-sn').value='2';actions.matBuildSis();
  actions.closeModule('linear');
  assert.equal(getElementById('linear-app').classList.contains('visible'),false);
  actions.closeSubmod();
  assert.match(getElementById('submod-cards').innerHTML,/Estadística/);
  assert.match(getElementById('submod-back').innerHTML, /Inicio/);
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
  actions.openSubmod('math');

  assert.equal(getElementById('submod-screen').classList.contains('visible'), true);
  actions.closeSubmod();
  assert.equal(getElementById('submod-title').innerHTML.includes('Matemáticas'), true);
  actions.launchSubmod('stats');
  assert.equal(getElementById('stats-app').classList.contains('visible'), true);
  getElementById('stats-values').value = '2, 4, 4, 6, 9';
  actions.statsAnalyze();
  assert.match(getElementById('stats-result').innerHTML, /Mediana/);
  assert.match(getElementById('stats-result').innerHTML, /Varianza muestral/);
  assert.match(getElementById('stats-result').innerHTML, /Diagrama de caja/);
  actions.closeModule('stats');
  assert.equal(getElementById('submod-title').innerHTML.includes('Matemáticas'), true);
  history.forward();
  assert.equal(getElementById('stats-app').classList.contains('visible'), true);
  history.back();
  actions.openSubmod('prob');
  assert.match(getElementById('submod-back').innerHTML, /Matemáticas/);
  for (const id of ['prob-combinations','prob-coin','prob-dice'])
    assert.match(getElementById('submod-cards').innerHTML, new RegExp(`data-arg="${id}"`));
  actions.launchSubmod('prob-combinations');
  getElementById('prob-combinations-n').value = '10';
  getElementById('prob-combinations-k').value = '3';
  actions.probCalculateCombinations();
  assert.match(getElementById('prob-combinations-result').innerHTML, /120/);
  actions.closeModule('prob');
  actions.launchSubmod('prob-coin');
  assert.equal(getElementById('prob-app').classList.contains('visible'), true);
  assert.equal(getElementById('prob-coin-card').hidden, false);
  assert.equal(getElementById('prob-dice-card').hidden, true);
  getElementById('prob-coin-n').value = '4';
  getElementById('prob-coin-p').value = '0.5';
  getElementById('prob-coin-k').value = '2';
  actions.probCalculateCoin();
  assert.match(getElementById('prob-coin-result').innerHTML, /37\.5 %/);
  actions.closeModule('prob');
  assert.match(getElementById('submod-title').innerHTML, /Probabilidad/);
  actions.launchSubmod('prob-dice');
  assert.equal(getElementById('prob-dice-card').hidden, false);
  getElementById('prob-dice-n').value = '2';
  getElementById('prob-dice-sum').value = '7';
  actions.probCalculateDice();
  assert.match(getElementById('prob-dice-result').innerHTML, /Casos favorables/);
  actions.closeModule('prob');
  actions.closeSubmod();
  actions.openSubmod('exp');
  for (const id of ['exp-dice','exp-coin','exp-pi'])
    assert.match(getElementById('submod-cards').innerHTML, new RegExp(`data-arg="${id}"`));
  actions.launchSubmod('exp-pi');
  assert.equal(getElementById('exp-app').classList.contains('visible'), true);
  assert.equal(getElementById('exp-pi-card').hidden, false);
  getElementById('exp-pi-digits').value = '10';
  actions.expCalculatePi();
  assert.match(getElementById('exp-pi-result').innerHTML, /3\.1415926535/);
  actions.closeModule('exp');
  actions.launchSubmod('exp-dice');
  getElementById('exp-dice-count').value = '20';
  actions.expRollDice();
  assert.match(getElementById('exp-dice-result').innerHTML, /20 lanzamientos/);
  actions.closeModule('exp');
  actions.launchSubmod('exp-coin');
  getElementById('exp-coin-count').value = '20';
  actions.expFlipCoins();
  assert.match(getElementById('exp-coin-result').innerHTML, /Cara/);
  actions.closeModule('exp');
  actions.closeSubmod();
  actions.closeSubmod();
  assert.equal(getElementById('launcher').style.display, 'flex');
  history.forward();
  assert.equal(getElementById('submod-title').innerHTML.includes('Matemáticas'), true);
  assert.equal(getElementById('launcher').style.display, 'none');
  history.back();
  actions.openSubmod('math');
  actions.openSubmod('al');
  const openMatrix={dataset:{action:'launchSubmod',arg:'mat'},closest(){return this;}};
  delegatedEvents.get('click')({type:'click',target:openMatrix});
  assert.equal(actions.matDet, undefined);
  assert.equal(getElementById('mat-app').classList.contains('visible'), true);
  assert.equal(getElementById('submod-screen').classList.contains('visible'), false);

  for (const [id, value] of Object.entries({
    'mo-0-0-0': '1', 'mo-0-0-1': '2', 'mo-0-1-0': '3', 'mo-0-1-1': '4',
    'mo-1-0-0': '5', 'mo-1-0-1': '6', 'mo-1-1-0': '7', 'mo-1-1-1': '8',
  })) getElementById(id).value = value;
  actions.matCalcOps();
  assert.match(getElementById('mat-res-ops').innerHTML, /A \+ B/);
  assert.match(getElementById('mat-res-ops').innerHTML, /\[\s+6\s+8\s+\]/);

  getElementById('mat-op').value = 'sca';
  actions.matOpsRebuild();
  actions.matOpsSetScalar('3');
  actions.matCalcOps();
  assert.match(getElementById('mat-res-ops').innerHTML, /3 × A/);
  assert.match(getElementById('mat-res-ops').innerHTML, /\[\s+3\s+6\s+\]/);

  getElementById('mat-dn').value = '2';
  getElementById('md-0-0').value = '1';
  getElementById('md-0-1').value = '2';
  getElementById('md-1-0').value = '3';
  getElementById('md-1-1').value = '4';
  actions.matCalcDet();
  assert.match(getElementById('mat-res-det').innerHTML, /mat-res-val[^>]*>-2</);

  actions.matCalcInv();
  assert.match(getElementById('mat-res-det').innerHTML, /A⁻¹/);

  getElementById('mat-sn').value = '2';
  getElementById('mat-smet').value = 'cramer';
  for (const [id, value] of Object.entries({
    'ms-0-0': '2', 'ms-0-1': '1', 'ms-0-2': '5',
    'ms-1-0': '1', 'ms-1-1': '-1', 'ms-1-2': '1',
  })) getElementById(id).value = value;
  actions.matCalcSis();
  assert.match(getElementById('mat-res-sis').innerHTML, /x<sub>1<\/sub> = 2/);
  assert.match(getElementById('mat-res-sis').innerHTML, /x<sub>2<\/sub> = 1/);

  actions.ineqSetType('quad');
  getElementById('iq-a').value = '1';
  getElementById('iq-b').value = '-3';
  getElementById('iq-c').value = '2';
  getElementById('iq-sym').textContent = '<';
  actions.ineqSolveQuad();
  assert.match(getElementById('ineq-res').innerHTML, /Solución: <strong>\(1, 2\)<\/strong>/);

  actions.ineqSetType('abs');
  getElementById('iq-a').value = '2';
  getElementById('iq-b').value = '-1';
  getElementById('iq-c').value = '5';
  getElementById('iq-sym').textContent = '<';
  actions.ineqSolveAbs();
  assert.match(getElementById('ineq-res').innerHTML, /Solución: <strong>\(-2, 3\)<\/strong>/);

  actions.fnSetType('racional');
  getElementById('fn-num').value = 'x^2-1';
  getElementById('fn-den').value = 'x-2';
  actions.fnAnalyze();
  assert.match(getElementById('fn-result').innerHTML, /x = 2 excluido/);

  getElementById('pa-a1').value = '2';
  getElementById('pa-d').value = '3';
  getElementById('pa-n').value = '4';
  actions.seqAnalyzePA();
  assert.match(getElementById('seq-result').innerHTML, /S<sub>4<\/sub>/);

  getElementById('pg-a1').value = '3';
  getElementById('pg-r').value = '2';
  getElementById('pg-n').value = '4';
  actions.seqAnalyzePG();
  assert.match(getElementById('seq-result').innerHTML, /S<sub>4<\/sub>/);

  getElementById('seq-expr').value='(3n+1)/(n+5)';
  getElementById('seq-n').value='5';
  actions.seqPreviewExpression();
  assert.match(getElementById('seq-preview').textContent,/n es entero positivo/);
  actions.seqAnalyzeTerminos();
  assert.match(getElementById('seq-result').innerHTML,/Límite demostrado/);
  assert.match(getElementById('seq-result').innerHTML,/coeficientes principales/);
  getElementById('seq-expr').value='(2n²−n)/(n²+4)';
  actions.seqAnalyzeTerminos();
  assert.match(getElementById('seq-result').innerHTML,/coeficientes principales, 2\/1 = 2/);
  getElementById('seq-expr').value='(1+2/n)^n';
  actions.seqAnalyzeTerminos();
  assert.match(getElementById('seq-result').innerHTML,/e\^\(2\)/);
  getElementById('seq-expr').value='(1+1/(2n))^(3n)';
  actions.seqAnalyzeTerminos();
  assert.match(getElementById('seq-result').innerHTML,/e\^\(1.5\)/);
  getElementById('seq-expr').value='(2n+cos(n))/(n+1)';
  actions.seqAnalyzeTerminos();
  assert.match(getElementById('seq-result').innerHTML,/teorema del encaje/);
  assert.match(getElementById('seq-result').innerHTML,/Límite demostrado/);
  getElementById('seq-expr').value='sin(n)/n';
  actions.seqAnalyzeTerminos();
  assert.match(getElementById('seq-result').innerHTML,/No demostrado/);
  getElementById('seq-expr').value='globalThis.pwned=1';
  actions.seqAnalyzeTerminos();
  assert.match(getElementById('seq-result').innerHTML,/Expresión no admitida/);
  getElementById('seq-expr').value='(n-1)/(n-1)';
  actions.seqAnalyzeTerminos();
  assert.match(getElementById('seq-result').innerHTML,/no definido/);
  assert.match(getElementById('seq-result').innerHTML,/Límite demostrado/);

  actions.seqSetMode('rec');
  getElementById('seq-rec-c').value='2';
  getElementById('seq-rec-a1').value='1';
  getElementById('seq-rec-n').value='6';
  actions.seqAnalyzeRadical();
  assert.match(getElementById('seq-result').innerHTML,/Límite demostrado/);
  assert.match(getElementById('seq-result').innerHTML,/convergencia monótona/);
  assert.match(getElementById('seq-result').innerHTML,/≈ 2/);
  getElementById('seq-rec-c').value='0';
  actions.seqAnalyzeRadical();
  assert.match(getElementById('seq-result').innerHTML,/Usa c en/);
  actions.seqSetMode('terminos');

  getElementById('pg-a1').value='2';
  getElementById('pg-r').value='-1';
  actions.seqAnalyzePG();
  assert.match(getElementById('seq-result').innerHTML,/Alternante acotada/);
  assert.match(getElementById('seq-result').innerHTML,/Acotamiento de aₙ<\/span><span class="seq-prop-val">Acotada/);

  actions.grafSetType('lin');
  getElementById('gm').value = '2';
  getElementById('gb').value = '1';
  getElementById('graf-pts-n').value = '2';
  actions.grafDraw();
  assert.match(getElementById('graf-table').innerHTML, /<td>0<\/td>\s*<td>1<\/td>/);
  actions.grafSetType('racional');
  for(const [id,value] of Object.entries({ga:'1',gb:'1',gc:'1',gd:'-2'})) getElementById(id).value=value;
  actions.grafDraw();
  assert.match(getElementById('graf-table').innerHTML, /<td>2<\/td>\s*<td>—<\/td>/);
  assert.match(getElementById('graf-table').innerHTML, /<td>1<\/td>\s*<td>-2<\/td>/);

  getElementById('dif-der-fx').value = 'x^2';
  getElementById('dif-der-var').value = 'x';
  getElementById('dif-der-ord').value = '1';
  getElementById('dif-der-pt').value = '3';
  actions.calcDerivative();
  assert.match(getElementById('res-der').innerHTML, /en x = 3/);
  assert.match(getElementById('res-der').innerHTML, />6<\/div>/);
  getElementById('dif-der-var').value='t';
  getElementById('dif-der-fx').value='t^2';
  actions.calcDerivative();
  assert.match(getElementById('res-der').innerHTML, /en t = 3/);
  getElementById('dif-der-var').value='x';
  for(const [expression,order,point,expected] of [
    ['4x^3-5x^2+7x-2','1','0',/>7<\/div>/],
    ['x^2*sen(x)','1','0',/>0<\/div>/],
    ['ln(3x^2+1)','1','1',/>1\.5/],
    ['(x+1)/(x-1)','1','2',/>-2<\/div>/],
    ['x^4-3x^2+2','2','0',/>-6<\/div>/],
    ['exp(5x)*cos(x)','1','0',/>5<\/div>/],
    ['x^x','1','1',/>1<\/div>/],
    ['arctan(x^2)','1','1',/>1<\/div>/],
    ['x^(sen(x))','1','1',/>0\.84147098<\/div>/],
    ['x*exp(2x)','4','0',/>32<\/div>/],
  ]){
    getElementById('dif-der-fx').value=expression;
    getElementById('dif-der-ord').value=order;
    getElementById('dif-der-pt').value=point;
    actions.calcDerivative();
    const html=getElementById('res-der').innerHTML;
    assert.match(html,expected,expression);
    assert.match(html,/Reglas utilizadas/);
    assert.match(html,/Condiciones de la fórmula/);
  }
  assert.match(getElementById('res-der').innerHTML,/Orden 4:/);
  getElementById('dif-der-fx').value='sin(x)';
  getElementById('dif-der-ord').value='1';
  getElementById('dif-der-pt').value='π/6';
  actions.calcDerivative();
  assert.match(getElementById('res-der').innerHTML,/>0\.8660254<\/div>/);
  getElementById('dif-der-fx').value='x^x';
  getElementById('dif-der-pt').value='-1';
  actions.calcDerivative();
  assert.match(getElementById('res-der').innerHTML,/condición x > 0/);
  getElementById('dif-der-fx').value='x^';
  actions.calcDerivative();
  assert.match(getElementById('res-der').innerHTML,/Expresión o variable inválida/);
  getElementById('dif-lim-var').value='t';
  getElementById('dif-lim-fx').value='t^2';
  getElementById('dif-lim-a').value='3';
  getElementById('dif-lim-side').value='both';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML, /lim<sub>t→3<\/sub>/);
  getElementById('dif-lim-var').value='x';
  getElementById('dif-lim-fx').value='(5x^2+3x)/(2x^2-1)';
  getElementById('dif-lim-a').value='Infinity';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML,/coeficientes principales/);
  assert.match(getElementById('res-lim').innerHTML,/5\/2/);
  getElementById('dif-lim-fx').value='sqrt(x^2+3x)-x';
  getElementById('dif-lim-a').value='Infinity';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML,/Racionalizar/);
  assert.match(getElementById('res-lim').innerHTML,/3\/2/);
  getElementById('dif-lim-fx').value='cos(x)^(1/x^2)';
  getElementById('dif-lim-a').value='0';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML,/e\^\(-1\/2\)/);
  assert.match(getElementById('res-lim').innerHTML,/continuidad de exp/);
  for(const [expression,point,expected] of [
    ['(x^2-9)/(x-3)','3',/lim = <strong class="lim-ok">6/],
    ['sin(4x)/(2x)','0',/lim = <strong class="lim-ok">2/],
    ['(1-cos(x))/x^2','0',/lim = <strong class="lim-ok">1\/2/],
    ['(exp(x)-1-x)/x^2','0',/lim = <strong class="lim-ok">1\/2/],
  ]){
    getElementById('dif-lim-fx').value=expression;
    getElementById('dif-lim-a').value=point;
    actions.calcLimit();
    assert.match(getElementById('res-lim').innerHTML,expected);
  }
  assert.match(getElementById('res-lim').innerHTML,/Orden 1:/);
  assert.match(getElementById('res-lim').innerHTML,/Orden 2:/);
  getElementById('dif-lim-fx').value='1/sin(x)-1/x';
  getElementById('dif-lim-a').value='0';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML,/Unificar/);
  assert.match(getElementById('res-lim').innerHTML,/el cociente tiende a 0/);
  getElementById('dif-lim-fx').value='sin(1/x)';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML,/No demostrado/);
  assert.match(getElementById('res-lim').innerHTML,/no demuestran el límite/);
  getElementById('dif-lim-fx').value='sqrt(x)';
  getElementById('dif-lim-a').value='0';
  getElementById('dif-lim-side').value='both';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML,/Dominio real del lado solicitado/);
  assert.match(getElementById('res-lim').innerHTML,/la izquierda/);
  getElementById('dif-lim-side').value='right';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML,/Sustitución directa/);
  getElementById('dif-lim-side').value='both';
  getElementById('dif-lim-fx').value='tan(x)';
  getElementById('dif-lim-a').value='π/2';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML,/posible polo/);
  assert.match(getElementById('res-lim').innerHTML,/No demostrado/);

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
