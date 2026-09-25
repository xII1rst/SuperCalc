import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeFunction } from '../js/math/algebra/functions.mjs';

test('analiza función lineal sin DOM', () => {
  const result=analyzeFunction('lineal',{a:2,b:1});
  assert.equal(result.domain,'(-∞, +∞)');
  assert.equal(result.range,'(-∞, +∞)');
  assert.equal(result.pts.find(point=>point.x===0).y,1);
  assert.match(result.steps.join(' '), /x = -0\.5/);
});

test('analiza función cuadrática y racional sin DOM', () => {
  const quadratic=analyzeFunction('cuad',{a:1,b:0,c:-4});
  assert.equal(quadratic.range,'[-4, +∞)');
  assert.match(quadratic.steps.join(' '), /x = -2, x = 2/);

  const rational=analyzeFunction('racional',{numStr:'x^2-1',denStr:'x-2'});
  assert.equal(rational.domain,'(-∞, 2) ∪ (2, +∞)');
  assert.match(rational.steps.join(' '), /x = 2 excluido/);
  assert.ok(rational.pts.length>0);
  assert.ok(Math.abs(rational.pts.find(point=>Math.abs(point.x-3)<1e-8).y-8)<1e-8);
});
