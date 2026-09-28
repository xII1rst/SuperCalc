import test from 'node:test';
import assert from 'node:assert/strict';
import { rollDice, flipCoins, calculatePi, MAX_PI_DIGITS } from '../js/math/experiments.mjs';

test('los lanzamientos devuelven secuencias y frecuencias consistentes', () => {
  const randomValues = [0, 0.16, 0.5, 0.999999];
  let index = 0;
  const dice = rollDice(4, () => randomValues[index++]);
  assert.deepEqual(dice.outcomes, [1, 1, 4, 6]);
  assert.deepEqual(dice.frequencies, [2, 0, 0, 1, 0, 1]);
  index = 0;
  const coins = flipCoins(4, () => randomValues[index++]);
  assert.deepEqual(coins.outcomes, ['cara', 'cara', 'sello', 'sello']);
  assert.deepEqual(coins.frequencies, { cara: 2, sello: 2 });
  for (const count of [0, 10001, 1.5, NaN]) {
    assert.throws(() => rollDice(count), RangeError);
    assert.throws(() => flipCoins(count), RangeError);
  }
});

test('Chudnovsky calcula hasta 100 cifras decimales y rechaza límites inválidos', () => {
  const known = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';
  for (let digits = 1; digits <= 100; digits++) {
    assert.equal(calculatePi(digits), known.slice(0, digits + 2));
  }
  assert.equal(MAX_PI_DIGITS, 100);
  for (const digits of [0, 101, 1.5, NaN]) assert.throws(() => calculatePi(digits), RangeError);
});
