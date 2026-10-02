import { parseBaseNumber } from '../../math/logic.mjs';

export const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function read(id) {return document.getElementById(id).value.trim();}
export function integer(id) {
  const raw=read(id);
  if (!/^-?\d+$/.test(raw)) throw new RangeError(`${id}: introduce un entero`);
  return Number(raw);
}
export function bigIntegerFromBase(id,radix) {
  const value=parseBaseNumber(read(id),radix);
  if (value.denominator!==1n) throw new RangeError('Las operaciones de palabra requieren enteros');
  return value.numerator;
}
export function items(id) {return read(id).split(/[,\s]+/).filter(Boolean);}
export function ints(id) {
  const raw=read(id);
  if (!raw) return [];
  const values=raw.split(/[,\s]+/).filter(Boolean);
  if (values.some(value=>!/^\d+$/.test(value))) throw new RangeError(`${id}: usa enteros no negativos`);
  return values.map(Number);
}
export function graphEdges() {
  const lines=read('logic-graph-edges').split(/[;\n]+/).map(line=>line.trim()).filter(Boolean);
  return lines.map((line,index)=>{
    const parts=line.split(/[,\s]+/).filter(Boolean);
    if (parts.length<2||parts.length>3||parts.slice(0,2).some(name=>!/^[A-Za-z0-9_]+$/.test(name))
      || parts.length===3&&(!Number.isFinite(Number(parts[2]))||Number(parts[2])<0)) {
      throw new RangeError(`Arista ${index+1}: usa origen destino peso no negativo`);
    }
    return [parts[0],parts[1],...(parts.length===3?[Number(parts[2])]:[])];
  });
}
export const list=values=>`{${values.map(escapeHtml).join(', ')}}`;
export const table=(heads,body)=>`<div class="num-table-wrap"><table class="num-table"><thead><tr>${heads.map(head=>`<th>${escapeHtml(head)}</th>`).join('')}</tr></thead><tbody>${body.map(row=>`<tr>${row.map(value=>`<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
export function show(title,html) {
  const target=document.getElementById('logic-result');
  target.classList.remove('tool-error');
  target.innerHTML=`<div class="tool-result-title">${title}</div>${html}`;
}
export function fail(error) {
  const target=document.getElementById('logic-result');
  target.textContent=error.message;
  target.classList.add('tool-error');
}
