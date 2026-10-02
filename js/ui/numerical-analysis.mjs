import { collectVariables, normalizeExpression } from '../math/expression.mjs';
import { escapeHtml, read } from './numerical/inputs.mjs';
import { panels as errorsPanels } from './numerical/errors.mjs';
import { panels as rootsPanels } from './numerical/roots.mjs';
import { panels as systemsPanels } from './numerical/systems.mjs';
import { panels as interpolationPanels } from './numerical/interpolation.mjs';
import { panels as derivativeQuadraturePanels } from './numerical/derivative-quadrature.mjs';
import { panels as odePanels } from './numerical/ode.mjs';
export { numCalcErrors, numCalcPrecision, numCalcTaylor } from './numerical/errors.mjs';
export { numCalcRoots } from './numerical/roots.mjs';
export { numCalcLinear, numCalcSystem2D, numCalcSystem, numCalcSystemStability } from './numerical/systems.mjs';
export { numCalcInterpolation } from './numerical/interpolation.mjs';
export { numCalcDerivative, numCalcQuadrature } from './numerical/derivative-quadrature.mjs';
export { numCalcODE } from './numerical/ode.mjs';

const panels=Object.assign({},errorsPanels,rootsPanels,systemsPanels,interpolationPanels,derivativeQuadraturePanels,odePanels);

export function numOpenPanel(id) {
  const config=panels[id];
  if (!config) return;
  document.getElementById('num-title').textContent=config.title;
  document.getElementById('num-heading').textContent=config.title;
  document.getElementById('num-description').textContent=config.description;
  document.getElementById('num-content').innerHTML=`<div class="num-controls" data-action="numPreviewInputs" data-event="input" data-arg="${id}">${config.controls}</div><div id="num-preview" class="calc-res-hint" aria-live="polite"></div><div class="tool-actions"><button class="tool-button" data-action="${config.action}">Calcular</button></div><div id="num-result" class="tool-result" aria-live="polite"></div>`;
  numPreviewInputs(id);
}

export function numPreviewInputs(panel){
 const target=document.getElementById('num-preview'),config=panels[panel];if(!target||!config)return;
 const ids=[...config.controls.matchAll(/id="([^"]+)"/g)].map(m=>m[1]).filter(id=>/-(f|g|df|expressions|function|reference)$/.test(id));
 const entries=ids.map(id=>{const source=read(id);return source?`<p><code>${escapeHtml(normalizeExpression(source))}</code> · variables: ${escapeHtml(collectVariables(source).join(', ')||'constante')}</p>`:'';}).filter(Boolean);
 target.innerHTML=entries.length?`<details><summary>Entrada normalizada</summary>${entries.join('')}<p>Se verifican sintaxis, variables y dominio al calcular.</p></details>`:'';
}
