import { binomialSummary, combinations, diceSumSummary } from '../math/probability.mjs';
import { fN } from '../utils/format.mjs';

export function probOpenPanel(panel) {
  const copy = {
    combinations:['Combinaciones','Cuenta selecciones sin importar el orden.'],
    coin:['Éxitos en varios ensayos','Calcula probabilidades binomiales exactas y acumuladas.'],
    dice:['Suma de dados','Calcula la probabilidad y distribución de la suma de varios dados.'],
  };
  if (!Object.hasOwn(copy,panel)) return;
  for (const name of Object.keys(copy)) {
    const card = document.getElementById(`prob-${name}-card`);
    card.hidden = name !== panel;
    card.inert = name !== panel;
  }
  document.getElementById('prob-panel-title').textContent = copy[panel][0];
  document.getElementById('prob-panel-heading').textContent = copy[panel][0];
  document.getElementById('prob-panel-description').textContent = copy[panel][1];
  const scroll = document.getElementById('prob-app').querySelector?.('.tool-scroll');
  if (scroll) scroll.scrollTop = 0;
}

export function probCalculateCombinations() {
  const target = document.getElementById('prob-combinations-result');
  try {
    const n = inputNumber('prob-combinations-n');
    const k = inputNumber('prob-combinations-k');
    const count = combinations(n,k);
    showResult(target, `<div class="tool-stats-grid"><div class="tool-stat"><span>C(${n}, ${k})</span><strong>${count}</strong></div></div><p class="tool-note">C(${n}, ${k}) = ${n}! / [${k}! · (${n} − ${k})!] = ${count}</p>`);
  } catch (error) {
    showError(target,error);
  }
}

function inputNumber(id) {
  const value = document.getElementById(id).value.trim();
  return value === '' ? NaN : Number(value);
}

function showError(target, error) {
  target.textContent = error.message;
  target.classList.add('tool-error');
}

function showResult(target, html) {
  target.classList.remove('tool-error');
  target.innerHTML = html;
}

function percent(value) {
  return `${fN(value * 100, 4)} %`;
}

export function probCalculateCoin() {
  const target = document.getElementById('prob-coin-result');
  try {
    const n = inputNumber('prob-coin-n');
    const p = inputNumber('prob-coin-p');
    const k = inputNumber('prob-coin-k');
    const result = binomialSummary(n, k, p);
    showResult(target, `<p class="tool-result-title">${k} éxitos en ${n} ensayos</p>
      <div class="tool-stats-grid">
        <div class="tool-stat"><span>Combinaciones C(${n}, ${k})</span><strong>${result.combinations}</strong></div>
        <div class="tool-stat"><span>P(X = ${k})</span><strong>${percent(result.exact)}</strong></div>
        <div class="tool-stat"><span>P(X ≤ ${k})</span><strong>${percent(result.atMost)}</strong></div>
        <div class="tool-stat"><span>P(X ≥ ${k})</span><strong>${percent(result.atLeast)}</strong></div>
        <div class="tool-stat"><span>Valor esperado n·p</span><strong>${fN(result.expected)}</strong></div>
        <div class="tool-stat"><span>Varianza n·p·(1−p)</span><strong>${fN(result.variance)}</strong></div>
      </div><p class="tool-note">Ejemplo: para una moneda equilibrada, p = 0.5.</p>`);
  } catch (error) {
    showError(target, error);
  }
}

export function probCalculateDice() {
  const target = document.getElementById('prob-dice-result');
  try {
    const diceCount = inputNumber('prob-dice-n');
    const sum = inputNumber('prob-dice-sum');
    const result = diceSumSummary(diceCount, sum);
    const peak = Math.max(...result.distribution.map(item => item.probability));
    showResult(target, `<p class="tool-result-title">Suma ${sum} con ${diceCount} dados</p>
      <div class="tool-stats-grid">
        <div class="tool-stat"><span>Casos favorables</span><strong>${result.ways}</strong></div>
        <div class="tool-stat"><span>Casos posibles</span><strong>${result.total}</strong></div>
        <div class="tool-stat"><span>Probabilidad exacta</span><strong>${percent(result.probability)}</strong></div>
        <div class="tool-stat"><span>Suma esperada</span><strong>${fN(result.expected)}</strong></div>
      </div>
      <details class="prob-details"><summary>Ver distribución de sumas</summary>
        <div class="prob-distribution">${result.distribution.map(item => `
          <div class="prob-row"><span>${item.sum}</span>
            <div class="prob-track"><div style="width:${item.probability / peak * 100}%"></div></div>
            <strong>${percent(item.probability)}</strong></div>`).join('')}</div>
      </details>`);
  } catch (error) {
    showError(target, error);
  }
}
