import { rollDice, flipCoins, calculatePi } from '../math/experiments.mjs';
import { fN } from '../utils/format.mjs';

export function expOpenPanel(panel) {
  const copy = {
    dice:['Tira el dado','Simula lanzamientos de un dado de seis caras.'],
    coin:['Cara o sello','Simula lanzamientos de una moneda y compara las frecuencias.'],
    pi:['π con Chudnovsky','Calcula hasta 100 cifras decimales de π.'],
  };
  if (!Object.hasOwn(copy,panel)) return;
  for (const name of Object.keys(copy)) {
    const card = document.getElementById(`exp-${name}-card`);
    card.hidden = name !== panel;
    card.inert = name !== panel;
  }
  document.getElementById('exp-panel-title').textContent = copy[panel][0];
  document.getElementById('exp-panel-heading').textContent = copy[panel][0];
  document.getElementById('exp-panel-description').textContent = copy[panel][1];
  const scroll = document.getElementById('exp-app').querySelector?.('.tool-scroll');
  if (scroll) scroll.scrollTop = 0;
}

function showError(target, error) {
  target.textContent = error.message;
  target.classList.add('tool-error');
}

function showResult(target, html) {
  target.classList.remove('tool-error');
  target.innerHTML = html;
}

function outcomeList(outcomes, format) {
  const preview = outcomes.slice(0, 120).map(format).join(' · ');
  return `<div class="tool-sequence">${preview}${outcomes.length > 120 ? ' · …' : ''}</div>
    ${outcomes.length > 120 ? '<p class="tool-note">Se muestran los primeros 120 resultados.</p>' : ''}`;
}

export function expRollDice() {
  const target = document.getElementById('exp-dice-result');
  try {
    const count = Number(document.getElementById('exp-dice-count').value);
    const { outcomes, frequencies } = rollDice(count);
    showResult(target, `<p class="tool-result-title">${count} lanzamientos</p>
      <div class="tool-frequency">${frequencies.map((total, index) =>
        `<span>Cara ${index + 1}: <strong>${total}</strong> · ${fN(total / count * 100, 2)} % frente a 16.67 % teórico</span>`).join('')}</div>
      ${outcomeList(outcomes, value => value)}`);
  } catch (error) {
    showError(target, error);
  }
}

export function expFlipCoins() {
  const target = document.getElementById('exp-coin-result');
  try {
    const count = Number(document.getElementById('exp-coin-count').value);
    const { outcomes, frequencies } = flipCoins(count);
    showResult(target, `<p class="tool-result-title">${count} lanzamientos</p>
      <div class="tool-frequency"><span>Cara: <strong>${frequencies.cara}</strong> · ${fN(frequencies.cara / count * 100, 2)} % frente a 50 % teórico</span>
      <span>Sello: <strong>${frequencies.sello}</strong> · ${fN(frequencies.sello / count * 100, 2)} % frente a 50 % teórico</span></div>
      ${outcomeList(outcomes, value => value === 'cara' ? 'C' : 'S')}
      <p class="tool-note">C = cara · S = sello</p>`);
  } catch (error) {
    showError(target, error);
  }
}

export function expCalculatePi() {
  const target = document.getElementById('exp-pi-result');
  try {
    const digits = Number(document.getElementById('exp-pi-digits').value);
    const pi = calculatePi(digits);
    showResult(target, `<p class="tool-result-title">π con ${digits} cifras decimales</p>
      <div class="tool-pi-value">${pi}</div>
      <p class="tool-note">Serie de Chudnovsky · cálculo local con enteros de precisión arbitraria</p>`);
  } catch (error) {
    showError(target, error);
  }
}
