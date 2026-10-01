import {OUTPUT_UNITS,outputDimension,convertOutput} from '../math/physics-output.mjs';
import {physicsOutputs} from '../state/physics-output.mjs';
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Array.isArray(v)?`[${v.map(fmt).join(', ')}]`:String(Number(v.toPrecision(10)));
const finite=v=>Array.isArray(v)?v.length>0&&v.every(finite):typeof v==='number'&&Number.isFinite(v);
export function labelledOutputEntries(data,labelFor){
 return Object.entries(data).flatMap(([key,value])=>{const label=labelFor(key),unit=label.match(/\(([^()]*)\)$/)?.[1];return unit&&outputDimension(unit)&&finite(value)?[{label:label.replace(/\s*\([^()]*\)$/,''),value,unit}]:[];});
}
export function physicsOutputControls(prefix,entries){
 const groups=new Map();for(const entry of entries){const dimension=outputDimension(entry.unit);if(dimension&&finite(entry.value)){if(!groups.has(dimension))groups.set(dimension,[]);groups.get(dimension).push(entry);}}
 physicsOutputs.set(prefix,groups);if(!groups.size)return '';
 return `<details class="physics-output-units"><summary>Convertir unidades de resultados</summary><p>La tabla principal conserva las unidades indicadas; aquí puedes convertir los valores calculados.</p>${[...groups].map(([dimension,items])=>{const units=OUTPUT_UNITS[dimension],unit=items[0].unit;return `<label for="${prefix}-output-${dimension}">${escape(items[0].label)}: unidad de salida</label><select id="${prefix}-output-${dimension}" class="tool-input" data-action="physicsOutputUnitChanged" data-event="change" data-arg="${prefix}:${dimension}">${Object.keys(units).map(u=>`<option value="${escape(u)}"${u===unit?' selected':''}>${escape(u)}</option>`).join('')}</select><div id="${prefix}-converted-${dimension}">${converted(items,unit)}</div>`;}).join('')}</details>`;
}
function converted(entries,unit){return `<ul>${entries.map(entry=>`<li>${escape(entry.label)}: ${escape(fmt(convertOutput(entry.value,entry.unit,unit)))} ${escape(unit)}</li>`).join('')}</ul>`;}
export function physicsOutputUnitChanged(arg){
 const[prefix,dimension]=arg.split(':'),entries=physicsOutputs.get(prefix)?.get(dimension),target=document.getElementById(`${prefix}-converted-${dimension}`);if(!entries||!target)return;
 try{target.textContent='';target.innerHTML=converted(entries,document.getElementById(`${prefix}-output-${dimension}`).value);}catch(error){target.textContent=error.message;}
}
