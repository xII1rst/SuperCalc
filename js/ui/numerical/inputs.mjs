import { calcParse, normalizeExpression } from '../../math/expression.mjs';

// Numerical tables keep enough significant digits to inspect each iteration.
export const fN = value => Number.isFinite(value) ? (value===0?'0':String(Number(value.toPrecision(10)))) : 'indefinido';
export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function read(id) { return document.getElementById(id).value.trim(); }
export function number(id) {
  const value=read(id);
  if (!value || !Number.isFinite(Number(value))) throw new RangeError(`${id}: introduce un número finito`);
  return Number(value);
}
export function expression(id, variable='x') {
  const source=read(id);
  const parsed=calcParse(source,variable);
  if (!parsed) throw new RangeError(`${id}: expresión no reconocida`);
  return {parsed, normalized:normalizeExpression(source)};
}
export function rows(id) {
  const raw=read(id);
  const lines=raw.split(/[;\n]+/).map(line=>line.trim()).filter(Boolean);
  if (!lines.length || lines.length>20) throw new RangeError(`${id}: introduce entre 1 y 20 filas`);
  const result=lines.map((line,index)=>{
    const parts=line.split(/[,\s]+/).filter(Boolean);
    if (!parts.length || parts.some(part=>!Number.isFinite(Number(part)))) throw new RangeError(`${id}: fila ${index+1} inválida`);
    return parts.map(Number);
  });
  if (result.some(row=>row.length!==result[0].length)) throw new RangeError(`${id}: filas de distinta longitud`);
  return result;
}
export function vector(id) {
  const parsed=rows(id);
  if (parsed.length!==1) throw new RangeError(`${id}: usa una sola fila`);
  return parsed[0];
}
export const tuple=values=>`[${values.map(value=>fN(value)).join(', ')}]`;
export const table=(head,body)=>`<div class="num-table-wrap"><table class="num-table"><thead><tr>${head.map(cell=>`<th>${cell}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function show(title,body) {
  const target=document.getElementById('num-result');
  target.classList.remove('tool-error');
  target.innerHTML=`<div class="tool-result-title">${title}</div>${body}`;
}
export function fail(error) {
  const target=document.getElementById('num-result');
  target.textContent=error.message;
  target.classList.add('tool-error');
}
