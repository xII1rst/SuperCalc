export const MAX_TRIALS = 10000;
export const MAX_PI_DIGITS = 100;

function validateTrials(count) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_TRIALS) {
    throw new RangeError(`El número de lanzamientos debe estar entre 1 y ${MAX_TRIALS}.`);
  }
}

export function rollDice(count, random = Math.random) {
  validateTrials(count);
  const outcomes = [];
  const frequencies = Array(6).fill(0);
  for (let i = 0; i < count; i++) {
    const face = Math.floor(random() * 6) + 1;
    outcomes.push(face);
    frequencies[face - 1]++;
  }
  return { outcomes, frequencies };
}

export function flipCoins(count, random = Math.random) {
  validateTrials(count);
  const outcomes = [];
  const frequencies = { cara: 0, sello: 0 };
  for (let i = 0; i < count; i++) {
    const side = random() < 0.5 ? 'cara' : 'sello';
    outcomes.push(side);
    frequencies[side]++;
  }
  return { outcomes, frequencies };
}

function integerSqrt(value) {
  if (value < 0n) throw new RangeError('No existe raíz cuadrada real.');
  if (value < 2n) return value;
  let guess = 1n << BigInt(Math.ceil(value.toString(2).length / 2));
  while (true) {
    const next = (guess + value / guess) / 2n;
    if (next >= guess) return guess;
    guess = next;
  }
}

// π = 426880√10005 / Σ[(6k)!(13591409 + 545140134k) / ((3k)!(k!)³(-640320)^(3k))].
// La recurrencia evita factoriales grandes; los enteros escalados conservan cifras de guarda.
export function calculatePi(digits) {
  if (!Number.isInteger(digits) || digits < 1 || digits > MAX_PI_DIGITS) {
    throw new RangeError(`Las cifras decimales deben estar entre 1 y ${MAX_PI_DIGITS}.`);
  }
  const guardDigits = 12;
  const scale = 10n ** BigInt(digits + guardDigits);
  const terms = Math.ceil((digits + guardDigits) / 14) + 1;
  let m = 1n;
  let l = 13591409n;
  let x = 1n;
  let k = 6n;
  let sum = l * scale;
  for (let i = 1; i < terms; i++) {
    const n = BigInt(i);
    m = m * (k * k * k - 16n * k) / (n * n * n);
    l += 545140134n;
    x *= -262537412640768000n;
    sum += m * l * scale / x;
    k += 12n;
  }
  const numerator = 426880n * integerSqrt(10005n * scale * scale);
  const scaledPi = numerator * scale / sum;
  const whole = scaledPi / scale;
  const fraction = (scaledPi % scale).toString().padStart(digits + guardDigits, '0');
  return `${whole}.${fraction.slice(0, digits)}`;
}
