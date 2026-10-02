// Comprobaciones de dominio para herramientas que reciben una función ya compilada.
// Son conservadoras: solo rechazan cuando la muestra encuentra un problema
// (valor no definido, polo o derivadas laterales distintas); nunca certifican regularidad.
const fmt = x => String(Number(x.toPrecision(6)));
const safe = (fn, x) => { try { return fn(x, 0); } catch { return NaN; } };

// Primer problema en [a,b]: punto fuera del dominio o polo (cambio de signo con valores enormes).
export function scanInterval(fn, a, b, n = 2000) {
  const xs = [], ys = [];
  for (let i = 0; i <= n; i++) {
    const x = a + (b - a) * i / n, y = safe(fn, x);
    if (!Number.isFinite(y)) return { x, kind: 'undefined' };
    xs.push(x); ys.push(y);
  }
  const sorted = ys.map(Math.abs).sort((p, q) => p - q), scale = Math.max(1, sorted[Math.floor(sorted.length / 2)]), step = (b - a) / n;
  for (let i = 1; i < ys.length; i++) {
    const suspect = (ys[i - 1] * ys[i] < 0 && Math.min(Math.abs(ys[i - 1]), Math.abs(ys[i])) > 50 * scale) || Math.abs(ys[i]) > 1e4 * scale;
    if (suspect && confirmsPole(fn, xs[i], step, a, b, Math.max(Math.abs(ys[i - 1]), Math.abs(ys[i])))) return { x: xs[i], kind: 'pole' };
  }
  return null;
}

// Un polo sigue creciendo al refinar la malla; una función grande pero acotada (e^(20x)) no.
function confirmsPole(fn, x0, step, a, b, peak) {
  const lo = Math.max(a, x0 - 2 * step), hi = Math.min(b, x0 + 2 * step);
  let finer = 0;
  for (let i = 0; i <= 4000; i++) {
    const y = safe(fn, lo + (hi - lo) * i / 4000);
    if (!Number.isFinite(y)) return true;
    finer = Math.max(finer, Math.abs(y));
  }
  return finer > 20 * peak;
}

export function requireFiniteOn(fn, a, b, label = 'f', purpose = 'integral') {
  const problem = scanInterval(fn, a, b);
  if (!problem) return;
  if (problem.kind === 'undefined') throw new RangeError(`${label} no está definida en x ≈ ${fmt(problem.x)}, dentro de [${fmt(a)}, ${fmt(b)}]. Elige un intervalo dentro de su dominio.`);
  throw new RangeError(purpose === 'extremos'
    ? `${label} no está acotada cerca de x ≈ ${fmt(problem.x)}: sin continuidad en [${fmt(a)}, ${fmt(b)}] no se garantizan máximo ni mínimo absolutos (teorema de Weierstrass).`
    : `${label} tiene una singularidad cerca de x ≈ ${fmt(problem.x)}: la integral sería impropia. Separa el intervalo y estudia su convergencia en «Integral Definida».`);
}

// Derivable en x0: definida a ambos lados y con derivadas laterales que coinciden.
export function requireDifferentiableAt(fn, x0, label = 'f', variable = 'x') {
  const h = 1e-5, y = safe(fn, x0), yl = safe(fn, x0 - h), yr = safe(fn, x0 + h);
  if (!Number.isFinite(y)) throw new RangeError(`${label} no está definida en ${variable} = ${fmt(x0)}.`);
  if (!Number.isFinite(yl) || !Number.isFinite(yr)) throw new RangeError(`${label} solo está definida a un lado de ${variable} = ${fmt(x0)}: no es derivable allí.`);
  const left = (y - yl) / h, right = (yr - y) / h;
  if (!Number.isFinite(left) || !Number.isFinite(right) || Math.abs(left - right) > 1e-2 * Math.max(1, Math.abs(left), Math.abs(right))) {
    throw new RangeError(`${label} no es derivable en ${variable} = ${fmt(x0)}: las derivadas laterales valen ≈ ${fmt(left)} y ${fmt(right)}.`);
  }
}
