import { unitFactors, unitsByMode } from './waves/output.mjs';
import { stopAnimation, visualModes, wavesRedraw } from './waves/animation.mjs';
export {physicsOutputUnitChanged} from './physics-output.mjs';
export { wavesTimeChanged, wavesRedraw, wavesToggleAnimation } from './waves/animation.mjs';
import * as oscillations from './waves/oscillations.mjs';
import * as mechanical from './waves/mechanical.mjs';
import * as optics from './waves/optics.mjs';

const families=[oscillations, mechanical, optics];
const modes=Object.assign({},...families.map(family=>family.modes));
const solvers=Object.assign({},...families.map(family=>family.solvers));
const groupNames={oscillations:'Oscilaciones',mechanical:'Ondas mecánicas',optics:'Ondas EM y óptica'};
export function wavesOpenPanel(group) {
  if (!groupNames[group]) return;
  document.getElementById('waves-title').textContent=groupNames[group];
  document.getElementById('waves-heading').textContent=groupNames[group];
  document.getElementById('waves-mode').innerHTML=Object.entries(modes).filter(([,config])=>config.group===group)
    .map(([key,config])=>`<option value="${key}">${config.name}</option>`).join('');
  wavesSelect();
}

export function wavesSelect() {
  stopAnimation();
  const play=document.getElementById('waves-play');
  if(play) play.textContent='Reproducir';
  const config=modes[document.getElementById('waves-mode').value];
  if (!config) return;
  const mode=document.getElementById('waves-mode').value;
  document.getElementById('waves-fields').innerHTML=config.fields.map(([key,label,defaultValue,type])=>{
    const unitType=unitsByMode[mode]?.[key];
    const unitSelector=unitType?`<select id="waves-${key}-unit" class="tool-input waves-unit" aria-label="Unidad de ${label}">${Object.keys(unitFactors[unitType]).map(unit=>`<option value="${unit}">${unit}</option>`).join('')}</select>`:'';
    const displayLabel=unitType?label.replace(/\s*\(([^)]+)\)/g,(all,inside)=>{
      const [unit,...hints]=inside.split(',');
      return Object.hasOwn(unitFactors[unitType],unit.trim())?(hints.length?` (${hints.join(',').trim()})`:''):all;
    }):label;
    return `<label class="linear-field" for="waves-${key}"><span>${displayLabel}</span>${type==='select'
      ? `<select id="waves-${key}" class="tool-input"><option value="open-open">Ambos abiertos</option><option value="closed-open">Uno cerrado</option></select>`
      :type==='textarea'
      ? `<textarea id="waves-${key}" class="tool-textarea" rows="4">${defaultValue}</textarea>`
      : `<input id="waves-${key}" class="tool-input" type="number" step="any" value="${defaultValue}">`}${unitSelector}</label>`;
  }).join('')+'<p class="calc-res-hint">Las entradas se convierten a SI para calcular; los resultados indican sus unidades.</p>';
  const target=document.getElementById('waves-result');
  target.textContent='';
  target.classList.remove('tool-error');
  document.getElementById('waves-visual').hidden=!visualModes.has(document.getElementById('waves-mode').value);
}

export function wavesCalculate() {
  const mode=document.getElementById('waves-mode').value;
  const target=document.getElementById('waves-result');
  try {
    if (!Object.hasOwn(solvers, mode)) throw new RangeError('Selecciona una operación válida');
    solvers[mode](mode);
    if(visualModes.has(mode)) wavesRedraw();
  } catch(error) {
    target.textContent=error.message;
    target.classList.add('tool-error');
  }
}
