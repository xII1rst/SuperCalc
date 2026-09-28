export const MAX_BINOMIAL_TRIALS = 1000;
export const MAX_DICE = 12;

export function combinations(n, k) {
  if (!Number.isInteger(n) || n < 0 || n > MAX_BINOMIAL_TRIALS ||
      !Number.isInteger(k) || k < 0 || k > n) {
    throw new RangeError(`n debe estar entre 0 y ${MAX_BINOMIAL_TRIALS}, y k entre 0 y n.`);
  }
  const count = Math.min(k, n - k);
  let result = 1n;
  for (let i = 1; i <= count; i++) {
    result = result * BigInt(n - count + i) / BigInt(i);
  }
  return result;
}

function validateBinomial(n, k, p) {
  if (!Number.isInteger(n) || n < 1 || n > MAX_BINOMIAL_TRIALS ||
      !Number.isInteger(k) || k < 0 || k > n ||
      !Number.isFinite(p) || p < 0 || p > 1) {
    throw new RangeError(`Usa 1–${MAX_BINOMIAL_TRIALS} ensayos, 0 ≤ k ≤ n y 0 ≤ p ≤ 1.`);
  }
}

export function binomialProbability(n, k, p) {
  validateBinomial(n, k, p);
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  const small = Math.min(k, n - k);
  let logChoose = 0;
  for (let i = 1; i <= small; i++) logChoose += Math.log(n - small + i) - Math.log(i);
  return Math.exp(logChoose + k * Math.log(p) + (n - k) * Math.log1p(-p));
}

export function binomialSummary(n, k, p) {
  validateBinomial(n, k, p);
  let atMost = 0;
  let atLeast = 0;
  for (let i = 0; i <= k; i++) atMost += binomialProbability(n, i, p);
  for (let i = k; i <= n; i++) atLeast += binomialProbability(n, i, p);
  return {
    combinations: combinations(n, k),
    exact: binomialProbability(n, k, p),
    atMost: Math.min(1, atMost),
    atLeast: Math.min(1, atLeast),
    expected: n * p,
    variance: n * p * (1 - p),
  };
}

export function diceSumDistribution(diceCount) {
  if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > MAX_DICE) {
    throw new RangeError(`El número de dados debe estar entre 1 y ${MAX_DICE}.`);
  }
  let ways = [1];
  for (let die = 0; die < diceCount; die++) {
    const next = Array(ways.length + 6).fill(0);
    ways.forEach((count, sum) => {
      for (let face = 1; face <= 6; face++) next[sum + face] += count;
    });
    ways = next;
  }
  const total = 6 ** diceCount;
  return ways.map((count, sum) => ({sum, ways: count, probability: count / total}))
    .filter(item => item.sum >= diceCount && item.sum <= 6 * diceCount);
}

export function diceSumSummary(diceCount, target) {
  const distribution = diceSumDistribution(diceCount);
  if (!Number.isInteger(target) || target < diceCount || target > 6 * diceCount) {
    throw new RangeError(`La suma debe estar entre ${diceCount} y ${6 * diceCount}.`);
  }
  const selected = distribution[target - diceCount];
  return {
    ...selected,
    total: 6 ** diceCount,
    expected: 3.5 * diceCount,
    distribution,
  };
}
