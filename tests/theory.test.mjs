import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { THEORY, STATUS, CARD_KINDS, ROUTES, coverageCounts } from '../js/content/theory.mjs';
import { parseRoute } from '../js/ui/routes.mjs';

const syllabus = name => readFile(new URL(`../noCommit/referencias/Contenidos_Materias_UPC_MD/${name}.md`, import.meta.url), 'utf8').catch(() => null);

test('cada materia del temario tiene unidades con fichas y subtemas válidos', () => {
  assert.deepEqual(THEORY.map(subject => subject.id), ['diferencial', 'integral', 'multivariable', 'edo', 'lineal', 'numerico', 'logica', 'em', 'mecanica', 'ondas']);
  const ids = new Set();
  for (const subject of THEORY) {
    assert.ok(['math', 'fi'].includes(subject.group), subject.id);
    for (const unit of subject.units) {
      assert.ok(!ids.has(unit.id), `unidad repetida ${unit.id}`);
      ids.add(unit.id);
      assert.ok(unit.cards.length >= 3, `${unit.id}: al menos tres fichas`);
      assert.ok(unit.topics.length >= 3, `${unit.id}: subtemas`);
      for (const card of unit.cards) {
        assert.ok(CARD_KINDS.includes(card.kind), `${unit.id}: tipo ${card.kind}`);
        assert.ok(card.title && card.text.length > 40, `${unit.id}: ${card.title}`);
      }
      for (const topic of unit.topics) {
        assert.ok(Object.hasOwn(STATUS, topic.status), `${unit.id}: estado ${topic.status}`);
        // Cubierto o parcial exige una herramienta a la que saltar.
        if (topic.status === 'C' || topic.status === 'P') assert.ok(topic.tool, `${unit.id}: ${topic.label} sin herramienta`);
      }
    }
  }
});

test('las unidades siguen el temario y las fichas no dejan subtemas pendientes', async () => {
  const counts = { diferencial: 5, integral: 4, multivariable: 4, edo: 4, lineal: 6, numerico: 6, logica: 6, em: 6, mecanica: 9, ondas: 3 };
  for (const subject of THEORY) assert.equal(subject.units.length, counts[subject.id], subject.id);
  const total = coverageCounts();
  assert.equal(total.N, 0);
  assert.equal(total.total, total.C + total.P + total.F);
  assert.ok(total.C / total.total > 0.75, 'la mayoría de subtemas tiene herramienta completa');
  const source = await syllabus('Algebra_Lineal');
  if (source) for (const unit of THEORY.find(subject => subject.id === 'lineal').units) {
    const roman = unit.title.match(/^Unidad ([IVX]+)\./)[1];
    assert.match(source, new RegExp(`### Unidad ${roman}\\.`));
  }
});

test('los enlaces de las fichas son rutas directas bien formadas', () => {
  for (const route of Object.values(ROUTES)) {
    const parsed = parseRoute(route);
    assert.ok(parsed?.parent && parsed.id, route);
  }
});
