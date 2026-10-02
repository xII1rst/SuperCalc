import { panels as basesPanels } from './logic/bases.mjs';
import { panels as setsPanels } from './logic/sets.mjs';
import { panels as propositionsPanels } from './logic/propositions.mjs';
import { panels as booleanPanels } from './logic/boolean.mjs';
import { panels as graphsPanels } from './logic/graphs.mjs';
export { logicCalculateBases } from './logic/bases.mjs';
export { logicCalculateSets } from './logic/sets.mjs';
export { logicCalculateProposition } from './logic/propositions.mjs';
export { logicCalculateBoolean } from './logic/boolean.mjs';
export { logicCalculateGraph } from './logic/graphs.mjs';

const panels=Object.assign({},basesPanels,setsPanels,propositionsPanels,booleanPanels,graphsPanels);

export function logicOpenPanel(id) {
  const config=panels[id];
  if (!config) return;
  document.getElementById('logic-title').textContent=config.title;
  document.getElementById('logic-heading').textContent=config.title;
  document.getElementById('logic-description').textContent=config.description;
  document.getElementById('logic-content').innerHTML=`<div class="num-controls">${config.controls}</div><div class="tool-actions"><button class="tool-button" data-action="${config.action}">Calcular</button></div><div id="logic-result" class="tool-result" aria-live="polite"></div>`;
}
