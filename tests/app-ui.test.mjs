import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

});
