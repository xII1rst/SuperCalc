import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createAppHarness } from './helpers/app-harness.mjs';

test('álgebra: geometría, espacios, matrices, funciones y graficador', async () => {
  const harness = await createAppHarness();
  const { delegatedEvents, getElementById } = harness;
  const actions = harness.actions;
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  // El recorrido original llegaba aquí desde el menú Matemáticas; el historial lo reproduce.
  actions.openSubmod('math');
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

});
