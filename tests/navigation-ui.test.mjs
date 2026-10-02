import test from 'node:test';
import assert from 'node:assert/strict';
import { THEORY } from '../js/content/theory.mjs';
import { createAppHarness } from './helpers/app-harness.mjs';

test('las fichas teóricas enlazan herramientas y vuelven al menú', async () => {
  const harness = await createAppHarness();
  const { getElementById } = harness;
  const actions = harness.actions;
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
});
