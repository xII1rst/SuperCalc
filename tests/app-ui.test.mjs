import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const appUrl = new URL('../app.js', import.meta.url);
const modules = new Map([
  ['./js/math/algebra/matrix.mjs', new URL('../js/math/algebra/matrix.mjs', import.meta.url)],
  ['./js/math/algebra/geometry.mjs', new URL('../js/math/algebra/geometry.mjs', import.meta.url)],
  ['./js/math/algebra/linear-spaces.mjs', new URL('../js/math/algebra/linear-spaces.mjs', import.meta.url)],
  ['./js/math/algebra/parameter-systems.mjs', new URL('../js/math/algebra/parameter-systems.mjs', import.meta.url)],
  ['./js/math/numerical-analysis.mjs', new URL('../js/math/numerical-analysis.mjs', import.meta.url)],
  ['./js/math/logic.mjs', new URL('../js/math/logic.mjs', import.meta.url)],
  ['./js/math/logic-advanced.mjs', new URL('../js/math/logic-advanced.mjs', import.meta.url)],
  ['./js/math/graphs.mjs', new URL('../js/math/graphs.mjs', import.meta.url)],
  ['./js/math/waves.mjs', new URL('../js/math/waves.mjs', import.meta.url)],
  ['./js/graphics/wave-plot.mjs', new URL('../js/graphics/wave-plot.mjs', import.meta.url)],
  ['./js/math/mechanics-advanced.mjs', new URL('../js/math/mechanics-advanced.mjs', import.meta.url)],
  ['./js/math/electromagnetism-advanced.mjs', new URL('../js/math/electromagnetism-advanced.mjs', import.meta.url)],
  ['./js/math/numerical-advanced.mjs', new URL('../js/math/numerical-advanced.mjs', import.meta.url)],
  ['./js/math/study-calculus.mjs', new URL('../js/math/study-calculus.mjs', import.meta.url)],
  ['./js/math/study-ode.mjs', new URL('../js/math/study-ode.mjs', import.meta.url)],
  ['./js/math/statistics.mjs', new URL('../js/math/statistics.mjs', import.meta.url)],
  ['./js/graphics/statistics-charts.mjs', new URL('../js/graphics/statistics-charts.mjs', import.meta.url)],
  ['./js/math/probability.mjs', new URL('../js/math/probability.mjs', import.meta.url)],
  ['./js/ui/probability.mjs', new URL('../js/ui/probability.mjs', import.meta.url)],
  ['./js/math/mechanics.mjs', new URL('../js/math/mechanics.mjs', import.meta.url)],
  ['./js/math/mechanics-units.mjs', new URL('../js/math/mechanics-units.mjs', import.meta.url)],
  ['./js/math/mechanics-solver.mjs', new URL('../js/math/mechanics-solver.mjs', import.meta.url)],
  ['./js/ui/mechanics.mjs', new URL('../js/ui/mechanics.mjs', import.meta.url)],
  ['./js/graphics/mechanics-trajectory.mjs', new URL('../js/graphics/mechanics-trajectory.mjs', import.meta.url)],
  ['./js/math/experiments.mjs', new URL('../js/math/experiments.mjs', import.meta.url)],
  ['./js/ui/statistics.mjs', new URL('../js/ui/statistics.mjs', import.meta.url)],
  ['./js/ui/experiments.mjs', new URL('../js/ui/experiments.mjs', import.meta.url)],
  ['./js/math/algebra/vector.mjs', new URL('../js/math/algebra/vector.mjs', import.meta.url)],
  ['./js/math/algebra/triangle.mjs', new URL('../js/math/algebra/triangle.mjs', import.meta.url)],
  ['./js/graphics/figures.mjs', new URL('../js/graphics/figures.mjs', import.meta.url)],
  ['./js/graphics/vector-canvas.mjs', new URL('../js/graphics/vector-canvas.mjs', import.meta.url)],
  ['./js/graphics/em-canvas.mjs', new URL('../js/graphics/em-canvas.mjs', import.meta.url)],
  ['./js/graphics/colors.mjs', new URL('../js/graphics/colors.mjs', import.meta.url)],
  ['./js/graphics/formula-background.mjs', new URL('../js/graphics/formula-background.mjs', import.meta.url)],
  ['./js/utils/format.mjs', new URL('../js/utils/format.mjs', import.meta.url)],
  ['./js/ui/algebra/matrix.mjs', new URL('../js/ui/algebra/matrix.mjs', import.meta.url)],
  ['./js/ui/algebra/geometry.mjs', new URL('../js/ui/algebra/geometry.mjs', import.meta.url)],
  ['./js/ui/algebra/linear-spaces.mjs', new URL('../js/ui/algebra/linear-spaces.mjs', import.meta.url)],
  ['./js/ui/numerical-analysis.mjs', new URL('../js/ui/numerical-analysis.mjs', import.meta.url)],
  ['./js/ui/logic.mjs', new URL('../js/ui/logic.mjs', import.meta.url)],
  ['./js/ui/waves.mjs', new URL('../js/ui/waves.mjs', import.meta.url)],
  ['./js/ui/mechanics-advanced.mjs', new URL('../js/ui/mechanics-advanced.mjs', import.meta.url)],
  ['./js/ui/electromagnetism-advanced.mjs', new URL('../js/ui/electromagnetism-advanced.mjs', import.meta.url)],
  ['./js/ui/study-calculus.mjs', new URL('../js/ui/study-calculus.mjs', import.meta.url)],
  ['./js/ui/algebra/inequalities.mjs', new URL('../js/ui/algebra/inequalities.mjs', import.meta.url)],
  ['./js/ui/branding.mjs', new URL('../js/ui/branding.mjs', import.meta.url)],
  ['./js/offline.mjs', new URL('../js/offline.mjs', import.meta.url)],
  ['./js/ui/navigation.mjs', new URL('../js/ui/navigation.mjs', import.meta.url)],
  ['./js/ui/events.mjs', new URL('../js/ui/events.mjs', import.meta.url)],
  ['./js/ui/canvas-size.mjs', new URL('../js/ui/canvas-size.mjs', import.meta.url)],
  ['./js/ui/theme.mjs', new URL('../js/ui/theme.mjs', import.meta.url)],
  ['./js/ui/toast.mjs', new URL('../js/ui/toast.mjs', import.meta.url)],
  ['./js/math/calculus.mjs', new URL('../js/math/calculus.mjs', import.meta.url)],
  ['./js/math/numeric.mjs', new URL('../js/math/numeric.mjs', import.meta.url)],
  ['./js/math/expression.mjs', new URL('../js/math/expression.mjs', import.meta.url)],
  ['./js/math/graph-types.mjs', new URL('../js/math/graph-types.mjs', import.meta.url)],
  ['./js/math/applications.mjs', new URL('../js/math/applications.mjs', import.meta.url)],
  ['./js/math/integration.mjs', new URL('../js/math/integration.mjs', import.meta.url)],
  ['./js/math/series.mjs', new URL('../js/math/series.mjs', import.meta.url)],
  ['./js/math/integral-applications.mjs', new URL('../js/math/integral-applications.mjs', import.meta.url)],
  ['./js/math/parametric.mjs', new URL('../js/math/parametric.mjs', import.meta.url)],
  ['./js/math/polar.mjs', new URL('../js/math/polar.mjs', import.meta.url)],
  ['./js/math/conics.mjs', new URL('../js/math/conics.mjs', import.meta.url)],
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
  ['./js/graphics/projection.mjs', new URL('../js/graphics/projection.mjs', import.meta.url)],
  ['./js/graphics/revolution.mjs', new URL('../js/graphics/revolution.mjs', import.meta.url)],
  ['./js/graphics/preview-canvas.mjs', new URL('../js/graphics/preview-canvas.mjs', import.meta.url)],
  ['./js/math/vector-calculus.mjs', new URL('../js/math/vector-calculus.mjs', import.meta.url)],
  ['./js/math/multivariable.mjs', new URL('../js/math/multivariable.mjs', import.meta.url)],
]);

function makeElement(id) {
  const classes = new Set();
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
  const headLinks = [];
  const delegatedEvents = new Map();
  const windowEvents = new Map();
  const navEntries = [{sc:'launcher'}];
  let navIndex = 0;
  const history = {
    pushState(state) {
      navEntries.splice(navIndex + 1);
      navEntries.push(state);
      navIndex++;
    },
    replaceState(state) { navEntries[navIndex] = state; },
    back() {
      if (navIndex > 0) {
        navIndex--;
        windowEvents.get('popstate')?.({state:navEntries[navIndex]});
      }
    },
    forward() {
      if (navIndex < navEntries.length - 1) {
        navIndex++;
        windowEvents.get('popstate')?.({state:navEntries[navIndex]});
      }
    },
  };
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
        : [],
      head: { appendChild(element) { headLinks.push(element); } },
      body: { appendChild(element) { elements.set(element.id, element); } },
    },
    navigator: { serviceWorker: { register: async () => registration, controller: {} } },
    location: { pathname: '/' },
    history,
    URL: { createObjectURL: () => 'blob:test' },
    Blob,
    Event: class { constructor(type){this.type=type;} },
    localStorage: {getItem:key=>savedTheme.get(key)||null,setItem:(key,value)=>savedTheme.set(key,value)},
    devicePixelRatio: 1,
    requestAnimationFrame() {},
    setTimeout: callback => callback(),
    clearTimeout() {},
    addEventListener(type, listener) { windowEvents.set(type, listener); },
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
  assert.equal(headLinks.find(link => link.rel === 'icon')?.href, 'data:image/png;base64,AA==');
  assert.equal(headLinks.find(link => link.rel === 'apple-touch-icon')?.href, 'data:image/png;base64,AA==');
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
  for (const [id,value] of Object.entries({'num-ode-f':'x+y','num-ode-x0':'0','num-ode-y0':'1','num-ode-h':'0.1','num-ode-n':'2','num-ode-method':'euler','num-ode-reference':'','num-ode-lambda':''}))
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
  getElementById('num-ode-reference').value='2*exp(x)';
  actions.numCalcODE();
  assert.match(getElementById('num-result').textContent,/no satisface el valor inicial/);
  actions.closeModule('num');
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
  for (const [id,value] of Object.entries({'logic-graph-mode':'dijkstra','logic-graph-edges':'A B 4\nA C 2\nB C 1\nB D 5\nC D 8\nC E 10\nD E 2','logic-graph-start':'A','logic-graph-target':'E','logic-graph-directed':'undirected'}))
    getElementById(id).value=value;
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Distancia mínima = 10/);
  getElementById('logic-graph-mode').value='matching';
  getElementById('logic-graph-left').value='A, B';
  getElementById('logic-graph-right').value='X, Y';
  getElementById('logic-graph-edges').value='A X\nB X\nB Y';
  actions.logicCalculateGraph();
  assert.match(getElementById('logic-result').innerHTML,/Tamaño máximo = 2/);
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
  actions.launchSubmod('study-multivariable');
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
    ['emplus-electrostatics','charges',{charges:'0.000001, -1, 0, 0\n0.000001, 1, 0, 0',point:'0, 0, 1'},/Potencial/],
    ['emplus-circuits','nodal',{nodes:'3',resistors:'1, 2, 1000\n2, 0, 1000',fixed:'0, 0\n1, 10',injections:''},/Potenciales de nodos/],
    ['emplus-magnetism','magnetic',{shape:'loop',current:'2',turns:'100',size:'0.2',position:'0.1'},/Campo E/],
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
  assert.match(getElementById('submod-cards').innerHTML,/data-arg="em-basics"/);
  actions.closeSubmod();
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
