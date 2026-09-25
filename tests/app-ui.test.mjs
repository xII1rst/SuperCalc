import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const appUrl = new URL('../app.js', import.meta.url);
const modules = new Map([
  ['./js/math/algebra/matrix.mjs', new URL('../js/math/algebra/matrix.mjs', import.meta.url)],
  ['./js/math/algebra/vector.mjs', new URL('../js/math/algebra/vector.mjs', import.meta.url)],
  ['./js/math/algebra/triangle.mjs', new URL('../js/math/algebra/triangle.mjs', import.meta.url)],
  ['./js/graphics/figures.mjs', new URL('../js/graphics/figures.mjs', import.meta.url)],
  ['./js/graphics/vector-canvas.mjs', new URL('../js/graphics/vector-canvas.mjs', import.meta.url)],
  ['./js/graphics/em-canvas.mjs', new URL('../js/graphics/em-canvas.mjs', import.meta.url)],
  ['./js/graphics/colors.mjs', new URL('../js/graphics/colors.mjs', import.meta.url)],
  ['./js/graphics/formula-background.mjs', new URL('../js/graphics/formula-background.mjs', import.meta.url)],
  ['./js/utils/format.mjs', new URL('../js/utils/format.mjs', import.meta.url)],
  ['./js/ui/algebra/matrix.mjs', new URL('../js/ui/algebra/matrix.mjs', import.meta.url)],
  ['./js/ui/algebra/inequalities.mjs', new URL('../js/ui/algebra/inequalities.mjs', import.meta.url)],
  ['./js/ui/branding.mjs', new URL('../js/ui/branding.mjs', import.meta.url)],
  ['./js/offline.mjs', new URL('../js/offline.mjs', import.meta.url)],
  ['./js/ui/navigation.mjs', new URL('../js/ui/navigation.mjs', import.meta.url)],
  ['./js/ui/events.mjs', new URL('../js/ui/events.mjs', import.meta.url)],
  ['./js/ui/canvas-size.mjs', new URL('../js/ui/canvas-size.mjs', import.meta.url)],
  ['./js/ui/theme.mjs', new URL('../js/ui/theme.mjs', import.meta.url)],
  ['./js/ui/toast.mjs', new URL('../js/ui/toast.mjs', import.meta.url)],
  ['./js/math/calculus.mjs', new URL('../js/math/calculus.mjs', import.meta.url)],
  ['./js/math/expression.mjs', new URL('../js/math/expression.mjs', import.meta.url)],
  ['./js/math/graph-types.mjs', new URL('../js/math/graph-types.mjs', import.meta.url)],
  ['./js/math/applications.mjs', new URL('../js/math/applications.mjs', import.meta.url)],
  ['./js/ui/algebra/functions.mjs', new URL('../js/ui/algebra/functions.mjs', import.meta.url)],
  ['./js/ui/algebra/sequences.mjs', new URL('../js/ui/algebra/sequences.mjs', import.meta.url)],
  ['./js/math/algebra/polynomial.mjs', new URL('../js/math/algebra/polynomial.mjs', import.meta.url)],
  ['./js/ui/plotter.mjs', new URL('../js/ui/plotter.mjs', import.meta.url)],
  ['./js/graphics/graph-canvas.mjs', new URL('../js/graphics/graph-canvas.mjs', import.meta.url)],
  ['./js/ui/calculus.mjs', new URL('../js/ui/calculus.mjs', import.meta.url)],
  ['./js/state/figures.mjs', new URL('../js/state/figures.mjs', import.meta.url)],
  ['./js/ui/figure-controls.mjs', new URL('../js/ui/figure-controls.mjs', import.meta.url)],
  ['./js/graphics/axes.mjs', new URL('../js/graphics/axes.mjs', import.meta.url)],
  ['./js/ui/electromagnetism.mjs', new URL('../js/ui/electromagnetism.mjs', import.meta.url)],
  ['./js/ui/electromagnetism-extra.mjs', new URL('../js/ui/electromagnetism-extra.mjs', import.meta.url)],
  ['./js/ui/algebra/vectors.mjs', new URL('../js/ui/algebra/vectors.mjs', import.meta.url)],
  ['./js/math/electromagnetism.mjs', new URL('../js/math/electromagnetism.mjs', import.meta.url)],
  ['./js/math/algebra/sequences.mjs', new URL('../js/math/algebra/sequences.mjs', import.meta.url)],
  ['./js/math/algebra/inequalities.mjs', new URL('../js/math/algebra/inequalities.mjs', import.meta.url)],
  ['./js/math/algebra/functions.mjs', new URL('../js/math/algebra/functions.mjs', import.meta.url)],
  ['./js/graphics/analysis.mjs', new URL('../js/graphics/analysis.mjs', import.meta.url)],
  ['./js/math/algebra/vector-equations.mjs', new URL('../js/math/algebra/vector-equations.mjs', import.meta.url)],
]);

function makeElement(id) {
  const classes = new Set(id === 'submod-screen' ? ['visible'] : []);
  const classList = {
    add: name => classes.add(name),
    remove: name => classes.delete(name),
    contains: name => classes.has(name),
    toggle: (name, force) => {
      if (force ?? !classes.has(name)) classes.add(name);
      else classes.delete(name);
    },
  };
  const context = new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
  return {
    id,
    dataset: {},
    classList,
    style: {},
    value: '0',
    innerHTML: '',
    clientWidth: 800,
    clientHeight: 600,
    addEventListener() {},
    setAttribute() {},
    insertBefore() {},
    remove() {},
    getContext: () => context,
    toDataURL: () => 'data:image/png;base64,AA==',
  };
}

test('el punto de entrada ES conserva los eventos y cálculos principales', async () => {
  const elements = new Map();
  const delegatedEvents = new Map();
  const calcTabs=['dif','int','mul','edo','graf'].map(id=>{
    const tab=makeElement(`calc-tab-${id}`);
    tab.dataset.arg=id;
    return tab;
  });
  const getElementById = id => {
    if (id === 'sc-bg-canvas' || id === 'sc-e1') return null;
    if (id === 'update-banner' || id === 'install-banner' || id === 'tri-restore-btn') return elements.get(id) || null;
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  };
  getElementById('pV').insertBefore = element => {
    elements.set(element.id, element);
    element.remove = () => elements.delete(element.id);
  };
  let updateFound;
  let stateChanged;
  const savedTheme=new Map();
  const registration = {
    installing: { state: 'installed', addEventListener(_type, listener) { stateChanged = listener; } },
    addEventListener(_type, listener) { updateFound = listener; },
  };
  const sandbox = {
    document: {
      documentElement: { dataset: { theme: 'dark' } },
      getElementById,
      querySelector: () => null,
      addEventListener(type,listener){ delegatedEvents.set(type,listener); },
      dispatchEvent(event){ delegatedEvents.get(event.type)?.(event); },
      createElement: tag => makeElement(tag),
      querySelectorAll: selector => selector === '.tab'
        ? Array.from({length:7}, (_,i)=>makeElement(`tab-${i}`))
        : selector === '.calc-tab' ? calcTabs : [],
      head: { appendChild() {} },
      body: { appendChild(element) { elements.set(element.id, element); } },
    },
    navigator: { serviceWorker: { register: async () => registration, controller: {} } },
    location: { pathname: '/' },
    history: { pushState() {} },
    URL: { createObjectURL: () => 'blob:test' },
    Blob,
    Event: class { constructor(type){this.type=type;} },
    localStorage: {getItem:key=>savedTheme.get(key)||null,setItem:(key,value)=>savedTheme.set(key,value)},
    devicePixelRatio: 1,
    requestAnimationFrame() {},
    setTimeout: callback => callback(),
    clearTimeout() {},
    addEventListener() {},
    alert: message => { throw new Error(message); },
    console,
  };
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);
  const source = await readFile(appUrl, 'utf8');
  const appModule = new vm.SourceTextModule(source, {
    context,
    identifier: appUrl.href,
  });
  const moduleUrls = new Set([...modules.values()].map(url => url.href));
  const linked = new Map([[appUrl.href, appModule]]);
  await appModule.link(async (specifier, referencingModule) => {
    const moduleUrl = new URL(specifier, referencingModule.identifier);
    assert.ok(moduleUrls.has(moduleUrl.href), `Import desconocido: ${specifier}`);
    if (!linked.has(moduleUrl.href)) {
      linked.set(moduleUrl.href, new vm.SourceTextModule(await readFile(moduleUrl, 'utf8'), {
        context,
        identifier: moduleUrl.href,
      }));
    }
    return linked.get(moduleUrl.href);
  });
  await appModule.evaluate();
  const actions=appModule.namespace.actions;
  getElementById('graf-canvas-wrap').style.display='none';
  assert.equal(actions.toggleTheme(),'light');
  assert.equal(sandbox.document.documentElement.dataset.theme,'light');
  assert.equal(savedTheme.get('sc-theme'),'light');
  await Promise.resolve();
  assert.equal(typeof updateFound, 'function');
  updateFound();
  stateChanged();
  assert.match(getElementById('update-banner').innerHTML, /Actualizar/);

  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const allSource = [source, ...await Promise.all([...modules.values()].map(url => readFile(url, 'utf8')))].join('\n');
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

  actions.openSubmod('al');
  const algebraCards=getElementById('submod-cards').innerHTML;
  assert.match(algebraCards,/Vectores y matrices/);
  assert.match(algebraCards,/Funciones y relaciones/);
  for(const id of ['vectors','mat','ineq','fn','seq'])
    assert.match(algebraCards,new RegExp(`data-arg="${id}"`));
  actions.openSubmod('ca');
  const calcCards=getElementById('submod-cards').innerHTML;
  for(const id of ['calc-dif','calc-int','calc-mul','calc-edo','calc-graf'])
    assert.match(calcCards,new RegExp(`data-arg="${id}"`));
  for(const [id,tab,panel] of [
    ['calc-dif','dif','Dif'],['calc-int','int','Int'],
    ['calc-mul','mul','Mul'],['calc-edo','edo','Edo'],['calc-graf','graf','Graf'],
  ]){
    const card={dataset:{action:'launchSubmod',arg:id},closest(){return this;}};
    delegatedEvents.get('click')({type:'click',target:card});
    assert.equal(getElementById('calc-p'+panel).classList.contains('on'),true,id);
    assert.equal(calcTabs.find(item=>item.dataset.arg===tab).classList.contains('on'),true,id);
    assert.equal(calcTabs.filter(item=>item.classList.contains('on')).length,1,id);
    actions.closeModule('calc');
  }

  assert.equal(getElementById('submod-screen').classList.contains('visible'), true);
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
  getElementById('dif-lim-var').value='t';
  getElementById('dif-lim-fx').value='t^2';
  getElementById('dif-lim-a').value='3';
  getElementById('dif-lim-side').value='both';
  actions.calcLimit();
  assert.match(getElementById('res-lim').innerHTML, /lim<sub>t→3<\/sub>/);

  getElementById('int-def-fx').value = 'x^2';
  getElementById('int-def-a').value = '0';
  getElementById('int-def-b').value = '1';
  actions.calcIntegralDef();
  assert.match(getElementById('res-def').innerHTML, /0\.333333/);

  getElementById('int-rev-fx').value='x';
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
