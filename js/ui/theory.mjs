// Pantalla «Fichas teóricas»: unidades del temario con fichas y el estado de cada subtema.
// El contenido vive en js/content/theory.mjs; aquí solo se presenta.
import { THEORY, STATUS, coverageCounts } from '../content/theory.mjs';

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const GROUP_NAMES = { math: 'Matemáticas', fi: 'Física' };
const state = { group: 'math', subject: null, tools: new Map() };

const subjectsOf = group => THEORY.filter(subject => subject.group === group);
const el = id => document.getElementById(id);

// `tools` traduce cada enlace (#/padre/id) al nombre que muestra el menú.
export function theoryOpen(group, tools = new Map()) {
  state.group = Object.hasOwn(GROUP_NAMES, group) ? group : 'math';
  state.tools = tools;
  const subjects = subjectsOf(state.group);
  if (!subjects.some(subject => subject.id === state.subject)) state.subject = subjects[0].id;
  el('theory-app')?.classList.toggle('physics-tool', state.group === 'fi');
  const back = el('theory-back');
  if (back) back.textContent = GROUP_NAMES[state.group];
  const select = el('theory-subject');
  if (select) {
    select.innerHTML = subjects.map(subject => `<option value="${subject.id}">${esc(subject.subject)}</option>`).join('');
    select.value = state.subject;
  }
  render();
}

export function theorySelect() {
  const value = el('theory-subject')?.value;
  if (subjectsOf(state.group).some(subject => subject.id === value)) state.subject = value;
  render();
}

function summaryText(counts) {
  const parts = [`${counts.C} cubiertos`, `${counts.P} parciales`, `${counts.F} con ficha`];
  if (counts.N) parts.push(`${counts.N} pendientes`);
  return `${counts.total} subtemas: ${parts.join(' · ')}.`;
}

function toolButton(route, label) {
  if (!route) return '';
  const name = state.tools.get(route) || 'herramienta';
  return `<button type="button" class="theory-link" data-action="theoryGo" data-arg="${esc(route)}" aria-label="${esc(`${label}: abrir ${name}`)}">${esc(name)} <svg class="sc-icon" aria-hidden="true"><use href="#sc-icon-chevron"></use></svg></button>`;
}

function renderCard(item) {
  return `<article class="theory-card" data-kind="${esc(item.kind)}">
    <p class="theory-kind">${esc(item.kind)}</p>
    <h3>${esc(item.title)}</h3>
    <p>${esc(item.text)}</p>
    ${toolButton(item.tool, item.title)}
  </article>`;
}

function renderTopic(topic) {
  return `<li class="theory-topic">
    <span class="theory-status" data-status="${topic.status}">${STATUS[topic.status]}</span>
    <span class="theory-topic-label">${esc(topic.label)}</span>
    ${toolButton(topic.tool, topic.label)}
  </li>`;
}

function renderUnit(unit, index) {
  const counts = coverageCounts([{ units: [unit] }]);
  return `<details class="theory-unit"${index === 0 ? ' open' : ''}>
    <summary><span class="theory-unit-title">${esc(unit.title)}</span><span class="theory-unit-meta">${counts.C + counts.P}/${counts.total} con herramienta</span></summary>
    <div class="theory-cards">${unit.cards.map(renderCard).join('')}</div>
    <h4 class="theory-topics-title">Subtemas y cobertura</h4>
    <ul class="theory-topics">${unit.topics.map(renderTopic).join('')}</ul>
  </details>`;
}

function render() {
  const subject = THEORY.find(item => item.id === state.subject);
  if (!subject) return;
  const summary = el('theory-summary');
  if (summary) summary.textContent = summaryText(coverageCounts([subject]));
  const units = el('theory-units');
  if (units) units.innerHTML = subject.units.map(renderUnit).join('');
}
