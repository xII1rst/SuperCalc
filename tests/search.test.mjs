import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeSearch, createSearchIndex, searchTools } from '../js/utils/search.mjs';
import { buildToolCatalog, defaultToolIds } from '../js/ui/search/catalog.mjs';
import { SUBMOD_CONFIG, cardsOf } from '../js/ui/navigation/catalog.mjs';

const catalog = buildToolCatalog();
const index = createSearchIndex(catalog);

test('búsqueda normaliza acentos, mayúsculas, puntuación y espacios', () => {
  assert.equal(normalizeSearch('  CÁLCULO — integración / R²  '), 'calculo integracion r2');
  assert.equal(normalizeSearch('Gram–Schmidt'), 'gram schmidt');
  assert.equal(normalizeSearch(''), '');
});

test('el catálogo tiene claves únicas y destinos y símbolos existentes', async () => {
  assert.equal(new Set(catalog.map(entry => entry.id)).size, catalog.length);
  const icons = await readFile(new URL('../html/shared/icons.html', import.meta.url), 'utf8');
  for (const entry of catalog) {
    const [, parent, id] = entry.route.split('/');
    assert.ok(Object.hasOwn(SUBMOD_CONFIG, parent), entry.route);
    assert.ok(cardsOf(parent).some(card => card.id === id), entry.route);
    assert.ok(icons.includes(`id="sc-icon-${entry.icon}"`), entry.icon);
    assert.ok(entry.title && entry.description && entry.path, entry.id);
    if (entry.selection) assert.ok(entry.selection.select && entry.selection.value && entry.selection.action, entry.id);
  }
  for (const id of defaultToolIds) assert.ok(catalog.some(entry => entry.id === id), id);
});

test('la búsqueda encuentra operaciones de todas las familias y abre su modo concreto', () => {
  for (const [query, id, select] of [
    ['Laplace inversa de cuadrática', 'study:laplaceinversequadratic', 'study-mode'],
    ['Coulomb', 'emplus:coulomb', 'emplus-mode'],
    ['Atwood', 'mechplus:atwood', 'mechplus-mode'],
    ['Doppler', 'waves:doppler', 'waves-mode'],
  ]) {
    const result = searchTools(index, query).find(entry => entry.id === id);
    assert.ok(result, query);
    assert.equal(result.selection.select, select);
  }
});

test('sinónimos ingleses y acentos omitidos encuentran herramientas en español', () => {
  for (const [query, id] of [
    ['projectile', 'mech-projectile'], ['statistics', 'stats'],
    ['eigenvalues', 'mat'], ['interpolation', 'num-interpolation'],
    ['derivative', 'num-derivative'], ['raices', 'num-roots'],
  ]) assert.ok(searchTools(index, query).some(entry => entry.id === id), query);
});

test('todos los términos deben coincidir y las palabras comunes no impiden buscar', () => {
  assert.ok(searchTools(index, 'integral doble').some(entry => entry.id === 'study:mpolar'));
  assert.deepEqual(searchTools(index, 'Laplace de cuadrática'), searchTools(index, 'laplace cuadratica'));
  assert.deepEqual(searchTools(index, 'integral zzzinexistente'), []);
});

test('el nombre exacto precede a descripciones y coincidencias parciales', () => {
  const small = createSearchIndex([
    { id: 'desc', title: 'Otro método', description: 'Taylor', path: 'Matemáticas' },
    { id: 'prefix', title: 'Taylor y error', description: '', path: 'Matemáticas' },
    { id: 'exact', title: 'Taylor', description: '', path: 'Matemáticas' },
  ]);
  assert.deepEqual(searchTools(small, 'taylor').map(entry => entry.id), ['exact', 'prefix', 'desc']);
  assert.equal(searchTools(small, 'taylor', 1).length, 1);
  assert.deepEqual(searchTools(small, ''), []);
  assert.deepEqual(searchTools(small, '   '), []);
  assert.deepEqual(searchTools(small, 'z'.repeat(200)), []);
});
