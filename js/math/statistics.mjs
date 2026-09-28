export const MAX_DATA_POINTS = 10000;

function percentileOfSorted(sorted, percentile) {
  const position = (sorted.length - 1) * percentile / 100;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
}

export function percentile(values, percentile) {
  if (!Array.isArray(values) || !values.length || values.length > MAX_DATA_POINTS ||
      values.some(value => !Number.isFinite(value)) ||
      !Number.isFinite(percentile) || percentile < 0 || percentile > 100) {
    throw new RangeError('Se requieren datos finitos y un percentil entre 0 y 100.');
  }
  const sorted = [...values].sort((a, b) => a - b);
  if (!Number.isFinite(sorted.at(-1) - sorted[0])) {
    throw new RangeError('El rango excede el límite numérico disponible.');
  }
  return percentileOfSorted(sorted, percentile);
}

export function histogram(values, binCount) {
  if (!Array.isArray(values) || !values.length || values.length > MAX_DATA_POINTS ||
      values.some(value => !Number.isFinite(value))) {
    throw new RangeError(`Se requieren entre 1 y ${MAX_DATA_POINTS} números finitos.`);
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (!Number.isFinite(range)) throw new RangeError('El rango excede el límite numérico disponible.');
  if (binCount !== undefined && (!Number.isInteger(binCount) || binCount < 1 || binCount > 50)) {
    throw new RangeError('El número de intervalos debe estar entre 1 y 50.');
  }
  const count = range === 0 ? 1 : (binCount ?? Math.min(12, Math.max(5, Math.ceil(Math.log2(values.length) + 1))));
  const width = range / count;
  const bins = Array.from({length: count}, (_, index) => ({
    start: min + index * width,
    end: index === count - 1 ? max : min + (index + 1) * width,
    count: 0,
  }));
  for (const value of values) {
    const index = range === 0 ? 0 : Math.min(count - 1, Math.floor((value - min) / range * count));
    bins[index].count++;
  }
  return bins;
}

export function parseDataset(text) {
  const tokens = text.trim().split(/[\s,;]+/).filter(Boolean);
  if (!tokens.length || tokens.length > MAX_DATA_POINTS) {
    throw new RangeError(`Introduce entre 1 y ${MAX_DATA_POINTS} datos.`);
  }
  const values = tokens.map(Number);
  if (values.some(value => !Number.isFinite(value))) {
    throw new TypeError('Todos los datos deben ser números finitos. Usa punto decimal.');
  }
  return values;
}

export function summarizeDataset(values) {
  if (!Array.isArray(values) || !values.length || values.length > MAX_DATA_POINTS ||
      values.some(value => !Number.isFinite(value))) {
    throw new RangeError(`Se requieren entre 1 y ${MAX_DATA_POINTS} números finitos.`);
  }
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const range = sorted[count - 1] - sorted[0];
  if (!Number.isFinite(range)) throw new RangeError('El rango excede el límite numérico disponible.');
  const sum = values.reduce((total, value) => total + value, 0);
  if (!Number.isFinite(sum)) throw new RangeError('La suma excede el rango numérico disponible.');
  const mean = sum / count;
  const median = count % 2 ? sorted[(count - 1) / 2] :
    (sorted[count / 2 - 1] + sorted[count / 2]) / 2;
  const frequencies = new Map();
  for (const value of sorted) frequencies.set(value, (frequencies.get(value) || 0) + 1);
  const highestFrequency = Math.max(...frequencies.values());
  const modes = highestFrequency === 1 ? [] :
    [...frequencies].filter(([, frequency]) => frequency === highestFrequency).map(([value]) => value);
  const squaredDeviations = values.reduce((total, value) => total + (value - mean) ** 2, 0);
  if (!Number.isFinite(squaredDeviations)) {
    throw new RangeError('La dispersión excede el rango numérico disponible.');
  }
  const populationVariance = squaredDeviations / count;
  const sampleVariance = count > 1 ? squaredDeviations / (count - 1) : null;
  const q1 = percentileOfSorted(sorted, 25);
  const q3 = percentileOfSorted(sorted, 75);
  return {
    count, sum, mean, median, modes,
    min: sorted[0], max: sorted[count - 1], range,
    q1, q3, iqr: q3 - q1,
    populationVariance, populationStdDev: Math.sqrt(populationVariance),
    sampleVariance, sampleStdDev: sampleVariance === null ? null : Math.sqrt(sampleVariance),
  };
}
